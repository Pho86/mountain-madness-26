"use client";

import { useEffect, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import type { StickyNote } from "@/lib/types";

const WS_URL =
  typeof window !== "undefined"
    ? (process.env.NEXT_PUBLIC_WS_URL || "http://localhost:3001")
    : "";

export function useBoardSocket(boardId: string | null) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [notes, setNotes] = useState<StickyNote[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!boardId || !WS_URL) return;
    const s = io(WS_URL, { autoConnect: true });
    setSocket(s);

    s.on("connect", () => setConnected(true));
    s.on("disconnect", () => setConnected(false));
    s.on("board:state", (state: { notes: StickyNote[] }) =>
      setNotes(state.notes ?? [])
    );
    s.on("note:added", (note: StickyNote) =>
      setNotes((prev) => [...prev.filter((n) => n.id !== note.id), note])
    );
    s.on("note:updated", (note: StickyNote) =>
      setNotes((prev) =>
        prev.map((n) => (n.id === note.id ? note : n))
      )
    );
    s.on("note:deleted", (id: string) =>
      setNotes((prev) => prev.filter((n) => n.id !== id))
    );

    s.emit("board:join", boardId);

    return () => {
      s.emit("board:leave", boardId);
      s.removeAllListeners();
      s.disconnect();
      setSocket(null);
      setConnected(false);
    };
  }, [boardId]);

  const addNote = useCallback(
    (note: StickyNote) => {
      if (!socket || !boardId) return;
      setNotes((prev) => [...prev.filter((n) => n.id !== note.id), note]);
      socket.emit("note:add", boardId, note);
    },
    [socket, boardId]
  );

  const updateNote = useCallback(
    (note: StickyNote) => {
      if (!socket || !boardId) return;
      setNotes((prev) =>
        prev.map((n) => (n.id === note.id ? note : n))
      );
      socket.emit("note:update", boardId, note);
    },
    [socket, boardId]
  );

  const deleteNote = useCallback(
    (id: string) => {
      if (!socket || !boardId) return;
      setNotes((prev) => prev.filter((n) => n.id !== id));
      socket.emit("note:delete", boardId, id);
    },
    [socket, boardId]
  );

  return { notes, connected, addNote, updateNote, deleteNote };
}
