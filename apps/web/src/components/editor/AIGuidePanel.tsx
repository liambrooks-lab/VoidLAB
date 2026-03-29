"use client";

import { useMemo, useState } from "react";
import { Bot, Loader2, SendHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/context/UserContext";
import { apiBaseUrl } from "@/lib/api";
import { getLanguageById } from "@/lib/languages";
import { readWorkspace } from "@/lib/workspace";

type ChatMessage = {
  content: string;
  role: "assistant" | "user";
};

const starterMessages: ChatMessage[] = [
  {
    role: "assistant",
    content:
      "I’m your VoidLAB AI Guide. Ask me about running code, using input, collaboration rooms, workspace features, or how to debug what just happened.",
  },
];

const starterSuggestions = [
  "How do I run a program with input?",
  "How do I use collaboration rooms?",
  "How do I preview HTML and CSS?",
];

export default function AIGuidePanel() {
  const { profile } = useUser();
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
      currentLanguage: language?.label,
      fileCount: workspace.files.length,
    };
  }, []);

  const sendMessage = async (content: string) => {
    const trimmed = content.trim();

    if (!trimmed) return;

    const nextMessages = [...messages, { content: trimmed, role: "user" as const }];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    try {
      const response = await fetch(`${apiBaseUrl}/api/assistant/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          context,
          messages: nextMessages,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "VoidLAB AI Guide could not answer right now.");
      }

      setMessages((current) => [
        ...current,
        {
          content: data.reply || "I’m here, but I didn’t receive a usable answer.",
          role: "assistant",
        },
      ]);
      setSuggestions(Array.isArray(data.suggestions) ? data.suggestions : starterSuggestions);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          content:
            error instanceof Error
              ? error.message
              : "VoidLAB AI Guide is temporarily unavailable.",
          role: "assistant",
        },
      ]);
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
            <div className="text-sm font-semibold text-white">AI Guide chat</div>
            <div className="text-sm text-slate-300">
              Context-aware product guidance for {profile?.name ?? "your"} workspace.
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
              {message.content}
            </div>
          ))}
        </div>

        <div className="mt-5 rounded-[24px] border border-white/10 bg-slate-950/40 p-3">
          <textarea
            className="min-h-[120px] w-full resize-none bg-transparent text-sm leading-7 text-slate-100 outline-none placeholder:text-slate-500"
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask about running code, using collaboration, debugging output, or understanding a VoidLAB feature..."
            value={input}
          />
          <div className="mt-3 flex justify-end">
            <Button disabled={loading} onClick={() => void sendMessage(input)} type="button">
              {loading ? <Loader2 size={15} className="animate-spin" /> : <SendHorizontal size={15} />}
              {loading ? "Thinking" : "Ask AI Guide"}
            </Button>
          </div>
        </div>
      </section>

      <section className="rounded-[28px] border border-white/10 bg-white/5 p-5">
        <div className="text-sm font-semibold text-white">Suggested prompts</div>
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
          Use AI Guide when you need fast product help, debugging direction, feature discovery,
          or collaboration onboarding without leaving the workspace.
        </div>
      </section>
    </div>
  );
}
