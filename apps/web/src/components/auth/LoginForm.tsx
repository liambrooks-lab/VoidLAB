"use client";

import { ChangeEvent, FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Camera,
  Github,
  Globe2,
  Instagram,
  Linkedin,
  Mail,
  Phone,
  User2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useUser } from "@/context/UserContext";
import { apiBaseUrl } from "@/lib/api";

const emptyForm = {
  avatar: "",
  bio: "",
  email: "",
  name: "",
  phone: "",
  region: "",
  socials: {
    github: "",
    instagram: "",
    linkedin: "",
    x: "",
  },
};

export default function LoginForm() {
  const router = useRouter();
  const { saveProfile } = useUser();
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const completion = useMemo(() => {
    const values = [form.name, form.email, form.phone, form.region];
    return Math.round((values.filter((value) => value.trim()).length / values.length) * 100);
  }, [form]);

  const handleField =
    (field: "bio" | "email" | "name" | "phone" | "region") =>
    (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((current) => ({ ...current, [field]: event.target.value }));
    };

  const handleSocialField =
    (field: keyof typeof emptyForm.socials) => (event: ChangeEvent<HTMLInputElement>) => {
      setForm((current) => ({
        ...current,
        socials: {
          ...current.socials,
          [field]: event.target.value,
        },
      }));
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
      bio: form.bio.trim(),
      email: form.email.trim(),
      name: form.name.trim(),
      phone: form.phone.trim(),
      region: form.region.trim(),
      socials: {
        github: form.socials.github.trim(),
        instagram: form.socials.instagram.trim(),
        linkedin: form.socials.linkedin.trim(),
        x: form.socials.x.trim(),
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
          <div className="display-font text-3xl font-semibold tracking-[-0.05em] text-white">
            Launch your workspace
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-300">
            Set up your profile once, then continue coding with your personalized
            VoidLAB environment on any device.
          </p>
        </div>
        <div className="rounded-2xl border border-sky-300/20 bg-sky-300/10 px-3 py-2 text-right">
          <div className="text-xs uppercase tracking-[0.24em] text-sky-100">Profile</div>
          <div className="display-font text-xl font-semibold text-white">{completion}%</div>
        </div>
      </div>

      <form className="space-y-5" onSubmit={(event) => void handleSubmit(event)}>
        <div className="flex flex-col items-center gap-3 sm:flex-row">
          <label className="group relative flex h-28 w-28 cursor-pointer items-center justify-center overflow-hidden rounded-[28px] border border-dashed border-white/15 bg-white/5 transition hover:border-sky-300/50 hover:bg-white/10">
            {form.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt="Profile preview" className="h-full w-full object-cover" src={form.avatar} />
            ) : (
              <div className="text-center">
                <Camera className="mx-auto text-slate-400 transition group-hover:text-sky-200" size={22} />
                <div className="mt-2 text-xs uppercase tracking-[0.22em] text-slate-400">
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

          <div className="flex-1 rounded-[28px] border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
            <div className="font-medium text-white">VoidLAB identity card</div>
            <p className="mt-2 leading-6 text-slate-400">
              Add your bio and social links so your profile page feels real, shareable,
              and ready for demos or portfolio use.
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

        <label className="block">
          <span className="mb-2 block text-sm text-slate-300">Bio</span>
          <textarea
            className="min-h-[110px] w-full resize-none rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-sky-300"
            onChange={handleField("bio")}
            placeholder="Tell people what you build, explore, or want to ship with VoidLAB."
            value={form.bio}
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            icon={<Github size={16} />}
            label="GitHub"
            onChange={handleSocialField("github")}
            placeholder="https://github.com/your-handle"
            value={form.socials.github}
          />
          <Input
            icon={<Linkedin size={16} />}
            label="LinkedIn"
            onChange={handleSocialField("linkedin")}
            placeholder="https://www.linkedin.com/in/your-handle"
            value={form.socials.linkedin}
          />
          <Input
            icon={<User2 size={16} />}
            label="X"
            onChange={handleSocialField("x")}
            placeholder="https://x.com/your-handle"
            value={form.socials.x}
          />
          <Input
            icon={<Instagram size={16} />}
            label="Instagram"
            onChange={handleSocialField("instagram")}
            placeholder="https://instagram.com/your-handle"
            value={form.socials.instagram}
          />
        </div>

        {error ? (
          <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
            {error}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-xs uppercase tracking-[0.24em] text-slate-400">
            Mobile ready • profile rich • fast compile loop • project ready
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
