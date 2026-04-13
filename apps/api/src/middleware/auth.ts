import { NextFunction, Request, Response } from "express";
import { readSession, type SessionPayload } from "../lib/session";

export type AuthenticatedRequest = Request & {
  authUser?: SessionPayload;
};

export const requireAuth = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction,
) => {
  const session = readSession(req);

  // TRUST THE TOKEN: If it exists and is signed, let them through
  if (!session?.userId) {
    return res.status(401).json({ error: "Authentication is required." });
  }

  req.authUser = session;
  return next();
};

export const attachOptionalAuth = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction,
) => {
  const session = readSession(req);
  if (session?.userId) {
    req.authUser = session;
  }
  next();
};