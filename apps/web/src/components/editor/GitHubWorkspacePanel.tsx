"use client";

import { useEffect, useMemo, useState } from "react";
import GitHubPanel from "@/components/editor/GitHubPanel";
import {
  defaultGitState,
  persistWorkspace,
  readWorkspace,
  type GitHubState,
  type WorkspaceState,
} from "@/lib/workspace";

export default function GitHubWorkspacePanel() {
  const [workspace, setWorkspace] = useState<WorkspaceState | null>(null);
  const [gitState, setGitState] = useState<GitHubState>(defaultGitState);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const nextWorkspace = readWorkspace();
    setWorkspace(nextWorkspace);
    setGitState(nextWorkspace.gitState);
  }, []);

  const commands = useMemo(() => {
    const repoLine = gitState.repoUrl
      ? `git remote add origin ${gitState.repoUrl}\ngit push -u origin ${gitState.branch || "main"}`
      : "# Add your GitHub repo URL above to generate the final push commands";

    return [
      "git init",
      `git checkout -b ${gitState.branch || "main"}`,
      "git add .",
      'git commit -m "Ship the latest VoidLAB update"',
      repoLine,
    ].join("\n");
  }, [gitState.branch, gitState.repoUrl]);

  const handleFieldChange = (field: keyof typeof gitState, value: string) => {
    if (!workspace) return;

    const nextGitState = {
      ...gitState,
      [field]: value,
    };

    setGitState(nextGitState);
    persistWorkspace(workspace.files, workspace.activeFileId, nextGitState);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(commands);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  };

  if (!workspace) return null;

  return (
    <GitHubPanel
      commands={commands}
      copied={copied}
      fileCount={workspace.files.length}
      gitState={gitState}
      onCopy={() => void handleCopy()}
      onFieldChange={handleFieldChange}
    />
  );
}
