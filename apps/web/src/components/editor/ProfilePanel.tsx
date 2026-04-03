"use client";

import { useMemo } from "react";
import { ArrowUpRight, Github, Instagram, Linkedin, MapPin, Phone, Sparkles, UserCircle2 } from "lucide-react";
import { useUser } from "@/context/UserContext";
import { readWorkspace } from "@/lib/workspace";

const normalizeUrl = (value: string) => {
  if (!value) return "";
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
};

const socialCards = [
  {
    key: "github",
    label: "GitHub",
    icon: Github,
  },
  {
    key: "linkedin",
    label: "LinkedIn",
    icon: Linkedin,
  },
  {
    key: "x",
    label: "X",
    icon: Sparkles,
  },
  {
    key: "instagram",
    label: "Instagram",
    icon: Instagram,
  },
] as const;

export default function ProfilePanel() {
  const { activities, profile } = useUser();

  const workspaceSummary = useMemo(() => {
    if (typeof window === "undefined") {
      return {
        fileCount: 0,
        folderCount: 0,
      };
    }

    const workspace = readWorkspace();

    return {
      fileCount: workspace.files.length,
      folderCount: workspace.folders.length,
    };
  }, []);

  if (!profile) return null;

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.15fr)_360px]">
      <section className="rounded-[28px] border border-white/10 bg-white/5 p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-[28px] border border-white/10 bg-white/5">
            {profile.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img alt={profile.name} className="h-full w-full object-cover" src={profile.avatar} />
            ) : (
              <UserCircle2 className="text-sky-200" size={34} />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-300/10 px-4 py-2 text-xs uppercase tracking-[0.24em] text-sky-100">
              VoidLAB profile
            </div>
            <h2 className="display-font mt-4 text-4xl font-semibold tracking-[-0.05em] text-white">
              {profile.name}
            </h2>
            <div className="mt-2 text-sm text-slate-300">{profile.email}</div>
            <div className="mt-5 rounded-[24px] border border-white/10 bg-slate-950/40 p-4 text-sm leading-7 text-slate-300">
              {profile.bio || "Add a bio from the launch form to personalize this profile card."}
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-[24px] border border-white/10 bg-slate-950/35 p-4">
            <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Workspace files</div>
            <div className="mt-3 text-3xl font-semibold text-white">{workspaceSummary.fileCount}</div>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-slate-950/35 p-4">
            <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Workspace folders</div>
            <div className="mt-3 text-3xl font-semibold text-white">{workspaceSummary.folderCount}</div>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-slate-950/35 p-4">
            <div className="text-xs uppercase tracking-[0.24em] text-slate-400">Activities</div>
            <div className="mt-3 text-3xl font-semibold text-white">{activities.length}</div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
          <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
            <div className="flex items-center gap-2 text-white">
              <MapPin size={16} />
              Region
            </div>
            <div className="mt-3">{profile.region}</div>
          </div>
          <div className="rounded-[24px] border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
            <div className="flex items-center gap-2 text-white">
              <Phone size={16} />
              Contact
            </div>
            <div className="mt-3">{profile.phone}</div>
          </div>
        </div>

        <div className="mt-6">
          <div className="text-sm font-semibold text-white">Social links</div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {socialCards.map((card) => {
              const Icon = card.icon;
              const link = normalizeUrl(profile.socials[card.key]);

              return link ? (
                <a
                  className="flex items-center justify-between rounded-[24px] border border-white/10 bg-white/5 px-4 py-4 text-sm text-slate-100 transition hover:-translate-y-0.5 hover:bg-white/10"
                  href={link}
                  key={card.key}
                  rel="noreferrer"
                  target="_blank"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-sky-300/20 bg-sky-300/10 text-sky-100">
                      <Icon size={17} />
                    </span>
                    {card.label}
                  </span>
                  <ArrowUpRight size={16} />
                </a>
              ) : (
                <div
                  className="flex items-center justify-between rounded-[24px] border border-dashed border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-slate-500"
                  key={card.key}
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-slate-400">
                      <Icon size={17} />
                    </span>
                    {card.label}
                  </span>
                  Add link
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-white/10 bg-white/5 p-6">
        <div className="text-sm font-semibold text-white">Recent activity</div>
        <div className="mt-4 space-y-3">
          {activities.length ? (
            activities.map((activity) => (
              <div className="rounded-[22px] border border-white/10 bg-slate-950/35 p-4" key={activity.id}>
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-white">{activity.title}</div>
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{activity.type}</div>
                </div>
                <div className="mt-2 text-sm leading-6 text-slate-300">{activity.detail}</div>
                <div className="mt-3 text-xs text-slate-500">
                  {new Date(activity.createdAt).toLocaleString()}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[22px] border border-white/10 bg-slate-950/35 p-4 text-sm text-slate-300">
              Activity will appear here as the user runs code, saves work, asks AI questions,
              imports files, and works through the editor.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
