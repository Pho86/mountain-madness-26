"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
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
/** Toolbar/dropdown accent (active state) */
const TOOLBAR_ACCENT = "#7f1d1d";
/** Bullet list prefix per line when editing */
const BULLET_PREFIX = "• ";

function getLineStart(text: string, pos: number): number {
  const last = text.lastIndexOf("\n", pos - 1);
  return last === -1 ? 0 : last + 1;
}

function minCursorForLine(text: string, pos: number): number {
  return getLineStart(text, pos) + BULLET_PREFIX.length;
}
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
  counterRotateDeg = 0,
  centeredByParent = false,
  getAnchorRectRef,
}: {
  note: StickyNote;
  onUpdate: (patch: Partial<StickyNote>) => void;
  onPointerDown: (e: React.PointerEvent) => void;
  onDelete?: () => void;
  visible: boolean;
  counterRotateDeg?: number;
  /** When true, toolbar is in-flow and centered by parent (no absolute positioning). */
  centeredByParent?: boolean;
  /** Ref to function that returns the card's bounding rect (for portal positioning at highest point). */
  getAnchorRectRef?: React.MutableRefObject<(() => DOMRect | null) | null>;
}) {
  const [colorOpen, setColorOpen] = useState(false);
  const [customSizeOpen, setCustomSizeOpen] = useState(false);
  const [presetSizeOpen, setPresetSizeOpen] = useState(false);
  const colorTriggerRef = useRef<HTMLButtonElement>(null);
  const customSizeTriggerRef = useRef<HTMLButtonElement>(null);
  const presetSizeTriggerRef = useRef<HTMLButtonElement>(null);
  const [colorDropdownPos, setColorDropdownPos] = useState<{ left: number; top: number } | null>(null);
  const [customSizeDropdownPos, setCustomSizeDropdownPos] = useState<{ left: number; top: number } | null>(null);
  const [presetSizeDropdownPos, setPresetSizeDropdownPos] = useState<{ left: number; top: number } | null>(null);
  const [toolbarBarPosition, setToolbarBarPosition] = useState<{ left: number; top: number } | null>(null);
  const fontSize = note.fontSize ?? DEFAULT_FONT_SIZE;
  const [sizeInput, setSizeInput] = useState(String(fontSize));
  const presetLabel = FONT_SIZE_PRESETS.find((p) => p.value === fontSize)?.label ?? String(fontSize);

  useEffect(() => {
    setSizeInput(String(note.fontSize ?? DEFAULT_FONT_SIZE));
  }, [note.fontSize]);

  const updateDropdownPositions = useCallback(() => {
    const gap = 6;
    if (colorOpen && colorTriggerRef.current) {
      const rect = colorTriggerRef.current.getBoundingClientRect();
      setColorDropdownPos({ left: rect.left, top: rect.top - gap });
    } else {
      setColorDropdownPos(null);
    }
    if (customSizeOpen && customSizeTriggerRef.current) {
      const rect = customSizeTriggerRef.current.getBoundingClientRect();
      setCustomSizeDropdownPos({ left: rect.left, top: rect.top - gap });
    } else {
      setCustomSizeDropdownPos(null);
    }
    if (presetSizeOpen && presetSizeTriggerRef.current) {
      const rect = presetSizeTriggerRef.current.getBoundingClientRect();
      setPresetSizeDropdownPos({ left: rect.left, top: rect.top - gap });
    } else {
      setPresetSizeDropdownPos(null);
    }
  }, [colorOpen, customSizeOpen, presetSizeOpen]);

  useLayoutEffect(() => {
    updateDropdownPositions();
  }, [updateDropdownPositions]);

  useEffect(() => {
    if (!colorOpen && !customSizeOpen && !presetSizeOpen) return;
    const onScrollOrResize = () => updateDropdownPositions();
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [colorOpen, customSizeOpen, presetSizeOpen, updateDropdownPositions]);

  const TOOLBAR_GAP = 6;
  useLayoutEffect(() => {
    if (!visible || !getAnchorRectRef?.current || !centeredByParent) {
      setToolbarBarPosition(null);
      return;
    }
    const rect = getAnchorRectRef.current();
    if (rect) {
      setToolbarBarPosition({
        left: rect.left + rect.width / 2,
        top: rect.top - TOOLBAR_GAP,
      });
    } else {
      setToolbarBarPosition(null);
    }
  }, [visible, centeredByParent, getAnchorRectRef, note.x, note.y, counterRotateDeg]);

  useEffect(() => {
    if (!visible || !toolbarBarPosition) return;
    const onScrollOrResize = () => {
      if (getAnchorRectRef?.current) {
        const rect = getAnchorRectRef.current();
        if (rect) {
          setToolbarBarPosition({
            left: rect.left + rect.width / 2,
            top: rect.top - TOOLBAR_GAP,
          });
        }
      }
    };
    window.addEventListener("scroll", onScrollOrResize, true);
    window.addEventListener("resize", onScrollOrResize);
    return () => {
      window.removeEventListener("scroll", onScrollOrResize, true);
      window.removeEventListener("resize", onScrollOrResize);
    };
  }, [visible, toolbarBarPosition, getAnchorRectRef]);

  const applyFontSize = (n: number) => {
    const clamped = Math.round(Math.max(10, Math.min(48, n)));
    onUpdate({ fontSize: clamped });
    setSizeInput(String(clamped));
  };

  const toolbarContent = (
    <div
      data-sticky-toolbar
      className={`flex min-w-[420px] max-w-[90vw] items-center justify-between gap-1 rounded-full border border-zinc-600/80 bg-[#2c2c2c] py-2 pl-2 pr-3 transition-opacity duration-200 ${visible ? "opacity-100" : "pointer-events-none opacity-0"} ${!toolbarBarPosition && !centeredByParent ? `absolute left-1/2 bottom-full -translate-x-1/2 ${counterRotateDeg !== 0 ? "mb-8" : "mb-2"}` : ""}`}
      style={{
        zIndex: 10000,
        ...(toolbarBarPosition
          ? undefined
          : centeredByParent
            ? { transform: `rotate(${-counterRotateDeg}deg)`, transformOrigin: "50% 100%" }
            : { transform: `translateX(-50%) rotate(${-counterRotateDeg}deg)`, transformOrigin: "50% 100%" }),
      }}
      onPointerDown={(e) => {
        e.stopPropagation();
        onPointerDown(e);
      }}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      role="toolbar"
    >
      {/* 1. Color dropdown */}
      <div className="relative flex items-center">
        <button
          ref={colorTriggerRef}
          type="button"
          onMouseDown={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setColorOpen((o) => !o);
            setCustomSizeOpen(false);
            setPresetSizeOpen(false);
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
        {colorOpen && colorDropdownPos && typeof document !== "undefined" &&
          createPortal(
            <div
              data-sticky-toolbar
              className="fixed min-w-[200px] rounded-lg border border-zinc-600 bg-[#2c2c2c] p-2.5"
              style={{
                zIndex: 10001,
                left: colorDropdownPos.left,
                top: colorDropdownPos.top,
                transform: "translateY(-100%)",
              }}
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="grid grid-cols-5 gap-2">
                {COLORS.map((c) => (
                  <button
                    key={c.bg}
                    type="button"
                    onClick={() => {
                      onUpdate({ color: c.bg });
                      setColorOpen(false);
                    }}
                    className="h-8 w-8 rounded-full border-2 transition hover:scale-110"
                    style={{
                      backgroundColor: c.bg,
                      borderColor: note.color === c.bg ? TOOLBAR_ACCENT : c.border,
                    }}
                    title={c.label}
                    aria-label={c.label}
                  />
                ))}
              </div>
            </div>,
            document.body
          )}
      </div>

      {/* 2. Font size custom dropdown (Aa) */}
      <div className="relative flex items-center">
        <button
          ref={customSizeTriggerRef}
          type="button"
          onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
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
        {customSizeOpen && customSizeDropdownPos && typeof document !== "undefined" &&
          createPortal(
            <div
              data-sticky-toolbar
              className="fixed rounded-lg border border-zinc-600 bg-[#2c2c2c] p-2"
              style={{
                zIndex: 10001,
                left: customSizeDropdownPos.left,
                top: customSizeDropdownPos.top,
                transform: "translateY(-100%)",
              }}
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              <p className="mb-1.5 text-xs font-medium text-white/70">Font size (px)</p>
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
                className="w-16 rounded border border-zinc-500 px-2 py-1 text-xs outline-none placeholder:text-zinc-400 focus:ring-1 focus:ring-white/30"
                style={{ backgroundColor: "#3f3f46", color: "#fff" }}
                autoFocus
              />
            </div>,
            document.body
          )}
      </div>

      {/* 3. Font size presets dropdown (Small / Medium / Large) */}
      <div className="relative flex items-center">
        <button
          ref={presetSizeTriggerRef}
          type="button"
          onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
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
        {presetSizeOpen && presetSizeDropdownPos && typeof document !== "undefined" &&
          createPortal(
            <div
              data-sticky-toolbar
              className="fixed rounded-lg border border-zinc-600 bg-[#2c2c2c] py-0.5"
              style={{
                zIndex: 10001,
                left: presetSizeDropdownPos.left,
                top: presetSizeDropdownPos.top,
                transform: "translateY(-100%)",
              }}
              onPointerDown={(e) => e.stopPropagation()}
              onMouseDown={(e) => e.stopPropagation()}
            >
              {FONT_SIZE_PRESETS.map((p) => (
                <button
                  key={p.value}
                  type="button"
                  onClick={() => {
                    applyFontSize(p.value);
                    setPresetSizeOpen(false);
                  }}
                  className={`w-full px-3 py-1.5 text-left text-xs text-white/90 hover:bg-white/10 ${fontSize === p.value ? "font-medium text-white" : ""}`}
                  style={fontSize === p.value ? { backgroundColor: TOOLBAR_ACCENT } : undefined}
                >
                  {p.label}
                </button>
              ))}
            </div>,
            document.body
          )}
      </div>

      <div className="h-5 w-px bg-white/15" aria-hidden />

      {/* 4. Bold */}
      <button
        type="button"
        onClick={() => onUpdate({ fontWeight: (note.fontWeight ?? "normal") === "bold" ? "normal" : "bold" })}
        className={`rounded-md px-3 py-1.5 font-bold ${(note.fontWeight ?? "normal") === "bold" ? "text-white" : "text-white/90 hover:bg-white/10"}`}
        style={(note.fontWeight ?? "normal") === "bold" ? { backgroundColor: TOOLBAR_ACCENT } : undefined}
        title="Bold"
        aria-pressed={(note.fontWeight ?? "normal") === "bold"}
      >
        B
      </button>

      {/* 5. Italic */}
      <button
        type="button"
        onClick={() => onUpdate({ fontStyle: (note.fontStyle ?? "normal") === "italic" ? "normal" : "italic" })}
        className={`rounded-md px-3 py-1.5 font-serif italic ${(note.fontStyle ?? "normal") === "italic" ? "text-white" : "text-white/90 hover:bg-white/10"}`}
        style={(note.fontStyle ?? "normal") === "italic" ? { backgroundColor: TOOLBAR_ACCENT } : undefined}
        title="Italic"
        aria-pressed={(note.fontStyle ?? "normal") === "italic"}
      >
        I
      </button>

      {/* 6. List */}
      <button
        type="button"
        onClick={() => onUpdate({ listStyle: (note.listStyle ?? "none") === "bullet" ? "none" : "bullet" })}
        className={`rounded-md px-3 py-1.5 ${(note.listStyle ?? "none") === "bullet" ? "text-white" : "text-white/90 hover:bg-white/10"}`}
        style={(note.listStyle ?? "none") === "bullet" ? { backgroundColor: TOOLBAR_ACCENT } : undefined}
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

  if (toolbarBarPosition && getAnchorRectRef && typeof document !== "undefined") {
    return createPortal(
      <div
        data-sticky-toolbar
        style={{
          position: "fixed",
          left: toolbarBarPosition.left,
          top: toolbarBarPosition.top,
          transform: "translate(-50%, -100%)",
          zIndex: 10000,
        }}
      >
        {toolbarContent}
      </div>,
      document.body
    );
  }
  return toolbarContent;
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
  displayRotation,
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
  /** Display rotation in degrees (for optimistic updates during rotate gesture) */
  displayRotation?: number;
}) {
  const x = displayX ?? note.x;
  const y = displayY ?? note.y;
  const rotationDeg = displayRotation ?? note.rotation ?? 0;
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
  const [isRotating, setIsRotating] = useState(false);
  const [resizeScale, setResizeScale] = useState(1);
  const resizeStartRef = useRef<{
    centerX: number;
    centerY: number;
    startDistance: number;
    startScale: number;
  } | null>(null);
  const resizeScaleRef = useRef(1);
  const cardRef = useRef<HTMLDivElement | null>(null);
  const getAnchorRectRef = useRef<(() => DOMRect | null) | null>(null);

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

  const rotationStartRef = useRef<{
    startAngle: number;
    startRotation: number;
    lastAngle: number;
    accumulatedDeg: number;
  } | null>(null);

  const getCenter = useCallback(() => {
    const card = cardRef.current;
    if (!card) return null;
    const rect = card.getBoundingClientRect();
    return { centerX: rect.left + rect.width / 2, centerY: rect.top + rect.height / 2 };
  }, []);

  const handleRotatePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.stopPropagation();
      setIsRotating(true);
      const center = getCenter();
      if (!center) return;
      const { centerX, centerY } = center;
      const startAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
      rotationStartRef.current = {
        startAngle,
        startRotation: rotationDeg,
        lastAngle: startAngle,
        accumulatedDeg: 0,
      };
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    },
    [rotationDeg, getCenter]
  );

  const handleRotatePointerMove = useCallback(
    (e: React.PointerEvent) => {
      const start = rotationStartRef.current;
      if (!start) return;
      const center = getCenter();
      if (!center) return;
      const { centerX, centerY } = center;
      const currentAngle = Math.atan2(e.clientY - centerY, e.clientX - centerX);
      let deltaRad = currentAngle - start.lastAngle;
      while (deltaRad > Math.PI) deltaRad -= 2 * Math.PI;
      while (deltaRad <= -Math.PI) deltaRad += 2 * Math.PI;
      start.lastAngle = currentAngle;
      start.accumulatedDeg += (deltaRad * 180) / Math.PI;
      const newRotation = Math.round((start.startRotation + start.accumulatedDeg) * 10) / 10;
      onUpdate({ ...note, rotation: newRotation });
    },
    [note, getCenter, onUpdate]
  );

  const handleRotatePointerUp = useCallback(
    (e: React.PointerEvent) => {
      const hadRotate = rotationStartRef.current !== null;
      rotationStartRef.current = null;
      setIsRotating(false);
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
      if (hadRotate && onSaveNote) {
        onSaveNote({ ...note, rotation: rotationDeg });
      }
    },
    [note, rotationDeg, onSaveNote]
  );

  const DRAG_THRESHOLD = 5;

  const handlePointerDown = useCallback(
    (e: React.PointerEvent) => {
      if ((e.target as HTMLElement).closest("button")) return;
      if ((e.target as HTMLElement).closest("[data-rotation-handle]")) return;
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
      const ta = e.currentTarget;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const isBulletMode = (note.listStyle ?? "none") === "bullet";

      if (isBulletMode) {
        const lineStart = getLineStart(localText, start);
        const minPos = minCursorForLine(localText, start);

        if (e.key === "Enter") {
          e.preventDefault();
          const before = localText.slice(0, start);
          const after = localText.slice(end);
          const newValue = before + "\n" + BULLET_PREFIX + after;
          setLocalText(newValue);
          requestAnimationFrame(() => {
            ta.selectionStart = ta.selectionEnd = start + 1 + BULLET_PREFIX.length;
          });
          return;
        }

        if (e.key === "ArrowLeft") {
          if (start === end && start > 0) {
            const newPos = start - 1;
            const prevLineStart = getLineStart(localText, newPos);
            if (newPos >= prevLineStart && newPos < prevLineStart + BULLET_PREFIX.length) {
              e.preventDefault();
              ta.selectionStart = ta.selectionEnd = prevLineStart + BULLET_PREFIX.length;
            }
          }
          return;
        }

        if (e.key === "ArrowRight") {
          if (start === end && start < localText.length) {
            const newPos = start + 1;
            const newLineStart = getLineStart(localText, newPos);
            if (newPos >= newLineStart && newPos < newLineStart + BULLET_PREFIX.length) {
              e.preventDefault();
              ta.selectionStart = ta.selectionEnd = newLineStart + BULLET_PREFIX.length;
            }
          }
          return;
        }

        if (e.key === "Backspace") {
          if (start === end && start === minPos) {
            if (lineStart === 0) {
              e.preventDefault();
              return;
            }
            e.preventDefault();
            const prevLineEnd = lineStart - 1;
            const before = localText.slice(0, prevLineEnd);
            const after = localText.slice(end);
            const newValue = before + after;
            setLocalText(newValue);
            requestAnimationFrame(() => {
              ta.selectionStart = ta.selectionEnd = prevLineEnd;
            });
            return;
          }
        }

        if (e.key === "Delete" && start === end) {
          if (start >= lineStart && start < minPos) {
            e.preventDefault();
            ta.selectionStart = ta.selectionEnd = minPos;
            return;
          }
        }
      }
    },
    [localText, note.listStyle]
  );

  const handleTextareaSelect = useCallback(
    (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
      if ((note.listStyle ?? "none") !== "bullet") return;
      const ta = e.currentTarget;
      requestAnimationFrame(() => {
        let start = ta.selectionStart;
        let end = ta.selectionEnd;
        const startLine = getLineStart(localText, start);
        const endLine = getLineStart(localText, end);
        const minStart = startLine + BULLET_PREFIX.length;
        const minEnd = endLine + BULLET_PREFIX.length;
        if (start < minStart) start = minStart;
        if (end < minEnd) end = minEnd;
        if (start !== ta.selectionStart || end !== ta.selectionEnd) {
          ta.setSelectionRange(start, end);
        }
      });
    },
    [localText, note.listStyle]
  );

  return (
      <div
        className={`absolute ${note.imageUrl ? "" : "w-56"} ${isDragging ? "transition-opacity duration-150" : "transition-all duration-150"} relative`}
        style={{
        left: x,
        top: y,
        zIndex,
        transform: `rotate(${rotationDeg}deg)`,
        transformOrigin: "50% 50%",
        ...(note.imageUrl && { width: IMAGE_BASE_W * imageScale }),
      }}
      onPointerDown={handlePointerDown}
      onPointerMoveCapture={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onPointerLeave={handlePointerUp}
    >
      {showToolbar && (
        <div
          className="pointer-events-none absolute left-0 right-0 flex justify-center"
          style={{
            bottom: "100%",
            marginBottom: rotationDeg !== 0 ? "2rem" : "0.5rem",
          }}
        >
          <div className="pointer-events-auto">
            {(() => {
              getAnchorRectRef.current = () => cardRef.current?.getBoundingClientRect() ?? null;
              return (
                <StickyToolbar
                  note={note}
                  onUpdate={handleToolbarUpdate}
                  onPointerDown={(e) => e.stopPropagation()}
                  onDelete={onDelete}
                  visible={!isDragging && !isRotating}
                  counterRotateDeg={rotationDeg}
                  centeredByParent
                  getAnchorRectRef={getAnchorRectRef}
                />
              );
            })()}
          </div>
        </div>
      )}
      <div
        ref={cardRef}
        className={`relative flex min-h-[200px] flex-col rounded-lg border-2 transition-colors ${
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
                const raw = e.target.value;
                if ((note.listStyle ?? "none") === "bullet") {
                  const normalized = raw
                    .split("\n")
                    .map((line) => BULLET_PREFIX + line.replace(/^•\s*/, ""))
                    .join("\n");
                  setLocalText(normalized);
                  requestAnimationFrame(() => {
                    const ta = textareaRef.current;
                    if (ta) {
                      const minS = minCursorForLine(normalized, ta.selectionStart);
                      const minE = minCursorForLine(normalized, ta.selectionEnd);
                      if (ta.selectionStart < minS || ta.selectionEnd < minE) {
                        ta.setSelectionRange(
                          Math.max(ta.selectionStart, minS),
                          Math.max(ta.selectionEnd, minE)
                        );
                      }
                    }
                  });
                } else {
                  setLocalText(raw);
                }
                adjustTextareaHeight();
              }}
              onBlur={handleBlur}
              onKeyDown={handleTextareaKeyDown}
              onSelect={handleTextareaSelect}
              autoFocus
              placeholder="Type something…"
              rows={1}
            />
          ) : (
            <div
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
                    ? note.text.split("\n").map((l) => "• " + l.trimStart().replace(/^•\s?/, "")).join("\n")
                    : note.text
                );
                setEditing(true);
              }}
              onDragStart={(e) => e.preventDefault()}
            >
              {isBullet && note.text ? (
                <ul className="list-disc pl-5 list-outside space-y-0.5 text-left" style={{ marginTop: 0, marginBottom: 0 }}>
                  {note.text
                    .split("\n")
                    .map((line) => line.replace(/^\s*•\s*/, ""))
                    .map((line, i) => (
                      <li key={i}>{line || "\u00A0"}</li>
                    ))}
                </ul>
              ) : isBullet && (!note.text || !note.text.trim()) ? (
                "Double-click to edit"
              ) : (
                note.text || "Double-click to edit"
              )}
            </div>
          )}
          {(note.authorIconId || note.authorName) && (
            <div className="mt-auto flex items-center justify-start gap-1.5 text-xs text-zinc-600">
              {note.authorIconId && (
                <img
                  src={getAvatarUrl(note.authorIconId)}
                  alt=""
                  className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-black/10"
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
              className={`absolute z-10 h-5 w-5 cursor-se-resize rounded-full border-2 border-blue-500 bg-white hover:bg-blue-50 hover:scale-110 pointer-events-auto ${
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
      {isSelected && (
        <div
          data-rotation-handle
          className="absolute left-1/2 bottom-0 z-10 h-6 w-6 -translate-x-1/2 translate-y-[calc(100%+0.5rem)] cursor-grab rounded-full border-2 border-blue-500 bg-white hover:bg-blue-50 hover:scale-110 active:cursor-grabbing pointer-events-auto"
          role="slider"
          aria-label="Rotate"
          aria-valuenow={rotationDeg}
          onPointerDown={handleRotatePointerDown}
          onPointerMove={handleRotatePointerMove}
          onPointerUp={handleRotatePointerUp}
          onPointerCancel={handleRotatePointerUp}
        >
          <svg className="absolute left-1/2 top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 text-blue-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d="M21 12a9 9 0 1 1-9-9c2.5 0 4.9 1 6.7 2.6" />
            <path d="M21 3v6h-6" />
          </svg>
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
