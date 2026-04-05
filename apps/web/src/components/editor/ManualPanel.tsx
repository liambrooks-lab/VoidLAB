"use client";

import { BookOpenText, Command, Info, Rocket, TerminalSquare } from "lucide-react";

export default function ManualPanel() {
  return (
    <section className="panel rounded-[28px] p-5">
      <div className="flex items-center gap-2 text-sm font-semibold text-white">
        <BookOpenText size={16} />
        User manual
      </div>

      <div className="scrollbar-thin mt-4 max-h-[620px] space-y-5 overflow-y-auto pr-1 text-sm leading-7 text-slate-300">
        <div>
          <div className="mb-2 flex items-center gap-2 font-medium text-white">
            <Info size={15} />
            What VoidLAB is
          </div>
          <p>
            VoidLAB is a cloud-style coding workspace with onboarding, profile-aware
            greeting, project files, tabs, themes, terminal output, and online
            code execution. The Vercel link is the user-facing product URL.
          </p>
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2 font-medium text-white">
            <Rocket size={15} />
            How to use it
          </div>
          <div className="space-y-2">
            <p>1. Fill the login profile and enter the workspace.</p>
            <p>2. Create or select a file from the explorer.</p>
            <p>3. Choose the language for the active file from the top bar.</p>
            <p>4. Write code in the editor and click Run or Preview.</p>
            <p>5. Use Input (stdin) for interactive programs before pressing Run.</p>
            <p>6. Read output, errors, and runtime messages in the terminal.</p>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2 font-medium text-white">
            <Command size={15} />
            Shortcuts
          </div>
          <div className="space-y-2">
            <p><code>Ctrl/Cmd + Enter</code> runs the active file.</p>
            <p><code>Ctrl/Cmd + S</code> saves the workspace locally.</p>
            <p><code>Ctrl/Cmd + Shift + N</code> creates a new file.</p>
            <p><code>Esc</code> closes mobile side panels.</p>
          </div>
        </div>

        <div>
          <div className="mb-2 flex items-center gap-2 font-medium text-white">
            <TerminalSquare size={15} />
            Execution notes
          </div>
          <div className="space-y-2">
            <p>VoidLAB supports many languages for editing and a broad set for live execution.</p>
            <p>
              Some formats are editor-only. If a language is marked editor-only,
              the workspace keeps syntax support but disables cloud execution.
            </p>
            <p>
              The first run after backend inactivity may feel slower because the
              hosted API can cold start. After that, runs should feel much faster.
            </p>
            <p>
              HTML, CSS, Markdown, JSON, and XML can open a browser preview
              instantly in a new tab instead of using the compiler pipeline.
            </p>
          </div>
        </div>

        <div>
          <div className="mb-2 font-medium text-white">Built-in product areas</div>
          <div className="space-y-2">
            <p><strong>File Explorer:</strong> manage multiple files in one workspace.</p>
            <p><strong>Tabs:</strong> switch quickly between active files.</p>
            <p><strong>Theme Switcher:</strong> change the interface style.</p>
            <p><strong>GitHub Publish:</strong> copy repo setup commands from a focused GitHub page.</p>
            <p><strong>Collaboration:</strong> create rooms, sync workspace state, and chat with teammates.</p>
            <p><strong>AI Guide:</strong> ask for workflow, debugging, or product help.</p>
            <p><strong>Terminal:</strong> inspect output, compile messages, and execution errors.</p>
          </div>
        </div>
      </div>
    </section>
  );
}
