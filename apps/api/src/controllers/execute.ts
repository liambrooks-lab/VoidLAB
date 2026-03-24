import axios from "axios";
import { Request, Response } from "express";

const judge0ApiUrl =
  process.env.JUDGE0_API_URL ?? "https://ce.judge0.com";

export const executeCode = async (req: Request, res: Response) => {
  const { code, languageId } = req.body ?? {};

  if (!code || !languageId) {
    return res.status(400).json({
      error: "Language id and code are required.",
    });
  }

  try {
    const response = await axios.post(
      `${judge0ApiUrl}/submissions/?base64_encoded=false&wait=true`,
      {
        language_id: languageId,
        source_code: code,
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
