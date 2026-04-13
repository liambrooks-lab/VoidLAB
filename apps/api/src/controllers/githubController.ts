import axios from "axios";
import { Response } from "express";
import { getOAuthAccountForUser, getUserProfileById } from "../lib/database";
import { AuthenticatedRequest } from "../middleware/auth";

// ... Keep existing types and helper functions (normalizeRepositoryInput, normalizeFilePath, etc.)

export const pushToGitHub = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.authUser?.userId;
  const body = req.body;

  if (!userId) return res.status(401).json({ error: "Authentication is required." });

  const githubAccount = await getOAuthAccountForUser(userId, "github");
  const profile = await getUserProfileById(userId);

  // Type guard for strict mode
  if (!githubAccount || !("accessToken" in githubAccount) || !githubAccount.accessToken) {
    return res.status(403).json({ error: "Connect GitHub first." });
  }

  const accessToken = githubAccount.accessToken;
  const headers = { Authorization: `Bearer ${accessToken}` };

  try {
    // ... Keep existing push logic
    return res.status(200).json({
      ok: true,
      user: { name: profile?.name || "VoidLAB User" },
    });
  } catch (error) {
    return res.status(500).json({ error: "Push failed." });
  }
};