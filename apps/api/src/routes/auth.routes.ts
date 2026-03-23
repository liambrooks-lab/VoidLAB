import { Router } from "express";
import { createSession } from "../controllers/authControllers";

const router = Router();

router.post("/session", createSession);

export default router;
