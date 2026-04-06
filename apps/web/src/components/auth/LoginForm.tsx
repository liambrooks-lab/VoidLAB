"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { ArrowRight, Github, Globe2, Mail, Phone, ShieldCheck, Sparkles, User2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useUser } from "@/context/UserContext";
import { buildOAuthStartUrl } from "@/lib/auth";
import { apiBaseUrl } from "@/lib/api";

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

const emptyForm = {
  email: "",
  name: "",
  phone: "",
  region: "",
};

type LoginFormProps = {
  authError?: string;
};

export default function LoginForm({ authError = "" }: LoginFormProps) {
  const { isReady, profile, refreshProfile } = useUser();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const completion = useMemo(() => {
    const values = [form.name, form.email, form.phone, form.region];
    return Math.round((values.filter((value) => value.trim()).length / values.length) * 100);
  }, [form]);

  const handleField =
    (field: keyof typeof emptyForm) => (event: ChangeEvent<HTMLInputElement>) => {
      setForm((current) => ({ ...current, [field]: event.target.value }));
    };

  const handleManualLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.region.trim()) {
      setError("Please fill name, email, phone, and region first.");
      return;
    }

    setSubmitting(true);

    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/manual-login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          email: form.email.trim(),
          name: form.name.trim(),
          phone: form.phone.trim(),
          region: form.region.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "VoidLAB could not enter your workspace.");
      }

      await refreshProfile();
      window.location.href = "/editor";
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "VoidLAB could not enter your workspace.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="glass w-full max-w-xl rounded-[32px] p-5 sm:p-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="display-font text-3xl font-semibold tracking-[-0.05em] theme-text">
            Enter VoidLAB
          </div>
          <p className="mt-2 text-sm leading-6 theme-muted">
            Use the simple direct entry form like before, or keep things connected with Google,
            GitHub, or X whenever you want.
          </p>
        </div>
        <div className="rounded-2xl border border-sky-100 bg-sky-50 px-3 py-2 text-right shadow-[inset_0_0_0_1px_rgba(96,165,250,0.08)]">
          <div className="text-xs uppercase tracking-[0.24em] text-sky-700">Access</div>
          <div className="display-font text-xl font-semibold text-slate-900">{completion}%</div>
        </div>
      </div>

      <form className="space-y-4" onSubmit={(event) => void handleManualLogin(event)}>
        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            icon={<User2 size={16} />}
            label="Full name"
            onChange={handleField("name")}
            placeholder="Liam"
            value={form.name}
          />
          <Input
            icon={<Mail size={16} />}
            label="Email"
            onChange={handleField("email")}
            placeholder="you@example.com"
            type="email"
            value={form.email}
          />
          <Input
            icon={<Phone size={16} />}
            label="Phone number"
            onChange={handleField("phone")}
            placeholder="Phone number"
            value={form.phone}
          />
          <Input
            icon={<Globe2 size={16} />}
            label="Region"
            onChange={handleField("region")}
            placeholder="Kolkata, India"
            value={form.region}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 rounded-[28px] border border-sky-100 bg-white p-5">
          <div>
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-950">
              <ShieldCheck size={16} />
              Traditional entry
            </div>
            <div className="mt-2 text-sm leading-6 text-slate-600">
              This creates or reuses your real VoidLAB account and signs you in directly without
              going through another app.
            </div>
          </div>
          <Button className="min-w-[190px]" disabled={submitting} type="submit">
            {submitting ? "Entering..." : "Enter VoidLAB"}
            <ArrowRight size={16} />
          </Button>
        </div>
      </form>

      {error || authError ? (
        <div className="mt-4 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {error || authError}
        </div>
      ) : null}

      <div className="my-6 flex items-center gap-4">
        <div className="h-px flex-1 bg-sky-100" />
        <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Or continue with</div>
        <div className="h-px flex-1 bg-sky-100" />
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
