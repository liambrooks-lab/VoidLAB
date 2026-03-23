import { ArrowUpRight, ShieldCheck } from "lucide-react";
import ThemeSwitcher from "@/components/layout/ThemeSwitcher";

export default function Navbar() {
  return (
    <header className="flex items-center justify-between gap-4 rounded-[28px] border border-white/10 bg-slate-950/50 px-5 py-4 backdrop-blur-xl">
      <div>
        <div className="display-font text-2xl font-semibold tracking-[-0.05em] text-white">
          VoidLAB
        </div>
        <div className="text-xs uppercase tracking-[0.24em] text-slate-400">
          Cloud editor and compiler
        </div>
      </div>
      <div className="flex items-center gap-3">
        <ThemeSwitcher />
        <div className="hidden items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 sm:flex">
          <ShieldCheck size={16} className="text-teal-300" />
          Stable, responsive, keyboard-first
          <ArrowUpRight size={15} className="text-amber-300" />
        </div>
      </div>
    </header>
  );
}
