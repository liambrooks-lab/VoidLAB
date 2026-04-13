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
      ? "border-rose-500/30 bg-black text-rose-100"
      : tone === "success"
        ? "border-emerald-500/30 bg-black text-emerald-100"
        : "border-white/15 bg-black text-zinc-100";

  return (
    <div className={`rounded-[24px] border p-5 shadow-[0_18px_60px_rgba(0,0,0,0.45)] ${classes}`}>
      <div className="mb-3 text-xs uppercase tracking-[0.28em] text-white/55">{label}</div>
      <pre className="whitespace-pre-wrap break-words font-mono text-[1rem] leading-8 sm:text-[1.05rem]">
        {value}
      </pre>
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
          <div className="text-sm font-semibold text-white">
            Input (stdin) - for interactive programs
          </div>
          <div className="mt-2 text-sm leading-6 text-slate-300">
            Paste stdin exactly as the program expects it. New lines and copy-paste are preserved,
            and the Run action always sends this field to the backend, even when it is empty.
          </div>
          <textarea
            className="theme-input mt-4 min-h-[190px] w-full resize-none rounded-[24px] p-4 font-mono text-sm leading-7 outline-none focus:border-sky-300"
            onChange={(event) => onInputChange(event.target.value)}
            placeholder={"21\nAda Lovelace"}
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

          <div className="theme-input mt-4 rounded-[24px] p-4">
            <div className="scrollbar-thin h-[190px] space-y-3 overflow-y-auto pr-2 font-mono text-sm leading-6 text-slate-800">
              {commandHistory.length ? (
                commandHistory.map((entry) => (
                  <div key={entry.id}>
                    <div className="text-sky-200">
                      {formatWorkspacePath(entry.cwd)} $ {entry.command}
                    </div>
                    <pre
                      className={`mt-1 whitespace-pre-wrap break-words ${
                        entry.status === "error"
                          ? "text-rose-700"
                          : entry.status === "success"
                            ? "text-slate-900"
                            : "text-slate-700"
                      }`}
                    >
                      {entry.output}
                    </pre>
                  </div>
                ))
              ) : (
                <div className="text-slate-500">
                  Run commands like <code>ls</code>, <code>tree</code>, <code>mkdir src</code>,
                  <code>touch src/main.py</code>, <code>open src/main.py</code>, or <code>help</code>.
                </div>
              )}
            </div>

            <div className="mt-4 flex gap-3">
              <input
                className="theme-input flex-1 rounded-2xl px-4 py-3 text-sm outline-none focus:border-sky-300"
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
              <div className="rounded-[24px] border border-rose-500/30 bg-black p-5 text-rose-100 shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
                <div className="mb-3 flex items-center gap-2 font-sans font-medium text-base">
                  <AlertTriangle size={16} />
                  Execution gateway error
                </div>
                <pre className="whitespace-pre-wrap break-words font-mono text-base leading-8">{error}</pre>
              </div>
            ) : execution ? (
              <>
                <div className="grid gap-3 md:grid-cols-3">
                  <div className="rounded-[24px] border border-white/15 bg-black p-5 shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
                    <div className="text-xs uppercase tracking-[0.22em] text-white/45">Status</div>
                    <div className="mt-3 text-lg font-semibold text-white">{execution.status.description}</div>
                  </div>
                  <div className="rounded-[24px] border border-white/15 bg-black p-5 shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
                    <div className="text-xs uppercase tracking-[0.22em] text-white/45">Time</div>
                    <div className="mt-3 text-lg font-semibold text-white">{execution.time ?? "n/a"} sec</div>
                  </div>
                  <div className="rounded-[24px] border border-white/15 bg-black p-5 shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
                    <div className="text-xs uppercase tracking-[0.22em] text-white/45">Memory</div>
                    <div className="mt-3 text-lg font-semibold text-white">
                      {execution.memory !== null ? `${execution.memory} KB` : "n/a"}
                    </div>
                  </div>
                </div>
                <OutputSection label="Stdout" tone="success" value={execution.stdout} />
                <OutputSection label="Stderr" tone="danger" value={execution.stderr} />
                <OutputSection label="Compile output" tone="danger" value={execution.compileOutput} />
                <OutputSection label="Runtime message" value={execution.message} />
                {!execution.stdout && !execution.stderr && !execution.compileOutput && !execution.message ? (
                  <div className="rounded-[24px] border border-white/15 bg-black p-5 text-base leading-8 text-zinc-200 shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
                    The program finished without producing visible output.
                  </div>
                ) : null}
              </>
            ) : (
              <div className="rounded-[24px] border border-white/15 bg-black p-5 text-base leading-8 text-zinc-200 shadow-[0_18px_60px_rgba(0,0,0,0.45)]">
                [system] Structured execution output will appear here after you run the active file.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
