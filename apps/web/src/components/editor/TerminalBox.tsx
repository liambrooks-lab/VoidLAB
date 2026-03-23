"use client";

import { AlertTriangle, TerminalSquare } from "lucide-react";

type TerminalBoxProps = {
  error: string;
  loading: boolean;
  output: string;
};

export default function TerminalBox({
  error,
  loading,
  output,
}: TerminalBoxProps) {
  return (
    <section className="panel min-h-[280px] rounded-[28px]">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <TerminalSquare size={16} />
          Terminal
        </div>
        <div className="text-xs uppercase tracking-[0.22em] text-slate-400">
          {loading ? "Running" : "Idle"}
        </div>
      </div>
      <div className="scrollbar-thin h-[320px] overflow-y-auto p-5 font-mono text-sm leading-7 text-slate-200">
        {error ? (
          <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 p-4 text-rose-200">
            <div className="mb-2 flex items-center gap-2 font-sans font-medium">
              <AlertTriangle size={16} />
              Execution error
            </div>
            <pre className="whitespace-pre-wrap">{error}</pre>
          </div>
        ) : output ? (
          <pre className="whitespace-pre-wrap">{output}</pre>
        ) : (
          <div className="text-slate-400">[system] Output will appear here after you run code.</div>
        )}
      </div>
    </section>
  );
}
