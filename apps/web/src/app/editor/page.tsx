"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Download, Loader2, Menu, Play, Save, Sparkles } from "lucide-react";
import EditorTabs from "@/components/editor/EditorTabs";
import FileExplorer from "@/components/editor/FileExplorer";
import GitHubPanel from "@/components/editor/GitHubPanel";
import ManualPanel from "@/components/editor/ManualPanel";
import MonacoEditor from "@/components/editor/MonacoEditor";
import Brand from "@/components/layout/Brand";
import Sidebar from "@/components/editor/Sidebar";
import TerminalBox from "@/components/editor/TerminalBox";
import ThemeSwitcher from "@/components/layout/ThemeSwitcher";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/context/ThemeContext";
import { useUser } from "@/context/UserContext";
import { useCompiler } from "@/hooks/useCompiler";
import { useShortcuts } from "@/hooks/useShortcuts";
import {
  DEFAULT_LANGUAGE,
  LanguageOption,
  getLanguageById,
  languageGroups,
} from "@/lib/languages";

const workspaceStorageKey = "voidlab-workspace";

type ProjectFile = {
  content: string;
  id: string;
  languageId: string;
  name: string;
};

type GitHubState = {
  branch: string;
  repoUrl: string;
  visibility: "public" | "private";
};

type WorkspaceState = {
  activeFileId: string;
  files: ProjectFile[];
  gitState: GitHubState;
};

const defaultGitState: GitHubState = {
  branch: "main",
  repoUrl: "",
  visibility: "public",
};

