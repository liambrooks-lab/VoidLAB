"use client";

import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import Brand from "@/components/layout/Brand";
import ThemeSwitcher from "@/components/layout/ThemeSwitcher";

type ToolPageShellProps = {
  children: React.ReactNode;
  description: string;
  eyebrow?: string;
  title: string;
};

export default function ToolPageShell({
  children,
  description,
  eyebrow = "Workspace tools",
  title,
}: ToolPageShellProps) {
  return (
    <main className="app-shell min-h-screen px-4 py-5 sm:px-6 lg:px-8">
      <div className="mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-7xl flex-col gap-6">
        <header className="glass rounded-[28px] px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100 transition hover:bg-white/10"
                href="/editor"
              >
                <ArrowLeft size={16} />
                Back to editor
              </Link>
              <Brand compact />
            </div>
            <ThemeSwitcher />
          </div>
        </header>

        <section className="panel rounded-[32px] p-6 sm:p-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-300/10 px-4 py-2 text-xs uppercase tracking-[0.26em] text-sky-100">
            <Sparkles size={14} />
            {eyebrow}
          </div>
          <h1 className="display-font mt-5 text-4xl font-semibold tracking-[-0.05em] text-white sm:text-5xl">
            {title}
          </h1>
          <p className="mt-4 max-w-3xl text-base leading-8 text-slate-300">{description}</p>
          <div className="mt-8">{children}</div>
        </section>
      </div>
    </main>
  );
}
