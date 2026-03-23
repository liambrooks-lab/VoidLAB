import axios from "axios";
import { Request, Response } from "express";

const pistonApiUrl =
  process.env.PISTON_API_URL ?? "https://emkc.org/api/v2/piston";

export const executeCode = async (req: Request, res: Response) => {
  const { code, language, version } = req.body ?? {};

  if (!code || !language) {
    return res.status(400).json({
      error: "Language and code are required.",
    });
  }

  try {
    const response = await axios.post(`${pistonApiUrl}/execute`, {
      language,
      version: version || "*",
      files: [{ content: code }],
    });

    return res.status(200).json(response.data);
  } catch (error) {
    const message =
      axios.isAxiosError(error) && error.response?.data
        ? JSON.stringify(error.response.data)
        : "Compilation failed at the VoidLAB execution gateway.";

    return res.status(500).json({ error: message });
  }
};
