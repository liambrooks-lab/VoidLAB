"use client";

import { ChangeEvent, useMemo, useRef, useState } from "react";
import {
  ArrowUpRight,
  Camera,
  Github,
  Instagram,
  Linkedin,
  MapPin,
  Phone,
  RotateCcw,
  Save,
  Sparkles,
  UserCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/context/UserContext";
import { readWorkspace } from "@/lib/workspace";

const normalizeUrl = (value: string) => {
  if (!value) return "";
  return /^https?:\/\//i.test(value) ? value : `https://${value}`;
};

const socialCards = [
  { key: "github", label: "GitHub", icon: Github },
  { key: "linkedin", label: "LinkedIn", icon: Linkedin },
  { key: "x", label: "X", icon: Sparkles },
  { key: "instagram", label: "Instagram", icon: Instagram },
] as const;

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error("VoidLAB could not read that image."));
    reader.readAsDataURL(file);
  });

export default function ProfilePanel() {
  const { activities, profile, recordActivity, saveAvatar, saveProfile } = useUser();
  const [status, setStatus] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [draft, setDraft] = useState(() => ({
    bio: profile?.bio ?? "",
    socials: {
      github: profile?.socials.github ?? "",
      instagram: profile?.socials.instagram ?? "",
      linkedin: profile?.socials.linkedin ?? "",
      x: profile?.socials.x ?? "",
    },
  }));

  const workspaceSummary = useMemo(() => {
    if (typeof window === "undefined") {
      return { fileCount: 0, folderCount: 0 };
    }

    const workspace = readWorkspace();

    return {
      fileCount: workspace.files.length,
      folderCount: workspace.folders.length,
    };
  }, []);

  if (!profile) return null;

  const handleBioChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setDraft((current) => ({ ...current, bio: event.target.value }));
  };

  const handleSocialChange =
    (field: keyof typeof draft.socials) => (event: ChangeEvent<HTMLInputElement>) => {
      setDraft((current) => ({
        ...current,
        socials: {
          ...current.socials,
          [field]: event.target.value,
        },
      }));
    };

  const handleSave = () => {
    void saveProfile({
      bio: draft.bio.trim(),
      phone: profile.phone,
      region: profile.region,
      socials: {
        github: draft.socials.github.trim(),
        instagram: draft.socials.instagram.trim(),
        linkedin: draft.socials.linkedin.trim(),
        x: draft.socials.x.trim(),
      },
    })
      .then(() => {
        recordActivity({
          detail: "Refined bio or social links from the in-product profile page.",
          title: "Profile polished",
          type: "profile",
        });
        setStatus("Profile details saved inside VoidLAB.");
      })
      .catch((error) => {
        setStatus(error instanceof Error ? error.message : "Profile details could not be saved.");
      });
  };

  const handleAvatarPick = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) return;

    try {
      if (!file.type.startsWith("image/")) {
        throw new Error("Please choose an image file for your DP.");
      }

      if (file.size > 2 * 1024 * 1024) {
        throw new Error("Please choose an image smaller than 2 MB.");
      }

      const avatar = await readFileAsDataUrl(file);
      saveAvatar(avatar);
      setStatus("Display picture updated for this browser.");
      recordActivity({
        detail: "Updated the profile display picture from the profile page.",
        title: "Display picture changed",
        type: "profile",
      });
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Display picture could not be updated.");
    } finally {
      if (event.target) {
        event.target.value = "";
      }
    }
  };

  const handleRemoveAvatar = () => {
    saveAvatar("");
    setStatus("Display picture removed.");
    recordActivity({
      detail: "Removed the local display picture from the profile page.",
      title: "Display picture removed",
      type: "profile",
    });
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1.1fr)_380px]">
      <section className="rounded-[32px] border border-sky-100 bg-white p-6 shadow-[0_22px_70px_rgba(148,163,184,0.14)]">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="space-y-3">
            <input
              accept="image/*"
              className="hidden"
              onChange={(event) => void handleAvatarPick(event)}
              ref={fileInputRef}
              type="file"
            />
            <div className="flex h-28 w-28 items-center justify-center overflow-hidden rounded-[28px] border border-sky-100 bg-slate-50">
              {profile.avatar ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt={profile.name} className="h-full w-full object-cover" src={profile.avatar} />
              ) : (
                <UserCircle2 className="text-sky-500" size={34} />
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button onClick={() => fileInputRef.current?.click()} tone="secondary" type="button">
                <Camera size={15} />
                Add DP
              </Button>
              {profile.avatar ? (
                <Button onClick={handleRemoveAvatar} tone="secondary" type="button">
                  <RotateCcw size={15} />
                  Remove
                </Button>
              ) : null}
            </div>
          </div>

          <div className="min-w-0 flex-1">
            <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-4 py-2 text-xs uppercase tracking-[0.24em] text-sky-700">
              VoidLAB profile
            </div>
            <h2 className="display-font mt-4 text-4xl font-semibold tracking-[-0.05em] text-slate-950">
              {profile.name}
            </h2>
            <div className="mt-2 text-sm text-slate-600">{profile.email}</div>
            <div className="mt-4 grid gap-3 md:grid-cols-2">
              <div className="rounded-[24px] border border-sky-100 bg-slate-50 p-4 text-sm text-slate-700">
                <div className="flex items-center gap-2 font-medium text-slate-900">
                  <MapPin size={16} />
                  Region
                </div>
                <div className="mt-2">{profile.region || "Global"}</div>
              </div>
              <div className="rounded-[24px] border border-sky-100 bg-slate-50 p-4 text-sm text-slate-700">
                <div className="flex items-center gap-2 font-medium text-slate-900">
                  <Phone size={16} />
                  Contact
                </div>
                <div className="mt-2">{profile.phone || "Not added yet"}</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <div className="rounded-[24px] border border-sky-100 bg-slate-50 p-4">
            <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Workspace files</div>
            <div className="mt-3 text-3xl font-semibold text-slate-950">{workspaceSummary.fileCount}</div>
          </div>
          <div className="rounded-[24px] border border-sky-100 bg-slate-50 p-4">
            <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Workspace folders</div>
            <div className="mt-3 text-3xl font-semibold text-slate-950">{workspaceSummary.folderCount}</div>
          </div>
          <div className="rounded-[24px] border border-sky-100 bg-slate-50 p-4">
            <div className="text-xs uppercase tracking-[0.24em] text-slate-500">Activities</div>
            <div className="mt-3 text-3xl font-semibold text-slate-950">{activities.length}</div>
          </div>
        </div>

        <div className="mt-6 grid gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <div className="text-sm font-semibold text-slate-950">Bio</div>
            <textarea
              className="mt-3 min-h-[180px] w-full resize-none rounded-[24px] border border-sky-100 bg-slate-50 px-4 py-4 text-sm leading-7 text-slate-800 outline-none transition focus:border-sky-300"
              onChange={handleBioChange}
              placeholder="Write a sharp intro about what you build, your stack, or what your VoidLAB workspace is focused on."
              value={draft.bio}
            />
          </div>

          <div>
            <div className="text-sm font-semibold text-slate-950">Social links</div>
            <div className="mt-3 grid gap-3">
              <input
                className="w-full rounded-2xl border border-sky-100 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-sky-300"
                onChange={handleSocialChange("github")}
                placeholder="GitHub URL"
                value={draft.socials.github}
              />
              <input
                className="w-full rounded-2xl border border-sky-100 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-sky-300"
                onChange={handleSocialChange("linkedin")}
                placeholder="LinkedIn URL"
                value={draft.socials.linkedin}
              />
              <input
                className="w-full rounded-2xl border border-sky-100 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-sky-300"
                onChange={handleSocialChange("x")}
                placeholder="X URL"
                value={draft.socials.x}
              />
              <input
                className="w-full rounded-2xl border border-sky-100 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-sky-300"
                onChange={handleSocialChange("instagram")}
                placeholder="Instagram URL"
                value={draft.socials.instagram}
              />
            </div>
            <div className="mt-4 flex items-center justify-between gap-3">
              <Button onClick={handleSave} type="button">
                <Save size={15} />
                Save profile
              </Button>
              {status ? <div className="text-sm text-slate-600">{status}</div> : null}
            </div>
          </div>
        </div>

        <div className="mt-6">
          <div className="text-sm font-semibold text-slate-950">Public links</div>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {socialCards.map((card) => {
              const Icon = card.icon;
              const link = normalizeUrl(profile.socials[card.key]);

              return link ? (
                <a
                  className="flex items-center justify-between rounded-[24px] border border-sky-100 bg-slate-50 px-4 py-4 text-sm text-slate-900 transition hover:-translate-y-0.5 hover:border-sky-200"
                  href={link}
                  key={card.key}
                  rel="noreferrer"
                  target="_blank"
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-sky-100 bg-white text-sky-700">
                      <Icon size={17} />
                    </span>
                    {card.label}
                  </span>
                  <ArrowUpRight size={16} />
                </a>
              ) : (
                <div
                  className="flex items-center justify-between rounded-[24px] border border-dashed border-sky-100 bg-slate-50 px-4 py-4 text-sm text-slate-500"
                  key={card.key}
                >
                  <span className="flex items-center gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-2xl border border-sky-100 bg-white text-slate-400">
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

      <section className="rounded-[32px] border border-sky-100 bg-white p-6 shadow-[0_22px_70px_rgba(148,163,184,0.14)]">
        <div className="text-sm font-semibold text-slate-950">Recent activity</div>
        <div className="mt-2 text-sm text-slate-500">Entries older than 7 days are cleared automatically.</div>
        <div className="mt-4 space-y-3">
          {activities.length ? (
            activities.map((activity) => (
              <div className="rounded-[22px] border border-sky-100 bg-slate-50 p-4" key={activity.id}>
                <div className="flex items-center justify-between gap-3">
                  <div className="text-sm font-semibold text-slate-900">{activity.title}</div>
                  <div className="text-xs uppercase tracking-[0.18em] text-slate-500">{activity.type}</div>
                </div>
                <div className="mt-2 text-sm leading-6 text-slate-600">{activity.detail}</div>
                <div className="mt-3 text-xs text-slate-500">
                  {new Date(activity.createdAt).toLocaleString()}
                </div>
              </div>
            ))
          ) : (
            <div className="rounded-[22px] border border-sky-100 bg-slate-50 p-4 text-sm text-slate-600">
              Activity will appear here as the user runs code, saves work, asks AI questions,
              imports files, and updates the workspace.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
