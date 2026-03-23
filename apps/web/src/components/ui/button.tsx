import { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  tone?: "primary" | "secondary";
};

export function Button({
  children,
  className,
  tone = "primary",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-medium transition duration-200 disabled:cursor-not-allowed disabled:opacity-60",
        tone === "primary"
          ? "bg-teal-400 text-slate-950 shadow-[0_0_35px_rgba(45,212,191,0.24)] hover:bg-teal-300"
          : "border border-white/10 bg-white/5 text-slate-100 hover:bg-white/10",
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}
