import { Request, Response } from "express";
import crypto from "crypto";
import {
  createOrUpdateManualUser,
  getOAuthAccountForUser,
  getUserProfileById,
  type AuthProvider,
  type SocialLinks,
  updateUserProfile,
  upsertOAuthUser,
} from "../lib/database";
import { toCodeChallenge } from "../lib/crypto";
import {
  clearOAuthStateCookie,
  clearSessionCookie,
  createSessionToken,
  createOAuthStateToken,
  getWebAppUrl,
  readOAuthState,
  readSession,
  sanitizeReturnTo,
  setOAuthStateCookie,
  setSessionCookie,
  verifySessionToken,
} from "../lib/session";
import type { AuthenticatedRequest } from "../middleware/auth";

const resendApiUrl = "https://api.resend.com/emails";

type OAuthIntent = "link" | "login";

type ProviderProfile = {
  avatar: string;
  email?: string | null;
  name: string;
  profileUrl?: string;
  providerUserId: string;
  username?: string;
};

type TokenResponse = {
  accessToken: string;
  expiresAt?: number | null;
  refreshToken?: string | null;
  scope?: string;
  tokenType?: string;
};

const providerConfigs = {
  github: {
    authUrl: "https://github.com/login/oauth/authorize",
    callbackPath: "/api/auth/github/callback",
    clientId: process.env.GITHUB_CLIENT_ID || "",
    clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    scope: "read:user user:email repo",
  },
  google: {
    authUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    callbackPath: "/api/auth/google/callback",
    clientId: process.env.GOOGLE_CLIENT_ID || "",
    clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    scope: "openid email profile",
  },
  x: {
    authUrl: "https://x.com/i/oauth2/authorize",
    callbackPath: "/api/auth/x/callback",
    clientId: process.env.X_CLIENT_ID || "",
    clientSecret: process.env.X_CLIENT_SECRET || "",
    scope: "users.read users.email offline.access",
  },
} satisfies Record<
  AuthProvider,
  { authUrl: string; callbackPath: string; clientId: string; clientSecret: string; scope: string }
>;

const emptySocials: SocialLinks = {
  github: "",
  instagram: "",
  linkedin: "",
  x: "",
};

const sendWelcomeEmail = async ({
  email,
  name,
  region,
}: {
  email: string;
  name: string;
  region: string;
}) => {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.VOIDLAB_FROM_EMAIL;

  if (!apiKey || !fromEmail || !email) {
    return {
      delivered: false,
      reason: "Email delivery is not configured on the backend yet.",
    };
  }

  const html = `
    <div style="font-family:Arial,sans-serif;background:#f8fbff;padding:32px;color:#0f172a">
      <div style="max-width:620px;margin:0 auto;background:white;border:1px solid #dbeafe;border-radius:24px;overflow:hidden">
        <div style="padding:28px 32px;background:linear-gradient(135deg,#0f172a,#1d4ed8);color:white">
          <div style="font-size:12px;letter-spacing:0.24em;text-transform:uppercase;opacity:0.8">VoidLAB</div>
          <h1 style="margin:12px 0 0;font-size:28px;line-height:1.2">Your workspace is ready</h1>
        </div>
        <div style="padding:28px 32px">
          <p style="font-size:16px;line-height:1.7;margin:0 0 16px">Hi ${name},</p>
          <p style="font-size:16px;line-height:1.7;margin:0 0 16px">
            Welcome to VoidLAB. Your cloud workspace is ready, and your OAuth login is now active.
          </p>
          <p style="font-size:16px;line-height:1.7;margin:0 0 24px">
            Open your product link: <a href="${getWebAppUrl()}" style="color:#2563eb">${getWebAppUrl()}</a>
          </p>
          <div style="font-size:13px;color:#475569">Built for fast iteration, premium UX, and modern cloud workflows.</div>
        </div>
      </div>
    </div>
  `;

  const response = await fetch(resendApiUrl, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: fromEmail,
      html,
      subject: "Welcome to VoidLAB",
      text: `Hi ${name}, your VoidLAB workspace is ready. Open ${getWebAppUrl()} to start coding.`,
      to: [email],
    }),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(details || "Unable to deliver welcome email.");
  }

  return { delivered: true };
};

const getCallbackUrl = (provider: AuthProvider) =>
  `${process.env.API_BASE_URL || "http://localhost:5000"}${providerConfigs[provider].callbackPath}`;

