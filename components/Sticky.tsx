"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { ChevronDownIcon, ListBulletIcon, TrashIcon } from "@heroicons/react/24/outline";
import type { StickyNote } from "@/lib/types";
import { getAvatarUrl } from "@/lib/avatars";

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
const IMAGE_BASE_W = 224;
const IMAGE_BASE_H = 200;
const IMAGE_SCALE_MIN = 0.25;
const IMAGE_SCALE_MAX = 3;
/** 0–1: how much pointer distance change affects scale (lower = slower resize) */
const RESIZE_SENSITIVITY = 0.35;

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
  onDelete,
  visible,
}: {
  note: StickyNote;
  onUpdate: (patch: Partial<StickyNote>) => void;
  onPointerDown: (e: React.PointerEvent) => void;
  onDelete?: () => void;
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
          <ChevronDownIcon className="h-3.5 w-3.5 text-white/70" />
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
          <ChevronDownIcon className="h-3.5 w-3.5 text-white/70" />
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
          <ChevronDownIcon className="h-3.5 w-3.5 text-white/70" />
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
        <ListBulletIcon className="h-4 w-4" aria-hidden />
      </button>

      {onDelete && (
        <>
          <div className="h-5 w-px bg-white/15" aria-hidden />
          <button
            type="button"
            onClick={onDelete}
            className="rounded-md px-4 py-2 text-white/90 hover:bg-red-600/80 hover:text-white"
            title="Delete"
            aria-label="Delete"
          >
            <TrashIcon className="h-4 w-4" aria-hidden />
          </button>
        </>
      )}
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
  showToolbar,
  autoFocusEdit = false,
  onEditEnd,
  displayX,
  displayY,
  onSaveNote,
  onToolbarPatch,
  onDelete,
  dragPosition,
  zoom,
  zIndex = 1,
}: {
  note: StickyNote;
  onUpdate: (n: StickyNote) => void;
  onDragEnd?: (noteId: string, clientX: number, clientY: number) => void;
  onDragMove?: (clientX: number, clientY: number) => void;
  onSelect?: (noteId: string, shiftKey?: boolean) => void;
  isDragging?: boolean;
  isSelected?: boolean;
  showToolbar?: boolean;
  autoFocusEdit?: boolean;
  onEditEnd?: () => void;
  displayX?: number;
  displayY?: number;
  onSaveNote?: (note: StickyNote) => void;
  onToolbarPatch?: (patch: Partial<StickyNote>) => void;
  onDelete?: () => void;
  /** Content-space position for drag (use when parent positions the wrapper); required for correct drag when displayX/displayY are 0 */
  dragPosition?: { x: number; y: number };
  /** Board zoom (1 = 100%); needed to convert pointer delta to content space */
  zoom?: number;
  zIndex?: number;
}) {
  const x = displayX ?? note.x;
  const y = displayY ?? note.y;
  const zoomLevel = zoom ?? 1;
  const dragOrigin = dragPosition ?? { x: note.x, y: note.y };
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

  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const REALTIME_SAVE_DEBOUNCE_MS = 200;
  useEffect(() => {
    if (!editing || !onSaveNote) return;
    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveTimeoutRef.current = null;
      const raw = (note.listStyle ?? "none") === "bullet"
        ? localText.split("\n").map((l) => l.replace(/^•\s?/, "")).join("\n")
        : localText.trim();
      const newText = raw || "";
      if (newText !== note.text) {
        onSaveNote({ ...note, text: newText });
      }
    }, REALTIME_SAVE_DEBOUNCE_MS);
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [editing, localText, note, onSaveNote]);

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

  const [isResizing, setIsResizing] = useState(false);
  const [resizeScale, setResizeScale] = useState(1);
  const resizeStartRef = useRef<{
    centerX: number;
    centerY: number;
    startDistance: number;
    startScale: number;
  } | null>(null);
  const resizeScaleRef = useRef(1);
  const cardRef = useRef<HTMLDivElement | null>(null);

  const getScaleFromPointer = useCallback(
    (clientX: number, clientY: number): number => {
      const start = resizeStartRef.current;
      if (!start) return resizeScaleRef.current;
      const { centerX, centerY, startDistance, startScale } = start;
      const dx = clientX - centerX;
      const dy = clientY - centerY;
      const currentDistance = Math.hypot(dx, dy) || startDistance;
      const ratio = currentDistance / startDistance;
      const newScale = startScale * (1 + (ratio - 1) * RESIZE_SENSITIVITY);
      return Math.max(IMAGE_SCALE_MIN, Math.min(IMAGE_SCALE_MAX, newScale));
    },
    []
  );

  const handleResizePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      const card = cardRef.current;
      if (!card) return;
      const rect = card.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const startScale = note.imageScale ?? 1;
      const startDistance = Math.hypot(e.clientX - centerX, e.clientY - centerY) || 1;
      resizeStartRef.current = { centerX, centerY, startDistance, startScale };
      resizeScaleRef.current = startScale;
      setResizeScale(startScale);
      setIsResizing(true);
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [note.imageScale]
  );

  const handleResizePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const start = resizeStartRef.current;
      if (!start) return;
      const newScale = getScaleFromPointer(e.clientX, e.clientY);
      resizeScaleRef.current = newScale;
      setResizeScale(newScale);
    },
    [getScaleFromPointer]
  );

  const handleResizePointerUp = useCallback(
    (e: React.PointerEvent) => {
      const hadResize = resizeStartRef.current !== null;
      resizeStartRef.current = null;
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      setIsResizing(false);
      if (hadResize && onSaveNote) {
        onSaveNote({ ...note, imageScale: resizeScaleRef.current });
      }
    },
    [note, onSaveNote]
  );

  const DRAG_THRESHOLD = 5;

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if ((e.target as HTMLElement).closest("button")) return;
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        noteX: dragOrigin.x,
        noteY: dragOrigin.y,
      };
    },
    [dragOrigin.x, dragOrigin.y]
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
      const contentDx = dx / zoomLevel;
      const contentDy = dy / zoomLevel;
      onUpdate({
        ...note,
        x: noteX + contentDx,
        y: noteY + contentDy,
      });
      if (onDragMove) onDragMove(e.clientX, e.clientY);
    },
    [note, zoomLevel, onUpdate, onDragMove]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent) => {
      const hadPointerDown = dragRef.current !== null;
      const wasDragging = dragRef.current?.dragStarted;
      const noteId = note.id;
      if (wasDragging && onDragEnd) {
        onDragEnd(noteId, e.clientX, e.clientY);
      } else if (hadPointerDown && !wasDragging && onSelect) {
        onSelect(noteId, e.shiftKey);
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
      if (onToolbarPatch) {
        onToolbarPatch(patch);
      } else {
        const updated = { ...note, ...patch };
        onSaveNote?.(updated);
      }
    },
    [note, onSaveNote, onToolbarPatch]
  );

  const borderColor = getBorderColor(note.color);
  const fontSizePx = note.fontSize ?? DEFAULT_FONT_SIZE;
  const fontWeight = note.fontWeight ?? "normal";
  const fontStyle = note.fontStyle ?? "normal";
  const listStyle = note.listStyle ?? "none";
  const isBold = fontWeight === "bold";
  const isItalic = fontStyle === "italic";
  const isBullet = listStyle === "bullet";
  const imageScale = note.imageUrl
    ? (isResizing ? resizeScale : (note.imageScale ?? 1))
    : 1;

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
        className={`absolute ${note.imageUrl ? "" : "w-56"} ${isDragging ? "transition-shadow duration-150" : "transition-all duration-150"} relative`}
        style={{
        left: x,
        top: y,
        zIndex,
        ...(note.imageUrl && { width: IMAGE_BASE_W * imageScale }),
      }}
      onPointerDown={handlePointerDown}
      onPointerMoveCapture={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {showToolbar && (
        <StickyToolbar
          note={note}
          onUpdate={handleToolbarUpdate}
          onPointerDown={(e) => e.stopPropagation()}
          onDelete={onDelete}
          visible={!isDragging}
        />
      )}
      <div
        ref={cardRef}
        className={`relative flex min-h-[200px] flex-col rounded-lg border-2 transition-shadow ${
          isSelected ? "outline-2 outline-blue-500 outline-offset-0" : ""
        }`}
        style={{
          backgroundColor: note.color,
          borderColor,
          ...(note.imageUrl && { minHeight: IMAGE_BASE_H * imageScale }),
        }}
      >
        <div className="flex min-h-0 flex-1 flex-col gap-1 p-3 select-none">
          {note.imageUrl ? (
            <>
              <div
                className="relative flex-1 overflow-hidden rounded"
                style={{
                  minHeight: Math.max(128, IMAGE_BASE_H * imageScale - (note.text ? 48 : 24)),
                  width: "100%",
                }}
              >
                <img
                  src={note.imageUrl}
                  alt=""
                  className="h-full w-full object-contain object-top"
                  style={{
                    imageRendering: "auto",
                    minWidth: 0,
                    minHeight: 0,
                  }}
                  draggable={false}
                  onDragStart={(e) => e.preventDefault()}
                />
              </div>
              {note.text ? (
                <p
                  className="mt-1 cursor-grab select-none rounded text-sm font-normal leading-normal text-zinc-800 whitespace-pre-wrap"
                  onDragStart={(e) => e.preventDefault()}
                >
                  {note.text}
                </p>
              ) : null}
            </>
          ) : editing ? (
            <textarea
              ref={textareaRef}
              className="min-h-24 w-full resize-none wrap-break-word border-0 bg-transparent font-normal text-zinc-900 placeholder:text-zinc-600/70 outline-none select-text"
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
              className="min-h-20 flex-1 cursor-grab select-none wrap-break-word rounded font-normal leading-normal text-zinc-800 whitespace-pre-wrap"
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
              onDragStart={(e) => e.preventDefault()}
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
          {(note.authorIconId || note.authorName) && (
            <div className="mt-auto flex items-center justify-start gap-1.5 text-xs text-zinc-600">
              {note.authorIconId && (
                <img
                  src={getAvatarUrl(note.authorIconId)}
                  alt=""
                  className="h-6 w-6 shrink-0 rounded-full object-cover ring-1 ring-black/10"
                />
              )}
              {note.authorName && (
                <span className="truncate font-medium text-zinc-700" title={note.authorName}>
                  {note.authorName}
                </span>
              )}
            </div>
          )}
          {!(note.authorIconId || note.authorName) && <div className="mt-auto" />}
        </div>
      </div>
      {note.imageUrl && isSelected && (
        <div
          className="pointer-events-none absolute inset-0 rounded-lg"
          aria-hidden
        >
          <div className="absolute inset-0 rounded-lg border-2 border-blue-500" />
          {(["nw", "ne", "sw", "se"] as const).map((corner) => (
            <div
              key={corner}
              data-resize-handle
              role="slider"
              aria-label={`Resize from ${corner}`}
              aria-valuemin={IMAGE_SCALE_MIN}
              aria-valuemax={IMAGE_SCALE_MAX}
              aria-valuenow={imageScale}
              className={`absolute z-10 h-5 w-5 cursor-se-resize rounded-full border-2 border-blue-500 bg-white shadow hover:bg-blue-50 hover:scale-110 pointer-events-auto ${
                corner === "nw" ? "left-0 top-0 -translate-x-1/2 -translate-y-1/2 cursor-nw-resize" : ""
              } ${corner === "ne" ? "right-0 top-0 translate-x-1/2 -translate-y-1/2 cursor-ne-resize" : ""} ${
                corner === "sw" ? "bottom-0 left-0 -translate-x-1/2 translate-y-1/2 cursor-sw-resize" : ""
              } ${corner === "se" ? "bottom-0 right-0 translate-x-1/2 translate-y-1/2 cursor-se-resize" : ""}`}
              onPointerDown={handleResizePointerDown}
              onPointerMove={handleResizePointerMove}
              onPointerUp={handleResizePointerUp}
              onPointerCancel={handleResizePointerUp}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export function useAddSticky(authorName?: string, authorIconId?: string) {
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
        authorIconId: authorIconId ?? undefined,
      };
      return note;
    },
    [authorName, authorIconId]
  );
}
