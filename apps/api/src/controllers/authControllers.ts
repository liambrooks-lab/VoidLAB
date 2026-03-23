import { Request, Response } from "express";

export const createSession = async (req: Request, res: Response) => {
  const { email, name, phone, region } = req.body ?? {};

  if (!email || !name || !phone || !region) {
    return res.status(400).json({
      error: "Missing required profile fields.",
    });
  }

  return res.status(200).json({
    ok: true,
    profile: { email, name, phone, region },
  });
};
