import { Router } from "express";
import { executeCode, getExecutionStatus } from "../controllers/execute";
import { rateLimiter } from "../middleware/rateLimiter";

const router = Router();

router.post("/", rateLimiter, executeCode);
router.get("/:token", rateLimiter, getExecutionStatus);

export default router;
