"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Copy, Loader2, MessagesSquare, RefreshCcw, Share2, Users2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useUser } from "@/context/UserContext";
import { apiBaseUrl } from "@/lib/api";
import { persistWorkspace, readWorkspace } from "@/lib/workspace";

type RoomMessage = {
  authorId: string;
  authorName: string;
  createdAt: string;
  id: string;
  text: string;
};

type Participant = {
  color: string;
  id: string;
  name: string;
};

type RoomState = {
  id: string;
  messages: RoomMessage[];
  name: string;
  participants: Participant[];
  workspace: {
    activeFileId: string;
    files: Array<{
      content: string;
      id: string;
      languageId: string;
      name: string;
      path: string;
    }>;
    folders: string[];
    updatedAt: string;
    updatedBy: string;
  } | null;
};

export default function CollaborationPanel() {
  const searchParams = useSearchParams();
  const initialRoomId = searchParams.get("room")?.toUpperCase() ?? "";
  const { profile } = useUser();
  const [roomId, setRoomId] = useState(initialRoomId);
  const [roomName, setRoomName] = useState("VoidLAB Team Room");
  const [participantId, setParticipantId] = useState("");
  const [room, setRoom] = useState<RoomState | null>(null);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState(
    initialRoomId
      ? `Room ${initialRoomId} is ready to join.`
      : "Create a room or join one to start collaborating.",
  );
  const [loading, setLoading] = useState(false);

  const canCollaborate = Boolean(profile?.name);

  const roomShareLink = useMemo(() => {
    if (!room?.id || typeof window === "undefined") return "";
    return `${window.location.origin}/editor/collaboration?room=${room.id}`;
  }, [room?.id]);

  const syncRoom = async (targetRoomId: string, currentParticipantId: string) => {
    const response = await fetch(
      `${apiBaseUrl}/api/collaboration/rooms/${targetRoomId}?participantId=${currentParticipantId}`,
    );
    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || "Unable to refresh the collaboration room.");
    }

    setRoom(data.room);
  };

  useEffect(() => {
    if (!roomId || !participantId) return;

    const interval = window.setInterval(() => {
      void syncRoom(roomId, participantId).catch(() => undefined);
    }, 5000);

    return () => window.clearInterval(interval);
  }, [participantId, roomId]);

  const handleCreateRoom = async () => {
    if (!profile) return;

    setLoading(true);

    try {
      const response = await fetch(`${apiBaseUrl}/api/collaboration/rooms`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          profile,
          roomName,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to create room.");
      }

      setRoom(data.room);
      setRoomId(data.room.id);
      setParticipantId(data.participantId);
      setStatus(`Room ${data.room.id} is ready. Share it with your team.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to create room.");
    } finally {
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!profile || !roomId.trim()) return;

    setLoading(true);

    try {
      const response = await fetch(
        `${apiBaseUrl}/api/collaboration/rooms/${roomId.trim().toUpperCase()}/join`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ profile }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to join room.");
      }

      setRoom(data.room);
      setRoomId(data.room.id);
      setParticipantId(data.participantId);
      setStatus(`Connected to room ${data.room.id}.`);
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to join room.");
    } finally {
      setLoading(false);
    }
  };

  const handlePushWorkspace = async () => {
    if (!roomId || !participantId) return;

    setLoading(true);

    try {
      const workspace = readWorkspace();
      const response = await fetch(`${apiBaseUrl}/api/collaboration/rooms/${roomId}/workspace`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          activeFileId: workspace.activeFileId,
          files: workspace.files,
          folders: workspace.folders,
          participantId,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to sync the workspace.");
      }

      setRoom(data.room);
      setStatus("Workspace pushed to the collaboration room.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to sync workspace.");
    } finally {
      setLoading(false);
    }
  };

  const handlePullWorkspace = () => {
    if (!room?.workspace) return;

    const current = readWorkspace();
    persistWorkspace({
      ...current,
      activeFileId: room.workspace.activeFileId,
      files: room.workspace.files,
      folders: room.workspace.folders,
    });
    setStatus(`Pulled the latest workspace shared by ${room.workspace.updatedBy}.`);
  };

  const handleSendMessage = async () => {
    if (!roomId || !participantId || !message.trim()) return;

    try {
      const response = await fetch(`${apiBaseUrl}/api/collaboration/rooms/${roomId}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          participantId,
          text: message,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Unable to send message.");
      }

      setRoom(data.room);
      setMessage("");
      setStatus("Message sent to the room.");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Unable to send message.");
    }
  };

  const copyShareLink = async () => {
    if (!roomShareLink) return;

    await navigator.clipboard.writeText(roomShareLink);
    setStatus("Collaboration link copied.");
  };

  return (
    <div className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
      <section className="rounded-[28px] border border-white/10 bg-white/5 p-5">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-300/20 bg-sky-300/10 text-sky-100">
            <Users2 size={18} />
          </div>
          <div>
            <div className="text-sm font-semibold text-white">Room controls</div>
            <div className="text-sm text-slate-300">
              Create a room, join a room, and sync the current workspace with your team.
            </div>
          </div>
        </div>

        <div className="mt-5 space-y-3">
          <input
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-slate-100 outline-none placeholder:text-slate-500 focus:border-sky-300"
            onChange={(event) => setRoomName(event.target.value)}
            placeholder="Room name"
            value={roomName}
          />
          <input
            className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm uppercase text-slate-100 outline-none placeholder:text-slate-500 focus:border-sky-300"
            onChange={(event) => setRoomId(event.target.value)}
            placeholder="Enter room code"
            value={roomId}
          />
        </div>

        <div className="mt-4 grid gap-3">
          <Button disabled={!canCollaborate || loading} onClick={() => void handleCreateRoom()} type="button">
            {loading ? <Loader2 size={15} className="animate-spin" /> : <Share2 size={15} />}
            Create room
          </Button>
          <Button
            disabled={!canCollaborate || loading || !roomId.trim()}
            onClick={() => void handleJoinRoom()}
            tone="secondary"
            type="button"
          >
            Join room
          </Button>
        </div>

        <div className="mt-4 rounded-[24px] border border-white/10 bg-slate-950/40 p-4 text-sm leading-7 text-slate-300">
          {status}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Button disabled={!room} onClick={() => void handlePushWorkspace()} tone="secondary" type="button">
            Push workspace
          </Button>
          <Button disabled={!room?.workspace} onClick={handlePullWorkspace} tone="secondary" type="button">
            Pull workspace
          </Button>
        </div>

        {roomShareLink ? (
          <button
            className="mt-4 inline-flex items-center gap-2 rounded-2xl border border-sky-300/20 bg-sky-300/10 px-4 py-3 text-sm text-sky-50"
            onClick={() => void copyShareLink()}
            type="button"
          >
            <Copy size={15} />
            Copy share link
          </button>
        ) : null}
      </section>

      <section className="grid gap-5">
        <div className="grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
            <div className="text-sm font-semibold text-white">Participants</div>
            <div className="mt-4 space-y-3">
              {room?.participants.length ? (
                room.participants.map((participant) => (
                  <div
                    className="flex items-center gap-3 rounded-[22px] border border-white/10 bg-white/5 px-4 py-3"
                    key={participant.id}
                  >
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: participant.color }}
                    />
                    <span className="text-sm text-slate-100">{participant.name}</span>
                  </div>
                ))
              ) : (
                <div className="text-sm text-slate-300">No active room yet.</div>
              )}
            </div>
          </div>

          <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-sm font-semibold text-white">Shared workspace</div>
                <div className="text-sm text-slate-300">
                  {room?.workspace
                    ? `Last synced by ${room.workspace.updatedBy}`
                    : "No shared workspace has been synced yet."}
                </div>
              </div>
              <button
                className="rounded-2xl border border-white/10 bg-white/5 p-2 text-slate-100"
                onClick={() => void syncRoom(roomId, participantId)}
                type="button"
              >
                <RefreshCcw size={16} />
              </button>
            </div>

            <div className="mt-4 rounded-[24px] border border-white/10 bg-slate-950/40 p-4 text-sm text-slate-300">
              {room?.workspace ? (
                <>
                  <div>Files shared: {room.workspace.files.length}</div>
                  <div className="mt-2">Folders shared: {room.workspace.folders.length}</div>
                  <div className="mt-2">
                    Updated at: {new Date(room.workspace.updatedAt).toLocaleString()}
                  </div>
                </>
              ) : (
                <div>Push the current editor state to give your teammates a live snapshot.</div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-white/10 bg-white/5 p-5">
          <div className="flex items-center gap-2 text-sm font-semibold text-white">
            <MessagesSquare size={16} />
            Team chat
          </div>
          <div className="scrollbar-thin mt-4 h-[320px] space-y-3 overflow-y-auto pr-2">
            {room?.messages.length ? (
              room.messages.map((entry) => (
                <div className="rounded-[22px] border border-white/10 bg-white/5 px-4 py-3" key={entry.id}>
                  <div className="text-sm font-medium text-white">{entry.authorName}</div>
                  <div className="mt-1 text-sm leading-7 text-slate-300">{entry.text}</div>
                </div>
              ))
            ) : (
              <div className="text-sm text-slate-300">Messages will appear here once a room is active.</div>
            )}
          </div>

          <div className="mt-4 rounded-[24px] border border-white/10 bg-slate-950/40 p-3">
            <textarea
              className="min-h-[110px] w-full resize-none bg-transparent text-sm leading-7 text-slate-100 outline-none placeholder:text-slate-500"
              onChange={(event) => setMessage(event.target.value)}
              placeholder="Send a quick update to your collaborators..."
              value={message}
            />
            <div className="mt-3 flex justify-end">
              <Button disabled={!room || !message.trim()} onClick={() => void handleSendMessage()} type="button">
                Send message
              </Button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
