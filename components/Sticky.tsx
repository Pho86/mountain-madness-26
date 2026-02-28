"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { StickyNote } from "@/lib/types";

const COLORS = [
  { bg: "#fef9c3", border: "#fde047", label: "yellow" },
  { bg: "#dcfce7", border: "#86efac", label: "green" },
  { bg: "#dbeafe", border: "#93c5fd", label: "blue" },
  { bg: "#fce7f3", border: "#f9a8d4", label: "pink" },
  { bg: "#ede9fe", border: "#c4b5fd", label: "violet" },
  { bg: "#ffedd5", border: "#fdba74", label: "orange" },
];

function randomColor() {
  const c = COLORS[Math.floor(Math.random() * COLORS.length)];
  return c.bg;
}

function getBorderColor(bg: string) {
  const found = COLORS.find((c) => c.bg === bg);
  return found?.border ?? "rgba(0,0,0,0.08)";
}

function formatNoteDate(ms: number): string {
  const d = new Date(ms);
  const now = new Date();
  const sameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  if (sameDay) {
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
  }
  const opts: Intl.DateTimeFormatOptions = {
    month: "short",
    day: "numeric",
  };
  if (d.getFullYear() !== now.getFullYear()) opts.year = "numeric";
  return d.toLocaleDateString([], opts);
}

export function Sticky({
  note,
  onUpdate,
  onDragEnd,
  onSelect,
  isDragging,
  isSelected,
  autoFocusEdit = false,
  onEditEnd,
  displayX,
  displayY,
  onSaveNote,
}: {
  note: StickyNote;
  onUpdate: (n: StickyNote) => void;
  onDragEnd?: (noteId: string, clientX: number, clientY: number) => void;
  onSelect?: (noteId: string) => void;
  isDragging?: boolean;
  isSelected?: boolean;
  autoFocusEdit?: boolean;
  onEditEnd?: () => void;
  displayX?: number;
  displayY?: number;
  onSaveNote?: (note: StickyNote) => void;
}) {
  const x = displayX ?? note.x;
  const y = displayY ?? note.y;
  const [editing, setEditing] = useState(autoFocusEdit);
  const [localText, setLocalText] = useState(note.text);
  const hasAutoFocused = useRef(false);

  useEffect(() => {
    if (!editing) setLocalText(note.text);
  }, [note.text, editing]);

  useEffect(() => {
    if (autoFocusEdit && !hasAutoFocused.current) {
      hasAutoFocused.current = true;
      setEditing(true);
    }
  }, [autoFocusEdit]);

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
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        noteX: x,
        noteY: y,
      };
    },
    [editing, x, y]
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

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      const wasDragging = dragRef.current?.dragStarted;
      const noteId = note.id;
      if (wasDragging && onDragEnd) {
        onDragEnd(noteId, e.clientX, e.clientY);
      } else if (!wasDragging && onSelect) {
        onSelect(noteId);
      }
      dragRef.current = null;
    },
    [note.id, onDragEnd, onSelect]
  );

  const handleBlur = useCallback(() => {
    setEditing(false);
    const newText = localText.trim() || "";
    if (newText !== note.text) {
      const updated = { ...note, text: newText };
      onSaveNote?.(updated);
    }
    onEditEnd?.();
  }, [localText, note, onSaveNote, onEditEnd]);

  const borderColor = getBorderColor(note.color);

  return (
    <div
      className="absolute w-56 transition-all duration-150"
      style={{
        left: x,
        top: y,
        zIndex: isDragging ? 50 : 1,
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      <div
        className={`flex min-h-[120px] flex-col rounded-lg border-2 shadow-md transition-shadow ${
          isSelected
            ? "ring-2 ring-blue-500 ring-offset-2 border-blue-500"
            : ""
        }`}
        style={{
          backgroundColor: note.color,
          borderColor: isSelected ? "rgb(59 130 246)" : borderColor,
          boxShadow: isDragging
            ? "0 25px 50px -12px rgba(0,0,0,0.25)"
            : "0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -2px rgba(0,0,0,0.1)",
        }}
      >
        <div className="flex flex-1 flex-col gap-1 p-3 select-text">
          {editing ? (
            <textarea
              className="min-h-20 w-full resize-none rounded border-0 bg-white/90 p-2 text-base font-normal text-zinc-900 placeholder:text-zinc-400 outline-none"
              value={localText}
              onChange={(e) => setLocalText(e.target.value)}
              onBlur={handleBlur}
              onPointerDown={(e) => e.stopPropagation()}
              autoFocus
              placeholder="Type something…"
            />
          ) : (
            <p
              className="min-h-14 flex-1 cursor-text rounded p-2 text-base font-normal leading-normal text-zinc-800 select-text"
              onPointerDown={(e) => e.stopPropagation()}
              onDoubleClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setLocalText(note.text);
                setEditing(true);
              }}
            >
              {note.text || "Double-click to edit"}
            </p>
          )}
          <div className="mt-auto flex items-center gap-1.5 text-xs text-zinc-600">
            {note.authorName && (
              <span className="truncate font-medium" title={note.authorName}>
                {note.authorName}
              </span>
            )}
            {note.authorName && <span>·</span>}
            <span title={new Date(note.createdAt).toLocaleString()}>
              {formatNoteDate(note.createdAt)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export function useAddSticky(authorName?: string) {
  return useCallback(
    (x: number, y: number) => {
      const note: StickyNote = {
        id: crypto.randomUUID(),
        x,
        y,
        text: "",
        color: randomColor(),
        createdAt: Date.now(),
        authorName: authorName ?? undefined,
      };
      return note;
    },
    [authorName]
  );
}