const redirectWithError = (res: Response, returnTo: string, message: string) => {
  const url = new URL(returnTo, getWebAppUrl());
  url.searchParams.set("authError", message);
  return res.redirect(url.toString());
};

const redirectWithSuccess = (res: Response, returnTo: string, token?: string) => {
  const url = new URL(returnTo, getWebAppUrl());
  url.searchParams.set("auth", "success");
  if (token) {
    url.searchParams.set("sessionToken", token);
  }
  return res.redirect(url.toString());
};

const startOAuth = (provider: AuthProvider) => (req: AuthenticatedRequest, res: Response) => {
  const config = providerConfigs[provider];

  if (!config.clientId || !config.clientSecret) {
    return res.status(500).json({
      error: `${provider} OAuth is not configured on the backend.`,
    });
  }

  const intent = req.query.intent === "link" ? "link" : "login";
  const returnTo = sanitizeReturnTo(typeof req.query.returnTo === "string" ? req.query.returnTo : undefined);
  const verifier = provider === "x" ? crypto.randomBytes(48).toString("base64url") : undefined;
  const currentSession =
    readSession(req) ||
    verifySessionToken(typeof req.query.appToken === "string" ? req.query.appToken : undefined);

  if (intent === "link" && !currentSession?.userId) {
    return res.status(401).json({
      error: "Sign in to VoidLAB before linking another provider.",
    });
  }

  const stateToken = createOAuthStateToken({
    intent,
    linkUserId: currentSession?.userId,
    provider,
    returnTo,
    verifier,
  });

  setOAuthStateCookie(res, stateToken);

  const params = new URLSearchParams({
    client_id: config.clientId,
    redirect_uri: getCallbackUrl(provider),
    response_type: "code",
    scope: config.scope,
    state: stateToken,
  });

  if (provider === "google") {
    params.set("access_type", "offline");
    params.set("include_granted_scopes", "true");
    params.set("prompt", "consent");
  }

  if (provider === "x" && verifier) {
    params.set("code_challenge", toCodeChallenge(verifier));
    params.set("code_challenge_method", "S256");
  }

  return res.redirect(`${config.authUrl}?${params.toString()}`);
};

const exchangeGoogleCode = async (code: string): Promise<TokenResponse> => {
  const config = providerConfigs.google;
  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: getCallbackUrl("google"),
    }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const data = (await response.json()) as {
    access_token: string;
    expires_in?: number;
    refresh_token?: string;
    scope?: string;
    token_type?: string;
  };

  return {
    accessToken: data.access_token,
    expiresAt: data.expires_in ? Date.now() + data.expires_in * 1000 : null,
    refreshToken: data.refresh_token,
    scope: data.scope,
    tokenType: data.token_type,
  };
};

const fetchGoogleProfile = async (accessToken: string): Promise<ProviderProfile> => {
  const response = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const data = (await response.json()) as {
    email?: string;
    name: string;
    picture?: string;
    sub: string;
  };

  return {
    avatar: data.picture ?? "",
    email: data.email,
    name: data.name,
    providerUserId: data.sub,
  };
};

const exchangeGitHubCode = async (code: string): Promise<TokenResponse> => {
  const config = providerConfigs.github;
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      redirect_uri: getCallbackUrl("github"),
    }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const data = (await response.json()) as {
    access_token: string;
    scope?: string;
    token_type?: string;
  };

  return {
    accessToken: data.access_token,
    scope: data.scope,
    tokenType: data.token_type,
  };
};

const fetchGitHubProfile = async (accessToken: string): Promise<ProviderProfile> => {
  const headers = {
    Accept: "application/vnd.github+json",
    Authorization: `Bearer ${accessToken}`,
    "User-Agent": "VoidLAB/1.0",
  };

  const userResponse = await fetch("https://api.github.com/user", { headers });

  if (!userResponse.ok) {
    throw new Error(await userResponse.text());
  }

  const user = (await userResponse.json()) as {
    avatar_url?: string;
    email?: string | null;
    html_url?: string;
    id: number;
    login?: string;
    name?: string;
  };

  let email = user.email ?? undefined;

  if (!email) {
    const emailResponse = await fetch("https://api.github.com/user/emails", { headers });
    if (emailResponse.ok) {
      const emails = (await emailResponse.json()) as Array<{
        email: string;
        primary: boolean;
        verified: boolean;
      }>;
      email =
        emails.find((entry) => entry.primary && entry.verified)?.email ??
        emails.find((entry) => entry.verified)?.email ??
        emails[0]?.email;
    }
  }

  return {
    avatar: user.avatar_url ?? "",
    email,
    name: user.name || user.login || "GitHub User",
    profileUrl: user.html_url,
    providerUserId: String(user.id),
    username: user.login,
  };
};

