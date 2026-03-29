import { Request, Response } from "express";

type ChatMessage = {
  content: string;
  role: "assistant" | "user";
};

type AssistantContext = {
  currentLanguage?: string;
  fileCount?: number;
  lastOutput?: string;
  roomId?: string;
};

const buildReply = (message: string, context: AssistantContext) => {
  const normalized = message.toLowerCase();
  const languageHint = context.currentLanguage
    ? ` for your current ${context.currentLanguage} workspace`
    : "";

  if (!message.trim()) {
    return {
      reply:
        "Ask me anything about using VoidLAB, fixing code execution, collaborating in a room, or finding the right workflow for your current project.",
      suggestions: [
        "How do I run code with input?",
        "How do collaboration rooms work?",
        "Give me keyboard shortcuts",
      ],
    };
  }

  if (normalized.includes("input") || normalized.includes("stdin")) {
    return {
      reply: `To run input/output programs${languageHint}, open the terminal input box, type the input exactly as the program expects it, and then press Run. Multi-line input is supported, so each new line will be passed to the runtime the same way it would in a local terminal.`,
      suggestions: [
        "Show me an example input format",
        "Why is my program waiting for input?",
        "How do I preview HTML output?",
      ],
    };
  }

  if (
    normalized.includes("run") ||
    normalized.includes("compile") ||
    normalized.includes("error")
  ) {
    const outputHint = context.lastOutput
      ? ` The latest terminal response I know about is: "${context.lastOutput.slice(0, 120)}".`
      : "";

    return {
      reply: `Start by confirming the selected language matches the active file extension, then run the file again. If the terminal shows an error, read the first error line before changing the code because it usually points to the exact syntax or input issue.${outputHint}`,
      suggestions: [
        "Help me debug this output",
        "What languages are runnable right now?",
        "How do I use stdin in VoidLAB?",
      ],
    };
  }

  if (
    normalized.includes("collab") ||
    normalized.includes("team") ||
    normalized.includes("share") ||
    normalized.includes("room")
  ) {
    const roomHint = context.roomId
      ? ` You are currently connected to room ${context.roomId}.`
      : " Create a room, share the room code, and then use Push workspace to sync your current files into the shared session.";

    return {
      reply: `VoidLAB collaboration rooms let teammates join the same workspace, exchange messages, and sync the latest file set into a shared room state.${roomHint}`,
      suggestions: [
        "How do I create a room?",
        "How do I pull the latest shared workspace?",
        "How do I invite teammates?",
      ],
    };
  }

  if (
    normalized.includes("manual") ||
    normalized.includes("shortcut") ||
    normalized.includes("how to")
  ) {
    return {
      reply:
        "The fastest way to learn VoidLAB is to use the feature pages from the editor toolbar. Manual explains the product, GitHub shows publish commands, Collaboration manages shared rooms, and AI Guide helps with workflows and troubleshooting.",
      suggestions: [
        "List the shortcuts",
        "What is the best workflow for a beginner?",
        "How do I deploy my project?",
      ],
    };
  }

  if (
    normalized.includes("html") ||
    normalized.includes("css") ||
    normalized.includes("preview")
  ) {
    return {
      reply:
        "For web-style files, VoidLAB can open a live preview in a new tab instead of sending the code to the compiler. If your workspace has HTML and CSS files together, the preview combines them so you can see the page instantly.",
      suggestions: [
        "How do I preview HTML and CSS together?",
        "Can JavaScript be included in preview mode?",
        "Why does preview open in a new tab?",
      ],
    };
  }

  return {
    reply:
      "VoidLAB AI Guide is here to help with product usage, execution issues, workflow choices, collaboration, and deployment steps. Ask me about your current file, how to use a feature, or how to debug what just happened in the terminal.",
    suggestions: [
      "How do I use collaboration?",
      "Help me debug a failing run",
      "What can I do from the GitHub page?",
    ],
  };
};

export const chatWithAssistant = async (req: Request, res: Response) => {
  const { context, messages } = (req.body ?? {}) as {
    context?: AssistantContext;
    messages?: ChatMessage[];
  };

  const lastUserMessage =
    messages?.filter((item) => item.role === "user").at(-1)?.content ?? "";

  const response = buildReply(lastUserMessage, context ?? {});

  return res.status(200).json({
    ok: true,
    ...response,
  });
};
