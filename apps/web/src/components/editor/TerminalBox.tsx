"use client";

import { AlertTriangle, Play, TerminalSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { type ExecutionDetails } from "@/hooks/useCompiler";
import { formatWorkspacePath, type TerminalHistoryEntry } from "@/lib/workspace";

type TerminalBoxProps = {
  commandHistory: TerminalHistoryEntry[];
  commandInput: string;
  cwd: string;
  error: string;
  execution: ExecutionDetails | null;
  loading: boolean;
  onCommandChange: (value: string) => void;
  onCommandRun: () => void;
  onInputChange: (value: string) => void;
  onRun: () => void;
  stdin: string;
};

type SectionProps = {
  label: string;
  tone?: "danger" | "default" | "success";
  value: string;
};

function OutputSection({ label, tone = "default", value }: SectionProps) {
  if (!value) return null;

  const classes =
    tone === "danger"
      ? "border-rose-400/20 bg-rose-500/10 text-rose-100"
      : tone === "success"
        ? "border-emerald-400/20 bg-emerald-500/10 text-emerald-50"
        : "border-white/10 bg-white/5 text-slate-100";

  return (
    <div className={`rounded-[22px] border p-4 ${classes}`}>
      <div className="mb-2 text-xs uppercase tracking-[0.2em]">{label}</div>
      <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-7">{value}</pre>
    </div>
  );
}

export default function TerminalBox({
  commandHistory,
  commandInput,
  cwd,
  error,
  execution,
  loading,
  onCommandChange,
  onCommandRun,
  onInputChange,
  onRun,
  stdin,
}: TerminalBoxProps) {
  const latestStatus = execution?.status.description ?? (loading ? "Running" : "Idle");

  return (
    <section className="panel rounded-[28px]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <TerminalSquare size={16} />
          Terminal and output
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs uppercase tracking-[0.22em] text-slate-400">{latestStatus}</div>
          <Button disabled={loading} onClick={onRun} type="button">
            <Play size={15} />
            {loading ? "Running" : "Run active file"}
          </Button>
        </div>
      </div>
      <div className="grid gap-0 xl:grid-cols-[320px_360px_minmax(0,1fr)]">
        <div className="border-b border-white/10 p-5 xl:border-b-0 xl:border-r">
          <div className="text-sm font-semibold text-white">Program input</div>
          <div className="mt-2 text-sm leading-6 text-slate-300">
            Paste stdin exactly as the program expects it. New lines are preserved.
          </div>
          <textarea
            className="mt-4 min-h-[190px] w-full resize-none rounded-[24px] border border-white/10 bg-slate-950/40 p-4 font-mono text-sm leading-7 text-slate-100 outline-none placeholder:text-slate-500 focus:border-sky-300"
            onChange={(event) => onInputChange(event.target.value)}
            placeholder={"5\n10 20\nhello"}
            value={stdin}
          />
        </div>

        <div className="border-b border-white/10 p-5 xl:border-b-0 xl:border-r">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="text-sm font-semibold text-white">Workspace commands</div>
              <div className="mt-2 text-sm leading-6 text-slate-300">
                Current directory {formatWorkspacePath(cwd)}
              </div>
            </div>
          </div>

          <div className="mt-4 rounded-[24px] border border-white/10 bg-slate-950/40 p-4">
            <div className="scrollbar-thin h-[190px] space-y-3 overflow-y-auto pr-2 font-mono text-sm leading-6 text-slate-200">
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
                            ? "text-slate-100"
                            : "text-slate-300"
                      }`}
                    >
                      {entry.output}
                    </pre>
                  </div>
                ))
              ) : (
                <div className="text-slate-400">
                  Run commands like <code>ls</code>, <code>tree</code>, <code>mkdir src</code>,
                  <code>touch src/main.py</code>, <code>open src/main.py</code>, or <code>help</code>.
                </div>
              )}
            </div>

            <div className="mt-4 flex gap-3">
              <input
                className="flex-1 rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-sky-300"
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
              <Button onClick={onCommandRun} tone="secondary" type="button">
                Run command
              </Button>
            </div>
          </div>
        </div>

        <div className="p-5">
          <div className="mb-3 text-sm font-semibold text-white">Execution output</div>
          <div className="space-y-3">
            {error ? (
              <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4 text-rose-200">
                <div className="mb-2 flex items-center gap-2 font-sans font-medium">
                  <AlertTriangle size={16} />
                  Execution gateway error
                </div>
                <pre className="whitespace-pre-wrap break-words">{error}</pre>
              </div>
            ) : execution ? (
              <>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Status</div>
                    <div className="mt-2 text-sm font-semibold text-white">{execution.status.description}</div>
                  </div>
                  <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Time</div>
                    <div className="mt-2 text-sm font-semibold text-white">{execution.time ?? "n/a"} sec</div>
                  </div>
                  <div className="rounded-[22px] border border-white/10 bg-white/5 p-4">
                    <div className="text-xs uppercase tracking-[0.18em] text-slate-400">Memory</div>
                    <div className="mt-2 text-sm font-semibold text-white">
                      {execution.memory !== null ? `${execution.memory} KB` : "n/a"}
                    </div>
                  </div>
                </div>
                <OutputSection label="Stdout" tone="success" value={execution.stdout} />
                <OutputSection label="Stderr" tone="danger" value={execution.stderr} />
                <OutputSection label="Compile output" tone="danger" value={execution.compileOutput} />
                <OutputSection label="Runtime message" value={execution.message} />
                {!execution.stdout && !execution.stderr && !execution.compileOutput && !execution.message ? (
                  <div className="rounded-[22px] border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
                    The program finished without producing visible output.
                  </div>
                ) : null}
              </>
            ) : (
              <div className="rounded-[24px] border border-white/10 bg-slate-950/40 p-4 text-slate-400">
                [system] Structured execution output will appear here after you run the active file.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
