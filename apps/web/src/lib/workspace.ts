import { DEFAULT_LANGUAGE, LanguageOption, getLanguageByExtension, getLanguageById } from "@/lib/languages";

export const workspaceStorageKey = "voidlab-workspace";

export type ProjectFile = {
  content: string;
  id: string;
  languageId: string;
  name: string;
  path: string;
};

export type GitHubState = {
  branch: string;
  repoUrl: string;
  visibility: "private" | "public";
};

export type TerminalHistoryEntry = {
  command: string;
  createdAt: string;
  cwd: string;
  id: string;
  output: string;
  status: "error" | "info" | "success";
};

export type TerminalState = {
  cwd: string;
  history: TerminalHistoryEntry[];
};

export type WorkspaceState = {
  activeFileId: string;
  files: ProjectFile[];
  folders: string[];
  gitState: GitHubState;
  terminal: TerminalState;
};

export type WorkspaceCommandResult = {
  clearHistory?: boolean;
  cwd: string;
  openFileId?: string;
  output: string;
  status: "error" | "info" | "success";
  workspace: WorkspaceState;
};

export const defaultGitState: GitHubState = {
  branch: "main",
  repoUrl: "",
  visibility: "public",
};

export const defaultTerminalState: TerminalState = {
  cwd: "",
  history: [],
};

export const createFileId = () =>
  `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const createHistoryId = () =>
  `terminal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

const createSafeName = (value: string) =>
  value.trim().replace(/\s+/g, "-").replace(/[^\w./-]/g, "");

const splitPath = (value: string) =>
  value
    .replaceAll("\\", "/")
    .split("/")
    .map((segment) => segment.trim())
    .filter(Boolean);

export const normalizeWorkspacePath = (value: string) => {
  const parts: string[] = [];

  splitPath(value).forEach((segment) => {
    if (segment === ".") return;
    if (segment === "..") {
      parts.pop();
      return;
    }

    parts.push(segment);
  });

  return parts.join("/");
};

export const formatWorkspacePath = (value: string) => {
  const normalized = normalizeWorkspacePath(value);
  return normalized ? `/${normalized}` : "/";
};

export const getWorkspaceParentPath = (value: string) => {
  const normalized = normalizeWorkspacePath(value);

  if (!normalized) return "";

  const segments = normalized.split("/");
  segments.pop();
  return segments.join("/");
};

export const getWorkspaceBaseName = (value: string) => {
  const normalized = normalizeWorkspacePath(value);
  return normalized.split("/").pop() ?? "";
};

export const joinWorkspacePath = (...parts: string[]) =>
  normalizeWorkspacePath(parts.filter(Boolean).join("/"));

export const resolveWorkspacePath = (cwd: string, target: string) => {
  const trimmed = target.trim();

  if (!trimmed) return normalizeWorkspacePath(cwd);
  if (trimmed.startsWith("/")) return normalizeWorkspacePath(trimmed);

  return joinWorkspacePath(cwd, trimmed);
};

export const withExtension = (baseName: string, extension: string) => {
  const safeBase = createSafeName(baseName) || "untitled";
  return safeBase.includes(".") ? safeBase : `${safeBase}.${extension}`;
};

export const replaceExtension = (name: string, extension: string) => {
  const index = name.lastIndexOf(".");
  const base = index > 0 ? name.slice(0, index) : name;
  return `${base}.${extension}`;
};

const makeUniquePath = (desiredPath: string, existingPaths: string[]) => {
  const normalized = normalizeWorkspacePath(desiredPath);
  const existing = new Set(existingPaths.map((item) => normalizeWorkspacePath(item)));

  if (!existing.has(normalized)) return normalized;

  const baseName = getWorkspaceBaseName(normalized);
  const parentPath = getWorkspaceParentPath(normalized);
  const dotIndex = baseName.lastIndexOf(".");
  const stem = dotIndex > 0 ? baseName.slice(0, dotIndex) : baseName;
  const extension = dotIndex > 0 ? baseName.slice(dotIndex) : "";

  let counter = 2;
  let nextPath = normalized;

  while (existing.has(nextPath)) {
    nextPath = joinWorkspacePath(parentPath, `${stem}-${counter}${extension}`);
    counter += 1;
  }

  return nextPath;
};

