"use client";

import { FileCode2, FilePlus2, Folder, FolderPlus, FolderTree, Trash2, Upload } from "lucide-react";
import { languageGroups } from "@/lib/languages";
import { formatWorkspacePath, getWorkspaceBaseName, getWorkspaceParentPath } from "@/lib/workspace";

type ExplorerFile = {
  id: string;
  languageId: string;
  name: string;
  path: string;
};

type TreeItem =
  | {
      depth: number;
      kind: "folder";
      path: string;
    }
  | {
      depth: number;
      id: string;
      kind: "file";
      languageId: string;
      path: string;
    };

type FileExplorerProps = {
  activeFileId: string;
  cwd: string;
  draftLanguage: string;
  draftName: string;
  files: ExplorerFile[];
  folders: string[];
  onCreateFile: () => void;
  onCreateFolder: () => void;
  onDeleteFile: (id: string) => void;
  onDeleteFolder: (path: string) => void;
  onDraftLanguageChange: (value: string) => void;
  onDraftNameChange: (value: string) => void;
  onImportFiles: () => void;
  onImportFolder: () => void;
  onSelectFile: (id: string) => void;
};

const buildTree = (folders: string[], files: ExplorerFile[], parent = "", depth = 0): TreeItem[] => {
  const folderItems = folders
    .filter((folder) => getWorkspaceParentPath(folder) === parent)
    .sort((left, right) => left.localeCompare(right))
    .flatMap((folder) => [
      {
        depth,
        kind: "folder" as const,
        path: folder,
      },
      ...buildTree(folders, files, folder, depth + 1),
    ]);

  const fileItems = files
    .filter((file) => getWorkspaceParentPath(file.path) === parent)
    .sort((left, right) => left.path.localeCompare(right.path))
    .map(
      (file) =>
        ({
          depth,
          id: file.id,
          kind: "file" as const,
          languageId: file.languageId,
          path: file.path,
        }) satisfies TreeItem,
    );

  return [...folderItems, ...fileItems];
};

export default function FileExplorer({
  activeFileId,
  cwd,
  draftLanguage,
  draftName,
  files,
  folders,
  onCreateFile,
  onCreateFolder,
  onDeleteFile,
  onDeleteFolder,
  onDraftLanguageChange,
  onDraftNameChange,
  onImportFiles,
  onImportFolder,
  onSelectFile,
}: FileExplorerProps) {
  const items = buildTree(folders, files);

  return (
    <div className="flex h-full flex-col border-r border-white/10 bg-black/10">
      <div className="border-b border-white/10 px-4 py-4">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <FolderTree size={16} />
          Project explorer
        </div>
        <div className="mt-2 text-xs uppercase tracking-[0.18em] text-slate-400">
          Working directory {formatWorkspacePath(cwd)}
        </div>
        <div className="mt-4 space-y-3">
          <input
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white outline-none placeholder:text-slate-500 focus:border-teal-400"
            onChange={(event) => onDraftNameChange(event.target.value)}
            placeholder="src/main"
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
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-sky-400 px-4 py-2.5 text-sm font-medium text-slate-950 transition hover:bg-sky-300"
              onClick={onCreateFile}
              type="button"
            >
              <FilePlus2 size={15} />
              Create file
            </button>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
              onClick={onCreateFolder}
              type="button"
            >
              <FolderPlus size={15} />
              Create folder
            </button>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            <button
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
              onClick={onImportFiles}
              type="button"
            >
              <Upload size={15} />
              Import files
            </button>
            <button
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/10"
              onClick={onImportFolder}
              type="button"
            >
              <Upload size={15} />
              Import folder
            </button>
          </div>
        </div>
      </div>

      <div className="scrollbar-thin flex-1 overflow-y-auto p-3">
        <div className="space-y-2">
          {items.length ? (
            items.map((item) => {
              const paddingLeft = 12 + item.depth * 16;

              if (item.kind === "folder") {
                return (
                  <div
                    className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 px-3 py-3"
                    key={item.path}
                    style={{ paddingLeft }}
                  >
                    <div className="min-w-0 text-left">
                      <div className="flex items-center gap-2 text-sm font-medium text-white">
                        <Folder size={14} className="text-sky-200" />
                        <span className="truncate">{getWorkspaceBaseName(item.path)}</span>
                      </div>
                      <div className="truncate text-xs text-slate-400">{formatWorkspacePath(item.path)}</div>
                    </div>
                    <button
                      className="rounded-full p-2 text-slate-400 transition hover:bg-white/10 hover:text-rose-300"
                      onClick={() => onDeleteFolder(item.path)}
                      type="button"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              }

              const isActive = item.id === activeFileId;
              return (
                <div
                  className={`flex items-center justify-between rounded-2xl border px-3 py-3 transition ${
                    isActive
                      ? "border-sky-300/35 bg-sky-300/10"
                      : "border-white/10 bg-white/5 hover:bg-white/10"
                  }`}
                  key={item.id}
                  style={{ paddingLeft }}
                >
                  <button
                    className="min-w-0 flex-1 text-left"
                    onClick={() => onSelectFile(item.id)}
                    type="button"
                  >
                    <div className="flex items-center gap-2 truncate text-sm font-medium text-white">
                      <FileCode2 size={14} />
                      <span className="truncate">{getWorkspaceBaseName(item.path)}</span>
                    </div>
                    <div className="truncate text-xs text-slate-400">{formatWorkspacePath(item.path)}</div>
                  </button>
                  <button
                    className="rounded-full p-2 text-slate-400 transition hover:bg-white/10 hover:text-rose-300"
                    onClick={() => onDeleteFile(item.id)}
                    type="button"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })
          ) : (
            <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.03] px-4 py-4 text-sm text-slate-400">
              Import a folder or create files to populate the workspace tree.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
