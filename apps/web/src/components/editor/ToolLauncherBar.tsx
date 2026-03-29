"use client";

import Link from "next/link";
import { BookOpenText, Bot, Github, Users2 } from "lucide-react";

const tools = [
  {
    description: "Read the detailed product manual and execution notes.",
    href: "/editor/manual",
    icon: BookOpenText,
    label: "Manual",
  },
  {
    description: "Prepare repository links and publish commands.",
    href: "/editor/github",
    icon: Github,
    label: "GitHub",
  },
  {
    description: "Create rooms, invite teammates, and sync workspace state.",
    href: "/editor/collaboration",
    icon: Users2,
    label: "Collaboration",
  },
  {
    description: "Ask the built-in guide for workflow and debugging help.",
    href: "/editor/ai",
    icon: Bot,
    label: "AI Guide",
  },
];

export default function ToolLauncherBar() {
  return (
    <section className="panel rounded-[28px] p-4 sm:p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-white">Feature hub</div>
          <div className="mt-1 text-sm text-slate-300">
            Open focused pages for product help, publishing, collaboration, and AI guidance.
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        {tools.map((tool) => {
          const Icon = tool.icon;

          return (
            <Link
              className="rounded-[24px] border border-white/10 bg-white/5 p-4 transition hover:-translate-y-0.5 hover:bg-white/10"
              href={tool.href}
              key={tool.href}
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-300/20 bg-sky-300/10 text-sky-200">
                <Icon size={18} />
              </div>
              <div className="mt-4 text-sm font-semibold text-white">{tool.label}</div>
              <div className="mt-2 text-sm leading-6 text-slate-300">{tool.description}</div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
