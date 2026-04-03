import { Router } from "express";
import { chatWithAssistant, streamAssistantChat } from "../controllers/assistantController";

const router = Router();

router.post("/chat", chatWithAssistant);
router.post("/stream", streamAssistantChat);

export default router;
