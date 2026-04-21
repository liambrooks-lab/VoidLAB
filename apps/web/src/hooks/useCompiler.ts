import { useCallback, useRef, useState } from "react";
import { apiBaseUrl } from "@/lib/api";
import { LanguageOption } from "@/lib/languages";

export type ExecutionDetails = {
  compileOutput: string;
  exitCode: number | null;
  exitSignal: number | null;
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
  timedOut: boolean;
  token: string | null;
};

const STATUS_TLE = 13;
const timeoutHintMessage = "Execution timed out. Did your program expect input that wasn't provided?";
const delay = (value: number) => new Promise((resolve) => setTimeout(resolve, value));
const pollDelayMs = 1000;
const maxAttempts = 18;

const isTleResult = (execution: ExecutionDetails) =>
  execution.timedOut ||
  execution.status.id === STATUS_TLE ||
  /time limit exceeded|timed out/i.test(execution.status.description) ||
  /time limit exceeded|timed out/i.test(execution.message);

export const useCompiler = () => {
  const [execution, setExecution] = useState<ExecutionDetails | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const runCode = useCallback(async (language: LanguageOption, code: string, stdin = "") => {
    abortRef.current?.abort();
    abortRef.current = new AbortController();
    const { signal } = abortRef.current;

    setLoading(true);
    setError("");
    setExecution(null);

    const stdinPayload = typeof stdin === "string" ? stdin : "";

    try {
      const createResponse = await fetch(`${apiBaseUrl}/api/execute`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal,
        body: JSON.stringify({
          code,
          languageId: language.judge0Id,
          stdin: stdinPayload,
        }),
      });

      const createData = await createResponse.json();

      if (!createResponse.ok || !createData.token) {
        const nextError = createData.error || "Execution failed.";
        setError(nextError);
        return { error: nextError, ok: false as const };
      }

      for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
        if (signal.aborted) {
          return { error: "Execution cancelled.", ok: false as const };
        }

        const statusResponse = await fetch(`${apiBaseUrl}/api/execute/${createData.token}`, {
          signal,
        });
        const statusData = await statusResponse.json();

        if (!statusResponse.ok) {
          const nextError = statusData.error || "Execution failed while polling status.";
          setError(nextError);
          return { error: nextError, ok: false as const };
        }

        const nextExecution = statusData.execution as ExecutionDetails;
        setExecution(nextExecution);

        if (!nextExecution.processing) {
          if (isTleResult(nextExecution)) {
            const tleError = nextExecution.message || timeoutHintMessage;
            setError(tleError);
            return {
              ok: false as const,
              result: nextExecution,
              tleSuggestion: true,
              error: tleError,
            };
          }

          return {
            ok: Boolean(nextExecution.status?.successful),
            result: nextExecution,
          } as const;
        }

        await delay(pollDelayMs);
      }

      const nextError = "Execution monitoring expired before Judge0 returned a final state.";
      setError(nextError);
      return { error: nextError, ok: false as const };
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        return { error: "Execution cancelled.", ok: false as const };
      }

      const nextError = "VoidLAB could not reach the execution service.";
      setError(nextError);
      return { error: nextError, ok: false as const };
    } finally {
      setLoading(false);
    }
  }, []);

  const cancelExecution = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const resetExecutionState = useCallback(() => {
    setError("");
    setExecution(null);
  }, []);

  return { cancelExecution, error, execution, loading, resetExecutionState, runCode };
};
