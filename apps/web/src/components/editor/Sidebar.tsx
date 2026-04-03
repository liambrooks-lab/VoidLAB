"use client";

import Link from "next/link";
import { BookText, Command, ExternalLink, Globe2, UserCircle2 } from "lucide-react";
import { UserProfile } from "@/context/UserContext";
import { LanguageOption } from "@/lib/languages";

type SidebarProps = {
  currentLanguage: LanguageOption;
  isOpen: boolean;
  profile: UserProfile;
  shortcutItems: Array<{ key: string; label: string }>;
};

const normalizeUrl = (value: string) => {
  if (!value) return "";
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
};

export default function Sidebar({
  currentLanguage,
  isOpen,
  profile,
  shortcutItems,
}: SidebarProps) {
  const socialLinks = [
    { label: "GitHub", href: normalizeUrl(profile.socials.github) },
    { label: "LinkedIn", href: normalizeUrl(profile.socials.linkedin) },
    { label: "X", href: normalizeUrl(profile.socials.x) },
    { label: "Instagram", href: normalizeUrl(profile.socials.instagram) },
  ].filter((item) => item.href);

  return (
    <aside
      className={`${
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
      } fixed inset-y-0 left-0 z-20 w-[290px] border-r border-white/10 bg-slate-950/96 p-4 transition-transform duration-300 lg:static lg:block lg:w-[300px] lg:bg-transparent lg:p-4`}
    >
      <div className="scrollbar-thin flex h-full flex-col gap-4 overflow-y-auto pt-20 lg:pt-0">
        <div className="panel rounded-[28px] p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
              {profile.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt={profile.name} className="h-full w-full rounded-2xl object-cover" src={profile.avatar} />
              ) : (
                <UserCircle2 className="text-sky-300" size={22} />
              )}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-medium text-white">{profile.name}</div>
              <div className="truncate text-xs text-slate-400">{profile.email}</div>
            </div>
          </div>
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-300">
            {profile.bio || "Add a bio from your profile setup to personalize this workspace."}
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link
              className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs text-slate-100 transition hover:bg-white/10"
              href="/editor/profile"
            >
              Open profile
            </Link>
            {socialLinks.map((item) => (
              <a
                className="inline-flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-xs text-slate-100 transition hover:bg-white/10"
                href={item.href}
                key={item.label}
                rel="noreferrer"
                target="_blank"
              >
                {item.label}
                <ExternalLink size={12} />
              </a>
            ))}
          </div>
        </div>

        <div className="panel rounded-[28px] p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <BookText size={16} />
            Language card
          </div>
          <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="display-font text-xl font-semibold text-white">{currentLanguage.label}</div>
            <div className="mt-2 text-sm leading-6 text-slate-400">{currentLanguage.description}</div>
            <div className="mt-4 flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-slate-300">
              <span className="rounded-full border border-white/10 px-3 py-1">
                {currentLanguage.category}
              </span>
              <span className="rounded-full border border-white/10 px-3 py-1">
                {currentLanguage.runnable ? "Runnable" : "Editor only"}
              </span>
            </div>
          </div>
        </div>

        <div className="panel rounded-[28px] p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Command size={16} />
            Shortcuts
          </div>
          <div className="mt-4 space-y-3">
            {shortcutItems.map((item) => (
              <div
                className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm"
                key={item.key}
              >
                <span className="text-slate-300">{item.label}</span>
                <span className="rounded-full border border-white/10 px-2 py-1 text-xs text-slate-200">
                  {item.key}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="panel rounded-[28px] p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <Globe2 size={16} />
            Region
          </div>
          <div className="mt-3 text-sm leading-6 text-slate-300">
            Personalized workspace currently configured for{" "}
            <span className="font-medium text-white">{profile.region}</span>.
          </div>
        </div>
      </div>
    </aside>
  );
}
