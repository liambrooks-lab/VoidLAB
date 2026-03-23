import { useState } from "react";
import { LanguageOption } from "@/lib/languages";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5000";

export const useCompiler = () => {
  const [output, setOutput] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const runCode = async (language: LanguageOption, code: string) => {
    setLoading(true);
    setError("");
    setOutput("");

    try {
      const response = await fetch(`${apiBaseUrl}/api/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          language: language.runtime,
          version: language.version,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Execution failed.");
        return { ok: false };
      }

      const terminalOutput =
        data.run?.output ||
        data.run?.stderr ||
        data.compile?.output ||
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
