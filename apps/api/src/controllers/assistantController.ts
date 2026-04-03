import { Request, Response } from "express";

type ChatMessage = {
  content: string;
  role: "assistant" | "user";
};

type AssistantContext = {
  activeFileName?: string;
  activeFilePath?: string;
  currentLanguage?: string;
  fileCount?: number;
  folderCount?: number;
  lastOutput?: string;
  lastStatus?: string;
  profileName?: string;
};

const delay = (value: number) => new Promise((resolve) => setTimeout(resolve, value));

const emitEvent = (res: Response, type: string, payload: unknown) => {
  res.write(`event: ${type}\n`);
  res.write(`data: ${JSON.stringify(payload)}\n\n`);
};

const buildReply = (message: string, context: AssistantContext) => {
  const normalized = message.toLowerCase();
  const name = context.profileName ?? "builder";
  const fileHint = context.activeFileName
    ? ` The active file is ${context.activeFileName}${context.activeFilePath ? ` at ${context.activeFilePath}` : ""}.`
    : "";
  const workspaceHint = ` Your workspace currently has ${context.fileCount ?? 0} files and ${context.folderCount ?? 0} folders.`;

  if (!message.trim()) {
    return {
      reply:
        `I’m the VoidLAB basic assistant for ${name}. Ask me about running code, fixing compile issues, using stdin, AI workflow, folders, or workspace commands.${workspaceHint}`,
      suggestions: [
        "How do I run code with input?",
        "How do workspace commands work?",
        "How do I organize files and folders?",
      ],
    };
  }

  if (normalized.includes("python")) {
    return {
      reply:
        `Python works well in VoidLAB. Choose the Python language for the active file, write your script, put stdin in the input panel if your code uses input(), and run it. If the result is wrong, compare stdout, stderr, and compile status separately because VoidLAB now shows each section distinctly.${fileHint}`,
      suggestions: [
        "Show a Python input example",
        "How do I debug Python stderr?",
        "Can I create multiple Python files?",
      ],
    };
  }

  if (normalized.includes("input") || normalized.includes("stdin")) {
    return {
      reply:
        `For precise stdin handling, paste the input exactly line by line in the Program input box and then run the active file. VoidLAB forwards the raw text to the runtime without rewriting it, so spaces, new lines, and multi-line cases stay intact.`,
      suggestions: [
        "Why is my program waiting for input?",
        "How is stdout different from stderr?",
        "How do I test multiple input cases?",
      ],
    };
  }

  if (
    normalized.includes("error") ||
    normalized.includes("compile") ||
    normalized.includes("output") ||
    normalized.includes("wrong answer")
  ) {
    const statusHint = context.lastStatus ? ` The latest status was ${context.lastStatus}.` : "";
    const outputHint = context.lastOutput
      ? ` The latest terminal output starts with: "${context.lastOutput.slice(0, 160)}".`
      : "";

    return {
      reply:
        `Start with the execution status, then check compile output, then stderr, then stdout. Compile output means the code did not build. Stderr means the program ran and failed. Stdout is the actual program result.${statusHint}${outputHint}${fileHint}`,
      suggestions: [
        "Explain my latest output",
        "How do I fix runtime errors?",
        "What if stdout is empty?",
      ],
    };
  }

  if (normalized.includes("command") || normalized.includes("terminal") || normalized.includes("folder")) {
    return {
      reply:
        `VoidLAB workspace commands manage your virtual project tree. Use mkdir to create folders, touch to create files, ls or tree to inspect the workspace, open to jump to a file, and rm to remove entries. These commands operate on your workspace data directly, so they are fast and safe for browser use.${workspaceHint}`,
      suggestions: [
        "List useful workspace commands",
        "How do I import a folder?",
        "Can I open a file from the terminal?",
      ],
    };
  }

  if (normalized.includes("profile") || normalized.includes("bio") || normalized.includes("social")) {
    return {
      reply:
        `Your profile page is where VoidLAB surfaces identity, bio, social links, and recent activities such as runs, saves, AI chats, and workspace changes. Keeping those details updated makes the product feel much more personal and portfolio-ready.`,
      suggestions: [
        "What appears on the profile page?",
        "How are activities tracked?",
        "Can I update my social links later?",
      ],
    };
  }

  return {
    reply:
      `VoidLAB basic assistant is best for product usage, execution troubleshooting, workspace organization, and fast guidance while you code.${workspaceHint}${fileHint} Ask me about the current file, terminal output, or the next workflow step you want to take.`,
    suggestions: [
      "Help me debug my active file",
      "How do I use folders in VoidLAB?",
      "How do I run input-output programs correctly?",
    ],
  };
};

const getAssistantResponse = (context: AssistantContext | undefined, messages: ChatMessage[] | undefined) => {
  const lastUserMessage = messages?.filter((item) => item.role === "user").at(-1)?.content ?? "";
  return buildReply(lastUserMessage, context ?? {});
};

export const chatWithAssistant = async (req: Request, res: Response) => {
  const { context, messages } = (req.body ?? {}) as {
    context?: AssistantContext;
    messages?: ChatMessage[];
  };

  const response = getAssistantResponse(context, messages);

  return res.status(200).json({
    ok: true,
    ...response,
  });
};

export const streamAssistantChat = async (req: Request, res: Response) => {
  const { context, messages } = (req.body ?? {}) as {
    context?: AssistantContext;
    messages?: ChatMessage[];
  };

  const response = getAssistantResponse(context, messages);
  const chunks = response.reply.match(/.{1,32}(\s|$)|.{1,32}/g) ?? [response.reply];

  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Content-Type", "text/event-stream");
  res.flushHeaders?.();

  emitEvent(res, "meta", { ok: true, mode: "basic-realtime" });

  for (const chunk of chunks) {
    emitEvent(res, "chunk", { value: chunk });
    await delay(18);
  }

  emitEvent(res, "done", {
    suggestions: response.suggestions,
  });
  res.end();
};
