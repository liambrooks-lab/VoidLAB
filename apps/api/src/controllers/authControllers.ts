import { Request, Response } from "express";
import crypto from "crypto";
import {
  type AuthProvider,
  type SocialLinks,
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

export const defaultProfileShape = {
  avatar: "",
  bio: "",
  email: "",
  githubConnected: false,
  githubLogin: "",
  id: "",
  name: "",
  phone: "",
  providers: { github: false, google: false, x: false },
  region: "Global",
  socials: { github: "", instagram: "", linkedin: "", x: "" },
};

const sendWelcomeEmail = async ({
  email,
  name,
}: {
  email: string;
  name: string;
  region: string;
}) => {
  const apiKey = process.env.RESEND_API_KEY;
  const fromEmail = process.env.VOIDLAB_FROM_EMAIL;
  if (!apiKey || !fromEmail || !email) return { delivered: false };

  try {
    await fetch(resendApiUrl, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: fromEmail,
        html: `<h1>Welcome ${name}</h1><p>Your VoidLAB workspace is ready.</p>`,
        subject: "Welcome to VoidLAB",
        to: [email],
      }),
    });
    return { delivered: true };
  } catch {
    return { delivered: false };
  }
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
  if (token) url.searchParams.set("sessionToken", token);
  return res.redirect(url.toString());
};

export const startOAuth = (provider: AuthProvider) => (req: AuthenticatedRequest, res: Response) => {
  const config = providerConfigs[provider];
  if (!config.clientId || !config.clientSecret) {
    return res.status(500).json({ error: `${provider} OAuth is not configured.` });
  }
  const intent = req.query.intent === "link" ? "link" : "login";
  const returnTo = sanitizeReturnTo(typeof req.query.returnTo === "string" ? req.query.returnTo : undefined);
  const verifier = provider === "x" ? crypto.randomBytes(48).toString("base64url") : undefined;
  const stateToken = createOAuthStateToken({ intent, provider, returnTo, verifier });

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
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: config.clientId,
      client_secret: config.clientSecret,
      code,
      grant_type: "authorization_code",
      redirect_uri: getCallbackUrl("google"),
    }),
  });
  if (!response.ok) throw new Error(await response.text());
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
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error(await response.text());
  const data = (await response.json()) as { picture?: string; email?: string; name: string; sub: string };
  return { avatar: data.picture ?? "", email: data.email, name: data.name, providerUserId: data.sub };
};

const exchangeGitHubCode = async (code: string): Promise<TokenResponse> => {
  const config = providerConfigs.github;
  const response = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({ client_id: config.clientId, client_secret: config.clientSecret, code, redirect_uri: getCallbackUrl("github") }),
  });
  if (!response.ok) throw new Error(await response.text());
  const data = (await response.json()) as { access_token: string; scope?: string; token_type?: string };
  return { accessToken: data.access_token, scope: data.scope, tokenType: data.token_type };
};

const fetchGitHubProfile = async (accessToken: string): Promise<ProviderProfile> => {
  const headers = { Accept: "application/vnd.github+json", Authorization: `Bearer ${accessToken}`, "User-Agent": "VoidLAB/1.0" };
  const userResponse = await fetch("https://api.github.com/user", { headers });
  if (!userResponse.ok) throw new Error(await userResponse.text());
  const user = (await userResponse.json()) as { avatar_url?: string; email?: string | null; html_url?: string; id: number; login?: string; name?: string };
  let email = user.email ?? undefined;
  if (!email) {
    const emailResponse = await fetch("https://api.github.com/user/emails", { headers });
    if (emailResponse.ok) {
      const emails = (await emailResponse.json()) as Array<{ email: string; primary: boolean; verified: boolean }>;
      email = emails.find((e) => e.primary && e.verified)?.email ?? emails[0]?.email;
    }
  }
  return { avatar: user.avatar_url ?? "", email, name: user.name || user.login || "GitHub User", profileUrl: user.html_url, providerUserId: String(user.id), username: user.login };
};

