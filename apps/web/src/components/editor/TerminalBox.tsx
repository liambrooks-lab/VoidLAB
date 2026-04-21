"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  Clock,
  Globe,
  Play,
  RotateCcw,
  TerminalSquare,
} from "lucide-react";
import { type ExecutionDetails } from "@/hooks/useCompiler";
import { countBufferedStdinLines } from "@/lib/execution";
import { formatWorkspacePath, type TerminalHistoryEntry } from "@/lib/workspace";

type TerminalTab = "output" | "terminal" | "ports";

export type OutputTranscriptEntry = {
  id: string;
  text: string;
  tone: "error" | "input" | "prompt" | "status" | "stdout" | "success" | "timeout";
};

type InteractiveSessionState = {
  active: boolean;
  helperText: string;
  promptLabel: string;
};

type TerminalBoxProps = {
  activeFilePath: string;
  commandHistory: TerminalHistoryEntry[];
  commandInput: string;
  cwd: string;
  error: string;
  execution: ExecutionDetails | null;
  interactiveSession: InteractiveSessionState;
  loading: boolean;
  onCommandChange: (value: string) => void;
  onCommandRun: () => void;
  onInteractiveInputChange: (value: string) => void;
  onResetBufferedInput: () => void;
  onRun: () => void;
  pendingInteractiveInput: string;
  stdin: string;
  transcript: OutputTranscriptEntry[];
};

type OutputSectionProps = {
  label: string;
  tone?: "danger" | "default" | "success";
  value: string;
};

const tabs: Array<{ id: TerminalTab; label: string }> = [
  { id: "output", label: "Output" },
  { id: "terminal", label: "Terminal" },
  { id: "ports", label: "Ports" },
];

const terminalButtonBase =
  "inline-flex items-center justify-center gap-2 rounded-2xl border px-4 py-2.5 text-sm font-medium transition outline-none disabled:cursor-not-allowed disabled:opacity-50";
const terminalButtonPrimary = `${terminalButtonBase} border-sky-400/40 bg-sky-400 text-slate-950 hover:bg-sky-300`;
const terminalButtonSecondary = `${terminalButtonBase} border-white/10 bg-white/[0.04] text-white hover:bg-white/[0.08]`;

function OutputSection({ label, tone = "default", value }: OutputSectionProps) {
  if (!value) return null;

  const classes =
    tone === "danger"
      ? "border-rose-500/30 bg-rose-500/[0.06] text-rose-100"
      : tone === "success"
        ? "border-emerald-500/30 bg-emerald-500/[0.06] text-emerald-100"
        : "border-white/10 bg-white/[0.03] text-zinc-100";

  return (
    <div className={`rounded-[22px] border p-4 ${classes}`}>
      <div className="mb-3 text-xs uppercase tracking-[0.24em] text-white/45">{label}</div>
      <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-7">{value}</pre>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[20px] border border-white/10 bg-white/[0.03] p-4">
      <div className="text-xs uppercase tracking-[0.22em] text-white/40">{label}</div>
      <div className="mt-3 text-base font-semibold text-white">{value}</div>
    </div>
  );
}

function TranscriptLine({ entry }: { entry: OutputTranscriptEntry }) {
  const toneClass =
    entry.tone === "error"
      ? "text-rose-200"
      : entry.tone === "timeout"
        ? "text-amber-200"
        : entry.tone === "input"
          ? "text-sky-200"
          : entry.tone === "prompt"
            ? "text-amber-100"
            : entry.tone === "success"
              ? "text-emerald-200"
              : entry.tone === "stdout"
                ? "text-zinc-100"
                : "text-white/70";

  const Icon = entry.tone === "timeout" ? Clock : null;

  return (
    <div className={`flex items-start gap-2 whitespace-pre-wrap break-words font-mono text-sm leading-7 ${toneClass}`}>
      {Icon && <Icon className="mt-1 shrink-0 opacity-80" size={13} />}
      <span>{entry.text}</span>
    </div>
  );
}