const exchangeXCode = async (code: string, verifier: string): Promise<TokenResponse> => {
  const config = providerConfigs.x;
  const clientCredentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64");
  const response = await fetch("https://api.x.com/2/oauth2/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${clientCredentials}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      client_id: config.clientId,
      code,
      code_verifier: verifier,
      grant_type: "authorization_code",
      redirect_uri: getCallbackUrl("x"),
    }),
  });

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const data = (await response.json()) as {
    access_token: string;
    expires_in?: number;
    refresh_token?: string;
    scope?: string;
    token_type?: string;
  };

  return {
    accessToken: data.access_token,
    expiresAt: data.expires_in ? Date.now() + data.expires_in * 1000 : null,
    refreshToken: data.refresh_token,
    scope: data.scope,
    tokenType: data.token_type,
  };
};

const fetchXProfile = async (accessToken: string): Promise<ProviderProfile> => {
  const response = await fetch(
    "https://api.x.com/2/users/me?user.fields=profile_image_url,username,name",
    {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(await response.text());
  }

  const payload = (await response.json()) as {
    data: {
      email?: string;
      id: string;
      name: string;
      profile_image_url?: string;
      username?: string;
    };
  };

  return {
    avatar: payload.data.profile_image_url ?? "",
    email: payload.data.email,
    name: payload.data.name,
    profileUrl: payload.data.username ? `https://x.com/${payload.data.username}` : undefined,
    providerUserId: payload.data.id,
    username: payload.data.username,
  };
};

const completeOAuth =
  (provider: AuthProvider) => async (req: Request, res: Response) => {
    const config = providerConfigs[provider];
    const state = typeof req.query.state === "string" ? req.query.state : null;
    const code = typeof req.query.code === "string" ? req.query.code : null;
    const returnTo = sanitizeReturnTo(typeof req.query.returnTo === "string" ? req.query.returnTo : undefined);

    if (typeof req.query.error === "string") {
      clearOAuthStateCookie(res);
      return redirectWithError(res, returnTo, req.query.error);
    }

    const oauthState = readOAuthState(req, state);
    clearOAuthStateCookie(res);

    if (!oauthState || oauthState.provider !== provider || !code) {
      return redirectWithError(res, "/",
        "The OAuth session expired or was invalid. Please try again.");
    }

    if (!config.clientId || !config.clientSecret) {
      return redirectWithError(res, oauthState.returnTo, `${provider} OAuth is not configured.`);
    }

    try {
      const tokenResponse =
        provider === "google"
          ? await exchangeGoogleCode(code)
          : provider === "github"
            ? await exchangeGitHubCode(code)
            : await exchangeXCode(code, oauthState.verifier || "");

      const providerProfile =
        provider === "google"
          ? await fetchGoogleProfile(tokenResponse.accessToken)
          : provider === "github"
            ? await fetchGitHubProfile(tokenResponse.accessToken)
            : await fetchXProfile(tokenResponse.accessToken);

      const currentSession = readSession(req);
      const { created, profile } = await upsertOAuthUser({
        accessToken: tokenResponse.accessToken,
        avatar: providerProfile.avatar,
        currentUserId: oauthState.intent === "link" ? oauthState.linkUserId : undefined,
        email: providerProfile.email,
        expiresAt: tokenResponse.expiresAt,
        name: providerProfile.name,
        profileUrl: providerProfile.profileUrl,
        provider,
        providerUserId: providerProfile.providerUserId,
        refreshToken: tokenResponse.refreshToken,
        scope: tokenResponse.scope,
        tokenType: tokenResponse.tokenType,
        username: providerProfile.username,
      });

      const appSession = { userId: profile.id };
      setSessionCookie(res, appSession);
      const token = createSessionToken(appSession);

      if (created && profile.email) {
        void sendWelcomeEmail({
          email: profile.email,
          name: profile.name,
          region: profile.region || "Global",
        }).catch(() => undefined);
      }

      return redirectWithSuccess(res, oauthState.returnTo, token);
    } catch (error) {
      const message = error instanceof Error ? error.message : "OAuth sign-in failed.";
      return redirectWithError(res, oauthState.returnTo, message);
    }
  };

export const getCurrentUser = async (req: Request, res: Response) => {
  const session = readSession(req);

  if (!session?.userId) {
    return res.status(401).json({ error: "Not signed in." });
  }

  const profile = await getUserProfileById(session.userId);

  if (!profile) {
    clearSessionCookie(res);
    return res.status(401).json({ error: "Session is no longer valid." });
  }

  return res.status(200).json({ ok: true, profile });
};

export const manualLogin = async (req: Request, res: Response) => {
  const { avatar, email, name, phone, region } = req.body ?? {};

  if (
    typeof email !== "string" ||
    typeof name !== "string" ||
    typeof phone !== "string" ||
    typeof region !== "string" ||
    !email.trim() ||
    !name.trim() ||
    !phone.trim() ||
    !region.trim()
  ) {
    return res.status(400).json({
      error: "Name, email, phone, and region are required.",
    });
  }

  try {
    const { created, profile } = await createOrUpdateManualUser({
      avatar: typeof avatar === "string" ? avatar : "",
      email: email.trim().toLowerCase(),
      name: name.trim(),
      phone: phone.trim(),
      region: region.trim(),
    });

    if (!profile) {
      return res.status(500).json({ error: "VoidLAB could not create your session." });
    }

    const appSession = { userId: profile.id };
    setSessionCookie(res, appSession);

    if (created && profile.email) {
      void sendWelcomeEmail({
        email: profile.email,
        name: profile.name,
        region: profile.region || "Global",
      }).catch(() => undefined);
    }

    return res.status(200).json({
      ok: true,
      profile,
      token: createSessionToken(appSession),
    });
  } catch (error) {
    return res.status(500).json({
      error: error instanceof Error ? error.message : "VoidLAB could not sign you in.",
    });
  }
};

export const updateCurrentUserProfile = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.authUser?.userId;

  if (!userId) {
    return res.status(401).json({ error: "Authentication is required." });
  }

  const { bio, phone, region, socials } = req.body ?? {};
  const profile = await updateUserProfile(userId, {
    bio: typeof bio === "string" ? bio : undefined,
    phone: typeof phone === "string" ? phone : undefined,
    region: typeof region === "string" ? region : undefined,
    socials:
      socials && typeof socials === "object"
        ? {
            github: typeof socials.github === "string" ? socials.github : undefined,
            instagram: typeof socials.instagram === "string" ? socials.instagram : undefined,
            linkedin: typeof socials.linkedin === "string" ? socials.linkedin : undefined,
            x: typeof socials.x === "string" ? socials.x : undefined,
          }
        : undefined,
  });

  if (!profile) {
    return res.status(404).json({ error: "User not found." });
  }

  return res.status(200).json({ ok: true, profile });
};

export const logout = (_req: Request, res: Response) => {
  clearSessionCookie(res);
  clearOAuthStateCookie(res);
  return res.status(200).json({ ok: true });
};

export const beginGoogleOAuth = startOAuth("google");
export const beginGitHubOAuth = startOAuth("github");
export const beginXOAuth = startOAuth("x");
export const handleGoogleOAuthCallback = completeOAuth("google");
export const handleGitHubOAuthCallback = completeOAuth("github");
export const handleXOAuthCallback = completeOAuth("x");

export const getGitHubConnectionStatus = async (req: Request, res: Response) => {
  const session = readSession(req);

  if (!session?.userId) {
    return res.status(401).json({ error: "Not signed in." });
  }

  const githubAccount = await getOAuthAccountForUser(session.userId, "github");

  return res.status(200).json({
    ok: true,
    connected: Boolean(githubAccount?.accessToken),
    username: githubAccount?.username ?? "",
  });
};

export const defaultProfileShape = {
  avatar: "",
  bio: "",
  email: "",
  githubConnected: false,
  githubLogin: "",
  id: "",
  name: "",
  phone: "",
  providers: {
    github: false,
    google: false,
    x: false,
  },
  region: "Global",
  socials: emptySocials,
};
