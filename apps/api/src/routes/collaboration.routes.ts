import { Router } from "express";
import {
  createRoom,
  getRoomState,
  joinRoom,
  postRoomMessage,
  updateWorkspace,
} from "../controllers/collaborationController";

const router = Router();

router.post("/rooms", createRoom);
router.post("/rooms/:roomId/join", joinRoom);
router.get("/rooms/:roomId", getRoomState);
router.put("/rooms/:roomId/workspace", updateWorkspace);
router.post("/rooms/:roomId/messages", postRoomMessage);

export default router;
