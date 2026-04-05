import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
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
  email: string | null;
  id: string;
  name: string;
  phone: string | null;
  region: string | null;
  socials_json: string | null;
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

const dataDir = path.resolve(__dirname, "../../data");
const databasePath = path.join(dataDir, "voidlab.sqlite");

fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(databasePath);
db.pragma("journal_mode = WAL");

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE,
    name TEXT NOT NULL,
    avatar TEXT DEFAULT '',
    bio TEXT DEFAULT '',
    phone TEXT DEFAULT '',
    region TEXT DEFAULT 'Global',
    socials_json TEXT DEFAULT '{}',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS oauth_accounts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    provider_user_id TEXT NOT NULL,
    access_token_encrypted TEXT NOT NULL,
    refresh_token_encrypted TEXT,
    scope TEXT DEFAULT '',
    token_type TEXT DEFAULT '',
    expires_at INTEGER,
    username TEXT DEFAULT '',
    profile_url TEXT DEFAULT '',
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    UNIQUE(provider, provider_user_id),
    FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
  );
`);

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

const getAccountsForUser = db.prepare(
  "SELECT * FROM oauth_accounts WHERE user_id = ?",
);

const getUserRowById = db.prepare(
  "SELECT * FROM users WHERE id = ?",
);

const getUserRowByEmail = db.prepare(
  "SELECT * FROM users WHERE email = ?",
);

const getOAuthAccountByProvider = db.prepare(
  "SELECT * FROM oauth_accounts WHERE provider = ? AND provider_user_id = ?",
);

const getOAuthAccountByUserAndProvider = db.prepare(
  "SELECT * FROM oauth_accounts WHERE user_id = ? AND provider = ?",
);

const insertUserStatement = db.prepare(`
  INSERT INTO users (id, email, name, avatar, bio, phone, region, socials_json, created_at, updated_at)
  VALUES (@id, @email, @name, @avatar, @bio, @phone, @region, @socials_json, @created_at, @updated_at)
`);

const updateUserIdentityStatement = db.prepare(`
  UPDATE users
  SET email = @email,
      name = @name,
      avatar = @avatar,
      socials_json = @socials_json,
      updated_at = @updated_at
  WHERE id = @id
`);

const updateUserProfileStatement = db.prepare(`
  UPDATE users
  SET bio = @bio,
      phone = @phone,
      region = @region,
      socials_json = @socials_json,
      updated_at = @updated_at
  WHERE id = @id
`);

const upsertOAuthAccountStatement = db.prepare(`
  INSERT INTO oauth_accounts (
    id, user_id, provider, provider_user_id, access_token_encrypted, refresh_token_encrypted,
    scope, token_type, expires_at, username, profile_url, created_at, updated_at
  ) VALUES (
    @id, @user_id, @provider, @provider_user_id, @access_token_encrypted, @refresh_token_encrypted,
    @scope, @token_type, @expires_at, @username, @profile_url, @created_at, @updated_at
  )
  ON CONFLICT(provider, provider_user_id)
  DO UPDATE SET
    user_id = excluded.user_id,
    access_token_encrypted = excluded.access_token_encrypted,
    refresh_token_encrypted = excluded.refresh_token_encrypted,
    scope = excluded.scope,
    token_type = excluded.token_type,
    expires_at = excluded.expires_at,
    username = excluded.username,
    profile_url = excluded.profile_url,
    updated_at = excluded.updated_at
`);

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

const loadProfileByUserId = (userId: string) => {
  const user = getUserRowById.get(userId) as UserRow | undefined;

  if (!user) return null;

  const accounts = getAccountsForUser.all(userId) as OAuthAccountRow[];
  return serializeProfile(user, accounts);
};

const applyProviderLinks = (provider: AuthProvider, profileUrl: string | undefined, socials: SocialLinks) => {
  if (!profileUrl) return socials;

  if (provider === "github" && !socials.github) {
    return { ...socials, github: profileUrl };
  }

  if (provider === "x" && !socials.x) {
    return { ...socials, x: profileUrl };
  }

  return socials;
};

export const upsertOAuthUser = (input: UpsertOAuthUserInput) => {
  const existingAccount = getOAuthAccountByProvider.get(
    input.provider,
    input.providerUserId,
  ) as OAuthAccountRow | undefined;

  if (
    input.currentUserId &&
    existingAccount &&
    existingAccount.user_id !== input.currentUserId
  ) {
    throw new Error(`This ${input.provider} account is already linked to another VoidLAB user.`);
  }

  const userFromEmail =
    !existingAccount && input.email
      ? (getUserRowByEmail.get(input.email) as UserRow | undefined)
      : undefined;

  const userId =
    input.currentUserId ||
    existingAccount?.user_id ||
    userFromEmail?.id ||
    `user-${crypto.randomUUID()}`;

  const existingUser = (getUserRowById.get(userId) as UserRow | undefined) ?? userFromEmail;
  const now = new Date().toISOString();
  const currentSocials = parseSocials(existingUser?.socials_json);
  const nextSocials = applyProviderLinks(input.provider, input.profileUrl, currentSocials);

  if (!existingUser) {
    insertUserStatement.run({
      id: userId,
      email: input.email ?? null,
      name: input.name,
      avatar: input.avatar,
      bio: "",
      phone: "",
      region: "Global",
      socials_json: JSON.stringify(nextSocials),
      created_at: now,
      updated_at: now,
    });
  } else {
    updateUserIdentityStatement.run({
      id: userId,
      email: input.email ?? existingUser.email ?? null,
      name: input.name || existingUser.name,
      avatar: input.avatar || existingUser.avatar || "",
      socials_json: JSON.stringify(nextSocials),
      updated_at: now,
    });
  }

  upsertOAuthAccountStatement.run({
    id: existingAccount?.id ?? `oauth-${crypto.randomUUID()}`,
    user_id: userId,
    provider: input.provider,
    provider_user_id: input.providerUserId,
    access_token_encrypted: encryptSecret(input.accessToken),
    refresh_token_encrypted: input.refreshToken ? encryptSecret(input.refreshToken) : null,
    scope: input.scope ?? "",
    token_type: input.tokenType ?? "",
    expires_at: input.expiresAt ?? null,
    username: input.username ?? "",
    profile_url: input.profileUrl ?? "",
    created_at: existingAccount?.created_at ?? now,
    updated_at: now,
  });

  return {
    created: !existingUser,
    profile: loadProfileByUserId(userId)!,
  };
};

export const getUserProfileById = (userId: string) => loadProfileByUserId(userId);

export const updateUserProfile = (userId: string, patch: UserProfilePatch) => {
  const user = getUserRowById.get(userId) as UserRow | undefined;

  if (!user) {
    return null;
  }

  const currentSocials = parseSocials(user.socials_json);
  const nextSocials = {
    ...currentSocials,
    ...(patch.socials ?? {}),
  };

  updateUserProfileStatement.run({
    id: userId,
    bio: patch.bio ?? user.bio ?? "",
    phone: patch.phone ?? user.phone ?? "",
    region: patch.region ?? user.region ?? "Global",
    socials_json: JSON.stringify(nextSocials),
    updated_at: new Date().toISOString(),
  });

  return loadProfileByUserId(userId);
};

export const getOAuthAccountForUser = (userId: string, provider: AuthProvider) => {
  const account = getOAuthAccountByUserAndProvider.get(userId, provider) as OAuthAccountRow | undefined;

  if (!account) return null;

  return {
    ...account,
    accessToken: decryptSecret(account.access_token_encrypted),
    refreshToken: decryptSecret(account.refresh_token_encrypted),
  };
};
