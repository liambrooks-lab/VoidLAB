import crypto from "crypto";
import { Pool, type PoolClient, type QueryResultRow } from "pg";
import { decryptSecret, encryptSecret } from "./crypto";

export type AuthProvider = "github" | "google" | "x";

export type SocialLinks = {
  github: string;
  instagram: string;
  linkedin: string;
  x: string;
};

export type AppUserProfile = {
  avatar: string;
  bio: string;
  email: string;
  githubConnected: boolean;
  githubLogin: string;
  id: string;
  name: string;
  phone: string;
  providers: Record<AuthProvider, boolean>;
  region: string;
  socials: SocialLinks;
};

type UserRow = {
  avatar: string | null;
  bio: string | null;
  created_at: string;
  email: string | null;
  id: string;
  name: string;
  phone: string | null;
  region: string | null;
  socials_json: string | null;
  updated_at: string;
};

type OAuthAccountRow = {
  access_token_encrypted: string;
  created_at: string;
  expires_at: number | null;
  id: string;
  profile_url: string | null;
  provider: AuthProvider;
  provider_user_id: string;
  refresh_token_encrypted: string | null;
  scope: string | null;
  token_type: string | null;
  updated_at: string;
  user_id: string;
  username: string | null;
};

type UpsertOAuthUserInput = {
  accessToken: string;
  avatar: string;
  currentUserId?: string | null;
  email?: string | null;
  expiresAt?: number | null;
  name: string;
  profileUrl?: string;
  provider: AuthProvider;
  providerUserId: string;
  refreshToken?: string | null;
  scope?: string;
  tokenType?: string;
  username?: string;
};

type UserProfilePatch = {
  bio?: string;
  phone?: string;
  region?: string;
  socials?: Partial<SocialLinks>;
};

const emptySocials: SocialLinks = {
  github: "",
  instagram: "",
  linkedin: "",
  x: "",
};

const databaseUrl = process.env.DATABASE_URL;
const useSsl = /^(1|true|require)$/i.test(process.env.DATABASE_SSL ?? "");
const rejectUnauthorized = !/^(0|false)$/i.test(
  process.env.DATABASE_SSL_REJECT_UNAUTHORIZED ?? "false",
);

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required for VoidLAB auth storage.");
}

const pool = new Pool({
  connectionString: databaseUrl,
  ssl: useSsl ? { rejectUnauthorized } : undefined,
});

let initPromise: Promise<void> | null = null;

const schemaSql = `
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    name TEXT NOT NULL,
    avatar TEXT DEFAULT '',
    bio TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    region TEXT DEFAULT 'Global',
    socials_json TEXT DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS oauth_accounts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider TEXT NOT NULL,
    provider_user_id TEXT NOT NULL,
    access_token_encrypted TEXT NOT NULL,
    refresh_token_encrypted TEXT,
    scope TEXT DEFAULT '',
    token_type TEXT DEFAULT '',
    expires_at BIGINT,
    username TEXT DEFAULT '',
    profile_url TEXT DEFAULT '',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(provider, provider_user_id)
  );

  CREATE INDEX IF NOT EXISTS idx_oauth_accounts_user_provider
  ON oauth_accounts(user_id, provider);
`;

const parseSocials = (value?: string | null): SocialLinks => {
  if (!value) return { ...emptySocials };

  try {
    return {
      ...emptySocials,
      ...(JSON.parse(value) as Partial<SocialLinks>),
    };
  } catch {
    return { ...emptySocials };
  }
};

const mapUserRow = <T extends QueryResultRow>(row: T): UserRow => ({
  avatar: (row.avatar as string | null) ?? "",
  bio: (row.bio as string | null) ?? "",
  created_at: String(row.created_at ?? new Date().toISOString()),
  email: (row.email as string | null) ?? null,
  id: String(row.id),
  name: String(row.name),
  phone: (row.phone as string | null) ?? "",
  region: (row.region as string | null) ?? "Global",
  socials_json: (row.socials_json as string | null) ?? "{}",
  updated_at: String(row.updated_at ?? new Date().toISOString()),
});

