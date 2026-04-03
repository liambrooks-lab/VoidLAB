"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Download, FileCode2, Loader2, Menu, Play, Save, Sparkles } from "lucide-react";
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
import { DEFAULT_LANGUAGE, getLanguageByExtension, getLanguageById, languageGroups } from "@/lib/languages";
import { openPreview } from "@/lib/preview";
import {
  appendTerminalHistory,
  createFolderPath,
  createWorkspaceFile,
  executeWorkspaceCommand,
  formatWorkspacePath,
  getWorkspaceBaseName,
  getWorkspaceParentPath,
  normalizeWorkspacePath,
  normalizeWorkspaceState,
  persistWorkspace,
  readWorkspace,
  replaceExtension,
  resolveWorkspacePath,
  type ProjectFile,
  type WorkspaceState,
} from "@/lib/workspace";
import { useRouter } from "next/navigation";

const readBrowserFile = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(new Error(`Unable to read ${file.name}`));
    reader.readAsText(file);
  });

export default function EditorPage() {
  const router = useRouter();
  const { editorTheme } = useTheme();
  const { isReady, profile, recordActivity } = useUser();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [workspace, setWorkspace] = useState<WorkspaceState | null>(null);
  const [draftName, setDraftName] = useState("src/main");
  const [draftLanguage, setDraftLanguage] = useState(DEFAULT_LANGUAGE.id);
  const [statusMessage, setStatusMessage] = useState("Workspace initialized.");
  const [stdin, setStdin] = useState("");
  const [commandInput, setCommandInput] = useState("");
  const { error, execution, loading, runCode } = useCompiler();
  const fileImportRef = useRef<HTMLInputElement>(null);
  const folderImportRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    folderImportRef.current?.setAttribute("webkitdirectory", "");
    folderImportRef.current?.setAttribute("directory", "");
  }, []);

  useEffect(() => {
    if (!isReady) return;

    if (!profile) {
      router.replace("/");
      return;
    }

    setWorkspace(readWorkspace());
  }, [isReady, profile, router]);

  const persist = (nextWorkspace: WorkspaceState) => {
    const normalized = normalizeWorkspaceState(nextWorkspace);
    setWorkspace(normalized);
    persistWorkspace(normalized);
  };

  const activeFile = workspace?.files.find((file) => file.id === workspace.activeFileId) ?? workspace?.files[0];
  const currentLanguage = getLanguageById(activeFile?.languageId ?? DEFAULT_LANGUAGE.id);

  const codeLooksInputDriven = (languageId: string, code: string) => {
    const normalized = code.toLowerCase();

    switch (languageId) {
      case "cpp":
      case "c":
        return /cin\s*>>|scanf\s*\(|getline\s*\(/i.test(code);
      case "python":
        return /\binput\s*\(/i.test(code);
      case "java":
        return /scanner\s+\w+|nextline\s*\(|nextint\s*\(|bufferedreader/i.test(code);
      case "javascript":
      case "typescript":
        return /readline|process\.stdin|prompt\s*\(/i.test(code);
      case "csharp":
        return /console\.readline\s*\(/i.test(code);
      case "go":
        return /fmt\.scan|fmt\.scanln|bufio\.newscanner/i.test(code);
      case "rust":
        return /stdin\(\)|read_line\s*\(/i.test(code);
      case "php":
        return /readline\s*\(|fgets\s*\(stdin/i.test(normalized);
      case "ruby":
        return /gets\b|readline\b/i.test(code);
      case "swift":
        return /readline\s*\(/i.test(code);
      case "kotlin":
        return /readln\s*\(|readline\s*\(/i.test(code);
      case "bash":
        return /\bread\s+[-a-z ]*\w+/i.test(code);
      case "lua":
        return /io\.read\s*\(/i.test(code);
      default:
        return false;
    }
  };

  useEffect(() => {
    if (!activeFile) return;
    setDraftLanguage(activeFile.languageId);
  }, [activeFile]);

  const handleSelectFile = (id: string) => {
    if (!workspace) return;

    const nextWorkspace = {
      ...workspace,
      activeFileId: id,
    };

    persist(nextWorkspace);
  };

  const handleCreateFile = () => {
    if (!workspace) return;

    const nextFile = createWorkspaceFile(
      draftName || "main",
      draftLanguage,
      workspace.files,
      workspace.terminal.cwd,
    );

    const nextWorkspace = {
      ...workspace,
      activeFileId: nextFile.id,
      files: [...workspace.files, nextFile],
      folders: workspace.folders.includes(getWorkspaceParentPath(nextFile.path))
        ? workspace.folders
        : [
            ...workspace.folders,
            ...(() => {
              const parentPath = getWorkspaceParentPath(nextFile.path);
              return parentPath ? [parentPath] : [];
            })(),
          ],
    };

    persist(nextWorkspace);
    setDraftName(`src/module-${nextWorkspace.files.length + 1}`);
    setStatusMessage(`${formatWorkspacePath(nextFile.path)} created.`);
    recordActivity({
      detail: `Created ${formatWorkspacePath(nextFile.path)} in the workspace explorer.`,
      title: "File created",
      type: "workspace",
    });
  };

  const handleCreateFolder = () => {
    if (!workspace) return;

    const nextFolderPath = createFolderPath(draftName || "src", workspace.folders, workspace.files, workspace.terminal.cwd);

    if (!nextFolderPath) {
      setStatusMessage("Folder name is required.");
      return;
    }

    const nextWorkspace = {
      ...workspace,
      folders: [...workspace.folders, nextFolderPath],
    };

    persist(nextWorkspace);
    setStatusMessage(`${formatWorkspacePath(nextFolderPath)} folder created.`);
    recordActivity({
      detail: `Created folder ${formatWorkspacePath(nextFolderPath)}.`,
      title: "Folder created",
      type: "workspace",
    });
  };

  const handleDeleteFile = (id: string) => {
    if (!workspace) return;

    if (workspace.files.length === 1) {
      setStatusMessage("At least one file must stay open.");
      return;
    }

    const targetFile = workspace.files.find((file) => file.id === id);
    const nextFiles = workspace.files.filter((file) => file.id !== id);
    const nextActiveFileId =
      workspace.activeFileId === id ? nextFiles[Math.max(0, nextFiles.length - 1)].id : workspace.activeFileId;

    persist({
      ...workspace,
      activeFileId: nextActiveFileId,
      files: nextFiles,
    });

    if (targetFile) {
      setStatusMessage(`${formatWorkspacePath(targetFile.path)} removed.`);
      recordActivity({
        detail: `Removed ${formatWorkspacePath(targetFile.path)} from the workspace.`,
        title: "File removed",
        type: "workspace",
      });
    }
  };

  const handleDeleteFolder = (path: string) => {
    if (!workspace) return;

    const nextFiles = workspace.files.filter(
      (file) => file.path !== path && !file.path.startsWith(`${path}/`),
    );
    const nextFolders = workspace.folders.filter(
      (folder) => folder !== path && !folder.startsWith(`${path}/`),
    );
    const fallbackFile = nextFiles[0] ?? workspace.files[0];

    persist({
      ...workspace,
      activeFileId: nextFiles.some((file) => file.id === workspace.activeFileId)
        ? workspace.activeFileId
        : fallbackFile.id,
      files: nextFiles,
      folders: nextFolders,
    });

    setStatusMessage(`${formatWorkspacePath(path)} removed.`);
    recordActivity({
      detail: `Removed folder ${formatWorkspacePath(path)} and its nested entries.`,
      title: "Folder removed",
      type: "workspace",
    });
  };

  const handleLanguageChange = (nextLanguageId: string) => {
    if (!workspace || !activeFile) return;

    const selectedLanguage = getLanguageById(nextLanguageId);
    const nextFiles = workspace.files.map((file) =>
      file.id === activeFile.id
        ? {
            ...file,
            languageId: selectedLanguage.id,
            name: replaceExtension(file.name, selectedLanguage.extension),
            path: normalizeWorkspacePath(
              `${getWorkspaceParentPath(file.path) ? `${getWorkspaceParentPath(file.path)}/` : ""}${replaceExtension(file.name, selectedLanguage.extension)}`,
            ),
          }
        : file,
    );

    persist({
      ...workspace,
      files: nextFiles,
    });
    setStatusMessage(`${selectedLanguage.label} ready.`);
  };

  const handleCodeChange = (value: string) => {
    if (!workspace || !activeFile) return;

    persist({
      ...workspace,
      files: workspace.files.map((file) =>
        file.id === activeFile.id ? { ...file, content: value } : file,
      ),
    });
  };

  const handleSave = () => {
    if (!workspace || !activeFile) return;

    persist(workspace);
    setStatusMessage("Workspace saved locally.");
    recordActivity({
      detail: `Saved the workspace while focused on ${formatWorkspacePath(activeFile.path)}.`,
      title: "Workspace saved",
      type: "save",
    });
  };

  const handleRun = async () => {
    if (!workspace || !activeFile) return;

    if (currentLanguage.previewable) {
      try {
        openPreview(workspace.files, activeFile.id);
        setStatusMessage(`${currentLanguage.label} preview opened in a new tab.`);
        recordActivity({
          detail: `Opened a live preview for ${formatWorkspacePath(activeFile.path)}.`,
          title: "Preview opened",
          type: "run",
        });
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

    if (codeLooksInputDriven(currentLanguage.id, activeFile.content) && !stdin.trim()) {
      setStatusMessage("This code appears to require input. Add stdin in Program input before running.");
      return;
    }

    setStatusMessage(`Running ${currentLanguage.label}...`);
    const result = await runCode(currentLanguage, activeFile.content, stdin);
    const status = result.result?.status.description ?? (result.ok ? "Success" : "Failed");

    setStatusMessage(
      result.ok
        ? `${currentLanguage.label} completed successfully.`
        : `${currentLanguage.label} finished with ${status}.`,
    );
    recordActivity({
      detail: `Ran ${formatWorkspacePath(activeFile.path)} with status ${status}.`,
      title: result.ok ? "Program executed" : "Program run needs attention",
      type: "run",
    });
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

  const handleInsertBoilerplate = () => {
    if (!workspace || !activeFile) return;

    const template = currentLanguage.template;
    persist({
      ...workspace,
      files: workspace.files.map((file) =>
        file.id === activeFile.id ? { ...file, content: template } : file,
      ),
    });
    setStatusMessage(`${currentLanguage.label} boilerplate inserted.`);
    recordActivity({
      detail: `Inserted fresh ${currentLanguage.label} boilerplate into ${formatWorkspacePath(activeFile.path)}.`,
      title: "Boilerplate inserted",
      type: "workspace",
    });
  };

  const importWorkspaceFiles = async (fileList: FileList | null, preserveRelativePath: boolean) => {
    if (!workspace || !fileList?.length) return;

    const browserFiles = Array.from(fileList);
    const importedFiles = await Promise.all(
      browserFiles.map(async (file) => {
        const relativePath = preserveRelativePath
          ? normalizeWorkspacePath((file as File & { webkitRelativePath?: string }).webkitRelativePath || file.name)
          : normalizeWorkspacePath(file.name);
        const content = await readBrowserFile(file);
        const language = getLanguageByExtension(relativePath);

        return {
          content,
          id: `imported-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          languageId: language.id,
          name: getWorkspaceBaseName(relativePath),
          path: relativePath,
        } satisfies ProjectFile;
      }),
    );

    const existingByPath = new Map(workspace.files.map((file) => [file.path, file]));
    importedFiles.forEach((file) => {
      existingByPath.set(file.path, file);
    });

    const nextFolders = new Set(workspace.folders);
    importedFiles.forEach((file) => {
      const segments = getWorkspaceParentPath(file.path).split("/").filter(Boolean);
      const chain: string[] = [];

      segments.forEach((segment) => {
        chain.push(segment);
        nextFolders.add(chain.join("/"));
      });
    });

    const nextWorkspace = {
      ...workspace,
      activeFileId: importedFiles[0]?.id ?? workspace.activeFileId,
      files: Array.from(existingByPath.values()),
      folders: Array.from(nextFolders),
    };

    persist(nextWorkspace);
    setStatusMessage(`${importedFiles.length} file${importedFiles.length > 1 ? "s" : ""} imported.`);
    recordActivity({
      detail: `Imported ${importedFiles.length} file${importedFiles.length > 1 ? "s" : ""} into the workspace.`,
      title: "Files imported",
      type: "workspace",
    });
  };

  const handleImportFiles = async (event: ChangeEvent<HTMLInputElement>) => {
    await importWorkspaceFiles(event.target.files, false);
    event.target.value = "";
  };

  const handleImportFolder = async (event: ChangeEvent<HTMLInputElement>) => {
    await importWorkspaceFiles(event.target.files, true);
    event.target.value = "";
  };

  const handleCommandRun = () => {
    if (!workspace || !commandInput.trim()) return;

    const trimmed = commandInput.trim();
    const result = executeWorkspaceCommand(workspace, trimmed);
    const nextWorkspace = result.clearHistory
      ? result.workspace
      : appendTerminalHistory(result.workspace, trimmed, result.output, result.status, result.cwd);

    persist(nextWorkspace);

    if (result.openFileId) {
      setStatusMessage(`Opened ${formatWorkspacePath(nextWorkspace.files.find((file) => file.id === result.openFileId)?.path ?? "")}.`);
    } else {
      setStatusMessage(result.output.split("\n")[0] || "Command completed.");
    }

    setCommandInput("");
    recordActivity({
      detail: `Ran workspace command "${trimmed}" in ${formatWorkspacePath(result.cwd)}.`,
      title: "Workspace command",
      type: "command",
    });
  };

  useShortcuts({
    onEscape: () => setIsSidebarOpen(false),
    onNewFile: handleCreateFile,
    onRun: handleRun,
    onSave: handleSave,
  });

  if (!profile || !workspace || !activeFile) return null;

  const firstName = profile.name.trim().split(/\s+/)[0] || "Builder";

  return (
    <main className="app-shell min-h-screen text-slate-100">
      <input
        className="hidden"
        multiple
        onChange={(event) => void handleImportFiles(event)}
        ref={fileImportRef}
        type="file"
      />
      <input
        className="hidden"
        multiple
        onChange={(event) => void handleImportFolder(event)}
        ref={folderImportRef}
        type="file"
      />
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
                href="/editor/profile"
              >
                Profile
              </Link>
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
                      Active file: {formatWorkspacePath(activeFile.path)} • {currentLanguage.label}
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
                    <Button onClick={handleInsertBoilerplate} tone="secondary" type="button">
                      <FileCode2 size={15} />
                      Boilerplate
                    </Button>
                    <Button
                      disabled={loading || (!currentLanguage.runnable && !currentLanguage.previewable)}
                      onClick={() => void handleRun()}
                      type="button"
                    >
                      {loading ? <Loader2 size={15} className="animate-spin" /> : <Play size={15} />}
                      {loading ? "Running" : currentLanguage.previewable ? "Preview" : "Run"}
                    </Button>
                  </div>
                </div>

                <EditorTabs
                  activeFileId={activeFile.id}
                  files={workspace.files.map((file) => ({ id: file.id, name: file.name, path: file.path }))}
                  onCloseFile={handleDeleteFile}
                  onSelectFile={handleSelectFile}
                />

                <div className="grid min-h-[520px] md:grid-cols-[300px_minmax(0,1fr)]">
                  <FileExplorer
                    activeFileId={activeFile.id}
                    cwd={workspace.terminal.cwd}
                    draftLanguage={draftLanguage}
                    draftName={draftName}
                    files={workspace.files}
                    folders={workspace.folders}
                    onCreateFile={handleCreateFile}
                    onCreateFolder={handleCreateFolder}
                    onDeleteFile={handleDeleteFile}
                    onDeleteFolder={handleDeleteFolder}
                    onDraftLanguageChange={setDraftLanguage}
                    onDraftNameChange={setDraftName}
                    onImportFiles={() => fileImportRef.current?.click()}
                    onImportFolder={() => folderImportRef.current?.click()}
                    onSelectFile={handleSelectFile}
                  />
                  <div className="min-h-[420px]">
                    <MonacoEditor
                      language={currentLanguage.monacoLanguage}
                      onChange={handleCodeChange}
                      path={activeFile.path}
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
                commandHistory={workspace.terminal.history}
                commandInput={commandInput}
                cwd={workspace.terminal.cwd}
                error={error}
                execution={execution}
                loading={loading}
                onCommandChange={setCommandInput}
                onCommandRun={handleCommandRun}
                onInputChange={setStdin}
                onRun={() => void handleRun()}
                stdin={stdin}
              />
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