const ensureFolderChain = (folders: string[], value: string) => {
  const normalized = normalizeWorkspacePath(value);

  if (!normalized) return folders;

  const nextFolders = new Set(folders.map((item) => normalizeWorkspacePath(item)).filter(Boolean));
  const segments = normalized.split("/");

  for (let index = 1; index <= segments.length; index += 1) {
    nextFolders.add(segments.slice(0, index).join("/"));
  }

  return Array.from(nextFolders).sort((left, right) => left.localeCompare(right));
};

const dedupeFiles = (files: ProjectFile[]) => {
  const seen = new Set<string>();

  return files
    .map((file) => {
      const normalizedPath = makeUniquePath(file.path || file.name, Array.from(seen));
      seen.add(normalizedPath);

      return {
        ...file,
        languageId: getLanguageById(file.languageId).id,
        name: getWorkspaceBaseName(normalizedPath),
        path: normalizedPath,
      };
    })
    .sort((left, right) => left.path.localeCompare(right.path));
};

const normalizeFolders = (folders: string[], files: ProjectFile[]) => {
  const nextFolders = folders.reduce<string[]>(
    (allFolders, folder) => ensureFolderChain(allFolders, folder),
    [],
  );

  return files.reduce<string[]>(
    (allFolders, file) => ensureFolderChain(allFolders, getWorkspaceParentPath(file.path)),
    nextFolders,
  );
};

export const buildStarterFile = (
  language: LanguageOption,
  value = "main",
  cwd = "",
): ProjectFile => {
  const suggestedName = withExtension(getWorkspaceBaseName(value) || value, language.extension);
  const path = resolveWorkspacePath(cwd, joinWorkspacePath(getWorkspaceParentPath(value), suggestedName));

  return {
    content: language.template,
    id: createFileId(),
    languageId: language.id,
    name: getWorkspaceBaseName(path),
    path,
  };
};

const createDefaultWorkspace = (): WorkspaceState => {
  const starterFile = buildStarterFile(DEFAULT_LANGUAGE);

  return {
    activeFileId: starterFile.id,
    files: [starterFile],
    folders: [],
    gitState: defaultGitState,
    terminal: defaultTerminalState,
  };
};

export const createFolderPath = (
  desiredPath: string,
  existingFolders: string[],
  existingFiles: ProjectFile[],
  cwd = "",
) => {
  const normalized = resolveWorkspacePath(cwd, desiredPath);

  if (!normalized) return "";

  const occupied = [
    ...existingFolders,
    ...existingFiles.map((file) => file.path),
  ];

  return makeUniquePath(normalized, occupied);
};

export const createWorkspaceFile = (
  desiredPath: string,
  languageId: string,
  existingFiles: ProjectFile[],
  cwd = "",
) => {
  const language = getLanguageById(languageId);
  const targetPath = resolveWorkspacePath(cwd, desiredPath);
  const nextPath = makeUniquePath(
    withExtension(targetPath || "main", language.extension),
    existingFiles.map((file) => file.path),
  );

  return {
    content: language.template,
    id: createFileId(),
    languageId: language.id,
    name: getWorkspaceBaseName(nextPath),
    path: nextPath,
  } satisfies ProjectFile;
};

export const normalizeWorkspaceState = (workspace: WorkspaceState): WorkspaceState => {
  const files = dedupeFiles(workspace.files.length ? workspace.files : [buildStarterFile(DEFAULT_LANGUAGE)]);
  const folders = normalizeFolders(workspace.folders ?? [], files);
  const activeFileId = files.some((file) => file.id === workspace.activeFileId)
    ? workspace.activeFileId
    : files[0].id;

  return {
    activeFileId,
    files,
    folders,
    gitState: workspace.gitState ?? defaultGitState,
    terminal: {
      cwd: normalizeWorkspacePath(workspace.terminal?.cwd ?? ""),
      history: Array.isArray(workspace.terminal?.history) ? workspace.terminal.history.slice(-60) : [],
    },
  };
};

