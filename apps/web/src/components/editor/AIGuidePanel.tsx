"use client";

import { useMemo, useState } from "react";
import { Bot, Loader2, SendHorizontal, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/context/UserContext";
import { apiBaseUrl } from "@/lib/api";
import { getLanguageById } from "@/lib/languages";
import { formatWorkspacePath, readWorkspace } from "@/lib/workspace";

type ChatMessage = {
  content: string;
  role: "assistant" | "user";
};

const starterMessages: ChatMessage[] = [
  {
    role: "assistant",
    content:
      "I’m the VoidLAB Basic Model. Ask me about input/output handling, folders, workspace commands, debugging, or how to structure your project.",
  },
];

const starterSuggestions = [
  "How do I run input-output programs correctly?",
  "What workspace commands are supported?",
  "How should I organize multiple files and folders?",
];

export default function AIGuidePanel() {
  const { profile, recordActivity } = useUser();
  const [messages, setMessages] = useState<ChatMessage[]>(starterMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [suggestions, setSuggestions] = useState(starterSuggestions);

  const context = useMemo(() => {
    if (typeof window === "undefined") return {};

    const workspace = readWorkspace();
    const activeFile =
      workspace.files.find((file) => file.id === workspace.activeFileId) ?? workspace.files[0];
    const language = activeFile ? getLanguageById(activeFile.languageId) : undefined;

    return {
      activeFileName: activeFile?.name,
      activeFilePath: activeFile ? formatWorkspacePath(activeFile.path) : undefined,
      currentLanguage: language?.label,
      fileCount: workspace.files.length,
      folderCount: workspace.folders.length,
      profileName: profile?.name,
    };
  }, [profile?.name]);

  const sendMessage = async (content: string) => {
    const trimmed = content.trim();

    if (!trimmed || loading) return;

    const nextMessages = [...messages, { content: trimmed, role: "user" as const }];
    const assistantIndex = nextMessages.length;

    setMessages([...nextMessages, { content: "", role: "assistant" }]);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(`${apiBaseUrl}/api/assistant/stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          context,
          messages: nextMessages,
        }),
      });

      if (!response.ok || !response.body) {
        const fallback = await response.json().catch(() => null);
        throw new Error(fallback?.error || "VoidLAB Basic Model could not answer right now.");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let finalSuggestions = starterSuggestions;
      let assistantText = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const events = buffer.split("\n\n");
        buffer = events.pop() ?? "";

        for (const eventChunk of events) {
          const lines = eventChunk.split("\n");
          const eventType = lines.find((line) => line.startsWith("event:"))?.replace("event:", "").trim();
          const dataLine = lines.find((line) => line.startsWith("data:"));

          if (!dataLine) continue;

          const payload = JSON.parse(dataLine.replace("data:", "").trim()) as {
            suggestions?: string[];
            value?: string;
          };

          if (eventType === "chunk" && payload.value) {
            assistantText += payload.value;
            setMessages((current) =>
              current.map((message, index) =>
                index === assistantIndex
                  ? { ...message, content: assistantText.trimStart() }
                  : message,
              ),
            );
          }

          if (eventType === "done" && Array.isArray(payload.suggestions)) {
            finalSuggestions = payload.suggestions;
          }
        }
      }

      setSuggestions(finalSuggestions);
      recordActivity({
        detail: `Asked VoidLAB Basic Model about "${trimmed.slice(0, 70)}".`,
        title: "AI guidance used",
        type: "ai",
      });
    } catch (error) {
      setMessages((current) =>
        current.map((message, index) =>
          index === assistantIndex
            ? {
                ...message,
                content:
                  error instanceof Error
                    ? error.message
                    : "VoidLAB Basic Model is temporarily unavailable.",
              }
            : message,
        ),
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
      <section className="rounded-[28px] border border-white/10 bg-white/5 p-5">
        <div className="flex items-center gap-3 border-b border-white/10 pb-4">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-300/20 bg-sky-300/10 text-sky-100">
            <Bot size={18} />
          </div>
          <div>
            <div className="text-sm font-semibold text-white">VoidLAB Basic Model</div>
            <div className="text-sm text-slate-300">
              Real-time product guidance for {profile?.name ?? "your"} workspace.
            </div>
          </div>
        </div>

        <div className="scrollbar-thin mt-5 h-[420px] space-y-4 overflow-y-auto pr-2">
          {messages.map((message, index) => (
            <div
              className={`max-w-[88%] rounded-[24px] px-4 py-3 text-sm leading-7 ${
                message.role === "assistant"
                  ? "border border-white/10 bg-white/5 text-slate-100"
                  : "ml-auto bg-sky-400 text-slate-950"
              }`}
              key={`${message.role}-${index}`}
            >
              {message.content || (loading && index === messages.length - 1 ? "Thinking..." : "")}
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-[24px] border border-white/10 bg-slate-950/40 p-3">
          <textarea
            className="min-h-[120px] w-full resize-none bg-transparent text-sm leading-7 text-slate-100 outline-none placeholder:text-slate-500"
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask about precise output handling, Python input, folders, workspace commands, or the best VoidLAB workflow..."
            value={input}
          />
          <div className="mt-3 flex justify-end">
            <Button disabled={loading} onClick={() => void sendMessage(input)} type="button">
              {loading ? <Loader2 size={15} className="animate-spin" /> : <SendHorizontal size={15} />}
              {loading ? "Streaming" : "Ask Basic Model"}
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-white/10 bg-white/5 p-5">
        <div className="flex items-center gap-2 text-sm font-semibold text-white">
          <Sparkles size={16} />
          Suggested prompts
        </div>
        <div className="mt-4 space-y-3">
          {suggestions.map((suggestion) => (
            <button
              className="w-full rounded-[22px] border border-white/10 bg-white/5 px-4 py-3 text-left text-sm text-slate-100 transition hover:bg-white/10"
              key={suggestion}
              onClick={() => void sendMessage(suggestion)}
              type="button"
            >
              {suggestion}
            </button>
          ))}
        </div>

        <div className="mt-6 rounded-[24px] border border-sky-300/20 bg-sky-300/10 p-4 text-sm leading-7 text-sky-50">
          This assistant is intentionally basic and fast. It streams guidance in real time,
          stays focused on VoidLAB workflows, and is best used for debugging direction,
          input-output help, and project organization.
        </div>
      </section>
    </div>
  );
}
