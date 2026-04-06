import { Router } from "express";
import {
  beginGitHubOAuth,
  beginGoogleOAuth,
  beginXOAuth,
  getCurrentUser,
  getGitHubConnectionStatus,
  handleGitHubOAuthCallback,
  handleGoogleOAuthCallback,
  handleXOAuthCallback,
  logout,
  manualLogin,
  updateCurrentUserProfile,
} from "../controllers/authControllers";
import { requireAuth } from "../middleware/auth";

const router = Router();

router.post("/manual-login", manualLogin);
router.get("/google", beginGoogleOAuth);
router.get("/google/callback", handleGoogleOAuthCallback);
router.get("/github", beginGitHubOAuth);
router.get("/github/callback", handleGitHubOAuthCallback);
router.get("/x", beginXOAuth);
router.get("/x/callback", handleXOAuthCallback);
router.get("/me", getCurrentUser);
router.get("/github/status", getGitHubConnectionStatus);
router.patch("/profile", requireAuth, updateCurrentUserProfile);
router.post("/logout", logout);

export default router;
