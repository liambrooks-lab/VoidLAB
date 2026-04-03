import axios from "axios";
import { Request, Response } from "express";

const judge0ApiUrl = process.env.JUDGE0_API_URL ?? "https://ce.judge0.com";

const encode = (value: string) => Buffer.from(value, "utf8").toString("base64");

const decode = (value?: string | null) => {
  if (!value) return "";

  try {
    return Buffer.from(value, "base64").toString("utf8");
  } catch {
    return value;
  }
};

export const executeCode = async (req: Request, res: Response) => {
  const { code, languageId, stdin } = req.body ?? {};

  if (typeof code !== "string" || !code.trim() || !languageId) {
    return res.status(400).json({
      error: "Language id and code are required.",
    });
  }

  try {
    const response = await axios.post(
      `${judge0ApiUrl}/submissions/?base64_encoded=true&wait=true`,
      {
        cpu_time_limit: 5,
        language_id: Number(languageId),
        memory_limit: 262144,
        source_code: encode(code),
        stdin: encode(typeof stdin === "string" ? stdin : ""),
        wall_time_limit: 12,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "VoidLAB/1.0",
        },
        timeout: 25000,
      },
    );

    const data = response.data ?? {};
    const stdout = decode(data.stdout);
    const stderr = decode(data.stderr);
    const compileOutput = decode(data.compile_output);
    const message = decode(data.message);
    const status = {
      description: data.status?.description ?? "Unknown",
      id: Number(data.status?.id ?? 0),
      successful: Number(data.status?.id ?? 0) === 3,
    };

    return res.status(200).json({
      ok: true,
      execution: {
        compileOutput,
        memory: data.memory ?? null,
        message,
        output:
          [compileOutput, stderr, stdout, message]
            .filter((item) => typeof item === "string" && item.length > 0)
            .join("\n\n")
            .trim() || "Code executed with no output.",
        status,
        stderr,
        stdout,
        time: data.time ?? null,
        token: data.token ?? null,
      },
    });
  } catch (error) {
    const message =
      axios.isAxiosError(error) && error.response?.data
        ? typeof error.response.data === "string"
          ? error.response.data
          : JSON.stringify(error.response.data)
        : "Compilation failed at the VoidLAB execution gateway.";

    return res.status(500).json({ error: message });
  }
};
