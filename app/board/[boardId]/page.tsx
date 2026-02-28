"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { useBoardFirestore } from "@/lib/use-board-firestore";
import { useAuth } from "@/lib/auth-context";
import { Sticky, useAddSticky } from "@/components/Sticky";
import { BoardToolbar } from "@/components/BoardToolbar";
import { DeleteZone } from "@/components/DeleteZone";
import type { StickyNote } from "@/lib/types";

type Tool = "cursor" | "sticky";

const DELETE_ZONE_SELECTOR = "[data-delete-zone]";

function isPointInRect(x: number, y: number, rect: DOMRect): boolean {
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

export default function BoardPage() {
  const params = useParams();
  const boardId = typeof params.boardId === "string" ? params.boardId : null;
  const { user } = useAuth();
  const { notes, connected, addNote, updateNote, deleteNote } =
    useBoardFirestore(boardId);
  const authorName = user?.displayName || user?.email?.split("@")[0] || undefined;
  const createSticky = useAddSticky(authorName);
  const [tool, setTool] = useState<Tool>("cursor");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [lastCreatedNoteId, setLastCreatedNoteId] = useState<string | null>(null);
  const [optimisticPosition, setOptimisticPosition] = useState<Record<string, { x: number; y: number }>>({});
  const deleteZoneRef = useRef<HTMLDivElement>(null);

  const handleBoardClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if ((e.target as HTMLElement).closest("[data-sticky]")) return;
      if (tool === "sticky") {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left - 80;
        const y = e.clientY - rect.top - 40;
        const note = createSticky(x, y);
        addNote(note);
        setLastCreatedNoteId(note.id);
      } else {
        setSelectedNoteId(null);
      }
    },
    [tool, addNote, createSticky]
  );

  const handleEditEnd = useCallback(() => {
    setLastCreatedNoteId(null);
  }, []);

  const handleDragEnd = useCallback(
    (noteId: string, clientX: number, clientY: number) => {
      let droppedOnDelete = false;
      const zone = deleteZoneRef.current;
      if (zone) {
        const rect = zone.getBoundingClientRect();
        droppedOnDelete = isPointInRect(clientX, clientY, rect);
      }
      if (!droppedOnDelete) {
        const el = document.elementFromPoint(clientX, clientY);
        droppedOnDelete = !!el?.closest(DELETE_ZONE_SELECTOR);
      }
      if (droppedOnDelete) {
        deleteNote(noteId);
        setSelectedNoteId((id) => (id === noteId ? null : id));
      } else {
        const finalPos = optimisticPosition[noteId];
        const note = notes.find((n) => n.id === noteId);
        if (note && finalPos) {
          updateNote({ ...note, x: finalPos.x, y: finalPos.y });
        }
      }
      setOptimisticPosition((prev) => {
        const next = { ...prev };
        delete next[noteId];
        return next;
      });
      setDraggingId(null);
    },
    [deleteNote, notes, optimisticPosition, updateNote]
  );

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Delete" && e.key !== "Backspace") return;
      if ((e.target as HTMLElement).closest("textarea, input")) return;
      if (!selectedNoteId) return;
      e.preventDefault();
      deleteNote(selectedNoteId);
      setSelectedNoteId(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedNoteId, deleteNote]);

  const handleUpdate = useCallback((note: StickyNote) => {
    setDraggingId(note.id);
    setOptimisticPosition((prev) => ({
      ...prev,
      [note.id]: { x: note.x, y: note.y },
    }));
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

      <BoardToolbar tool={tool} onToolChange={setTool} />

      <main
        className="relative flex-1 overflow-auto"
        style={{
          minHeight: "calc(100vh - 56px - 44px)",
          cursor: tool === "sticky" ? "crosshair" : "default",
        }}
        onClick={handleBoardClick}
      >
        <div className="absolute inset-0" />
        {notes.map((note) => {
          const opt = optimisticPosition[note.id];
          return (
            <div key={note.id} data-sticky>
              <Sticky
                note={note}
                onUpdate={handleUpdate}
                onDragEnd={handleDragEnd}
                onSelect={setSelectedNoteId}
                isDragging={draggingId === note.id}
                isSelected={selectedNoteId === note.id}
                autoFocusEdit={lastCreatedNoteId === note.id}
                onEditEnd={handleEditEnd}
                displayX={opt?.x}
                displayY={opt?.y}
              />
            </div>
          );
        })}
        <p className="absolute bottom-4 left-4 text-sm text-zinc-400">
          {tool === "sticky"
            ? "Click on the board to add a note"
            : "Click to select · Double-click to edit · Drag to delete zone or press Delete"}
        </p>
      </main>

      <div className="pointer-events-none absolute inset-0 flex items-end justify-center pb-6">
        <div
          ref={deleteZoneRef}
          data-delete-zone
          className="pointer-events-auto flex cursor-default items-center gap-2 rounded-full border border-zinc-200 bg-white px-5 py-3 shadow-lg transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
        >
          <DeleteZone />
        </div>
      </div>
    </div>
  );
}
