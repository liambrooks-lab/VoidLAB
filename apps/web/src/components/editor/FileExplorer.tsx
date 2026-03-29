"use client";

import { FilePlus2, FolderTree, Trash2 } from "lucide-react";
import { languageGroups } from "@/lib/languages";

type ExplorerFile = {
  id: string;
  languageId: string;
  name: string;
};

type FileExplorerProps = {
  activeFileId: string;
  draftLanguage: string;
  draftName: string;
  files: ExplorerFile[];
  onCreateFile: () => void;
  onDeleteFile: (id: string) => void;
  onDraftLanguageChange: (value: string) => void;
  onDraftNameChange: (value: string) => void;
  onSelectFile: (id: string) => void;
};

export default function FileExplorer({
  activeFileId,
  draftLanguage,
  draftName,
  files,
  onCreateFile,
  onDeleteFile,
  onDraftLanguageChange,
  onDraftNameChange,
  onSelectFile,
}: FileExplorerProps) {
  return (
    <div className="flex h-full flex-col border-r border-white/10 bg-black/10">
      <div className="border-b border-white/10 px-4 py-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <FolderTree size={16} />
          Project files
        </div>
        <div className="mt-4 space-y-3">
          <input
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-teal-400"
            onChange={(event) => onDraftNameChange(event.target.value)}
            placeholder="new-module"
            value={draftName}
          />
          <select
            className="w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-2.5 text-sm text-slate-100 outline-none focus:border-sky-300"
            onChange={(event) => onDraftLanguageChange(event.target.value)}
            value={draftLanguage}
          >
            {languageGroups.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.items.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <button
            className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-sky-400 px-4 py-2.5 text-sm font-medium text-slate-950 transition hover:bg-sky-300"
            onClick={onCreateFile}
            type="button"
          >
            <FilePlus2 size={15} />
            Create file
          </button>
        </div>
      </div>

      <div className="scrollbar-thin flex-1 overflow-y-auto p-3">
        <div className="space-y-2">
          {files.map((file) => {
            const isActive = file.id === activeFileId;
            return (
              <div
                className={`flex items-center justify-between rounded-2xl border px-3 py-3 transition ${
                  isActive
                    ? "border-sky-300/35 bg-sky-300/10"
                    : "border-white/10 bg-white/5 hover:bg-white/10"
                }`}
                key={file.id}
              >
                <button
                  className="min-w-0 flex-1 text-left"
                  onClick={() => onSelectFile(file.id)}
                  type="button"
                >
                  <div className="truncate text-sm font-medium text-white">{file.name}</div>
                  <div className="truncate text-xs text-slate-400">{file.languageId}</div>
                </button>
                <button
                  className="rounded-full p-2 text-slate-400 transition hover:bg-white/10 hover:text-rose-300"
                  onClick={() => onDeleteFile(file.id)}
                  type="button"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
