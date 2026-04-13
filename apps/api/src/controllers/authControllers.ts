import axios from "axios";
import { Response } from "express";
import { getOAuthAccountForUser, getUserProfileById } from "../lib/database";
import { AuthenticatedRequest } from "../middleware/auth";

type PushRequestBody = {
  activeFile?: {
    content: string;
    languageId: string;
    name: string;
    path: string;
  };
  branch?: string;
  description?: string;
  mode?: "existing" | "new";
  repository?: string;
  visibility?: "private" | "public";
};

const githubApi = axios.create({
  baseURL: "https://api.github.com",
  headers: {
    Accept: "application/vnd.github+json",
    "User-Agent": "VoidLAB/1.0",
  },
  timeout: 20000,
});

const fallbackFileNames: Record<string, string> = {
  bash: "main.sh",
  c: "main.c",
  cpp: "main.cpp",
  csharp: "Program.cs",
  go: "main.go",
  java: "Main.java",
  javascript: "index.js",
  kotlin: "Main.kt",
  lua: "main.lua",
  php: "index.php",
  python: "app.py",
  ruby: "main.rb",
  rust: "main.rs",
  swift: "main.swift",
  typescript: "index.ts",
};

const normalizeRepositoryInput = (value: string, fallbackOwner: string) => {
  const trimmed = value.trim().replace(/\.git$/i, "");
  const withoutUrl = trimmed.replace(/^https?:\/\/github\.com\//i, "");
  const [first, second] = withoutUrl.split("/");
  if (second) return { owner: first, repo: second };
  return { owner: fallbackOwner, repo: first };
};

const normalizeFilePath = (file?: PushRequestBody["activeFile"]) => {
  if (!file) return "";
  const normalized = (file.path || file.name || "").replaceAll("\\", "/").replace(/^\/+/, "");
  if (normalized) return normalized;
  return fallbackFileNames[file.languageId] ?? "main.txt";
};

const ensureBranch = async ({
  accessToken,
  branch,
  owner,
  repo,
}: {
  accessToken: string;
  branch: string;
  owner: string;
  repo: string;
}) => {
  const headers = { Authorization: `Bearer ${accessToken}` };
  try {
    await githubApi.get(`/repos/${owner}/${repo}/branches/${branch}`, { headers });
    return;
  } catch (error) {
    if (!axios.isAxiosError(error) || error.response?.status !== 404) throw error;
  }
  const repoResponse = await githubApi.get(`/repos/${owner}/${repo}`, { headers });
  const defaultBranch = repoResponse.data.default_branch;
  const baseRef = await githubApi.get(`/repos/${owner}/${repo}/git/ref/heads/${defaultBranch}`, { headers });
  await githubApi.post(`/repos/${owner}/${repo}/git/refs`, { ref: `refs/heads/${branch}`, sha: baseRef.data.object.sha }, { headers });
};

export const pushToGitHub = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.authUser?.userId;
  const body = (req.body ?? {}) as PushRequestBody;

  if (!userId) return res.status(401).json({ error: "Authentication is required." });

  const githubAccount = await getOAuthAccountForUser(userId, "github");
  const profile = await getUserProfileById(userId);

  // FIX: Type Guard to prevent 'never' errors
  if (!githubAccount || !("accessToken" in githubAccount) || !githubAccount.accessToken) {
    return res.status(403).json({ error: "Connect GitHub to your VoidLAB account." });
  }

  if (!body.repository?.trim()) return res.status(400).json({ error: "Repo name is required." });
  if (!body.activeFile?.content || !normalizeFilePath(body.activeFile)) return res.status(400).json({ error: "File required." });

  const accessToken = githubAccount.accessToken;
  const headers = { Authorization: `Bearer ${accessToken}` };

  try {
    const viewerResponse = await githubApi.get("/user", { headers });
    const githubLogin = viewerResponse.data.login as string;
    const repositoryInput = normalizeRepositoryInput(body.repository, githubLogin);
    const branch = body.branch?.trim() || "main";

    if (body.mode !== "existing") {
      try {
        await githubApi.post("/user/repos", { auto_init: true, name: repositoryInput.repo, private: body.visibility === "private" }, { headers });
      } catch (e) { /* ignore 422 */ }
    }

    await ensureBranch({ accessToken, branch, owner: repositoryInput.owner, repo: repositoryInput.repo });
    const filePath = normalizeFilePath(body.activeFile);
    let existingSha: string | undefined;

    try {
      const resp = await githubApi.get(`/repos/${repositoryInput.owner}/${repositoryInput.repo}/contents/${encodeURIComponent(filePath)}`, { headers, params: { ref: branch } });
      existingSha = resp.data.sha;
    } catch (e) { /* ignore 404 */ }

    await githubApi.put(`/repos/${repositoryInput.owner}/${repositoryInput.repo}/contents/${encodeURIComponent(filePath)}`, {
      branch,
      content: Buffer.from(body.activeFile.content, "utf8").toString("base64"),
      message: `Update ${filePath} from VoidLAB`,
      sha: existingSha,
    }, { headers });

    return res.status(200).json({
      ok: true,
      repoUrl: `https://github.com/${repositoryInput.owner}/${repositoryInput.repo}`,
      summary: { branch, filePath, providerUser: githubLogin, repository: `${repositoryInput.owner}/${repositoryInput.repo}` },
      user: { name: profile?.name || "VoidLAB User" }, // FIX: Safe access
    });
  } catch (error) {
    return res.status(500).json({ error: "Push failed." });
  }
};