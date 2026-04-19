"use client";

import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";
import Brand from "@/components/layout/Brand";
import SessionControls from "@/components/layout/SessionControls";
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
        <header className="glass theme-header rounded-[28px] px-5 py-4">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <Link
                className="theme-button-secondary inline-flex items-center gap-2 rounded-2xl px-4 py-2 text-sm transition"
                href="/editor"
              >
                <ArrowLeft size={16} />
                Back to editor
              </Link>
              <Brand compact />
            </div>
            <div className="flex items-center gap-3">
              <ThemeSwitcher />
              <SessionControls />
            </div>
          </div>
        </header>

        <section className="panel rounded-[32px] p-6 sm:p-8">
          <div className="theme-chip inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs uppercase tracking-[0.26em]">
            <Sparkles size={14} />
            {eyebrow}
          </div>
          <h1 className="display-font theme-text-strong mt-5 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
            {title}
          </h1>
          <p className="theme-muted mt-4 max-w-3xl text-base leading-8">{description}</p>
          <div className="mt-8">{children}</div>
        </section>
      </div>
    </main>
  );
}
