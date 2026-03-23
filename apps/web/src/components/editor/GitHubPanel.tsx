"use client";

import { Check, Copy, Github, GitBranch, Lock, UploadCloud } from "lucide-react";
import { Button } from "@/components/ui/button";

type GitHubState = {
  branch: string;
  repoUrl: string;
  visibility: "public" | "private";
};

type GitHubPanelProps = {
  commands: string;
  copied: boolean;
  fileCount: number;
  gitState: GitHubState;
  onCopy: () => void;
  onFieldChange: (field: keyof GitHubState, value: string) => void;
};

export default function GitHubPanel({
  commands,
  copied,
  fileCount,
  gitState,
  onCopy,
  onFieldChange,
}: GitHubPanelProps) {
  return (
    <section className="panel rounded-[28px] p-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <Github size={16} />
        GitHub publish
      </div>

      <div className="mt-4 grid gap-3">
        <label className="block">
          <span className="mb-2 block text-sm text-slate-300">Repository URL</span>
          <input
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white outline-none placeholder:text-slate-500 focus:border-teal-400"
            onChange={(event) => onFieldChange("repoUrl", event.target.value)}
            placeholder="https://github.com/username/voidlab.git"
            value={gitState.repoUrl}
          />
        </label>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-2 block text-sm text-slate-300">Branch</span>
            <div className="relative">
              <GitBranch className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <input
                className="w-full rounded-2xl border border-white/10 bg-white/5 py-3 pl-11 pr-4 text-sm text-white outline-none placeholder:text-slate-500 focus:border-teal-400"
                onChange={(event) => onFieldChange("branch", event.target.value)}
                placeholder="main"
                value={gitState.branch}
              />
            </div>
          </label>

          <label className="block">
            <span className="mb-2 block text-sm text-slate-300">Visibility</span>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={15} />
              <select
                className="w-full rounded-2xl border border-white/10 bg-slate-900 py-3 pl-11 pr-4 text-sm text-white outline-none focus:border-teal-400"
                onChange={(event) => onFieldChange("visibility", event.target.value)}
                value={gitState.visibility}
              >
                <option value="public">Public</option>
                <option value="private">Private</option>
              </select>
            </div>
          </label>
        </div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-300">
        <div className="font-medium text-white">Publish summary</div>
        <div className="mt-2">Files ready: {fileCount}</div>
        <div className="mt-1">Branch target: {gitState.branch || "main"}</div>
        <div className="mt-1">Repository type: {gitState.visibility}</div>
      </div>

      <div className="mt-4 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-white">
          <UploadCloud size={16} />
          Publish commands
        </div>
        <pre className="whitespace-pre-wrap break-words text-xs leading-6 text-slate-300">
          {commands}
        </pre>
      </div>

      <div className="mt-4">
        <Button onClick={onCopy} tone="secondary">
          {copied ? <Check size={15} /> : <Copy size={15} />}
          {copied ? "Copied commands" : "Copy commands"}
        </Button>
      </div>
    </section>
  );
}