const exchangeXCode = async (code: string, verifier: string): Promise<TokenResponse> => {
  const config = providerConfigs.x;
  const clientCredentials = Buffer.from(`${config.clientId}:${config.clientSecret}`).toString("base64");
  const response = await fetch("https://api.x.com/2/oauth2/token", {
    method: "POST",
    headers: { Authorization: `Basic ${clientCredentials}`, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: config.clientId, code, code_verifier: verifier, grant_type: "authorization_code", redirect_uri: getCallbackUrl("x") }),
  });
  if (!response.ok) throw new Error(await response.text());
  const data = (await response.json()) as { access_token: string; expires_in?: number; refresh_token?: string; scope?: string; token_type?: string };
  return { accessToken: data.access_token, expiresAt: data.expires_in ? Date.now() + data.expires_in * 1000 : null, refreshToken: data.refresh_token, scope: data.scope, tokenType: data.token_type };
};

const fetchXProfile = async (accessToken: string): Promise<ProviderProfile> => {
  const response = await fetch("https://api.x.com/2/users/me?user.fields=profile_image_url,username,name", {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!response.ok) throw new Error(await response.text());
  const payload = (await response.json()) as { data: { id: string; name: string; email?: string; profile_image_url?: string; username?: string } };
  return {
    avatar: payload.data.profile_image_url ?? "",
    email: payload.data.email,
    name: payload.data.name,
    profileUrl: payload.data.username ? `https://x.com/${payload.data.username}` : undefined,
    providerUserId: payload.data.id,
    username: payload.data.username,
  };
};

export const completeOAuth = (provider: AuthProvider) => async (req: Request, res: Response) => {
  const state = typeof req.query.state === "string" ? req.query.state : null;
  const code = typeof req.query.code === "string" ? req.query.code : null;
  const oauthState = readOAuthState(req, state);
  clearOAuthStateCookie(res);
  if (!oauthState || !code) return redirectWithError(res, "/", "OAuth session expired.");

  try {
    const tokenResponse = provider === "google" ? await exchangeGoogleCode(code) : 
                         provider === "github" ? await exchangeGitHubCode(code) : 
                         await exchangeXCode(code, oauthState.verifier || "");

    const providerProfile = provider === "google" ? await fetchGoogleProfile(tokenResponse.accessToken) : 
                           provider === "github" ? await fetchGitHubProfile(tokenResponse.accessToken) : 
                           await fetchXProfile(tokenResponse.accessToken);

    const userId = `temp-${providerProfile.providerUserId}`;
    const appSession = { userId };
    setSessionCookie(res, appSession);
    const token = createSessionToken(appSession);

    if (providerProfile.email) {
      void sendWelcomeEmail({ email: providerProfile.email, name: providerProfile.name, region: "Global" }).catch(() => undefined);
    }
    return redirectWithSuccess(res, oauthState.returnTo, token);
  } catch (error) {
    return redirectWithError(res, oauthState.returnTo, error instanceof Error ? error.message : "OAuth failed.");
  }
};

export const manualLogin = async (req: Request, res: Response) => {
  const { email, name } = req.body ?? {};
  if (!email || !name) return res.status(400).json({ error: "Name and email are required." });
  const userId = `user-${crypto.randomUUID()}`;
  const appSession = { userId };
  setSessionCookie(res, appSession);
  return res.status(200).json({ ok: true, profile: { ...defaultProfileShape, id: userId, name, email }, token: createSessionToken(appSession) });
};

export const getCurrentUser = async (req: Request, res: Response) => {
  const session = readSession(req);
  if (!session?.userId) return res.status(401).json({ error: "Not signed in." });
  return res.status(200).json({ ok: true, profile: { ...defaultProfileShape, id: session.userId, name: "VoidLAB User" } });
};

export const updateCurrentUserProfile = async (_req: Request, res: Response) => res.status(200).json({ ok: true });
export const logout = (_req: Request, res: Response) => { clearSessionCookie(res); clearOAuthStateCookie(res); return res.status(200).json({ ok: true }); };
export const beginGoogleOAuth = startOAuth("google");
export const beginGitHubOAuth = startOAuth("github");
export const beginXOAuth = startOAuth("x");
export const handleGoogleOAuthCallback = completeOAuth("google");
export const handleGitHubOAuthCallback = completeOAuth("github");
export const handleXOAuthCallback = completeOAuth("x");
export const getGitHubConnectionStatus = async (_req: Request, res: Response) => res.status(200).json({ ok: true, connected: false });