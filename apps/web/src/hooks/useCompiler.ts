import { useState } from "react";
import { apiBaseUrl } from "@/lib/api";
import { LanguageOption } from "@/lib/languages";

export type ExecutionDetails = {
  compileOutput: string;
  memory: number | null;
  message: string;
  output: string;
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

export const useCompiler = () => {
  const [execution, setExecution] = useState<ExecutionDetails | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const runCode = async (language: LanguageOption, code: string, stdin = "") => {
    setLoading(true);
    setError("");
    setExecution(null);

    try {
      const response = await fetch(`${apiBaseUrl}/api/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          languageId: language.judge0Id,
          stdin,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Execution failed.");
        return { ok: false };
      }

      setExecution(data.execution ?? null);
      return { ok: Boolean(data.execution?.status?.successful), result: data.execution as ExecutionDetails };
    } catch {
      setError("VoidLAB could not reach the execution service.");
      return { ok: false };
    } finally {
      setLoading(false);
    }
  };

  return { error, execution, loading, runCode };
};
