import { Router } from "express";
import { executeCode } from "../controllers/execute";
import { rateLimiter } from "../middleware/rateLimiter";

const router = Router();

router.post("/", rateLimiter, executeCode);

export default router;
