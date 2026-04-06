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

  if (second) {
    return { owner: first, repo: second };
  }

  return { owner: fallbackOwner, repo: first };
};

const normalizeFilePath = (file?: PushRequestBody["activeFile"]) => {
  if (!file) return "";

  const normalized = (file.path || file.name || "").replaceAll("\\", "/").replace(/^\/+/, "");

  if (normalized) {
    return normalized;
  }

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
  const headers = {
    Authorization: `Bearer ${accessToken}`,
  };

  try {
    await githubApi.get(`/repos/${owner}/${repo}/branches/${branch}`, { headers });
    return;
  } catch (error) {
    if (!axios.isAxiosError(error) || error.response?.status !== 404) {
      throw error;
    }
  }

  const repoResponse = await githubApi.get(`/repos/${owner}/${repo}`, { headers });
  const defaultBranch = repoResponse.data.default_branch;
  const baseRef = await githubApi.get(`/repos/${owner}/${repo}/git/ref/heads/${defaultBranch}`, { headers });

  await githubApi.post(
    `/repos/${owner}/${repo}/git/refs`,
    {
      ref: `refs/heads/${branch}`,
      sha: baseRef.data.object.sha,
    },
    { headers },
  );
};

export const pushToGitHub = async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.authUser?.userId;
  const body = (req.body ?? {}) as PushRequestBody;

  if (!userId) {
    return res.status(401).json({ error: "Authentication is required." });
  }

  const githubAccount = await getOAuthAccountForUser(userId, "github");
  const profile = await getUserProfileById(userId);

  if (!profile || !githubAccount?.accessToken) {
    return res.status(403).json({
      error: "Connect GitHub to your VoidLAB account before pushing code.",
    });
  }

  if (!body.repository?.trim()) {
    return res.status(400).json({ error: "Repository name is required." });
  }

  if (!body.activeFile?.content || !normalizeFilePath(body.activeFile)) {
    return res.status(400).json({ error: "An active code file is required to push." });
  }

  const accessToken = githubAccount.accessToken;
  const headers = {
    Authorization: `Bearer ${accessToken}`,
  };

  try {
    const viewerResponse = await githubApi.get("/user", { headers });
    const githubLogin = viewerResponse.data.login as string;
    const repositoryInput = normalizeRepositoryInput(body.repository, githubLogin);
    const branch = body.branch?.trim() || "main";
    const visibility = body.visibility === "private" ? "private" : "public";

    if (body.mode !== "existing") {
      try {
        await githubApi.post(
          "/user/repos",
          {
            auto_init: true,
            description: body.description?.trim() || "",
            name: repositoryInput.repo,
            private: visibility === "private",
          },
          { headers },
        );
      } catch (error) {
        if (!axios.isAxiosError(error) || error.response?.status !== 422) {
          throw error;
        }
      }
    }

    await ensureBranch({
      accessToken,
      branch,
      owner: repositoryInput.owner,
      repo: repositoryInput.repo,
    });

    const filePath = normalizeFilePath(body.activeFile);
    let existingSha: string | undefined;

    try {
      const existingFileResponse = await githubApi.get(
        `/repos/${repositoryInput.owner}/${repositoryInput.repo}/contents/${encodeURIComponent(filePath).replace(/%2F/g, "/")}`,
        {
          headers,
          params: { ref: branch },
        },
      );
      existingSha = existingFileResponse.data.sha as string | undefined;
    } catch (error) {
      if (!axios.isAxiosError(error) || error.response?.status !== 404) {
        throw error;
      }
    }

    const commitMessage = existingSha
      ? `Update ${filePath} from VoidLAB`
      : `Add ${filePath} from VoidLAB`;

    await githubApi.put(
      `/repos/${repositoryInput.owner}/${repositoryInput.repo}/contents/${encodeURIComponent(filePath).replace(/%2F/g, "/")}`,
      {
        branch,
        content: Buffer.from(body.activeFile.content, "utf8").toString("base64"),
        message: commitMessage,
        sha: existingSha,
      },
      { headers },
    );

    const repoUrl = `https://github.com/${repositoryInput.owner}/${repositoryInput.repo}`;

    return res.status(200).json({
      ok: true,
      repoUrl,
      summary: {
        branch,
        filePath,
        providerUser: githubLogin,
        repository: `${repositoryInput.owner}/${repositoryInput.repo}`,
      },
      user: {
        name: profile.name,
      },
    });
  } catch (error) {
    const fallbackMessage = "VoidLAB could not push the code to GitHub.";

    if (axios.isAxiosError(error)) {
      const status = error.response?.status;
      const message =
        typeof error.response?.data === "string"
          ? error.response.data
          : error.response?.data?.message || error.message;

      return res.status(status && status >= 400 ? status : 500).json({
        error: message || fallbackMessage,
      });
    }

    return res.status(500).json({ error: fallbackMessage });
  }
};
