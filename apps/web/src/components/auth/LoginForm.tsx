"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Camera,
  Github,
  Globe2,
  Mail,
  Phone,
  Sparkles,
  User2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUser } from "@/context/UserContext";
import { apiBaseUrl } from "@/lib/api";

const emptyForm = {
  avatar: "",
  email: "",
  name: "",
  phone: "",
  region: "",
};

export default function LoginForm() {
  const router = useRouter();
  const { saveProfile } = useUser();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const completion = useMemo(() => {
    const values = [form.name, form.email, form.phone, form.region];
    return Math.round((values.filter((value) => value.trim()).length / values.length) * 100);
  }, [form]);

  const handleField =
    (field: keyof typeof emptyForm) => (event: ChangeEvent<HTMLInputElement>) => {
      setForm((current) => ({ ...current, [field]: event.target.value }));
    };

  const handleAvatar = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setForm((current) => ({ ...current, avatar: String(reader.result ?? "") }));
    };
    reader.readAsDataURL(file);
  };

  const handleProviderClick = (provider: "GitHub" | "Google" | "X") => {
    setInfo(`${provider} login button is ready in the onboarding UI. Manual profile launch still works right now.`);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!form.name.trim() || !form.email.trim() || !form.phone.trim() || !form.region.trim()) {
      setError("Please complete all required fields before launching VoidLAB.");
      return;
    }

    setSubmitting(true);

    const nextProfile = {
      avatar: form.avatar,
      bio: "",
      email: form.email.trim(),
      name: form.name.trim(),
      phone: form.phone.trim(),
      region: form.region.trim(),
      socials: {
        github: "",
        instagram: "",
        linkedin: "",
        x: "",
      },
    };

    try {
      const response = await fetch(`${apiBaseUrl}/api/auth/session`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(nextProfile),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "VoidLAB could not create your session.");
      }

      saveProfile(nextProfile);
      router.push("/editor");
    } catch (submissionError) {
      setError(
        submissionError instanceof Error
          ? submissionError.message
          : "VoidLAB could not create your session.",
      );
      setSubmitting(false);
    }
  };

  return (
    <section className="glass w-full max-w-xl rounded-[32px] p-5 sm:p-8">
      <div className="mb-8 flex items-start justify-between gap-4">
        <div>
          <div className="display-font text-3xl font-semibold tracking-[-0.05em] theme-text">
            Launch your workspace
          </div>
          <p className="mt-2 text-sm leading-6 theme-muted">
            Keep onboarding clean, then manage bio, socials, and activity details later
            from the in-product profile section.
          </p>
        </div>
        <div className="rounded-2xl border border-sky-200 bg-sky-50 px-3 py-2 text-right shadow-[inset_0_0_0_1px_rgba(96,165,250,0.08)]">
          <div className="text-xs uppercase tracking-[0.24em] text-sky-700">Profile</div>
          <div className="display-font text-xl font-semibold text-slate-900">{completion}%</div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <button
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm font-medium text-slate-900 shadow-[0_10px_24px_rgba(148,163,184,0.12)] transition hover:-translate-y-0.5 hover:border-sky-200"
          onClick={() => handleProviderClick("GitHub")}
          type="button"
        >
          <Github size={16} />
          GitHub
        </button>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm font-medium text-slate-900 shadow-[0_10px_24px_rgba(148,163,184,0.12)] transition hover:-translate-y-0.5 hover:border-sky-200"
          onClick={() => handleProviderClick("Google")}
          type="button"
        >
          <Mail size={16} />
          Google
        </button>
        <button
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-sky-100 bg-white px-4 py-3 text-sm font-medium text-slate-900 shadow-[0_10px_24px_rgba(148,163,184,0.12)] transition hover:-translate-y-0.5 hover:border-sky-200"
          onClick={() => handleProviderClick("X")}
          type="button"
        >
          <Sparkles size={16} />
          X
        </button>
      </div>

      {info ? (
        <div className="mt-4 rounded-2xl border border-sky-100 bg-sky-50 px-4 py-3 text-sm text-sky-800">
          {info}
        </div>
      ) : null}

      <form className="mt-5 space-y-5" onSubmit={(event) => void handleSubmit(event)}>
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <label className="group relative flex h-28 w-28 cursor-pointer items-center justify-center overflow-hidden rounded-[28px] border border-dashed border-sky-200 bg-white transition hover:border-sky-300 hover:bg-sky-50">
            {form.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="Profile preview" className="h-full w-full object-cover" src={form.avatar} />
            ) : (
              <div className="text-center">
                <Camera className="mx-auto text-slate-400 transition group-hover:text-sky-600" size={22} />
                <div className="mt-2 text-xs uppercase tracking-[0.22em] text-slate-500">
                  Add photo
                </div>
              </div>
            )}
            <input
              accept="image/*"
              className="absolute inset-0 cursor-pointer opacity-0"
              onChange={handleAvatar}
              type="file"
            />
          </label>

          <div className="flex-1 rounded-[28px] border border-sky-100 bg-white p-4 text-sm text-slate-600 shadow-[inset_0_0_0_1px_rgba(191,219,254,0.45)]">
            <div className="font-medium text-slate-900">VoidLAB identity card</div>
            <p className="mt-2 leading-6 text-slate-600">
              Start with your name, email, phone, region, and display photo. After entering the
              product, use the new profile page to add bio, socials, and manage your public card.
            </p>
          </div>
        </div>

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

        {error ? (
          <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs uppercase tracking-[0.24em] text-slate-500">
            Clean onboarding • profile inside product • polished workflow
          </div>
          <Button className="min-w-[200px]" disabled={submitting} type="submit">
            {submitting ? "Launching" : "Launch VoidLAB"}
            <ArrowRight size={16} />
          </Button>
        </div>
      </form>
    </section>
  );
}