export const fromLegacyWorkspace = (parsed: {
  drafts?: Record<string, string>;
  files?: ProjectFile[];
  language?: string;
}): WorkspaceState => {
  const draftEntries = Object.entries(parsed.drafts ?? {});
  const files =
    draftEntries.length > 0
      ? draftEntries.map(([languageId, content], index) => {
          const language = getLanguageById(languageId);
          const path = withExtension(index === 0 ? "main" : language.label.toLowerCase(), language.extension);

          return {
            content,
            id: createFileId(),
            languageId: language.id,
            name: path,
            path,
          };
        })
      : [buildStarterFile(DEFAULT_LANGUAGE)];

  const activeFile = files.find((file) => file.languageId === parsed.language) ?? files[0];

  return normalizeWorkspaceState({
    activeFileId: activeFile.id,
    files,
    folders: [],
    gitState: defaultGitState,
    terminal: defaultTerminalState,
  });
};

export const readWorkspace = (): WorkspaceState => {
  const raw = window.localStorage.getItem(workspaceStorageKey);

  if (!raw) {
    return createDefaultWorkspace();
  }

  try {
    const parsed = JSON.parse(raw) as WorkspaceState & {
      drafts?: Record<string, string>;
      files?: Array<ProjectFile & { path?: string }>;
      folders?: string[];
      language?: string;
      terminal?: TerminalState;
    };

    if ("drafts" in parsed) {
      return fromLegacyWorkspace(parsed);
    }

    const files =
      parsed.files?.map((file) => {
        const path = normalizeWorkspacePath(file.path || file.name);

        return {
          ...file,
          languageId: getLanguageById(file.languageId).id,
          name: getWorkspaceBaseName(path) || file.name,
          path,
        };
      }) ?? [];

    return normalizeWorkspaceState({
      activeFileId: parsed.activeFileId,
      files,
      folders: parsed.folders ?? [],
      gitState: parsed.gitState ?? defaultGitState,
      terminal: parsed.terminal ?? defaultTerminalState,
    });
  } catch {
    return createDefaultWorkspace();
  }
};

export const persistWorkspace = (workspace: WorkspaceState) => {
  window.localStorage.setItem(
    workspaceStorageKey,
    JSON.stringify(normalizeWorkspaceState(workspace)),
  );
};

const findFileByPath = (workspace: WorkspaceState, value: string) => {
  const path = resolveWorkspacePath(workspace.terminal.cwd, value);
  return workspace.files.find((file) => file.path === path);
};

const folderExists = (workspace: WorkspaceState, value: string) => {
  const target = resolveWorkspacePath(workspace.terminal.cwd, value);

  return target === "" || workspace.folders.includes(target);
};

const listDirectory = (workspace: WorkspaceState, value?: string) => {
  const target = resolveWorkspacePath(workspace.terminal.cwd, value ?? "");

  if (target && !folderExists(workspace, target)) {
    return {
      output: `ls: cannot access '${value}': no such directory`,
      status: "error" as const,
    };
  }

  const folderNames = workspace.folders
    .filter((folder) => getWorkspaceParentPath(folder) === target)
    .map((folder) => `${getWorkspaceBaseName(folder)}/`);

  const fileNames = workspace.files
    .filter((file) => getWorkspaceParentPath(file.path) === target)
    .map((file) => file.name);

  const items = [...folderNames, ...fileNames].sort((left, right) => left.localeCompare(right));

  return {
    output: items.length ? items.join("\n") : "(empty)",
    status: "success" as const,
  };
};

const renderTree = (workspace: WorkspaceState, folder = "", depth = 0): string[] => {
  const prefix = depth > 0 ? `${"  ".repeat(depth - 1)}- ` : "";
  const folderLines = workspace.folders
    .filter((item) => getWorkspaceParentPath(item) === folder)
    .flatMap((item) => [
      `${prefix}${getWorkspaceBaseName(item)}/`,
      ...renderTree(workspace, item, depth + 1),
    ]);

  const fileLines = workspace.files
    .filter((item) => getWorkspaceParentPath(item.path) === folder)
    .map((item) => `${prefix}${item.name}`);

  return [...folderLines, ...fileLines];
};

