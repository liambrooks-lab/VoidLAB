import { Request, Response } from "express";
import jwt from "jsonwebtoken";

export type OAuthIntent = "link" | "login";

export type SessionPayload = {
  userId: string;
};

type OAuthStatePayload = {
  intent: OAuthIntent;
  provider: "github" | "google" | "x";
  returnTo: string;
  verifier?: string;
};

const sessionCookieName = "voidlab_session";
const oauthCookieName = "voidlab_oauth";
const jwtSecret = process.env.JWT_SECRET || "voidlab-dev-jwt-secret";

const isProduction = process.env.NODE_ENV === "production";

const cookieOptions = {
  httpOnly: true,
  sameSite: "lax" as const,
  secure: isProduction,
};

export const getWebAppUrl = () => process.env.WEB_APP_URL || "http://localhost:3000";

export const readSession = (req: Request) => {
  const token =
    req.cookies?.[sessionCookieName] ||
    req.headers.authorization?.replace(/^Bearer\s+/i, "");

  if (!token) return null;

  try {
    return jwt.verify(token, jwtSecret) as SessionPayload;
  } catch {
    return null;
  }
};

export const createSessionToken = (payload: SessionPayload) =>
  jwt.sign(payload, jwtSecret, { expiresIn: "7d" });

export const setSessionCookie = (res: Response, payload: SessionPayload) => {
  res.cookie(sessionCookieName, createSessionToken(payload), {
    ...cookieOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: "/",
  });
};

export const clearSessionCookie = (res: Response) => {
  res.clearCookie(sessionCookieName, {
    ...cookieOptions,
    path: "/",
  });
};

export const createOAuthStateToken = (payload: OAuthStatePayload) =>
  jwt.sign(payload, jwtSecret, { expiresIn: "15m" });

export const setOAuthStateCookie = (res: Response, token: string) => {
  res.cookie(oauthCookieName, token, {
    ...cookieOptions,
    maxAge: 15 * 60 * 1000,
    path: "/api/auth",
  });
};

export const readOAuthState = (req: Request, state?: string | null) => {
  const cookieToken = req.cookies?.[oauthCookieName];

  if (!cookieToken || !state || cookieToken !== state) {
    return null;
  }

  try {
    return jwt.verify(cookieToken, jwtSecret) as OAuthStatePayload;
  } catch {
    return null;
  }
};

export const clearOAuthStateCookie = (res: Response) => {
  res.clearCookie(oauthCookieName, {
    ...cookieOptions,
    path: "/api/auth",
  });
};

export const sanitizeReturnTo = (value?: string | null) => {
  if (!value || !value.startsWith("/")) {
    return "/editor";
  }

  return value;
};
