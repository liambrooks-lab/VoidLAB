import { DEFAULT_LANGUAGE, LanguageOption, getLanguageById } from "@/lib/languages";

export const workspaceStorageKey = "voidlab-workspace";

export type ProjectFile = {
  content: string;
  id: string;
  languageId: string;
  name: string;
};

export type GitHubState = {
  branch: string;
  repoUrl: string;
  visibility: "private" | "public";
};

export type WorkspaceState = {
  activeFileId: string;
  files: ProjectFile[];
  gitState: GitHubState;
};

export const defaultGitState: GitHubState = {
  branch: "main",
  repoUrl: "",
  visibility: "public",
};

export const createFileId = () =>
  `file-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

export const withExtension = (baseName: string, extension: string) => {
  const trimmed = baseName.trim().replace(/\s+/g, "-").replace(/[^\w.-]/g, "");
  const safeBase = trimmed || "untitled";
  return safeBase.includes(".") ? safeBase : `${safeBase}.${extension}`;
};

export const replaceExtension = (name: string, extension: string) => {
  const index = name.lastIndexOf(".");
  const base = index > 0 ? name.slice(0, index) : name;
  return `${base}.${extension}`;
};

export const buildStarterFile = (
  language: LanguageOption,
  name = "main",
): ProjectFile => ({
  content: language.template,
  id: createFileId(),
  languageId: language.id,
  name: withExtension(name, language.extension),
});

export const fromLegacyWorkspace = (parsed: {
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
            name: withExtension(
              index === 0 ? "main" : language.label.toLowerCase(),
              language.extension,
            ),
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

export const readWorkspace = (): WorkspaceState => {
  const raw = window.localStorage.getItem(workspaceStorageKey);

  if (!raw) {
    const starterFile = buildStarterFile(DEFAULT_LANGUAGE);
    return {
      activeFileId: starterFile.id,
      files: [starterFile],
      gitState: defaultGitState,
    };
  }

  try {
    const parsed = JSON.parse(raw) as WorkspaceState & {
      drafts?: Record<string, string>;
      language?: string;
    };

    if ("drafts" in parsed) {
      return fromLegacyWorkspace(parsed);
    }

    const safeFiles = parsed.files?.length
      ? parsed.files
      : [buildStarterFile(DEFAULT_LANGUAGE)];

    return {
      activeFileId: parsed.activeFileId || safeFiles[0].id,
      files: safeFiles,
      gitState: parsed.gitState ?? defaultGitState,
    };
  } catch {
    const starterFile = buildStarterFile(DEFAULT_LANGUAGE);
    return {
      activeFileId: starterFile.id,
      files: [starterFile],
      gitState: defaultGitState,
    };
  }
};

export const persistWorkspace = (
  files: ProjectFile[],
  activeFileId: string,
  gitState: GitHubState,
) => {
  window.localStorage.setItem(
    workspaceStorageKey,
    JSON.stringify({
      activeFileId,
      files,
      gitState,
    } satisfies WorkspaceState),
  );
};
