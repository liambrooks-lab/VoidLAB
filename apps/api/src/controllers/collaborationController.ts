import { Request, Response } from "express";

type CollaboratorProfile = {
  avatar?: string;
  email?: string;
  name: string;
};

type RoomFile = {
  content: string;
  id: string;
  languageId: string;
  name: string;
};

type WorkspaceSnapshot = {
  activeFileId: string;
  files: RoomFile[];
  updatedAt: string;
  updatedBy: string;
};

type Participant = {
  avatar?: string;
  color: string;
  email?: string;
  id: string;
  joinedAt: string;
  lastSeen: number;
  name: string;
};

type RoomMessage = {
  authorId: string;
  authorName: string;
  createdAt: string;
  id: string;
  text: string;
};

type Room = {
  createdAt: string;
  id: string;
  messages: RoomMessage[];
  name: string;
  participants: Map<string, Participant>;
  workspace: WorkspaceSnapshot | null;
};

const roomStore = new Map<string, Room>();
const activeWindowMs = 120_000;
const palette = ["#3b82f6", "#14b8a6", "#8b5cf6", "#f97316", "#ec4899", "#22c55e"];

const createId = (prefix: string) =>
  `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

const createRoomCode = () => Math.random().toString(36).slice(2, 8).toUpperCase();

const getParticipantColor = (index: number) => palette[index % palette.length];

const keepActiveParticipants = (room: Room) => {
  const now = Date.now();

  room.participants.forEach((participant, id) => {
    if (now - participant.lastSeen > activeWindowMs) {
      room.participants.delete(id);
    }
  });
};

const serializeRoom = (room: Room) => {
  keepActiveParticipants(room);

  return {
    createdAt: room.createdAt,
    id: room.id,
    messages: room.messages.slice(-30),
    name: room.name,
    participants: Array.from(room.participants.values()).sort((left, right) =>
      left.name.localeCompare(right.name),
    ),
    workspace: room.workspace,
  };
};

const createParticipant = (profile: CollaboratorProfile, currentCount: number): Participant => ({
  avatar: profile.avatar,
  color: getParticipantColor(currentCount),
  email: profile.email,
  id: createId("member"),
  joinedAt: new Date().toISOString(),
  lastSeen: Date.now(),
  name: profile.name.trim(),
});

const getRoomOrThrow = (roomId: string, res: Response) => {
  const room = roomStore.get(roomId.toUpperCase());

  if (!room) {
    res.status(404).json({
      error: "Collaboration room not found.",
    });
    return null;
  }

  return room;
};

export const createRoom = async (req: Request, res: Response) => {
  const { profile, roomName } = (req.body ?? {}) as {
    profile?: CollaboratorProfile;
    roomName?: string;
  };

  if (!profile?.name?.trim()) {
    return res.status(400).json({
      error: "A collaborator name is required to create a room.",
    });
  }

  const roomId = createRoomCode();
  const participant = createParticipant(profile, 0);
  const room: Room = {
    createdAt: new Date().toISOString(),
    id: roomId,
    messages: [
      {
        authorId: "system",
        authorName: "VoidLAB",
        createdAt: new Date().toISOString(),
        id: createId("msg"),
        text: `${participant.name} opened the collaboration room.`,
      },
    ],
    name: roomName?.trim() || "VoidLAB Collaboration Room",
    participants: new Map([[participant.id, participant]]),
    workspace: null,
  };

  roomStore.set(roomId, room);

  return res.status(201).json({
    ok: true,
    participantId: participant.id,
    room: serializeRoom(room),
  });
};

export const joinRoom = async (req: Request, res: Response) => {
  const room = getRoomOrThrow(req.params.roomId, res);

  if (!room) return;

  const { profile } = (req.body ?? {}) as {
    profile?: CollaboratorProfile;
  };

  if (!profile?.name?.trim()) {
    return res.status(400).json({
      error: "A collaborator name is required to join the room.",
    });
  }

  const participant = createParticipant(profile, room.participants.size);
  room.participants.set(participant.id, participant);
  room.messages.push({
    authorId: "system",
    authorName: "VoidLAB",
    createdAt: new Date().toISOString(),
    id: createId("msg"),
    text: `${participant.name} joined the room.`,
  });

  return res.status(200).json({
    ok: true,
    participantId: participant.id,
    room: serializeRoom(room),
  });
};

export const getRoomState = async (req: Request, res: Response) => {
  const room = getRoomOrThrow(req.params.roomId, res);

  if (!room) return;

  const participantId =
    typeof req.query.participantId === "string" ? req.query.participantId : "";

  if (participantId && room.participants.has(participantId)) {
    const participant = room.participants.get(participantId)!;
    participant.lastSeen = Date.now();
    room.participants.set(participantId, participant);
  }

  return res.status(200).json({
    ok: true,
    room: serializeRoom(room),
  });
};

export const updateWorkspace = async (req: Request, res: Response) => {
  const room = getRoomOrThrow(req.params.roomId, res);

  if (!room) return;

  const { activeFileId, files, participantId } = (req.body ?? {}) as {
    activeFileId?: string;
    files?: RoomFile[];
    participantId?: string;
  };

  if (!participantId || !room.participants.has(participantId)) {
    return res.status(400).json({
      error: "A valid participant id is required.",
    });
  }

  if (!activeFileId || !Array.isArray(files) || files.length === 0) {
    return res.status(400).json({
      error: "A complete workspace snapshot is required.",
    });
  }

  const author = room.participants.get(participantId)!;
  author.lastSeen = Date.now();
  room.participants.set(participantId, author);
  room.workspace = {
    activeFileId,
    files,
    updatedAt: new Date().toISOString(),
    updatedBy: author.name,
  };

  room.messages.push({
    authorId: "system",
    authorName: "VoidLAB",
    createdAt: new Date().toISOString(),
    id: createId("msg"),
    text: `${author.name} synced the workspace.`,
  });

  return res.status(200).json({
    ok: true,
    room: serializeRoom(room),
  });
};

export const postRoomMessage = async (req: Request, res: Response) => {
  const room = getRoomOrThrow(req.params.roomId, res);

  if (!room) return;

  const { participantId, text } = (req.body ?? {}) as {
    participantId?: string;
    text?: string;
  };

  if (!participantId || !room.participants.has(participantId)) {
    return res.status(400).json({
      error: "A valid participant id is required to send a message.",
    });
  }

  if (!text?.trim()) {
    return res.status(400).json({
      error: "Message text cannot be empty.",
    });
  }

  const author = room.participants.get(participantId)!;
  author.lastSeen = Date.now();
  room.participants.set(participantId, author);

  room.messages.push({
    authorId: author.id,
    authorName: author.name,
    createdAt: new Date().toISOString(),
    id: createId("msg"),
    text: text.trim(),
  });

  return res.status(201).json({
    ok: true,
    room: serializeRoom(room),
  });
};
