"use client";

import { AlertTriangle, Play, TerminalSquare } from "lucide-react";
import { Button } from "@/components/ui/button";

type TerminalBoxProps = {
  error: string;
  loading: boolean;
  onInputChange: (value: string) => void;
  onRun: () => void;
  output: string;
  stdin: string;
};

export default function TerminalBox({
  error,
  loading,
  onInputChange,
  onRun,
  output,
  stdin,
}: TerminalBoxProps) {
  return (
    <section className="panel rounded-[28px]">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <TerminalSquare size={16} />
          Terminal
        </div>
        <div className="flex items-center gap-3">
          <div className="text-xs uppercase tracking-[0.22em] text-slate-400">
            {loading ? "Running" : "Idle"}
          </div>
          <Button disabled={loading} onClick={onRun} type="button">
            <Play size={15} />
            {loading ? "Running" : "Run again"}
          </Button>
        </div>
      </div>
      <div className="grid gap-0 lg:grid-cols-[320px_minmax(0,1fr)]">
        <div className="border-b border-white/10 p-5 lg:border-b-0 lg:border-r">
          <div className="text-sm font-semibold text-white">Program input</div>
          <div className="mt-2 text-sm leading-6 text-slate-300">
            Provide stdin exactly as your program expects it. Multi-line input is supported.
          </div>
          <textarea
            className="mt-4 min-h-[160px] w-full resize-none rounded-[24px] border border-white/10 bg-slate-950/40 p-4 font-mono text-sm leading-7 text-slate-100 outline-none placeholder:text-slate-500 focus:border-sky-300"
            onChange={(event) => onInputChange(event.target.value)}
            placeholder={"5\n10 20\nhello"}
            value={stdin}
          />
        </div>

        <div className="p-5">
          <div className="mb-3 text-sm font-semibold text-white">Program output</div>
          <div className="scrollbar-thin h-[260px] overflow-y-auto rounded-[24px] border border-white/10 bg-slate-950/40 p-4 font-mono text-sm leading-7 text-slate-200 md:h-[320px]">
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
              <div className="text-slate-400">
                [system] Output will appear here after you run code or open a preview.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
