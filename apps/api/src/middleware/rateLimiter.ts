import { NextFunction, Request, Response } from "express";

const requestMap = new Map<string, { count: number; start: number }>();
const windowMs = 60_000;
const maxRequests = 30;

export const rateLimiter = (req: Request, res: Response, next: NextFunction) => {
  const key = req.ip || "anonymous";
  const now = Date.now();
  const entry = requestMap.get(key);

  if (!entry || now - entry.start > windowMs) {
    requestMap.set(key, { count: 1, start: now });
    return next();
  }

  if (entry.count >= maxRequests) {
    return res.status(429).json({
      error: "Rate limit exceeded. Please wait a moment and try again.",
    });
  }

  entry.count += 1;
  requestMap.set(key, entry);
  return next();
};
