"use client";

import { Github, Mail, ShieldCheck, Sparkles } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { buildOAuthStartUrl } from "@/lib/auth";

const providerCards = [
  {
    description: "Use your Google account for a polished one-click sign-in flow.",
    href: buildOAuthStartUrl("google"),
    icon: Mail,
    label: "Continue with Google",
  },
  {
    description: "Connect GitHub to unlock real repository pushes from VoidLAB.",
    href: buildOAuthStartUrl("github"),
    icon: Github,
    label: "Continue with GitHub",
  },
  {
    description: "Use X OAuth 2.0 so your profile and identity stay linked securely.",
    href: buildOAuthStartUrl("x"),
    icon: Sparkles,
    label: "Continue with X",
  },
];

type LoginFormProps = {
  authError?: string;
};

export default function LoginForm({ authError = "" }: LoginFormProps) {
  const { isReady, profile } = useUser();

  return (
    <section className="glass w-full max-w-xl rounded-[32px] p-5 sm:p-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="display-font text-3xl font-semibold tracking-[-0.05em] theme-text">
            Continue to VoidLAB
          </div>
          <p className="mt-2 text-sm leading-6 theme-muted">
            Sign in with a real OAuth provider. VoidLAB stores a secure app session and can keep
            your GitHub token encrypted for repository publishing.
          </p>
        </div>
        <div className="rounded-2xl border border-sky-100 bg-sky-50 px-3 py-2 text-right shadow-[inset_0_0_0_1px_rgba(96,165,250,0.08)]">
          <div className="text-xs uppercase tracking-[0.24em] text-sky-700">OAuth</div>
          <div className="display-font text-xl font-semibold text-slate-900">Live</div>
        </div>
      </div>

      <div className="space-y-3">
        {providerCards.map((provider) => {
          const Icon = provider.icon;

          return (
            <a
              className="flex items-center justify-between rounded-[28px] border border-sky-100 bg-white px-5 py-4 text-left shadow-[0_10px_24px_rgba(148,163,184,0.12)] transition hover:-translate-y-0.5 hover:border-sky-200"
              href={provider.href}
              key={provider.label}
            >
              <span className="flex min-w-0 items-center gap-4">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl border border-sky-100 bg-sky-50 text-slate-900">
                  <Icon size={18} />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-slate-950">{provider.label}</span>
                  <span className="mt-1 block text-sm leading-6 text-slate-600">
                    {provider.description}
                  </span>
                </span>
              </span>
            </a>
          );
        })}
      </div>

      {authError ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {authError}
        </div>
      ) : null}

      <div className="mt-6 rounded-[28px] border border-sky-100 bg-white p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
          <ShieldCheck size={16} />
          What happens after login
        </div>
        <div className="mt-3 space-y-2 text-sm leading-7 text-slate-600">
          <p>1. VoidLAB redirects you to the provider you choose.</p>
          <p>2. After approval, the backend exchanges the authorization code for tokens.</p>
          <p>3. Your user record is created or linked, then a secure app session cookie is set.</p>
          <p>4. If GitHub is connected, you can push code to real repositories from the app.</p>
        </div>
      </div>

      {isReady && profile ? (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-900">
          <span>Signed in as {profile.name}. Open your workspace when you’re ready.</span>
          <a
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-400 px-4 py-2.5 text-sm font-medium text-white shadow-[0_14px_32px_rgba(59,130,246,0.22)] transition duration-200 hover:bg-sky-300"
            href="/editor"
          >
            Open editor
          </a>
        </div>
      ) : null}
    </section>
  );
}
