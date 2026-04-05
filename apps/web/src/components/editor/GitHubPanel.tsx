"use client";

import {
  Check,
  Copy,
  ExternalLink,
  Github,
  GitBranch,
  Lock,
  UploadCloud,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";

type GitHubState = {
  branch: string;
  repoUrl: string;
  visibility: "public" | "private";
};

type PushFormState = {
  branch: string;
  description: string;
  mode: "existing" | "new";
  repository: string;
  visibility: "public" | "private";
};

type GitHubPanelProps = {
  activeFilePath: string;
  commands: string;
  copied: boolean;
  error: string;
  fileCount: number;
  gitState: GitHubState;
  githubConnected: boolean;
  githubLogin: string;
  isSignedIn: boolean;
  modalOpen: boolean;
  onCloseModal: () => void;
  onConnectGitHub: () => void;
  onCopy: () => void;
  onOpenModal: () => void;
  onPush: () => void;
  onPushFieldChange: (field: keyof PushFormState, value: string) => void;
  pushForm: PushFormState;
  pushing: boolean;
  repoUrl: string;
  status: string;
};

export default function GitHubPanel({
  activeFilePath,
  commands,
  copied,
  error,
  fileCount,
  gitState,
  githubConnected,
  githubLogin,
  isSignedIn,
  modalOpen,
  onCloseModal,
  onConnectGitHub,
  onCopy,
  onOpenModal,
  onPush,
  onPushFieldChange,
  pushForm,
  pushing,
  repoUrl,
  status,
}: GitHubPanelProps) {
  return (
    <>
      <section className="panel rounded-[28px] p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Github size={16} />
            GitHub publish
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {githubConnected ? (
              <div className="rounded-full border border-emerald-300/30 bg-emerald-500/10 px-3 py-1 text-xs uppercase tracking-[0.18em] text-emerald-200">
                Connected as {githubLogin || "GitHub user"}
              </div>
            ) : null}
            <Button
              disabled={!isSignedIn}
              onClick={githubConnected ? onOpenModal : onConnectGitHub}
              type="button"
            >
              <UploadCloud size={15} />
              {githubConnected ? "Push to GitHub" : "Connect GitHub"}
            </Button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Active file</div>
            <div className="mt-2 font-medium text-white">{activeFilePath || "No active file selected"}</div>
            <div className="mt-2 text-slate-400">This is the file that VoidLAB will commit and push.</div>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
            <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Repository target</div>
            <div className="mt-2 font-medium text-white">
              {gitState.repoUrl || "Create a new repository or choose an existing one"}
            </div>
            <div className="mt-2">
              Branch {gitState.branch || "main"} • {gitState.visibility}
            </div>
          </div>
        </div>

        {!isSignedIn ? (
          <div className="mt-4 rounded-2xl border border-amber-300/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
            Sign in first to create repositories and push code to GitHub.
          </div>
        ) : !githubConnected ? (
          <div className="mt-4 rounded-2xl border border-sky-300/20 bg-sky-300/10 px-4 py-3 text-sm text-sky-100">
            Connect GitHub to your VoidLAB account. Google and X users can link GitHub from here
            without creating a second account.
          </div>
        ) : null}

        {status ? (
          <div className="mt-4 rounded-2xl border border-emerald-300/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            {status}{" "}
            {repoUrl ? (
              <a
                className="inline-flex items-center gap-1 underline"
                href={repoUrl}
                rel="noreferrer"
                target="_blank"
              >
                Open repository
                <ExternalLink size={14} />
              </a>
            ) : null}
          </div>
        ) : null}

        {error ? (
          <div className="mt-4 rounded-2xl border border-rose-300/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">
            {error}
          </div>
        ) : null}

        <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
          <div className="font-medium text-white">Publish summary</div>
          <div className="mt-2">Files in workspace: {fileCount}</div>
          <div className="mt-1">Committed file: {activeFilePath || "n/a"}</div>
          <div className="mt-1">Branch target: {gitState.branch || "main"}</div>
          <div className="mt-1">Repository type: {gitState.visibility}</div>
        </div>

        <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white">
            <Copy size={16} />
            Manual git fallback
          </div>
          <pre className="whitespace-pre-wrap break-words text-xs leading-6 text-slate-300">
            {commands}
          </pre>
          <div className="mt-4">
            <Button onClick={onCopy} tone="secondary" type="button">
              {copied ? <Check size={15} /> : <Copy size={15} />}
              {copied ? "Copied commands" : "Copy commands"}
            </Button>
          </div>
        </div>
      </section>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4 backdrop-blur-sm">
          <div className="panel w-full max-w-2xl rounded-[32px] p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-white">Push to GitHub</div>
                <div className="mt-1 text-sm text-slate-300">
                  Create a repository or target an existing one, then push the active file.
                </div>
              </div>
              <button
                className="rounded-2xl border border-white/10 bg-white/5 p-2 text-slate-300 transition hover:bg-white/10"
                onClick={onCloseModal}
                type="button"
              >
                <X size={16} />
              </button>
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-2 block text-sm text-slate-300">Repository mode</span>
                <select
                  className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none focus:border-sky-300"
                  onChange={(event) => onPushFieldChange("mode", event.target.value)}
                  value={pushForm.mode}
                >
                  <option value="new">Create new repository</option>
                  <option value="existing">Use existing repository</option>
                </select>
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-2 block text-sm text-slate-300">
                  Repository name (new or existing)
                </span>
                <input
                  className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-sky-300"
                  onChange={(event) => onPushFieldChange("repository", event.target.value)}
                  placeholder="voidlab-demo or username/voidlab-demo"
                  value={pushForm.repository}
                />
              </label>

              <label className="block sm:col-span-2">
                <span className="mb-2 block text-sm text-slate-300">Description (optional)</span>
                <textarea
                  className="min-h-[110px] w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-sky-300"
                  onChange={(event) => onPushFieldChange("description", event.target.value)}
                  placeholder="Built with VoidLAB"
                  value={pushForm.description}
                />
              </label>

              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">Branch name</span>
                <div className="relative">
                  <GitBranch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  <input
                    className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-sky-300"
                    onChange={(event) => onPushFieldChange("branch", event.target.value)}
                    placeholder="main"
                    value={pushForm.branch}
                  />
                </div>
              </label>

              <label className="block">
                <span className="mb-2 block text-sm text-slate-300">Visibility</span>
                <div className="relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
                  <select
                    className="w-full rounded-2xl border border-white/10 bg-slate-900 py-3 pl-11 pr-4 text-sm text-white outline-none focus:border-sky-300"
                    onChange={(event) => onPushFieldChange("visibility", event.target.value)}
                    value={pushForm.visibility}
                  >
                    <option value="public">Public</option>
                    <option value="private">Private</option>
                  </select>
                </div>
              </label>
            </div>

            <div className="mt-5 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
              Active file to push: <span className="font-medium text-white">{activeFilePath}</span>
            </div>

            <div className="mt-6 flex flex-wrap justify-end gap-3">
              <Button onClick={onCloseModal} tone="secondary" type="button">
                Cancel
              </Button>
              <Button disabled={pushing || !pushForm.repository.trim()} onClick={onPush} type="button">
                <UploadCloud size={15} />
                {pushing ? "Pushing..." : "Push to GitHub"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
