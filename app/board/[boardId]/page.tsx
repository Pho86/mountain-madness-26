"use client";

import { useCallback, useState } from "react";
import { useParams } from "next/navigation";
import { useBoardFirestore } from "@/lib/use-board-firestore";
import { Sticky, useAddSticky } from "@/components/Sticky";
import type { StickyNote } from "@/lib/types";

export default function BoardPage() {
  const params = useParams();
  const boardId = typeof params.boardId === "string" ? params.boardId : null;
  const { notes, connected, addNote, updateNote, deleteNote } =
    useBoardFirestore(boardId);
  const createSticky = useAddSticky();
  const [draggingId, setDraggingId] = useState<string | null>(null);

  const handleBoardClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if ((e.target as HTMLElement).closest("[data-sticky]")) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left - 80;
      const y = e.clientY - rect.top - 40;
      const note = createSticky(x, y);
      addNote(note);
    },
    [addNote, createSticky]
  );

  const handleUpdate = useCallback(
    (note: StickyNote) => {
      setDraggingId(note.id);
      updateNote(note);
    },
    [updateNote]
  );

  const handleUpdateEnd = useCallback(() => {
    setDraggingId(null);
  }, []);

  if (!boardId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-100">
        <p className="text-zinc-500">Invalid board</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-100">
      <header className="flex items-center justify-between border-b border-zinc-200 bg-white px-4 py-3 shadow-sm">
        <h1 className="text-lg font-semibold text-zinc-800">
          Sticky Board
          <span className="ml-2 font-mono text-sm font-normal text-zinc-500">
            /{boardId}
          </span>
        </h1>
        <div className="flex items-center gap-3">
          <span
            className={`h-2 w-2 rounded-full ${
              connected ? "bg-emerald-500" : "bg-red-500"
            }`}
            title={connected ? "Connected" : "Disconnected"}
          />
          <span className="text-sm text-zinc-500">
            {connected ? "Live" : "Reconnecting…"}
          </span>
          <button
            type="button"
            className="rounded-lg bg-zinc-800 px-3 py-1.5 text-sm text-white hover:bg-zinc-700"
            onClick={() => {
              navigator.clipboard.writeText(
                `${typeof window !== "undefined" ? window.location.origin : ""}/board/${boardId}`
              );
            }}
          >
            Copy link
          </button>
        </div>
      </header>

      <main
        className="relative flex-1 overflow-auto"
        style={{ minHeight: "calc(100vh - 56px)" }}
        onClick={handleBoardClick}
      >
        <div className="absolute inset-0" />
        {notes.map((note) => (
          <div key={note.id} data-sticky>
            <Sticky
              note={note}
              onUpdate={handleUpdate}
              onDelete={deleteNote}
              onDragEnd={handleUpdateEnd}
              isDragging={draggingId === note.id}
            />
          </div>
        ))}
        <p className="absolute bottom-4 left-4 text-sm text-zinc-400">
          Click anywhere to add a note · Drag to move · Double-click to edit
        </p>
      </main>
    </div>
  );
}