export default function TerminalBox({
  activeFilePath,
  commandHistory,
  commandInput,
  cwd,
  error,
  execution,
  interactiveSession,
  loading,
  onCommandChange,
  onCommandRun,
  onInteractiveInputChange,
  onResetBufferedInput,
  onRun,
  pendingInteractiveInput,
  stdin,
  transcript,
}: TerminalBoxProps) {
  const [activeTab, setActiveTab] = useState<TerminalTab>("output");
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const stdinInputRef = useRef<HTMLTextAreaElement>(null);
  const timedOut = execution?.timedOut || error.includes("timed out");
  const stagedInputLines = useMemo(
    () => countBufferedStdinLines(interactiveSession.active ? pendingInteractiveInput : stdin),
    [interactiveSession.active, pendingInteractiveInput, stdin],
  );

  const latestStatus =
    execution?.status.description ?? (interactiveSession.active ? "Input required" : loading ? "Running" : "Idle");

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [transcript]);

  useEffect(() => {
    if (interactiveSession.active) {
      const timer = setTimeout(() => stdinInputRef.current?.focus(), 80);
      return () => clearTimeout(timer);
    }
  }, [interactiveSession.active]);

  return (
    <section className="overflow-hidden rounded-[28px] border border-white/10 bg-black shadow-[0_22px_80px_rgba(0,0,0,0.58)]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <TerminalSquare size={16} />
            Unified console
          </div>
          <div className="hidden text-xs uppercase tracking-[0.22em] text-white/40 sm:block">
            {latestStatus}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-full border border-white/10 bg-white/[0.03] p-1">
            {tabs.map((tab) => (
              <button
                className={`rounded-full px-3 py-1.5 text-xs uppercase tracking-[0.22em] transition ${
                  activeTab === tab.id
                    ? "bg-white text-slate-950"
                    : "text-white/60 hover:bg-white/[0.06] hover:text-white"
                }`}
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                type="button"
              >
                {tab.label}
              </button>
            ))}
          </div>
          <button className={terminalButtonPrimary} disabled={loading} onClick={onRun} type="button">
            <Play size={15} />
            {loading ? "Running" : interactiveSession.active ? "Run with input" : "Run active file"}
          </button>
        </div>
      </div>

      {activeTab === "output" ? (
        <div className="p-5">
          <div className="grid gap-3 md:grid-cols-4">
            <MetricCard label="Status" value={latestStatus} />
            <MetricCard
              label="Input lines"
              value={stagedInputLines ? `${stagedInputLines} line${stagedInputLines === 1 ? "" : "s"}` : "none"}
            />
            <MetricCard label="Time" value={execution?.time ? `${execution.time} sec` : loading ? "running" : "n/a"} />
            <MetricCard
              label="Memory"
              value={execution?.memory !== null && execution?.memory !== undefined ? `${execution.memory} KB` : "n/a"}
            />
          </div>

          <div className="mt-4 rounded-[24px] border border-white/10 bg-[#030405] p-4">
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs uppercase tracking-[0.22em] text-white/40">Execution stream</div>
              <div className="truncate text-xs text-white/45">{formatWorkspacePath(activeFilePath)}</div>
            </div>

            <div className="scrollbar-thin h-[240px] space-y-3 overflow-y-auto pr-2">
              {transcript.length ? (
                <>
                  {transcript.map((entry) => <TranscriptLine entry={entry} key={entry.id} />)}
                  <div ref={transcriptEndRef} />
                </>
              ) : (
                <div className="font-mono text-sm leading-7 text-white/55">
                  [system] Run the active file and VoidLAB will stream status, stdin prompts, stdout, and diagnostics here.
                </div>
              )}
            </div>

            {interactiveSession.active ? (
              <div className="mt-4 rounded-[20px] border border-sky-400/20 bg-sky-400/[0.05] p-4">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-sky-200">
                  <span className="relative flex h-2 w-2">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-sky-300" />
                  </span>
                  Input required
                </div>
                <div className="mt-2 text-sm leading-6 text-zinc-200">{interactiveSession.helperText}</div>
                <div className="mt-3 rounded-2xl border border-white/10 bg-black/40 px-3 py-2 font-mono text-sm text-amber-100">
                  {interactiveSession.promptLabel}
                </div>
                <textarea
                  className="mt-4 min-h-[120px] w-full resize-y rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 font-mono text-sm text-white outline-none transition placeholder:text-white/30 focus:border-sky-300"
                  onChange={(event) => onInteractiveInputChange(event.target.value)}
                  placeholder={"Enter stdin exactly as your program expects it.\nUse a new line for each value."}
                  ref={stdinInputRef}
                  spellCheck={false}
                  value={pendingInteractiveInput}
                />
                <div className="mt-4 flex flex-wrap gap-3">
                  <button className={terminalButtonSecondary} onClick={onResetBufferedInput} type="button">
                    <RotateCcw size={15} />
                    Clear input
                  </button>
                  <button className={terminalButtonPrimary} disabled={!pendingInteractiveInput.length || loading} onClick={onRun} type="button">
                    <Play size={15} />
                    Run program
                  </button>
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-4 space-y-3">
            {error ? (
              <div className={`rounded-[22px] border p-4 ${
                timedOut
                  ? "border-amber-500/30 bg-amber-500/[0.06] text-amber-100"
                  : "border-rose-500/30 bg-rose-500/[0.06] text-rose-100"
              }`}>
                <div className="mb-3 flex items-center gap-2 text-sm font-semibold">
                  {timedOut ? <Clock size={16} /> : <AlertTriangle size={16} />}
                  {timedOut ? "Execution timed out" : "Execution gateway error"}
                </div>
                <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-7">{error}</pre>
              </div>
            ) : null}

            {execution ? (
              <>
                <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <MetricCard label="Judge0 status" value={execution.status.description} />
                  <MetricCard label="Exit code" value={execution.exitCode !== null ? String(execution.exitCode) : "n/a"} />
                  <MetricCard
                    label="Exit signal"
                    value={execution.exitSignal !== null ? String(execution.exitSignal) : "n/a"}
                  />
                  <MetricCard label="Token" value={execution.token ?? "n/a"} />
                </div>
                <OutputSection label="Stdout" tone="success" value={execution.stdout} />
                <OutputSection label="Stderr" tone="danger" value={execution.stderr} />
                <OutputSection label="Compile output" tone="danger" value={execution.compileOutput} />
                <OutputSection label="Runtime message" value={execution.message} />
                {!execution.stdout && !execution.stderr && !execution.compileOutput && !execution.message ? (
                  <div className="rounded-[22px] border border-white/10 bg-white/[0.03] p-4 text-sm leading-7 text-zinc-200">
                    The program finished without producing visible output.
                  </div>
                ) : null}
              </>
            ) : null}
          </div>
        </div>
      ) : null}

      {activeTab === "terminal" ? (
        <div className="p-5">
          <div className="rounded-[24px] border border-white/10 bg-[#030405] p-4">
            <div className="mb-3 text-xs uppercase tracking-[0.22em] text-white/40">Workspace terminal</div>
            <div className="mb-4 text-sm text-white/55">Current directory {formatWorkspacePath(cwd)}</div>

            <div className="scrollbar-thin h-[280px] space-y-4 overflow-y-auto pr-2 font-mono text-sm leading-7">
              {commandHistory.length ? (
                commandHistory.map((entry) => (
                  <div key={entry.id}>
                    <div className="text-sky-200">
                      {formatWorkspacePath(entry.cwd)} $ {entry.command}
                    </div>
                    <pre
                      className={`mt-1 whitespace-pre-wrap break-words ${
                        entry.status === "error"
                          ? "text-rose-200"
                          : entry.status === "success"
                            ? "text-zinc-100"
                            : "text-white/70"
                      }`}
                    >
                      {entry.output}
                    </pre>
                  </div>
                ))
              ) : (
                <div className="text-white/55">
                  Run commands like <code>ls</code>, <code>tree</code>, <code>mkdir src</code>, <code>touch src/main.py</code>, <code>open src/main.py</code>, or <code>help</code>.
                </div>
              )}
            </div>

            <div className="mt-4 flex flex-col gap-3 lg:flex-row">
              <input
                className="flex-1 rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 font-mono text-sm text-white outline-none transition placeholder:text-white/30 focus:border-sky-300"
                onChange={(event) => onCommandChange(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    onCommandRun();
                  }
                }}
                placeholder="touch src/main.py"
                value={commandInput}
              />
              <button className={terminalButtonSecondary} onClick={onCommandRun} type="button">
                Run command
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {activeTab === "ports" ? (
        <div className="p-5">
          <div className="flex min-h-[340px] flex-col items-start justify-center rounded-[24px] border border-white/10 bg-[#030405] p-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-white">
              <Globe size={16} />
              Ports
            </div>
            <div className="mt-3 max-w-xl text-sm leading-7 text-white/60">
              Runtime-exposed ports will appear here once VoidLAB adds forwarded process sessions. For now, browser-preview files still open directly in a new tab from the editor toolbar.
            </div>
            <div className="mt-6 rounded-[20px] border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/70">
              Active file: {formatWorkspacePath(activeFilePath)}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