const mapOAuthAccountRow = <T extends QueryResultRow>(row: T): OAuthAccountRow => ({
  access_token_encrypted: String(row.access_token_encrypted),
  created_at: String(row.created_at ?? new Date().toISOString()),
  expires_at:
    row.expires_at === null || row.expires_at === undefined ? null : Number(row.expires_at),
  id: String(row.id),
  profile_url: (row.profile_url as string | null) ?? "",
  provider: row.provider as AuthProvider,
  provider_user_id: String(row.provider_user_id),
  refresh_token_encrypted: (row.refresh_token_encrypted as string | null) ?? null,
  scope: (row.scope as string | null) ?? "",
  token_type: (row.token_type as string | null) ?? "",
  updated_at: String(row.updated_at ?? new Date().toISOString()),
  user_id: String(row.user_id),
  username: (row.username as string | null) ?? "",
});

const serializeProfile = (user: UserRow, accounts: OAuthAccountRow[]): AppUserProfile => {
  const socials = parseSocials(user.socials_json);
  const providers = {
    github: accounts.some((account) => account.provider === "github"),
    google: accounts.some((account) => account.provider === "google"),
    x: accounts.some((account) => account.provider === "x"),
  };
  const githubAccount = accounts.find((account) => account.provider === "github");

  return {
    avatar: user.avatar ?? "",
    bio: user.bio ?? "",
    email: user.email ?? "",
    githubConnected: Boolean(githubAccount),
    githubLogin: githubAccount?.username ?? "",
    id: user.id,
    name: user.name,
    phone: user.phone ?? "",
    providers,
    region: user.region || "Global",
    socials,
  };
};

const applyProviderLinks = (
  provider: AuthProvider,
  profileUrl: string | undefined,
  socials: SocialLinks,
) => {
  if (!profileUrl) return socials;

  if (provider === "github" && !socials.github) {
    return { ...socials, github: profileUrl };
  }

  if (provider === "x" && !socials.x) {
    return { ...socials, x: profileUrl };
  }

  return socials;
};

const getUserById = async (client: PoolClient, userId: string) => {
  const result = await client.query("SELECT * FROM users WHERE id = $1", [userId]);
  return result.rows[0] ? mapUserRow(result.rows[0]) : null;
};

const getUserByEmail = async (client: PoolClient, email: string) => {
  const result = await client.query("SELECT * FROM users WHERE email = $1", [email]);
  return result.rows[0] ? mapUserRow(result.rows[0]) : null;
};

const getOAuthAccountByProvider = async (
  client: PoolClient,
  provider: AuthProvider,
  providerUserId: string,
) => {
  const result = await client.query(
    "SELECT * FROM oauth_accounts WHERE provider = $1 AND provider_user_id = $2",
    [provider, providerUserId],
  );
  return result.rows[0] ? mapOAuthAccountRow(result.rows[0]) : null;
};

const getAccountsForUser = async (client: PoolClient, userId: string) => {
  const result = await client.query("SELECT * FROM oauth_accounts WHERE user_id = $1", [userId]);
  return result.rows.map(mapOAuthAccountRow);
};

const loadProfileByUserId = async (client: PoolClient, userId: string) => {
  const user = await getUserById(client, userId);

  if (!user) return null;

  const accounts = await getAccountsForUser(client, userId);
  return serializeProfile(user, accounts);
};

export const initializeDatabase = async () => {
  if (!initPromise) {
    initPromise = (async () => {
      await pool.query(schemaSql);
    })();
  }

  return initPromise;
};

