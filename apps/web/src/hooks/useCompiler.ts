import { useState } from "react";
import { apiBaseUrl } from "@/lib/api";
import { LanguageOption } from "@/lib/languages";

export const useCompiler = () => {
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const runCode = async (language: LanguageOption, code: string, stdin = "") => {
    setLoading(true);
    setError("");
    setOutput("");

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

      const terminalOutput =
        data.stdout ||
        data.stderr ||
        data.compile_output ||
        data.message ||
        "Code executed with no output.";

      setOutput(terminalOutput);
      return { ok: true };
    } catch {
      setError("VoidLAB could not reach the execution service.");
      return { ok: false };
    } finally {
      setLoading(false);
    }
  };

  return { error, loading, output, runCode };
};