const tokenizeCommand = (value: string) =>
  Array.from(value.matchAll(/"([^"]*)"|'([^']*)'|`([^`]*)`|([^\s]+)/g)).map(
    (match) => match[1] ?? match[2] ?? match[3] ?? match[4] ?? "",
  );

const createTerminalEntry = (
  command: string,
  cwd: string,
  output: string,
  status: TerminalHistoryEntry["status"],
): TerminalHistoryEntry => ({
  command,
  createdAt: new Date().toISOString(),
  cwd,
  id: createHistoryId(),
  output,
  status,
});

export const appendTerminalHistory = (
  workspace: WorkspaceState,
  command: string,
  output: string,
  status: TerminalHistoryEntry["status"],
  cwd = workspace.terminal.cwd,
) => ({
  ...workspace,
  terminal: {
    cwd,
    history: [...workspace.terminal.history, createTerminalEntry(command, cwd, output, status)].slice(-60),
  },
});

export const executeWorkspaceCommand = (
  workspace: WorkspaceState,
  rawCommand: string,
): WorkspaceCommandResult => {
  const trimmed = rawCommand.trim();

  if (!trimmed) {
    return {
      cwd: workspace.terminal.cwd,
      output: "Type a workspace command such as ls, tree, mkdir src, touch src/main.py, open src/main.py, or pwd.",
      status: "info",
      workspace,
    };
  }

  const [command, ...args] = tokenizeCommand(trimmed);

  switch (command) {
    case "help":
      return {
        cwd: workspace.terminal.cwd,
        output:
          "Available commands:\nhelp\npwd\nls [path]\ntree [path]\ncd <path>\nmkdir <path>\ntouch <path>\nopen <path>\ncat <path>\nrm <path>\nclear",
        status: "info",
        workspace,
      };
    case "pwd":
      return {
        cwd: workspace.terminal.cwd,
        output: formatWorkspacePath(workspace.terminal.cwd),
        status: "success",
        workspace,
      };
    case "ls": {
      const result = listDirectory(workspace, args[0]);
      return {
        cwd: workspace.terminal.cwd,
        output: result.output,
        status: result.status,
        workspace,
      };
    }
    case "tree": {
      const target = resolveWorkspacePath(workspace.terminal.cwd, args[0] ?? "");

      if (target && !folderExists(workspace, target)) {
        return {
          cwd: workspace.terminal.cwd,
          output: `tree: '${args[0]}' does not exist`,
          status: "error",
          workspace,
        };
      }

      const lines = renderTree(workspace, target);
      return {
        cwd: workspace.terminal.cwd,
        output: lines.length ? lines.join("\n") : "(empty)",
        status: "success",
        workspace,
      };
    }
    case "cd": {
      const target = resolveWorkspacePath(workspace.terminal.cwd, args[0] ?? "");

      if (!folderExists(workspace, target)) {
        return {
          cwd: workspace.terminal.cwd,
          output: `cd: ${args[0] ?? ""}: no such directory`,
          status: "error",
          workspace,
        };
      }

      return {
        cwd: target,
        output: `Moved to ${formatWorkspacePath(target)}`,
        status: "success",
        workspace: {
          ...workspace,
          terminal: {
            ...workspace.terminal,
            cwd: target,
          },
        },
      };
    }
    case "mkdir": {
      if (!args[0]) {
        return {
          cwd: workspace.terminal.cwd,
          output: "mkdir: folder path is required",
          status: "error",
          workspace,
        };
      }

      const folderPath = createFolderPath(args[0], workspace.folders, workspace.files, workspace.terminal.cwd);
      const nextWorkspace = normalizeWorkspaceState({
        ...workspace,
        folders: ensureFolderChain(workspace.folders, folderPath),
      });

      return {
        cwd: nextWorkspace.terminal.cwd,
        output: `Created folder ${formatWorkspacePath(folderPath)}`,
        status: "success",
        workspace: nextWorkspace,
      };
    }
    case "touch": {
      if (!args[0]) {
        return {
          cwd: workspace.terminal.cwd,
          output: "touch: file path is required",
          status: "error",
          workspace,
        };
      }

      const targetPath = resolveWorkspacePath(workspace.terminal.cwd, args[0]);
      const language = getLanguageByExtension(targetPath);
      const nextFile = createWorkspaceFile(targetPath, language.id, workspace.files, "");
      const nextWorkspace = normalizeWorkspaceState({
        ...workspace,
        activeFileId: nextFile.id,
        files: [...workspace.files, nextFile],
        folders: ensureFolderChain(workspace.folders, getWorkspaceParentPath(nextFile.path)),
      });

      return {
        cwd: nextWorkspace.terminal.cwd,
        openFileId: nextFile.id,
        output: `Created file ${formatWorkspacePath(nextFile.path)}`,
        status: "success",
        workspace: nextWorkspace,
      };
    }
    case "open": {
      const file = findFileByPath(workspace, args[0] ?? "");

      if (!file) {
        return {
          cwd: workspace.terminal.cwd,
          output: `open: ${args[0] ?? ""}: file not found`,
          status: "error",
          workspace,
        };
      }

      return {
        cwd: workspace.terminal.cwd,
        openFileId: file.id,
        output: `Opened ${formatWorkspacePath(file.path)}`,
        status: "success",
        workspace: {
          ...workspace,
          activeFileId: file.id,
        },
      };
    }
    case "cat": {
      const file = findFileByPath(workspace, args[0] ?? "");

      if (!file) {
        return {
          cwd: workspace.terminal.cwd,
          output: `cat: ${args[0] ?? ""}: file not found`,
          status: "error",
          workspace,
        };
      }

      return {
        cwd: workspace.terminal.cwd,
        output: file.content || "(empty file)",
        status: "success",
        workspace,
      };
    }
    case "rm": {
      if (!args[0]) {
        return {
          cwd: workspace.terminal.cwd,
          output: "rm: target path is required",
          status: "error",
          workspace,
        };
      }

      const targetPath = resolveWorkspacePath(workspace.terminal.cwd, args[0]);
      const nextFiles = workspace.files.filter(
        (file) => file.path !== targetPath && !file.path.startsWith(`${targetPath}/`),
      );
      const nextFolders = workspace.folders.filter(
        (folder) => folder !== targetPath && !folder.startsWith(`${targetPath}/`),
      );

      if (nextFiles.length === workspace.files.length && nextFolders.length === workspace.folders.length) {
        return {
          cwd: workspace.terminal.cwd,
          output: `rm: ${args[0]}: target not found`,
          status: "error",
          workspace,
        };
      }

      const fallbackFile = nextFiles[0] ?? buildStarterFile(DEFAULT_LANGUAGE);
      const normalizedFiles = nextFiles.length ? nextFiles : [fallbackFile];
      const nextWorkspace = normalizeWorkspaceState({
        ...workspace,
        activeFileId: normalizedFiles.some((file) => file.id === workspace.activeFileId)
          ? workspace.activeFileId
          : normalizedFiles[0].id,
        files: normalizedFiles,
        folders: nextFolders,
      });

      return {
        cwd: nextWorkspace.terminal.cwd,
        output: `Removed ${formatWorkspacePath(targetPath)}`,
        status: "success",
        workspace: nextWorkspace,
      };
    }
    case "clear":
      return {
        clearHistory: true,
        cwd: workspace.terminal.cwd,
        output: "Terminal history cleared.",
        status: "info",
        workspace: {
          ...workspace,
          terminal: {
            ...workspace.terminal,
            history: [],
          },
        },
      };
    default:
      return {
        cwd: workspace.terminal.cwd,
        output: `Unknown command "${command}". Run "help" to see supported workspace commands.`,
        status: "error",
        workspace,
      };
  }
};
