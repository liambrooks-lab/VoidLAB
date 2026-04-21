import axios from "axios";
import { Request, Response } from "express";

const judge0ApiUrl = process.env.JUDGE0_API_URL ?? "https://ce.judge0.com";
const C_PLUS_PLUS_LANGUAGE_ID = 105;
const JAVASCRIPT_LANGUAGE_ID = 102;
const STATUS_TIME_LIMIT_EXCEEDED = 13;
const TYPESCRIPT_LANGUAGE_ID = 101;
const cpuTimeLimitSeconds = 5;
const wallTimeLimitSeconds = 10;
const memoryLimitKb = 786432;
const timeoutHintMessage = "Execution timed out. Did your program expect input that wasn't provided?";

const encode = (value: string) => Buffer.from(value, "utf8").toString("base64");
const normalizeStream = (value: string) => value.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

const decode = (value?: string | null) => {
  if (!value) return "";

  try {
    return normalizeStream(Buffer.from(value, "base64").toString("utf8"));
  } catch {
    return normalizeStream(value);
  }
};

const isFinalStatus = (statusId: number) => statusId >= 3;

const hasPromptCall = (source: string) => /\b(?:window\.)?prompt\s*\(/.test(source);
const hasCustomPromptImplementation = (source: string) =>
  /\b(?:function\s+prompt|const\s+prompt|let\s+prompt|var\s+prompt)\b/.test(source);

const promptShimPrelude = `
const __voidlabRawStdin = __VOIDLAB_READ_STDIN__;
const __voidlabLines = __voidlabRawStdin.length
  ? __voidlabRawStdin.replace(/\\r\\n/g, "\\n").replace(/\\r/g, "\\n").split("\\n")
  : [];

if (__voidlabLines.length > 0 && __voidlabLines[__voidlabLines.length - 1] === "") {
  __voidlabLines.pop();
}

let __voidlabCursor = 0;
const __voidlabPrompt = (..._args) =>
  __voidlabCursor < __voidlabLines.length ? __voidlabLines[__voidlabCursor++] : null;
`.trim();

const injectPromptShim = (languageId: number, source: string) => {
  if (!hasPromptCall(source) || hasCustomPromptImplementation(source)) {
    return source;
  }

  if (languageId === JAVASCRIPT_LANGUAGE_ID) {
    return [
      'const { readFileSync } = require("node:fs");',
      promptShimPrelude.replace("__VOIDLAB_READ_STDIN__", 'readFileSync(0, "utf8")'),
      "globalThis.prompt = __voidlabPrompt;",
      "if (typeof globalThis.window === \"undefined\") {",
      "  globalThis.window = globalThis;",
      "}",
      "if (typeof globalThis.window.prompt !== \"function\") {",
      "  globalThis.window.prompt = __voidlabPrompt;",
      "}",
      source,
    ].join("\n\n");
  }

  if (languageId === TYPESCRIPT_LANGUAGE_ID) {
    return [
      'import { readFileSync } from "node:fs";',
      promptShimPrelude
        .replace("__VOIDLAB_READ_STDIN__", 'readFileSync(0, "utf8")')
        .replace("(..._args) =>", "(..._args: unknown[]) =>"),
      `const __voidlabGlobal = globalThis as typeof globalThis & {
  prompt?: typeof __voidlabPrompt;
  window?: typeof globalThis & { prompt?: typeof __voidlabPrompt };
};`,
      "__voidlabGlobal.prompt = __voidlabPrompt;",
      "if (!__voidlabGlobal.window) {",
      "  __voidlabGlobal.window = globalThis as typeof globalThis & { prompt?: typeof __voidlabPrompt };",
      "}",
      "if (typeof __voidlabGlobal.window.prompt !== \"function\") {",
      "  __voidlabGlobal.window.prompt = __voidlabPrompt;",
      "}",
      source,
    ].join("\n\n");
  }

  return source;
};

const getCompilerOptions = (languageId: number) =>
  languageId === C_PLUS_PLUS_LANGUAGE_ID ? "-std=c++26" : undefined;

const joinOutputSections = (sections: Array<{ content: string; label: string }>) =>
  sections
    .filter((section) => section.content.length > 0)
    .map((section) => `${section.label}\n${section.content}`)
    .join("\n\n");

const stringifyErrorPayload = (value: unknown) => {
  if (typeof value === "string") {
    return value;
  }

  try {
    return JSON.stringify(value);
  } catch {
    return "VoidLAB received an unreadable error payload.";
  }
};

const isTimeoutExecution = (statusId: number, statusDescription: string, message: string) =>
  statusId === STATUS_TIME_LIMIT_EXCEEDED ||
  /time limit exceeded|timed out/i.test(statusDescription) ||
  /time limit exceeded|timed out/i.test(message);

const mapExecution = (data: any) => {
  const stdout = decode(data.stdout);
  const stderr = decode(data.stderr);
  const compileOutput = decode(data.compile_output);
  const statusId = Number(data.status?.id ?? 0);
  const statusDescription = data.status?.description ?? "Unknown";
  const runtimeMessage = decode(data.message);
  const timedOut = isTimeoutExecution(statusId, statusDescription, runtimeMessage);
  const message = timedOut && !runtimeMessage.length ? timeoutHintMessage : runtimeMessage;
  const joinedOutput = joinOutputSections([
    { content: stdout, label: "[stdout]" },
    { content: stderr, label: "[stderr]" },
    { content: compileOutput, label: "[compile]" },
    { content: message, label: "[message]" },
  ]);

  return {
    compileOutput,
    exitCode: data.exit_code ?? null,
    exitSignal: data.exit_signal ?? null,
    memory: data.memory ?? null,
    message,
    output: joinedOutput || "Code executed with no output.",
    processing: !isFinalStatus(statusId),
    status: {
      description: statusDescription,
      id: statusId,
      successful: statusId === 3,
    },
    stderr,
    stdout,
    time: data.time ?? null,
    timedOut,
    token: data.token ?? null,
  };
};

export const executeCode = async (req: Request, res: Response) => {
  const { code, languageId, stdin } = req.body ?? {};
  const numericLanguageId = Number(languageId);

  if (typeof code !== "string" || !code.trim() || !numericLanguageId) {
    return res.status(400).json({
      error: "Language id and code are required.",
    });
  }

  const normalizedStdin = typeof stdin === "string" ? stdin : "";
  const sourceCode = injectPromptShim(numericLanguageId, code);
  const compilerOptions = getCompilerOptions(numericLanguageId);

  try {
    const response = await axios.post(
      `${judge0ApiUrl}/submissions/?base64_encoded=true&wait=false`,
      {
        compiler_options: compilerOptions,
        cpu_time_limit: cpuTimeLimitSeconds,
        language_id: numericLanguageId,
        memory_limit: memoryLimitKb,
        source_code: encode(sourceCode),
        stdin: encode(normalizedStdin),
        wall_time_limit: wallTimeLimitSeconds,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "VoidLAB/1.0",
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        timeout: 15000,
      },
    );

    return res.status(202).json({
      ok: true,
      token: response.data?.token ?? null,
    });
  } catch (error) {
    const message =
      axios.isAxiosError(error) && error.response?.data
        ? stringifyErrorPayload(error.response.data)
        : "Compilation failed at the VoidLAB execution gateway.";

    return res.status(500).json({ error: message });
  }
};

export const getExecutionStatus = async (req: Request, res: Response) => {
  const token = req.params.token;

  if (!token) {
    return res.status(400).json({ error: "Execution token is required." });
  }

  try {
    const response = await axios.get(
      `${judge0ApiUrl}/submissions/${token}?base64_encoded=true&fields=stdout,stderr,compile_output,message,status,time,memory,token,exit_code,exit_signal`,
      {
        headers: {
          "User-Agent": "VoidLAB/1.0",
        },
        maxBodyLength: Infinity,
        maxContentLength: Infinity,
        timeout: 15000,
      },
    );

    return res.status(200).json({
      ok: true,
      execution: mapExecution(response.data ?? {}),
    });
  } catch (error) {
    const message =
      axios.isAxiosError(error) && error.response?.data
        ? stringifyErrorPayload(error.response.data)
        : "VoidLAB could not fetch the execution status.";

    return res.status(500).json({ error: message });
  }
};
