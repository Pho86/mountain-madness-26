"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { StickyNote } from "@/lib/types";

const COLORS = [
  "#fef08a", // yellow
  "#bbf7d0", // green
  "#bfdbfe", // blue
  "#fbcfe8", // pink
  "#ddd6fe", // violet
];

function randomColor() {
  return COLORS[Math.floor(Math.random() * COLORS.length)];
}

export function Sticky({
  note,
  onUpdate,
  onDelete,
  onDragEnd,
  isDragging,
}: {
  note: StickyNote;
  onUpdate: (n: StickyNote) => void;
  onDelete: (id: string) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [localText, setLocalText] = useState(note.text);

  useEffect(() => {
    if (!editing) setLocalText(note.text);
  }, [note.text, editing]);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    noteX: number;
    noteY: number;
    dragStarted?: boolean;
  } | null>(null);

  const DRAG_THRESHOLD = 5;

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if ((e.target as HTMLElement).closest("button")) return;
      if (editing) return;
      if ((e.target as HTMLElement).closest("textarea")) return;
      // Don't capture yet — wait for movement so double-click can fire
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        noteX: note.x,
        noteY: note.y,
      };
    },
    [editing, note.x, note.y]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragRef.current) return;
      const { startX, startY, noteX, noteY, dragStarted } = dragRef.current;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      const distance = Math.hypot(dx, dy);
      if (!dragStarted) {
        if (distance < DRAG_THRESHOLD) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        dragRef.current.dragStarted = true;
      }
      onUpdate({
        ...note,
        x: noteX + dx,
        y: noteY + dy,
      });
    },
    [note, onUpdate]
  );

  const handlePointerUp = useCallback(() => {
    if (dragRef.current) onDragEnd?.();
    dragRef.current = null;
  }, [onDragEnd]);

  const handleBlur = useCallback(() => {
    setEditing(false);
    if (localText.trim() !== note.text) {
      onUpdate({ ...note, text: localText.trim() || "New note" });
    }
  }, [localText, note, onUpdate]);

  return (
    <div
      className="absolute w-52 select-none rounded-lg shadow-lg transition-shadow"
      style={{
        left: note.x,
        top: note.y,
        backgroundColor: note.color,
        boxShadow: isDragging ? "0 20px 40px rgba(0,0,0,0.2)" : undefined,
        zIndex: isDragging ? 50 : 1,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <div className="flex items-start justify-between gap-1 rounded-t-lg border-b border-black/5 p-2">
        {editing ? (
          <textarea
            className="min-h-16 w-full resize-none rounded bg-white/60 p-1 text-sm outline-none"
            value={localText}
            onChange={(e) => setLocalText(e.target.value)}
            onBlur={handleBlur}
            autoFocus
          />
        ) : (
          <p
            className="min-h-10 flex-1 cursor-text rounded p-1 text-sm leading-snug text-zinc-800"
            onDoubleClick={(e) => {
              e.preventDefault();
              setLocalText(note.text);
              setEditing(true);
            }}
          >
            {note.text || "Double-click to edit"}
          </p>
        )}
        <button
          type="button"
          className="rounded p-1 text-zinc-500 hover:bg-black/10 hover:text-zinc-800"
          onClick={() => onDelete(note.id)}
          aria-label="Delete note"
        >
          ×
        </button>
      </div>
    </div>
  );
}

export function useAddSticky() {
  return useCallback((x: number, y: number) => {
    const note: StickyNote = {
      id: crypto.randomUUID(),
      x,
      y,
      text: "New note",
      color: randomColor(),
      createdAt: Date.now(),
    };
    return note;
  }, []);
}
