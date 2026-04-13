import { useState } from "react";
import { apiBaseUrl } from "@/lib/api";
import { LanguageOption } from "@/lib/languages";

export type ExecutionDetails = {
  compileOutput: string;
  memory: number | null;
  message: string;
  output: string;
  processing?: boolean;
  status: {
    description: string;
    id: number;
    successful: boolean;
  };
  stderr: string;
  stdout: string;
  time: string | null;
  token: string | null;
};

const delay = (value: number) => new Promise((resolve) => setTimeout(resolve, value));
const pollDelayMs = 1000;
const maxAttempts = 90;

export const useCompiler = () => {
  const [execution, setExecution] = useState<ExecutionDetails | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const runCode = async (language: LanguageOption, code: string, stdin = "") => {
    setLoading(true);
    setError("");
    setExecution(null);

    const stdinPayload = typeof stdin === "string" ? stdin : "";

    try {
      const createResponse = await fetch(`${apiBaseUrl}/api/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          languageId: language.judge0Id,
          stdin: stdinPayload,
        }),
      });

      const createData = await createResponse.json();

      if (!createResponse.ok || !createData.token) {
        setError(createData.error || "Execution failed.");
        return { ok: false };
      }

      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        const statusResponse = await fetch(`${apiBaseUrl}/api/execute/${createData.token}`);
        const statusData = await statusResponse.json();

        if (!statusResponse.ok) {
          setError(statusData.error || "Execution failed while polling status.");
          return { ok: false };
        }

        const nextExecution = statusData.execution as ExecutionDetails;
        setExecution(nextExecution);

        if (!nextExecution.processing) {
          return { ok: Boolean(nextExecution.status?.successful), result: nextExecution };
        }

        await delay(pollDelayMs);
      }

      setError(
        "Execution is still running longer than expected. Complex programs now get more time, but this one still exceeded the current waiting window.",
      );
      return { ok: false };
    } catch {
      setError("VoidLAB could not reach the execution service.");
      return { ok: false };
    } finally {
      setLoading(false);
    }
  };

  return { error, execution, loading, runCode };
};