const createFileId = () =>
  `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const withExtension = (baseName: string, extension: string) => {
  const trimmed = baseName.trim().replace(/\s+/g, "-").replace(/[^\w.-]/g, "");
  const safeBase = trimmed || "untitled";
  return safeBase.includes(".") ? safeBase : `${safeBase}.${extension}`;
};

const replaceExtension = (name: string, extension: string) => {
  const index = name.lastIndexOf(".");
  const base = index > 0 ? name.slice(0, index) : name;
  return `${base}.${extension}`;
};

const buildStarterFile = (language: LanguageOption, name = "main"): ProjectFile => ({
  content: language.template,
  id: createFileId(),
  languageId: language.id,
  name: withExtension(name, language.extension),
});

const fromLegacyWorkspace = (parsed: {
  drafts?: Record<string, string>;
  language?: string;
}): WorkspaceState => {
  const draftEntries = Object.entries(parsed.drafts ?? {});
  const files =
    draftEntries.length > 0
      ? draftEntries.map(([languageId, content], index) => {
          const language = getLanguageById(languageId);
          return {
            content,
            id: createFileId(),
            languageId,
            name: withExtension(index === 0 ? "main" : language.label.toLowerCase(), language.extension),
          };
        })
      : [buildStarterFile(DEFAULT_LANGUAGE)];

  const activeFile =
    files.find((file) => file.languageId === parsed.language) ?? files[0];

  return {
    activeFileId: activeFile.id,
    files,
    gitState: defaultGitState,
  };
};

export default function EditorPage() {
  const router = useRouter();
  const { editorTheme } = useTheme();
  const { isReady, profile } = useUser();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [files, setFiles] = useState<ProjectFile[]>([buildStarterFile(DEFAULT_LANGUAGE)]);
  const [activeFileId, setActiveFileId] = useState("");
  const [draftFileName, setDraftFileName] = useState("module");
  const [draftLanguage, setDraftLanguage] = useState(DEFAULT_LANGUAGE.id);
  const [gitState, setGitState] = useState<GitHubState>(defaultGitState);
  const [statusMessage, setStatusMessage] = useState("Workspace initialized.");
  const [copied, setCopied] = useState(false);
  const { error, loading, output, runCode } = useCompiler();

  useEffect(() => {
    if (!isReady) return;
    if (!profile) {
      router.replace("/");
      return;
    }

    const raw = window.localStorage.getItem(workspaceStorageKey);
    if (!raw) {
      const starterFile = buildStarterFile(DEFAULT_LANGUAGE);
      setFiles([starterFile]);
      setActiveFileId(starterFile.id);
      return;
    }

    try {
      const parsed = JSON.parse(raw) as WorkspaceState & {
        drafts?: Record<string, string>;
        language?: string;
      };

      if ("drafts" in parsed) {
        const migrated = fromLegacyWorkspace(parsed);
        setFiles(migrated.files);
        setActiveFileId(migrated.activeFileId);
        setGitState(migrated.gitState);
        return;
      }

      setFiles(parsed.files.length ? parsed.files : [buildStarterFile(DEFAULT_LANGUAGE)]);
      setActiveFileId(parsed.activeFileId || parsed.files[0]?.id || "");
      setGitState(parsed.gitState ?? defaultGitState);
    } catch {
      const starterFile = buildStarterFile(DEFAULT_LANGUAGE);
      setFiles([starterFile]);
      setActiveFileId(starterFile.id);
    }
  }, [isReady, profile, router]);

  const persistWorkspace = (
    nextFiles: ProjectFile[],
    nextActiveFileId: string,
    nextGitState: GitHubState = gitState,
  ) => {
    window.localStorage.setItem(
      workspaceStorageKey,
      JSON.stringify({
        activeFileId: nextActiveFileId,
        files: nextFiles,
        gitState: nextGitState,
      } satisfies WorkspaceState),
    );
  };

  const activeFile = files.find((file) => file.id === activeFileId) ?? files[0];
  const currentLanguage = getLanguageById(activeFile?.languageId ?? DEFAULT_LANGUAGE.id);

  useEffect(() => {
    if (!activeFile) return;
    setDraftLanguage(activeFile.languageId);
  }, [activeFile]);

  const handleSelectFile = (id: string) => {
    setActiveFileId(id);
    persistWorkspace(files, id);
  };

  const handleCreateFile = () => {
    const selectedLanguage = getLanguageById(draftLanguage);
    const nextFile = buildStarterFile(selectedLanguage, draftFileName || "module");
    const adjustedFile = {
      ...nextFile,
      name: withExtension(draftFileName || "module", selectedLanguage.extension),
    };
    const nextFiles = [...files, adjustedFile];
    setFiles(nextFiles);
    setActiveFileId(adjustedFile.id);
    persistWorkspace(nextFiles, adjustedFile.id);
    setDraftFileName(`module-${nextFiles.length + 1}`);
    setStatusMessage(`${adjustedFile.name} created.`);
  };

  const handleDeleteFile = (id: string) => {
    if (files.length === 1) {
      setStatusMessage("At least one file must stay open.");
      return;
    }

    const nextFiles = files.filter((file) => file.id !== id);
    const nextActiveFileId =
      activeFileId === id ? nextFiles[Math.max(0, nextFiles.length - 1)].id : activeFileId;

    setFiles(nextFiles);
    setActiveFileId(nextActiveFileId);
    persistWorkspace(nextFiles, nextActiveFileId);
    setStatusMessage("File closed.");
  };

  const handleLanguageChange = (nextLanguageId: string) => {
    const selectedLanguage = getLanguageById(nextLanguageId);
    const nextFiles = files.map((file) =>
      file.id === activeFile.id
        ? {
            ...file,
            languageId: selectedLanguage.id,
            name: replaceExtension(file.name, selectedLanguage.extension),
          }
        : file,
    );

    setFiles(nextFiles);
    persistWorkspace(nextFiles, activeFile.id);
    setStatusMessage(`${selectedLanguage.label} ready.`);
  };

  const handleCodeChange = (value: string) => {
    const nextFiles = files.map((file) =>
      file.id === activeFile.id ? { ...file, content: value } : file,
    );
    setFiles(nextFiles);
    persistWorkspace(nextFiles, activeFile.id);
  };

  const handleSave = () => {
    persistWorkspace(files, activeFile.id);
    setStatusMessage("Workspace saved locally.");
  };

  const handleRun = async () => {
    if (!currentLanguage.runnable) {
      setStatusMessage(`${currentLanguage.label} is editor-only in this release.`);
      return;
    }

    setStatusMessage(`Running ${currentLanguage.label}...`);
    const result = await runCode(currentLanguage, activeFile.content);
    setStatusMessage(
      result.ok
        ? `${currentLanguage.label} completed successfully.`
        : `Run failed for ${currentLanguage.label}.`,
    );
  };

  const handleDownload = () => {
    const blob = new Blob([activeFile.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = activeFile.name;
    anchor.click();
    URL.revokeObjectURL(url);
    setStatusMessage("Current file downloaded.");
  };

  const handleGitFieldChange = (field: keyof GitHubState, value: string) => {
    const nextGitState = {
      ...gitState,
      [field]: value,
    } as GitHubState;
    setGitState(nextGitState);
    persistWorkspace(files, activeFile.id, nextGitState);
  };

  const gitCommands = useMemo(() => {
    const repoLine = gitState.repoUrl
      ? `git remote add origin ${gitState.repoUrl}\ngit push -u origin ${gitState.branch || "main"}`
      : "# Add your GitHub repo URL above to generate the final push commands";

    return [
      "git init",
      `git checkout -b ${gitState.branch || "main"}`,
      "git add .",
      'git commit -m "Initialize VoidLAB project"',
      repoLine,
    ].join("\n");
  }, [gitState.branch, gitState.repoUrl]);

  const handleCopyGitCommands = async () => {
    try {
      await navigator.clipboard.writeText(gitCommands);
      setCopied(true);
      setStatusMessage("Git commands copied.");
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      setStatusMessage("Clipboard permission is unavailable in this browser session.");
    }
  };

  useShortcuts({
    onEscape: () => setIsSidebarOpen(false),
    onNewFile: handleCreateFile,
    onRun: handleRun,
    onSave: handleSave,
  });

  const shortcutItems = useMemo(
    () => [
      { key: "Ctrl/Cmd + Enter", label: "Run current file" },
      { key: "Ctrl/Cmd + S", label: "Save workspace locally" },
      { key: "Ctrl/Cmd + Shift + N", label: "Create a new project file" },
      { key: "Esc", label: "Close mobile side panels" },
    ],
    [],
  );

  if (!profile || !activeFile) return null;

  const firstName = profile.name.trim().split(/\s+/)[0] || "Builder";

  return (
    <main className="app-shell min-h-screen text-slate-100">
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/80 backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                className="rounded-xl border border-white/10 bg-white/5 p-2 text-slate-300 lg:hidden"
                onClick={() => setIsSidebarOpen((value) => !value)}
                type="button"
              >
                <Menu size={18} />
              </button>
              <div className="space-y-1">
                <Brand compact />
                <div className="text-sm text-slate-400">
                  Hi {firstName}, your cloud workspace is ready.
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <ThemeSwitcher />
              <div className="hidden rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 sm:flex sm:items-center sm:gap-2">
                <Sparkles size={14} className="text-amber-300" />
                {profile.region}
              </div>
              <select
                className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-2 text-sm text-slate-100 outline-none transition focus:border-teal-400"
                onChange={(event) => handleLanguageChange(event.target.value)}
                value={currentLanguage.id}
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
              <Button onClick={handleSave} tone="secondary">
                <Save size={15} />
                Save
              </Button>
              <Button onClick={handleDownload} tone="secondary">
                <Download size={15} />
                Export
              </Button>
              <Button disabled={loading || !currentLanguage.runnable} onClick={handleRun}>
                {loading ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
                {loading ? "Running" : "Run"}
              </Button>
            </div>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            currentLanguage={currentLanguage}
            isOpen={isSidebarOpen}
            profile={profile}
            shortcutItems={shortcutItems}
          />

          <section className="flex min-w-0 flex-1 flex-col">
            <div className="grid gap-4 px-4 py-4 sm:px-6 xl:grid-cols-[minmax(0,1fr)_360px]">
              <div className="panel min-h-[60vh] overflow-hidden rounded-[28px]">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3">
                  <div>
                    <div className="text-sm font-medium text-white">VoidLAB project workspace</div>
                    <div className="text-xs text-slate-400">
                      Active file: {activeFile.name} • {currentLanguage.label}
                    </div>
                  </div>
                  <div className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs uppercase tracking-[0.24em] text-slate-300">
                    {currentLanguage.runnable ? "Runnable" : "Editor only"}
                  </div>
                </div>

                <EditorTabs
                  activeFileId={activeFile.id}
                  files={files.map((file) => ({ id: file.id, name: file.name }))}
                  onCloseFile={handleDeleteFile}
                  onSelectFile={handleSelectFile}
                />

                <div className="grid h-[56vh] min-h-[420px] grid-cols-[260px_minmax(0,1fr)]">
                  <FileExplorer
                    activeFileId={activeFile.id}
                    draftLanguage={draftLanguage}
                    draftName={draftFileName}
                    files={files}
                    onCreateFile={handleCreateFile}
                    onDeleteFile={handleDeleteFile}
                    onDraftLanguageChange={setDraftLanguage}
                    onDraftNameChange={setDraftFileName}
                    onSelectFile={handleSelectFile}
                  />
                  <MonacoEditor
                    language={currentLanguage.monacoLanguage}
                    onChange={handleCodeChange}
                    theme={editorTheme}
                    value={activeFile.content}
                  />
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 px-4 py-3 text-xs text-slate-400">
                  <span>{statusMessage}</span>
                  <span>{currentLanguage.runtimeLabel ?? "No runtime available"}</span>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <ManualPanel />
                <GitHubPanel
                  commands={gitCommands}
                  copied={copied}
                  fileCount={files.length}
                  gitState={gitState}
                  onCopy={handleCopyGitCommands}
                  onFieldChange={handleGitFieldChange}
                />
                <TerminalBox error={error} loading={loading} output={output} />
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
