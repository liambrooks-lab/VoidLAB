"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Download, Loader2, Menu, Play, Save, Sparkles } from "lucide-react";
import EditorTabs from "@/components/editor/EditorTabs";
import FileExplorer from "@/components/editor/FileExplorer";
import MonacoEditor from "@/components/editor/MonacoEditor";
import Sidebar from "@/components/editor/Sidebar";
import TerminalBox from "@/components/editor/TerminalBox";
import ToolLauncherBar from "@/components/editor/ToolLauncherBar";
import Brand from "@/components/layout/Brand";
import ThemeSwitcher from "@/components/layout/ThemeSwitcher";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/context/ThemeContext";
import { useUser } from "@/context/UserContext";
import { useCompiler } from "@/hooks/useCompiler";
import { useShortcuts } from "@/hooks/useShortcuts";
import {
  DEFAULT_LANGUAGE,
  getLanguageById,
  languageGroups,
} from "@/lib/languages";
import { openPreview } from "@/lib/preview";
import {
  buildStarterFile,
  defaultGitState,
  persistWorkspace,
  readWorkspace,
  replaceExtension,
  type ProjectFile,
  type GitHubState,
} from "@/lib/workspace";
import { useRouter } from "next/navigation";

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
  const [stdin, setStdin] = useState("");
  const { error, loading, output, runCode } = useCompiler();

  useEffect(() => {
    if (!isReady) return;

    if (!profile) {
      router.replace("/");
      return;
    }

    const workspace = readWorkspace();
    setFiles(workspace.files);
    setActiveFileId(workspace.activeFileId);
    setGitState(workspace.gitState);
  }, [isReady, profile, router]);

  const activeFile = files.find((file) => file.id === activeFileId) ?? files[0];
  const currentLanguage = getLanguageById(activeFile?.languageId ?? DEFAULT_LANGUAGE.id);

  useEffect(() => {
    if (!activeFile) return;
    setDraftLanguage(activeFile.languageId);
  }, [activeFile]);

  const persist = (
    nextFiles: ProjectFile[],
    nextActiveFileId: string,
    nextGitState: GitHubState = gitState,
  ) => {
    persistWorkspace(nextFiles, nextActiveFileId, nextGitState);
  };

  const handleSelectFile = (id: string) => {
    setActiveFileId(id);
    persist(files, id);
  };

  const handleCreateFile = () => {
    const selectedLanguage = getLanguageById(draftLanguage);
    const nextFile = buildStarterFile(selectedLanguage, draftFileName || "module");
    const nextFiles = [...files, nextFile];
    setFiles(nextFiles);
    setActiveFileId(nextFile.id);
    persist(nextFiles, nextFile.id);
    setDraftFileName(`module-${nextFiles.length + 1}`);
    setStatusMessage(`${nextFile.name} created.`);
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
    persist(nextFiles, nextActiveFileId);
    setStatusMessage("File closed.");
  };

  const handleLanguageChange = (nextLanguageId: string) => {
    if (!activeFile) return;

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
    persist(nextFiles, activeFile.id);
    setStatusMessage(`${selectedLanguage.label} ready.`);
  };

  const handleCodeChange = (value: string) => {
    if (!activeFile) return;

    const nextFiles = files.map((file) =>
      file.id === activeFile.id ? { ...file, content: value } : file,
    );
    setFiles(nextFiles);
    persist(nextFiles, activeFile.id);
  };

  const handleSave = () => {
    if (!activeFile) return;
    persist(files, activeFile.id);
    setStatusMessage("Workspace saved locally.");
  };

  const handleRun = async () => {
    if (!activeFile) return;

    if (currentLanguage.previewable) {
      try {
        openPreview(files, activeFile.id);
        setStatusMessage(`${currentLanguage.label} preview opened in a new tab.`);
      } catch (previewError) {
        setStatusMessage(
          previewError instanceof Error ? previewError.message : "Preview could not be opened.",
        );
      }
      return;
    }

    if (!currentLanguage.runnable) {
      setStatusMessage(`${currentLanguage.label} is editor-only in this release.`);
      return;
    }

    setStatusMessage(`Running ${currentLanguage.label}...`);
    const result = await runCode(currentLanguage, activeFile.content, stdin);
    setStatusMessage(
      result.ok
        ? `${currentLanguage.label} completed successfully.`
        : `Run failed for ${currentLanguage.label}.`,
    );
  };

  const handleDownload = () => {
    if (!activeFile) return;

    const blob = new Blob([activeFile.content], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = activeFile.name;
    anchor.click();
    URL.revokeObjectURL(url);
    setStatusMessage("Current file downloaded.");
  };

  useShortcuts({
    onEscape: () => setIsSidebarOpen(false),
    onNewFile: handleCreateFile,
    onRun: handleRun,
    onSave: handleSave,
  });

  if (!profile || !activeFile) return null;

  const firstName = profile.name.trim().split(/\s+/)[0] || "Builder";

  return (
    <main className="app-shell min-h-screen text-slate-100">
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/75 backdrop-blur-xl">
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
                <div className="text-sm text-slate-300">
                  Hi {firstName}, your cloud workspace is ready.
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <ThemeSwitcher />
              <div className="hidden rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-300 sm:flex sm:items-center sm:gap-2">
                <Sparkles size={14} className="text-sky-200" />
                {profile.region}
              </div>
              <Link
                className="inline-flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-slate-100 transition hover:bg-white/10"
                href="/"
              >
                Switch profile
              </Link>
            </div>
          </div>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <Sidebar
            currentLanguage={currentLanguage}
            isOpen={isSidebarOpen}
            profile={profile}
            shortcutItems={[
              { key: "Ctrl/Cmd + Enter", label: "Run current file" },
              { key: "Ctrl/Cmd + S", label: "Save workspace locally" },
              { key: "Ctrl/Cmd + Shift + N", label: "Create a new project file" },
              { key: "Esc", label: "Close mobile side panels" },
            ]}
          />

          <section className="flex min-w-0 flex-1 flex-col overflow-y-auto px-4 py-4 sm:px-6">
            <div className="flex flex-col gap-4">
              <ToolLauncherBar />

              <section className="panel overflow-hidden rounded-[28px]">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-4">
                  <div>
                    <div className="text-sm font-medium text-white">VoidLAB project workspace</div>
                    <div className="text-xs text-slate-300">
                      Active file: {activeFile.name} • {currentLanguage.label}
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      className="rounded-2xl border border-white/10 bg-slate-900 px-4 py-2 text-sm text-slate-100 outline-none transition focus:border-sky-300"
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
                    <Button onClick={handleSave} tone="secondary" type="button">
                      <Save size={15} />
                      Save
                    </Button>
                    <Button onClick={handleDownload} tone="secondary" type="button">
                      <Download size={15} />
                      Export
                    </Button>
                    <Button
                      disabled={loading || (!currentLanguage.runnable && !currentLanguage.previewable)}
                      onClick={() => void handleRun()}
                      type="button"
                    >
                      {loading ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
                      {loading
                        ? "Running"
                        : currentLanguage.previewable
                          ? "Preview"
                          : "Run"}
                    </Button>
                  </div>
                </div>

                <EditorTabs
                  activeFileId={activeFile.id}
                  files={files.map((file) => ({ id: file.id, name: file.name }))}
                  onCloseFile={handleDeleteFile}
                  onSelectFile={handleSelectFile}
                />

                <div className="grid min-h-[520px] md:grid-cols-[250px_minmax(0,1fr)]">
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
                  <div className="min-h-[420px]">
                    <MonacoEditor
                      language={currentLanguage.monacoLanguage}
                      onChange={handleCodeChange}
                      theme={editorTheme}
                      value={activeFile.content}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-white/10 px-4 py-3 text-xs text-slate-300">
                  <span>{statusMessage}</span>
                  <span>
                    {currentLanguage.runtimeLabel ??
                      (currentLanguage.previewable ? "Browser preview available" : "No runtime available")}
                  </span>
                </div>
              </section>

              <TerminalBox
                error={error}
                loading={loading}
                onInputChange={setStdin}
                onRun={() => void handleRun()}
                output={output}
                stdin={stdin}
              />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
