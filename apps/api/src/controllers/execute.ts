import axios from "axios";
import { Request, Response } from "express";

const judge0ApiUrl =
  process.env.JUDGE0_API_URL ?? "https://ce.judge0.com";

export const executeCode = async (req: Request, res: Response) => {
  const { code, languageId, stdin } = req.body ?? {};

  if (!code || !languageId) {
    return res.status(400).json({
      error: "Language id and code are required.",
    });
  }

  try {
    const response = await axios.post(
      `${judge0ApiUrl}/submissions/?base64_encoded=false&wait=true`,
      {
        cpu_time_limit: 5,
        language_id: languageId,
        memory_limit: 262144,
        source_code: code,
        stdin: typeof stdin === "string" ? stdin : "",
        wall_time_limit: 12,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "User-Agent": "VoidLAB/1.0",
        },
        timeout: 20000,
      },
    );

    return res.status(200).json(response.data);
  } catch (error) {
    const message =
      axios.isAxiosError(error) && error.response?.data
        ? JSON.stringify(error.response.data)
        : "Compilation failed at the VoidLAB execution gateway.";

    return res.status(500).json({ error: message });
  }
};
