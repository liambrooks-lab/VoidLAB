"use client";

import { useEffect, useMemo, useState } from "react";
import GitHubPanel from "@/components/editor/GitHubPanel";
import { useUser } from "@/context/UserContext";
import { buildOAuthStartUrl } from "@/lib/auth";
import { apiBaseUrl } from "@/lib/api";
import {
  defaultGitState,
  persistWorkspace,
  readWorkspace,
  type GitHubState,
  type WorkspaceState,
} from "@/lib/workspace";

type PushFormState = {
  branch: string;
  description: string;
  mode: "existing" | "new";
  repository: string;
  visibility: "public" | "private";
};

const defaultPushForm: PushFormState = {
  branch: "main",
  description: "",
  mode: "new",
  repository: "",
  visibility: "public",
};

const getRepoNameFromUrl = (repoUrl: string) => {
  const cleaned = repoUrl.replace(/\.git$/i, "").replace(/^https?:\/\/github\.com\//i, "");
  return cleaned;
};

export default function GitHubWorkspacePanel() {
  const { profile, recordActivity } = useUser();
  const [workspace, setWorkspace] = useState<WorkspaceState | null>(null);
  const [gitState, setGitState] = useState<GitHubState>(defaultGitState);
  const [copied, setCopied] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [pushForm, setPushForm] = useState<PushFormState>(defaultPushForm);
  const [pushing, setPushing] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [repoUrl, setRepoUrl] = useState("");

  useEffect(() => {
    const nextWorkspace = readWorkspace();
    setWorkspace(nextWorkspace);
    setGitState(nextWorkspace.gitState);
    setPushForm({
      branch: nextWorkspace.gitState.branch || "main",
      description: "",
      mode: "new",
      repository: getRepoNameFromUrl(nextWorkspace.gitState.repoUrl),
      visibility: nextWorkspace.gitState.visibility,
    });
  }, []);

  const activeFile = useMemo(
    () =>
      workspace?.files.find((file) => file.id === workspace.activeFileId) ??
      workspace?.files[0] ??
      null,
    [workspace],
  );

  const commands = useMemo(() => {
    const repoLine = gitState.repoUrl
      ? `git remote add origin ${gitState.repoUrl}\ngit push -u origin ${gitState.branch || "main"}`
      : "# Connect GitHub and push from the modal above to create the repository automatically";

    return [
      "git init",
      `git checkout -b ${gitState.branch || "main"}`,
      "git add .",
      'git commit -m "Ship the latest VoidLAB update"',
      repoLine,
    ].join("\n");
  }, [gitState.branch, gitState.repoUrl]);

  const persistGitState = (nextGitState: GitHubState) => {
    if (!workspace) return;

    setGitState(nextGitState);
    const nextWorkspace = {
      ...workspace,
      gitState: nextGitState,
    };
    setWorkspace(nextWorkspace);
    persistWorkspace(nextWorkspace);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(commands);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const handlePushFieldChange = (field: keyof PushFormState, value: string) => {
    setPushForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleConnectGitHub = () => {
    window.location.href = buildOAuthStartUrl("github", {
      intent: "link",
      returnTo: "/editor/github",
    });
  };

  const handleOpenModal = () => {
    setError("");
    setStatus("");
    setRepoUrl("");
    setPushForm((current) => ({
      ...current,
      branch: gitState.branch || "main",
      repository: current.repository || getRepoNameFromUrl(gitState.repoUrl),
      visibility: gitState.visibility,
    }));
    setModalOpen(true);
  };

  const handlePush = async () => {
    if (!activeFile) {
      setError("Select an active file before pushing to GitHub.");
      return;
    }

    setPushing(true);
    setError("");
    setStatus("");
    setRepoUrl("");

    try {
      const response = await fetch(`${apiBaseUrl}/api/push-to-github`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          activeFile,
          branch: pushForm.branch.trim() || "main",
          description: pushForm.description.trim(),
          mode: pushForm.mode,
          repository: pushForm.repository.trim(),
          visibility: pushForm.visibility,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "VoidLAB could not push to GitHub.");
      }

      const nextRepoUrl = data.repoUrl as string;
      setRepoUrl(nextRepoUrl);
      setStatus(`Pushed ${data.summary.filePath} to ${data.summary.repository} on ${data.summary.branch}.`);
      persistGitState({
        branch: pushForm.branch.trim() || "main",
        repoUrl: nextRepoUrl,
        visibility: pushForm.visibility,
      });
      setModalOpen(false);
      recordActivity({
        detail: `Pushed ${data.summary.filePath} to GitHub repository ${data.summary.repository}.`,
        title: "GitHub push completed",
        type: "workspace",
      });
    } catch (pushError) {
      setError(pushError instanceof Error ? pushError.message : "GitHub push failed.");
    } finally {
      setPushing(false);
    }
  };

  if (!workspace || !activeFile) return null;

  return (
    <GitHubPanel
      activeFilePath={activeFile.path}
      commands={commands}
      copied={copied}
      error={error}
      fileCount={workspace.files.length}
      gitState={gitState}
      githubConnected={Boolean(profile?.githubConnected)}
      githubLogin={profile?.githubLogin ?? ""}
      isSignedIn={Boolean(profile)}
      modalOpen={modalOpen}
      onCloseModal={() => setModalOpen(false)}
      onConnectGitHub={handleConnectGitHub}
      onCopy={() => void handleCopy()}
      onOpenModal={handleOpenModal}
      onPush={() => void handlePush()}
      onPushFieldChange={handlePushFieldChange}
      pushForm={pushForm}
      pushing={pushing}
      repoUrl={repoUrl}
      status={status}
    />
  );
}
