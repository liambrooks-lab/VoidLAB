"use client";

import { FileCode2, X } from "lucide-react";

type TabFile = {
  id: string;
  name: string;
};

type EditorTabsProps = {
  activeFileId: string;
  files: TabFile[];
  onCloseFile: (id: string) => void;
  onSelectFile: (id: string) => void;
};

export default function EditorTabs({
  activeFileId,
  files,
  onCloseFile,
  onSelectFile,
}: EditorTabsProps) {
  return (
    <div className="scrollbar-thin flex gap-2 overflow-x-auto border-b border-white/10 px-3 py-3">
      {files.map((file) => {
        const isActive = file.id === activeFileId;
        return (
          <button
            className={`group flex items-center gap-2 rounded-2xl border px-3 py-2 text-sm transition ${
              isActive
                ? "border-teal-400/40 bg-teal-400/10 text-white"
                : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10"
            }`}
            key={file.id}
            onClick={() => onSelectFile(file.id)}
            type="button"
          >
            <FileCode2 size={14} />
            <span>{file.name}</span>
            <span
              className="rounded-full p-1 text-slate-400 opacity-60 transition hover:bg-white/10 hover:text-white group-hover:opacity-100"
              onClick={(event) => {
                event.stopPropagation();
                onCloseFile(file.id);
              }}
            >
              <X size={12} />
            </span>
          </button>
        );
      })}
    </div>
  );
}
