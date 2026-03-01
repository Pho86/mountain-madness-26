"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { StickyNote } from "@/lib/types";

const COLORS = [
  { bg: "#ffffff", border: "#e5e5e5", label: "white" },
  { bg: "#f5f5f5", border: "#d4d4d4", label: "grey" },
  { bg: "#fef9c3", border: "#fde047", label: "yellow" },
  { bg: "#ffedd5", border: "#fdba74", label: "orange" },
  { bg: "#dcfce7", border: "#86efac", label: "green" },
  { bg: "#cffafe", border: "#67e8f9", label: "cyan" },
  { bg: "#dbeafe", border: "#93c5fd", label: "blue" },
  { bg: "#ede9fe", border: "#c4b5fd", label: "violet" },
  { bg: "#fce7f3", border: "#f9a8d4", label: "pink" },
  { bg: "#fef2f2", border: "#fca5a5", label: "peach" },
];

const FONT_SIZE_PRESETS = [
  { label: "Small", value: 12 },
  { label: "Medium", value: 16 },
  { label: "Large", value: 20 },
];

const DEFAULT_FONT_SIZE = 16;

function randomColor() {
  const c = COLORS[Math.floor(Math.random() * COLORS.length)];
  return c.bg;
}

function getBorderColor(bg: string) {
  const found = COLORS.find((c) => c.bg === bg);
  return found?.border ?? "rgba(0,0,0,0.08)";
}