export const upsertOAuthUser = async (input: UpsertOAuthUserInput) => {
  await initializeDatabase();
  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const existingAccount = await getOAuthAccountByProvider(
      client,
      input.provider,
      input.providerUserId,
    );

    if (
      input.currentUserId &&
      existingAccount &&
      existingAccount.user_id !== input.currentUserId
    ) {
      throw new Error(`This ${input.provider} account is already linked to another VoidLAB user.`);
    }

    const userFromEmail =
      !existingAccount && input.email ? await getUserByEmail(client, input.email) : null;

    const userId =
      input.currentUserId ||
      existingAccount?.user_id ||
      userFromEmail?.id ||
      `user-${crypto.randomUUID()}`;

    const existingUser = (await getUserById(client, userId)) ?? userFromEmail;
    const now = new Date().toISOString();
    const currentSocials = parseSocials(existingUser?.socials_json);
    const nextSocials = applyProviderLinks(input.provider, input.profileUrl, currentSocials);

    if (!existingUser) {
      await client.query(
        `INSERT INTO users
          (id, email, name, avatar, bio, phone, region, socials_json, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
        [
          userId,
          input.email ?? null,
          input.name,
          input.avatar,
          "",
          "",
          "Global",
          JSON.stringify(nextSocials),
          now,
          now,
        ],
      );
    } else {
      await client.query(
        `UPDATE users
         SET email = $2,
             name = $3,
             avatar = $4,
             socials_json = $5,
             updated_at = $6
         WHERE id = $1`,
        [
          userId,
          input.email ?? existingUser.email ?? null,
          input.name || existingUser.name,
          input.avatar || existingUser.avatar || "",
          JSON.stringify(nextSocials),
          now,
        ],
      );
    }

    await client.query(
      `INSERT INTO oauth_accounts
        (id, user_id, provider, provider_user_id, access_token_encrypted, refresh_token_encrypted,
         scope, token_type, expires_at, username, profile_url, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
       ON CONFLICT (provider, provider_user_id)
       DO UPDATE SET
         user_id = EXCLUDED.user_id,
         access_token_encrypted = EXCLUDED.access_token_encrypted,
         refresh_token_encrypted = EXCLUDED.refresh_token_encrypted,
         scope = EXCLUDED.scope,
         token_type = EXCLUDED.token_type,
         expires_at = EXCLUDED.expires_at,
         username = EXCLUDED.username,
         profile_url = EXCLUDED.profile_url,
         updated_at = EXCLUDED.updated_at`,
      [
        existingAccount?.id ?? `oauth-${crypto.randomUUID()}`,
        userId,
        input.provider,
        input.providerUserId,
        encryptSecret(input.accessToken),
        input.refreshToken ? encryptSecret(input.refreshToken) : null,
        input.scope ?? "",
        input.tokenType ?? "",
        input.expiresAt ?? null,
        input.username ?? "",
        input.profileUrl ?? "",
        existingAccount?.created_at ?? now,
        now,
      ],
    );

    const profile = await loadProfileByUserId(client, userId);
    await client.query("COMMIT");

    return {
      created: !existingUser,
      profile: profile!,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
};

export const getUserProfileById = async (userId: string) => {
  await initializeDatabase();
  const client = await pool.connect();

  try {
    return await loadProfileByUserId(client, userId);
  } finally {
    client.release();
  }
};

export const updateUserProfile = async (userId: string, patch: UserProfilePatch) => {
  await initializeDatabase();
  const client = await pool.connect();

  try {
    const user = await getUserById(client, userId);

    if (!user) {
      return null;
    }

    const currentSocials = parseSocials(user.socials_json);
    const nextSocials = {
      ...currentSocials,
      ...(patch.socials ?? {}),
    };

    await client.query(
      `UPDATE users
       SET bio = $2,
           phone = $3,
           region = $4,
           socials_json = $5,
           updated_at = $6
       WHERE id = $1`,
      [
        userId,
        patch.bio ?? user.bio ?? "",
        patch.phone ?? user.phone ?? "",
        patch.region ?? user.region ?? "Global",
        JSON.stringify(nextSocials),
        new Date().toISOString(),
      ],
    );

    return await loadProfileByUserId(client, userId);
  } finally {
    client.release();
  }
};

export const getOAuthAccountForUser = async (userId: string, provider: AuthProvider) => {
  await initializeDatabase();
  const result = await pool.query(
    "SELECT * FROM oauth_accounts WHERE user_id = $1 AND provider = $2",
    [userId, provider],
  );
  const account = result.rows[0] ? mapOAuthAccountRow(result.rows[0]) : null;

  if (!account) return null;

  return {
    ...account,
    accessToken: decryptSecret(account.access_token_encrypted),
    refreshToken: decryptSecret(account.refresh_token_encrypted),
  };
};