function StickyToolbar({
  note,
  onUpdate,
  onPointerDown,
  visible,
}: {
  note: StickyNote;
  onUpdate: (patch: Partial<StickyNote>) => void;
  onPointerDown: (e: React.PointerEvent) => void;
  visible: boolean;
}) {
  const [colorOpen, setColorOpen] = useState(false);
  const [customSizeOpen, setCustomSizeOpen] = useState(false);
  const [presetSizeOpen, setPresetSizeOpen] = useState(false);
  const colorJustOpenedRef = useRef(false);
  const fontSize = note.fontSize ?? DEFAULT_FONT_SIZE;
  const [sizeInput, setSizeInput] = useState(String(fontSize));
  const presetLabel = FONT_SIZE_PRESETS.find((p) => p.value === fontSize)?.label ?? String(fontSize);

  useEffect(() => {
    setSizeInput(String(note.fontSize ?? DEFAULT_FONT_SIZE));
  }, [note.fontSize]);

  useEffect(() => {
    if (colorOpen) {
      const t = setTimeout(() => {
        colorJustOpenedRef.current = false;
      }, 150);
      return () => clearTimeout(t);
    }
  }, [colorOpen]);

  const applyFontSize = (n: number) => {
    const clamped = Math.round(Math.max(10, Math.min(48, n)));
    onUpdate({ fontSize: clamped });
    setSizeInput(String(clamped));
  };

  return (
    <div
        className={`absolute left-1/2 bottom-full z-9999 mb-2 flex min-w-[420px] max-w-[90vw] -translate-x-1/2 items-center justify-between gap-1 rounded-full border border-zinc-600/80 bg-[#2c2c2c] py-2 pl-2 pr-3 transition-opacity duration-200 ${visible ? "opacity-100" : "pointer-events-none opacity-0"}`}
      onPointerDown={onPointerDown}
      role="toolbar"
    >
      {/* 1. Color dropdown */}
      <div className="relative flex items-center">
        <button
          type="button"
          onClick={() => {
            setColorOpen((o) => !o);
            setCustomSizeOpen(false);
            setPresetSizeOpen(false);
            if (!colorOpen) colorJustOpenedRef.current = true;
          }}
          className="flex items-center gap-1.5 rounded-full px-3 py-2 text-white/90 hover:bg-white/10"
          title="Note color"
          aria-expanded={colorOpen}
          aria-haspopup="true"
        >
          <span
            className="h-4 w-4 rounded-full border border-white/20"
            style={{ backgroundColor: note.color }}
          />
          <svg className="h-3.5 w-3.5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {colorOpen && (
          <div className="absolute left-0 top-full z-50 mt-1.5 min-w-[280px] rounded-xl border border-zinc-600 bg-[#2c2c2c] p-4">
            <div className="grid grid-cols-5 gap-3">
              {COLORS.map((c) => (
                <button
                  key={c.bg}
                  type="button"
                  onClick={() => {
                    if (colorJustOpenedRef.current) {
                      colorJustOpenedRef.current = false;
                      return;
                    }
                    onUpdate({ color: c.bg });
                    setColorOpen(false);
                  }}
                  onPointerDown={(e) => e.stopPropagation()}
                  className="h-10 w-10 rounded-full border-2 transition hover:scale-110"
                  style={{
                    backgroundColor: c.bg,
                    borderColor: note.color === c.bg ? "#8b5cf6" : c.border,
                  }}
                  title={c.label}
                  aria-label={c.label}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. Font size custom dropdown (Aa) */}
      <div className="relative flex items-center">
        <button
          type="button"
          onClick={() => {
            setCustomSizeOpen((o) => !o);
            setColorOpen(false);
            setPresetSizeOpen(false);
          }}
          className="flex items-center gap-1.5 rounded-full px-3 py-2 text-white/90 hover:bg-white/10"
          title="Font size (custom)"
          aria-expanded={customSizeOpen}
          aria-haspopup="true"
        >
          <span className="text-sm font-medium">Aa</span>
          <svg className="h-3.5 w-3.5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {customSizeOpen && (
          <div className="absolute left-0 top-full z-50 mt-1.5 rounded-lg border border-zinc-600 bg-[#2c2c2c] p-3">
            <p className="mb-2 text-xs font-medium text-white/70">Font size (px)</p>
            <input
              type="number"
              min={10}
              max={48}
              value={sizeInput}
              onChange={(e) => setSizeInput(e.target.value)}
              onBlur={() => {
                const n = parseInt(sizeInput, 10);
                if (!Number.isNaN(n)) applyFontSize(n);
                else setSizeInput(String(fontSize));
                setCustomSizeOpen(false);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  const n = parseInt(sizeInput, 10);
                  if (!Number.isNaN(n)) applyFontSize(n);
                  setCustomSizeOpen(false);
                  (e.target as HTMLInputElement).blur();
                }
              }}
              className="w-20 rounded border border-zinc-500 px-2 py-1.5 text-sm outline-none placeholder:text-zinc-400 focus:ring-1 focus:ring-white/30"
              style={{ backgroundColor: "#3f3f46", color: "#fff" }}
              autoFocus
            />
          </div>
        )}
      </div>

      {/* 3. Font size presets dropdown (Small / Medium / Large) */}
      <div className="relative flex items-center">
        <button
          type="button"
          onClick={() => {
            setPresetSizeOpen((o) => !o);
            setColorOpen(false);
            setCustomSizeOpen(false);
          }}
          className="flex items-center gap-1.5 rounded-full px-3 py-2 text-white/90 hover:bg-white/10"
          title="Font size preset"
          aria-expanded={presetSizeOpen}
          aria-haspopup="true"
        >
          <span className="text-sm">{presetLabel}</span>
          <svg className="h-3.5 w-3.5 text-white/70" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        {presetSizeOpen && (
          <div className="absolute left-0 top-full z-50 mt-1.5 rounded-lg border border-zinc-600 bg-[#2c2c2c] py-1">
            {FONT_SIZE_PRESETS.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => {
                  applyFontSize(p.value);
                  setPresetSizeOpen(false);
                }}
                className={`w-full px-4 py-2 text-left text-sm text-white/90 hover:bg-white/10 ${fontSize === p.value ? "bg-[#8b5cf6] font-medium text-white" : ""}`}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="h-5 w-px bg-white/15" aria-hidden />

      {/* 4. Bold */}
      <button
        type="button"
        onClick={() => onUpdate({ fontWeight: (note.fontWeight ?? "normal") === "bold" ? "normal" : "bold" })}
        className={`rounded-md px-4 py-2 font-bold ${(note.fontWeight ?? "normal") === "bold" ? "bg-[#8b5cf6] text-white" : "text-white/90 hover:bg-white/10"}`}
        title="Bold"
        aria-pressed={(note.fontWeight ?? "normal") === "bold"}
      >
        B
      </button>

      {/* 5. Italic */}
      <button
        type="button"
        onClick={() => onUpdate({ fontStyle: (note.fontStyle ?? "normal") === "italic" ? "normal" : "italic" })}
        className={`rounded-md px-4 py-2 font-serif italic ${(note.fontStyle ?? "normal") === "italic" ? "bg-[#8b5cf6] text-white" : "text-white/90 hover:bg-white/10"}`}
        title="Italic"
        aria-pressed={(note.fontStyle ?? "normal") === "italic"}
      >
        I
      </button>

      {/* 6. List */}
      <button
        type="button"
        onClick={() => onUpdate({ listStyle: (note.listStyle ?? "none") === "bullet" ? "none" : "bullet" })}
        className={`rounded-md px-4 py-2 ${(note.listStyle ?? "none") === "bullet" ? "bg-[#8b5cf6] text-white" : "text-white/90 hover:bg-white/10"}`}
        title="Bulleted list"
        aria-pressed={(note.listStyle ?? "none") === "bullet"}
      >
        <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 24 24" aria-hidden>
          <path d="M4 6h2v2H4V6zm0 5h2v2H4v-2zm0 5h2v2H4v-2zm3-10h11v1.5H7V6zm0 5h11v1.5H7V11zm0 5h11v1.5H7V16z" />
        </svg>
      </button>
    </div>
  );
}

export function Sticky({
  note,
  onUpdate,
  onDragEnd,
  onDragMove,
  onSelect,
  isDragging,
  isSelected,
  autoFocusEdit = false,
  onEditEnd,
  displayX,
  displayY,
  onSaveNote,
  zIndex = 1,
}: {
  note: StickyNote;
  onUpdate: (n: StickyNote) => void;
  onDragEnd?: (noteId: string, clientX: number, clientY: number) => void;
  onDragMove?: (clientX: number, clientY: number) => void;
  onSelect?: (noteId: string) => void;
  isDragging?: boolean;
  isSelected?: boolean;
  autoFocusEdit?: boolean;
  onEditEnd?: () => void;
  displayX?: number;
  displayY?: number;
  onSaveNote?: (note: StickyNote) => void;
  zIndex?: number;
}) {
  const x = displayX ?? note.x;
  const y = displayY ?? note.y;
  const [editing, setEditing] = useState(autoFocusEdit);
  const [localText, setLocalText] = useState(note.text);
  const hasAutoFocused = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const adjustTextareaHeight = useCallback(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = `${Math.max(ta.scrollHeight, 96)}px`;
  }, []);

  useEffect(() => {
    if (editing) adjustTextareaHeight();
  }, [editing, localText, adjustTextareaHeight]);

  useEffect(() => {
    if (!editing) setLocalText(note.text);
  }, [note.text, editing]);

  useEffect(() => {
    if (editing && (note.listStyle ?? "none") === "bullet") {
      setLocalText((prev) => {
        const raw = prev.split("\n").map((l) => l.replace(/^•\s?/, "")).join("\n");
        return raw.split("\n").map((l) => "• " + l).join("\n");
      });
    } else if (editing && (note.listStyle ?? "none") === "none") {
      setLocalText((prev) => prev.split("\n").map((l) => l.replace(/^•\s?/, "")).join("\n"));
    }
  }, [editing, note.listStyle]);

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
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        noteX: x,
        noteY: y,
      };
    },
    [x, y]
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
      if (onDragMove) onDragMove(e.clientX, e.clientY);
    },
    [note, onUpdate, onDragMove]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      const hadPointerDown = dragRef.current !== null;
      const wasDragging = dragRef.current?.dragStarted;
      const noteId = note.id;
      if (wasDragging && onDragEnd) {
        onDragEnd(noteId, e.clientX, e.clientY);
      } else if (hadPointerDown && !wasDragging && onSelect) {
        onSelect(noteId);
      }
      dragRef.current = null;
    },
    [note.id, onDragEnd, onSelect]
  );

  const handleBlur = useCallback(() => {
    setEditing(false);
    const raw = (note.listStyle ?? "none") === "bullet"
      ? localText.split("\n").map((l) => l.replace(/^•\s?/, "")).join("\n")
      : localText.trim();
    const newText = raw || "";
    if (newText !== note.text) {
      const updated = { ...note, text: newText };
      onSaveNote?.(updated);
    }
    onEditEnd?.();
  }, [localText, note, onSaveNote, onEditEnd]);

  const handleToolbarUpdate = useCallback(
    (patch: Partial<StickyNote>) => {
      const updated = { ...note, ...patch };
      onSaveNote?.(updated);
    },
    [note, onSaveNote]
  );

  const borderColor = getBorderColor(note.color);
  const fontSizePx = note.fontSize ?? DEFAULT_FONT_SIZE;
  const fontWeight = note.fontWeight ?? "normal";
  const fontStyle = note.fontStyle ?? "normal";
  const listStyle = note.listStyle ?? "none";
  const isBold = fontWeight === "bold";
  const isItalic = fontStyle === "italic";
  const isBullet = listStyle === "bullet";

  const handleTextareaKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if ((note.listStyle ?? "none") !== "bullet" || e.key !== "Enter") return;
      e.preventDefault();
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const before = localText.slice(0, start);
      const after = localText.slice(end);
      const newValue = before + "\n• " + after;
      setLocalText(newValue);
      requestAnimationFrame(() => {
        ta.selectionStart = ta.selectionEnd = start + 3;
      });
    },
    [localText, note.listStyle]
  );

  return (
      <div
        className={`absolute w-56 ${isDragging ? "transition-shadow duration-150" : "transition-all duration-150"}`}
        style={{
        left: x,
        top: y,
        zIndex,
      }}
      onPointerDown={handlePointerDown}
      onPointerMoveCapture={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {isSelected && (
        <StickyToolbar
          note={note}
          onUpdate={handleToolbarUpdate}
          onPointerDown={(e) => e.stopPropagation()}
          visible={!isDragging}
        />
      )}
      <div
        className={`flex min-h-[200px] flex-col rounded-lg border-2 transition-shadow ${
          isSelected ? "outline-2 outline-blue-500 outline-offset-0" : ""
        }`}
        style={{
          backgroundColor: note.color,
          borderColor,
        }}
      >
        <div className="flex min-h-0 flex-1 flex-col gap-1 p-3 select-none">
          {editing ? (
            <textarea
              ref={textareaRef}
              className="-mx-3 min-h-24 w-[calc(100%+1.5rem)] resize-none wrap-break-word border-0 px-3 py-2 font-normal text-zinc-900 placeholder:text-zinc-600/70 outline-none select-text"
              style={{
                backgroundColor: "transparent",
                fontSize: fontSizePx,
                fontWeight: isBold ? "bold" : "normal",
                fontStyle: isItalic ? "italic" : "normal",
              }}
              value={localText}
              onChange={(e) => {
                setLocalText(e.target.value);
                adjustTextareaHeight();
              }}
              onBlur={handleBlur}
              onKeyDown={handleTextareaKeyDown}
              autoFocus
              placeholder="Type something…"
              rows={1}
            />
          ) : (
            <p
              className="min-h-20 flex-1 cursor-grab wrap-break-word rounded p-2 font-normal leading-normal text-zinc-800 whitespace-pre-wrap"
              style={{
                fontSize: fontSizePx,
                fontWeight: isBold ? "bold" : "normal",
                fontStyle: isItalic ? "italic" : "normal",
              }}
              onDoubleClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setLocalText(
                  (note.listStyle ?? "none") === "bullet"
                    ? "• " + note.text.split("\n").join("\n• ")
                    : note.text
                );
                setEditing(true);
              }}
            >
              {isBullet && note.text
                ? note.text.split("\n").map((line, i) => (
                    <span key={i}>
                      {i > 0 && <br />}
                      • {line}
                    </span>
                  ))
                : note.text || "Double-click to edit"}
            </p>
          )}
          {(note.authorName && (
            <div className="mt-auto flex items-center gap-1.5 text-xs text-zinc-600">
              <span className="truncate font-medium" title={note.authorName}>
                {note.authorName}
              </span>
            </div>
          )) || <div className="mt-auto" />}
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
        fontSize: 16,
        createdAt: Date.now(),
        authorName: authorName ?? undefined,
      };
      return note;
    },
    [authorName]
  );
}
