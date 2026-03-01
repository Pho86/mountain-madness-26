"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useParams } from "next/navigation";
import { UserGroupIcon } from "@heroicons/react/24/outline";
import { upload } from "@vercel/blob/client";
import { useBoardFirestore } from "@/hooks/use-board-firestore";
import { useAuth } from "@/lib/auth-context";
import { useUserRooms } from "@/hooks/use-user-rooms";
import { useUserProfile } from "@/lib/use-user-profile";
import { useRoomMembers } from "@/hooks/use-room-members";
import { Sticky, useAddSticky } from "@/components/Sticky";
import { BoardToolbar } from "@/components/BoardToolbar";
import { DeleteZone } from "@/components/DeleteZone";
import { EditableRoomName } from "@/components/EditableRoomName";
import { FridgeLayout } from "@/components/FridgeLayout";
import { Modal } from "@/components/Modal";
import { getAvatarUrl } from "@/lib/avatars";
import { useRoom } from "@/hooks/use-room";
import type { StickyNote } from "@/lib/types";

type Tool = "cursor" | "move" | "sticky";

const DELETE_ZONE_SELECTOR = "[data-delete-zone]";
const STICKY_NOTE_WIDTH = 224;
const STICKY_NOTE_HEIGHT = 200;
const FIT_PADDING = 48;
const MAX_ZOOM_FIT = 1.2;

function isPointInRect(x: number, y: number, rect: DOMRect): boolean {
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
}

function roundPosition(v: number) {
  return Math.round(v * 100) / 100;
}

export default function BoardPage() {
  const params = useParams();
  const boardId = typeof params.boardId === "string" ? params.boardId : null;
  const { user } = useAuth();
  const { addRoom } = useUserRooms(user?.uid ?? null);
  const { name: roomName, setName: setRoomName, ensureRoomExists, loading: roomLoading } = useRoom(boardId);
  const { notes, connected, addNote, updateNote, deleteNote } =
    useBoardFirestore(boardId);
  const authorName = user?.displayName || user?.email?.split("@")[0] || undefined;
  const { iconId: authorIconId } = useUserProfile(user?.uid ?? null);
  const { members, ensureCurrentUser } = useRoomMembers(boardId);
  const createSticky = useAddSticky(authorName, authorIconId ?? undefined);
  const [tool, setTool] = useState<Tool>("cursor");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [selectedNoteIds, setSelectedNoteIds] = useState<Set<string>>(new Set());
  const [primarySelectedId, setPrimarySelectedId] = useState<string | null>(null);
  const [lastCreatedNoteId, setLastCreatedNoteId] = useState<string | null>(null);
  const [dragOverDeleteZone, setDragOverDeleteZone] = useState(false);
  const [frontNoteIds, setFrontNoteIds] = useState<string[]>([]);
  const [optimisticPosition, setOptimisticPosition] = useState<Record<string, { x: number; y: number }>>({});
  const [optimisticRotation, setOptimisticRotation] = useState<Record<string, number>>({});
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const panZoomRef = useRef({ pan: { x: 0, y: 0 }, zoom: 1 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ clientX: number; clientY: number; panX: number; panY: number } | null>(null);
  const didPanRef = useRef(false);
  const didJustFinishNewNoteDragRef = useRef(false);
  const didMarqueeRef = useRef(false);
  const deleteZoneRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const lastNewNotePositionRef = useRef<{ x: number; y: number } | null>(null);
  const draggingSelectionRef = useRef<Set<string> | null>(null);
  const initialDragPositionsRef = useRef<Record<string, { x: number; y: number }>>({});
  const lastDragSyncTimeRef = useRef(0);
  const optimisticPositionRef = useRef(optimisticPosition);
  useEffect(() => {
    optimisticPositionRef.current = optimisticPosition;
  }, [optimisticPosition]);

  type PendingNewNoteDrag = { noteId: string; noteX: number; noteY: number };
  const [pendingNewNoteDrag, setPendingNewNoteDrag] = useState<PendingNewNoteDrag | null>(null);
  const [pendingNotes, setPendingNotes] = useState<StickyNote[]>([]);

  type SelectionBox = { startX: number; startY: number; endX: number; endY: number };
  const [selectionBox, setSelectionBox] = useState<SelectionBox | null>(null);
  const selectionBoxShiftRef = useRef(false);
  const selectionBoxRef = useRef<SelectionBox | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const [showMembersModal, setShowMembersModal] = useState(false);

  const noteIds = new Set(notes.map((n) => n.id));
  const displayNotes = [...notes, ...pendingNotes.filter((p) => !noteIds.has(p.id))];
  const hasFittedRef = useRef(false);
  const [canvasSizeKey, setCanvasSizeKey] = useState(0);

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) setCanvasSizeKey((k) => k + 1);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (roomLoading || displayNotes.length === 0 || !mainRef.current) return;
    if (hasFittedRef.current) return;

    const rect = mainRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    hasFittedRef.current = true;

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;
    for (const note of displayNotes) {
      const x = note.x;
      const y = note.y;
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x + STICKY_NOTE_WIDTH);
      maxY = Math.max(maxY, y + STICKY_NOTE_HEIGHT);
    }
    const contentW = Math.max(maxX - minX, 100);
    const contentH = Math.max(maxY - minY, 100);
    const zoomW = (rect.width - 2 * FIT_PADDING) / contentW;
    const zoomH = (rect.height - 2 * FIT_PADDING) / contentH;
    const newZoom = Math.min(zoomW, zoomH, MAX_ZOOM_FIT);
    const contentCenterX = minX + contentW / 2;
    const contentCenterY = minY + contentH / 2;
    const newPanX = rect.width / 2 - contentCenterX * newZoom;
    const newPanY = rect.height / 2 - contentCenterY * newZoom;

    setZoom(newZoom);
    setPan({ x: newPanX, y: newPanY });
    panZoomRef.current = { pan: { x: newPanX, y: newPanY }, zoom: newZoom };
  }, [roomLoading, displayNotes.length, canvasSizeKey]);

  const handleBoardClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (tool === "move") return;
      if (didPanRef.current) {
        didPanRef.current = false;
        return;
      }
      if (didJustFinishNewNoteDragRef.current) {
        didJustFinishNewNoteDragRef.current = false;
        return;
      }
      if (didMarqueeRef.current) {
        didMarqueeRef.current = false;
        return;
      }
      if ((e.target as HTMLElement).closest("[data-sticky]")) return;
      if ((e.target as HTMLElement).closest("[data-sticky-toolbar]")) return;
      if (tool === "sticky") {
        const rect = e.currentTarget.getBoundingClientRect();
        const contentX = (e.clientX - rect.left - pan.x) / zoom;
        const contentY = (e.clientY - rect.top - pan.y) / zoom;
        const x = contentX - 80;
        const y = contentY - 40;
        const note = createSticky(x, y);
        addNote(note);
        setSelectedNoteIds(new Set([note.id]));
        setPrimarySelectedId(note.id);
      } else {
        setSelectedNoteIds(new Set());
        setPrimarySelectedId(null);
      }
    },
    [tool, addNote, createSticky, pan.x, pan.y, zoom]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if (tool !== "move" && (e.target as HTMLElement).closest("[data-sticky]")) return;
      if ((e.target as HTMLElement).closest("[data-sticky-toolbar]")) return;
      if (tool === "sticky") {
        const rect = e.currentTarget.getBoundingClientRect();
        const contentX = (e.clientX - rect.left - pan.x) / zoom;
        const contentY = (e.clientY - rect.top - pan.y) / zoom;
        const x = roundPosition(contentX - 80);
        const y = roundPosition(contentY - 40);
        const note = createSticky(x, y);
        addNote(note);
        setPendingNotes((prev) => [...prev, note]);
        setSelectedNoteIds(new Set([note.id]));
        setPrimarySelectedId(note.id);
        setFrontNoteIds((prev) => [...prev.filter((id) => id !== note.id), note.id]);
        setPendingNewNoteDrag({ noteId: note.id, noteX: x, noteY: y });
        setOptimisticPosition((prev) => ({ ...prev, [note.id]: { x, y } }));
        lastNewNotePositionRef.current = { x, y };
        return;
      }
      if (tool !== "cursor" && tool !== "move") return;
      if (tool === "cursor") {
        selectionBoxShiftRef.current = e.shiftKey;
        const box = { startX: e.clientX, startY: e.clientY, endX: e.clientX, endY: e.clientY };
        selectionBoxRef.current = box;
        setSelectionBox(box);
        e.currentTarget.setPointerCapture(e.pointerId);
        return;
      }
      if (tool !== "move") return;
      didPanRef.current = true;
      setIsPanning(true);
      panStartRef.current = {
        clientX: e.clientX,
        clientY: e.clientY,
        panX: pan.x,
        panY: pan.y,
      };
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [tool, pan.x, pan.y, zoom, addNote, createSticky]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const main = mainRef.current;
      const { pan: currentPan, zoom: currentZoom } = panZoomRef.current;
      if (selectionBox !== null) {
        setSelectionBox((prev) => {
          const next = prev ? { ...prev, endX: e.clientX, endY: e.clientY } : null;
          if (next) selectionBoxRef.current = next;
          return next;
        });
        return;
      }
      if (pendingNewNoteDrag && main) {
        const rect = main.getBoundingClientRect();
        const contentX = (e.clientX - rect.left - currentPan.x) / currentZoom;
        const contentY = (e.clientY - rect.top - currentPan.y) / currentZoom;
        const x = roundPosition(contentX - 80);
        const y = roundPosition(contentY - 40);
        lastNewNotePositionRef.current = { x, y };
        setOptimisticPosition((prev) => ({
          ...prev,
          [pendingNewNoteDrag.noteId]: { x, y },
        }));
        return;
      }
      const start = panStartRef.current;
      if (!start) return;
      didPanRef.current = true;
      setPan({
        x: start.panX + (e.clientX - start.clientX),
        y: start.panY + (e.clientY - start.clientY),
      });
    },
    [pendingNewNoteDrag, selectionBox]
  );

  const handlePointerUp = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const box = selectionBoxRef.current;
      if (box !== null) {
        selectionBoxRef.current = null;
        setSelectionBox(null);
        const w = Math.abs(box.endX - box.startX);
        const h = Math.abs(box.endY - box.startY);
        if (w > 5 || h > 5) {
          didMarqueeRef.current = true;
          const main = mainRef.current;
          if (main) {
            const rect = main.getBoundingClientRect();
            const { pan: currentPan, zoom: currentZoom } = panZoomRef.current;
            const toContent = (cx: number, cy: number) => ({
              x: (cx - rect.left - currentPan.x) / currentZoom,
              y: (cy - rect.top - currentPan.y) / currentZoom,
            });
            const left = Math.min(box.startX, box.endX);
            const right = Math.max(box.startX, box.endX);
            const top = Math.min(box.startY, box.endY);
            const bottom = Math.max(box.startY, box.endY);
            const boxContentLeft = toContent(left, top).x;
            const boxContentTop = toContent(left, top).y;
            const boxContentRight = toContent(right, bottom).x;
            const boxContentBottom = toContent(right, bottom).y;
            const STICKY_W = 224;
            const STICKY_H = 200;
            const idsInBox = displayNotes.filter((note) => {
              const nx = optimisticPositionRef.current[note.id]?.x ?? note.x;
              const ny = optimisticPositionRef.current[note.id]?.y ?? note.y;
              const noteRight = nx + STICKY_W;
              const noteBottom = ny + STICKY_H;
              return !(boxContentRight < nx || boxContentLeft > noteRight || boxContentBottom < ny || boxContentTop > noteBottom);
            }).map((n) => n.id);
            if (idsInBox.length > 0) {
              if (selectionBoxShiftRef.current) {
                setSelectedNoteIds((prev) => {
                  const next = new Set(prev);
                  idsInBox.forEach((id) => next.add(id));
                  return next;
                });
              } else {
                setSelectedNoteIds(new Set(idsInBox));
              }
              setPrimarySelectedId(idsInBox[0]);
            }
          }
        }
        return;
      }
      if (pendingNewNoteDrag) {
      const note = notes.find((n) => n.id === pendingNewNoteDrag.noteId)
        ?? pendingNotes.find((n) => n.id === pendingNewNoteDrag.noteId);
      const finalPos = lastNewNotePositionRef.current ?? { x: pendingNewNoteDrag.noteX, y: pendingNewNoteDrag.noteY };
      if (note) updateNote({ ...note, x: roundPosition(finalPos.x), y: roundPosition(finalPos.y) });
      lastNewNotePositionRef.current = null;
      setPendingNewNoteDrag(null);
      setTool("cursor");
      setLastCreatedNoteId(pendingNewNoteDrag.noteId);
      didJustFinishNewNoteDragRef.current = true;
      return;
    }
    panStartRef.current = null;
    setIsPanning(false);
  }, [pendingNewNoteDrag, notes, pendingNotes, updateNote, displayNotes]);

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
      setDragOverDeleteZone(false);

      const toMove = draggingSelectionRef.current ?? new Set([noteId]);

      if (droppedOnDelete) {
        setOptimisticPosition((prev) => {
          const next = { ...prev };
          toMove.forEach((id) => delete next[id]);
          return next;
        });
        toMove.forEach((id) => deleteNote(id));
        setSelectedNoteIds((prev) => {
          const next = new Set(prev);
          toMove.forEach((id) => next.delete(id));
          return next;
        });
        setPrimarySelectedId((prev) => (prev && toMove.has(prev) ? null : prev));
      } else {
        const positions = optimisticPositionRef.current;
        toMove.forEach((id) => {
          const finalPos = positions[id] ?? optimisticPosition[id];
          const note = notes.find((n) => n.id === id);
          if (note && finalPos) {
            updateNote({ ...note, x: roundPosition(finalPos.x), y: roundPosition(finalPos.y) });
          }
        });
        setSelectedNoteIds(new Set(toMove));
        setPrimarySelectedId(noteId);
      }
      draggingSelectionRef.current = null;
      initialDragPositionsRef.current = {};
      setDraggingId(null);
    },
    [deleteNote, notes, optimisticPosition, updateNote]
  );

  // Clear optimistic position once Firestore has the same position (avoids glitch after drop)
  // Use 1px epsilon to avoid warp from float rounding when editing a note
  // Don't clear while a note is being dragged, so the sticky doesn't lag behind the cursor
  const POSITION_EPS = 1;
  useEffect(() => {
    setOptimisticPosition((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const id of Object.keys(next)) {
        if (draggingSelectionRef.current?.has(id)) continue;
        const note = notes.find((n) => n.id === id);
        if (
          note &&
          Math.abs(note.x - next[id].x) < POSITION_EPS &&
          Math.abs(note.y - next[id].y) < POSITION_EPS
        ) {
          delete next[id];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [notes]);

  const ROTATION_EPS = 0.5;
  useEffect(() => {
    setOptimisticRotation((prev) => {
      const next = { ...prev };
      let changed = false;
      for (const id of Object.keys(next)) {
        const note = notes.find((n) => n.id === id);
        if (note != null && typeof note.rotation === "number" && Math.abs(note.rotation - next[id]) < ROTATION_EPS) {
          delete next[id];
          changed = true;
        }
      }
      return changed ? next : prev;
    });
  }, [notes]);

  useEffect(() => {
    setPendingNotes((prev) => prev.filter((p) => !notes.some((n) => n.id === p.id)));
  }, [notes]);

  const handleDragMove = useCallback((clientX: number, clientY: number) => {
    const zone = deleteZoneRef.current;
    if (!zone) {
      setDragOverDeleteZone(false);
      return;
    }
    setDragOverDeleteZone(isPointInRect(clientX, clientY, zone.getBoundingClientRect()));
  }, []);

  const handleDeleteSelected = useCallback(() => {
    if (selectedNoteIds.size === 0) return;
    selectedNoteIds.forEach((id) => deleteNote(id));
    setSelectedNoteIds(new Set());
    setPrimarySelectedId(null);
  }, [selectedNoteIds, deleteNote]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Delete" && e.key !== "Backspace") return;
      if ((e.target as HTMLElement).closest("textarea, input")) return;
      if (selectedNoteIds.size === 0) return;
      e.preventDefault();
      handleDeleteSelected();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleDeleteSelected]);

  useEffect(() => {
    if (primarySelectedId && !selectedNoteIds.has(primarySelectedId)) {
      setPrimarySelectedId(selectedNoteIds.size > 0 ? (selectedNoteIds.values().next().value ?? null) : null);
    }
  }, [selectedNoteIds, primarySelectedId]);

  const handleUpdate = useCallback((note: StickyNote) => {
    const id = note.id;
    const currentNote = notes.find((n) => n.id === id) ?? pendingNotes.find((p) => p.id === id);
    const currentX = optimisticPositionRef.current[id]?.x ?? currentNote?.x ?? note.x;
    const currentY = optimisticPositionRef.current[id]?.y ?? currentNote?.y ?? note.y;
    const positionChanged = roundPosition(note.x) !== roundPosition(currentX) || roundPosition(note.y) !== roundPosition(currentY);

    if (note.rotation != null && !positionChanged) {
      setOptimisticRotation((prev) => ({ ...prev, [id]: note.rotation! }));
      if (!draggingSelectionRef.current) {
        setFrontNoteIds((prev) => [...prev.filter((i) => i !== id), id]);
        return;
      }
    }
    setDraggingId(id);
    setFrontNoteIds((prev) => [...prev.filter((i) => i !== id), id]);

    const selection = selectedNoteIds.has(id) ? selectedNoteIds : new Set([id]);
    if (!draggingSelectionRef.current) {
      if (!selectedNoteIds.has(id)) {
        setSelectedNoteIds(new Set());
        setPrimarySelectedId(null);
      }
      draggingSelectionRef.current = new Set(selection);
      const opt = optimisticPositionRef.current;
      const getPos = (nid: string) => {
        const o = opt[nid];
        if (o) return o;
        const n = notes.find((n) => n.id === nid) ?? pendingNotes.find((p) => p.id === nid);
        return n ? { x: n.x, y: n.y } : { x: 0, y: 0 };
      };
      initialDragPositionsRef.current = {};
      selection.forEach((nid) => {
        initialDragPositionsRef.current[nid] = getPos(nid);
      });
    }

    const start = initialDragPositionsRef.current[id];
    if (!start) return;
    const deltaX = roundPosition(note.x - start.x);
    const deltaY = roundPosition(note.y - start.y);

    const next: Record<string, { x: number; y: number }> = { ...optimisticPositionRef.current };
    draggingSelectionRef.current?.forEach((nid) => {
      const initial = initialDragPositionsRef.current[nid];
      if (!initial) return;
      if (nid === id) {
        next[nid] = { x: roundPosition(note.x), y: roundPosition(note.y) };
      } else {
        next[nid] = {
          x: roundPosition(initial.x + deltaX),
          y: roundPosition(initial.y + deltaY),
        };
      }
    });
    optimisticPositionRef.current = next;
    flushSync(() => setOptimisticPosition(next));

    const DRAG_SYNC_INTERVAL_MS = 80;
    const now = Date.now();
    if (now - lastDragSyncTimeRef.current >= DRAG_SYNC_INTERVAL_MS) {
      lastDragSyncTimeRef.current = now;
      draggingSelectionRef.current?.forEach((nid) => {
        const pos = next[nid];
        const n = notes.find((n) => n.id === nid) ?? pendingNotes.find((p) => p.id === nid);
        if (n && pos) updateNote({ ...n, x: pos.x, y: pos.y });
      });
    }
  }, [selectedNoteIds, notes, pendingNotes, updateNote]);

  const handleToolbarPatch = useCallback(
    (patch: Partial<StickyNote>) => {
      selectedNoteIds.forEach((id) => {
        const note = notes.find((n) => n.id === id) ?? pendingNotes.find((p) => p.id === id);
        if (note) updateNote({ ...note, ...patch });
      });
    },
    [selectedNoteIds, notes, pendingNotes, updateNote]
  );

  const handleSaveNote = useCallback(
    (note: StickyNote) => {
      updateNote(note);
      if (note.rotation != null) {
        setOptimisticRotation((prev) => {
          const next = { ...prev };
          delete next[note.id];
          return next;
        });
      }
    },
    [updateNote]
  );

  const handleSelect = useCallback((noteId: string, shiftKey?: boolean) => {
    setFrontNoteIds((prev) => [...prev.filter((id) => id !== noteId), noteId]);
    setPrimarySelectedId(noteId);
    if (shiftKey) {
      setSelectedNoteIds((prev) => {
        const next = new Set(prev);
        if (next.has(noteId)) next.delete(noteId);
        else next.add(noteId);
        return next;
      });
    } else {
      setSelectedNoteIds(new Set([noteId]));
    }
  }, []);

  const handleAddImageClick = useCallback(() => {
    imageInputRef.current?.click();
  }, []);

  const handleAddSticker = useCallback(
    (url: string) => {
      if (!mainRef.current) return;
      const rect = mainRef.current.getBoundingClientRect();
      const { pan: currentPan, zoom: currentZoom } = panZoomRef.current;
      const contentCenterX = (rect.width / 2 - currentPan.x) / currentZoom;
      const contentCenterY = (rect.height / 2 - currentPan.y) / currentZoom;
      const noteId = crypto.randomUUID();
      const x = roundPosition(contentCenterX - 112);
      const y = roundPosition(contentCenterY - 100);
      const note: StickyNote = {
        id: noteId,
        x,
        y,
        text: "",
        color: "#f5f5f5",
        imageUrl: url,
        createdAt: Date.now(),
      };
      addNote(note);
      setSelectedNoteIds(new Set([noteId]));
      setPrimarySelectedId(noteId);
      setFrontNoteIds((prev) => [...prev.filter((id) => id !== noteId), noteId]);
    },
    [addNote]
  );

  const handleImageUpload = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      e.target.value = "";
      if (!file || !mainRef.current) return;
      const rect = mainRef.current.getBoundingClientRect();
      const { pan: currentPan, zoom: currentZoom } = panZoomRef.current;
      const contentCenterX = (rect.width / 2 - currentPan.x) / currentZoom;
      const contentCenterY = (rect.height / 2 - currentPan.y) / currentZoom;
      try {
        const blob = await upload(file.name, file, {
          access: "public",
          handleUploadUrl: "/api/board-image",
        });
        const noteId = crypto.randomUUID();
        const x = roundPosition(contentCenterX - 112);
        const y = roundPosition(contentCenterY - 100);
        const note: StickyNote = {
          id: noteId,
          x,
          y,
          text: "",
          color: "#f5f5f5",
          imageUrl: blob.url,
          createdAt: Date.now(),
          authorName: authorName ?? undefined,
          authorIconId: authorIconId ?? undefined,
        };
        addNote(note);
        setSelectedNoteIds(new Set([noteId]));
        setPrimarySelectedId(noteId);
        setFrontNoteIds((prev) => [...prev.filter((id) => id !== noteId), noteId]);
      } catch (err) {
        console.error("Image upload failed:", err);
        alert("Image upload failed. Try again.");
      }
    },
    [authorName, authorIconId, addNote]
  );

  useEffect(() => {
    if (user && boardId) addRoom(boardId);
  }, [user, boardId, addRoom]);

  useEffect(() => {
    if (!boardId || !user) return;
    ensureCurrentUser(user, authorIconId ?? null);
  }, [boardId, user, authorIconId, ensureCurrentUser]);

  useEffect(() => {
    if (boardId) ensureRoomExists();
  }, [boardId, ensureRoomExists]);

  useEffect(() => {
    const name = roomName || boardId;
    if (name) document.title = `${name} · Board`;
    return () => { document.title = "Reizoko"; };
  }, [roomName, boardId]);

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    setFrontNoteIds((prev) => {
      const ids = notes.map((n) => n.id);
      const next = prev.filter((id) => ids.includes(id));
      ids.forEach((id) => {
        if (!next.includes(id)) next.push(id);
      });
      return next;
    });
  }, [notes]);

  useEffect(() => {
    panZoomRef.current = { pan, zoom };
  }, [pan, zoom]);

  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;

    const MIN_ZOOM = 0.25;
    const MAX_ZOOM = 3;

    const handleWheel = (e: WheelEvent) => {
      if ((e.target as HTMLElement).closest("textarea")) return;
      const rect = el.getBoundingClientRect();
      const cursorInBoard = isPointInRect(e.clientX, e.clientY, rect);
      const target = e.target as Node;
      if (!cursorInBoard && !el.contains(target)) return;
      e.preventDefault();

      const vx = e.clientX - rect.left;
      const vy = e.clientY - rect.top;
      const { pan: currentPan, zoom: currentZoom } = panZoomRef.current;

      if (e.ctrlKey || e.metaKey || e.altKey) {
        // Pinch / Ctrl+scroll / Alt+scroll: zoom canvas toward cursor
        const scale = e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? 800 : 1;
        const delta = -e.deltaY * scale * 0.006;
        const newZoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, currentZoom * (1 + delta)));
        const ratio = newZoom / currentZoom;
        const newPanX = vx * (1 - ratio) + currentPan.x * ratio;
        const newPanY = vy * (1 - ratio) + currentPan.y * ratio;
        setZoom(newZoom);
        setPan({ x: newPanX, y: newPanY });
      } else {
        // Two-finger scroll: pan (sensitivity < 1 to slow trackpad)
        const scale = e.deltaMode === 1 ? 32 : e.deltaMode === 2 ? 800 : 1;
        const sensitivity = 0.65;
        const dx = e.deltaX * scale * sensitivity;
        const dy = e.deltaY * scale * sensitivity;
        setPan((prev) => ({
          x: prev.x - dx,
          y: prev.y - dy,
        }));
      }
    };

    document.addEventListener("wheel", handleWheel, { passive: false, capture: true });
    return () => document.removeEventListener("wheel", handleWheel, { capture: true });
  }, []);

  if (!boardId) {
    return (
      <FridgeLayout showJars>
        <div className="flex min-h-full items-center justify-center">
          <p className="text-zinc-500">Invalid board</p>
        </div>
      </FridgeLayout>
    );
  }

  return (
    <FridgeLayout showJars>
      <div className="flex min-h-0 flex-1 flex-col items-center overflow-hidden">
        <div className="fridge-canvas-bounds">
          <div
            ref={mainRef}
            className="relative h-full w-full overflow-hidden"
            style={{
              cursor: roomLoading ? "default" : isPanning ? "grabbing" : tool === "sticky" ? "crosshair" : tool === "move" ? "grab" : "default",
            }}
        onClick={roomLoading ? undefined : handleBoardClick}
        onPointerDown={roomLoading ? undefined : handlePointerDown}
        onPointerMove={roomLoading ? undefined : handlePointerMove}
        onPointerUp={roomLoading ? undefined : handlePointerUp}
        onPointerLeave={roomLoading ? undefined : handlePointerUp}
        role="application"
        aria-label="Board canvas"
      >
        {/* Fridge name + room code plaque (on the fridge, top right) */}
        {!roomLoading && boardId && (
          <div
            className="absolute right-[6.5rem] top-6 z-10"
            onPointerDown={(e) => e.stopPropagation()}
            onPointerUp={(e) => e.stopPropagation()}
            onPointerMove={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center gap-2 rounded border-2 px-3 py-2 font-serif text-zinc-900"
              style={{
                backgroundColor: "var(--fridge-cream)",
                borderColor: "#5c4033",
              }}
            >
              <EditableRoomName
                name={roomName || boardId || "Reizoko"}
                roomCode={boardId}
                onSave={setRoomName}
                hideCode={false}
                loading={roomLoading}
                disabled={!user}
                className="flex flex-col items-end gap-0.5 font-serif text-right"
                inputClassName="w-full min-w-0 border-0 border-b-2 border-zinc-600 bg-transparent py-0.5 text-right text-lg font-medium text-zinc-900 outline-none focus:ring-0 [background:transparent]"
                compact
              />
              <button
                type="button"
                onClick={() => setShowMembersModal(true)}
                className="inline-flex h-8 w-8 aspect-square items-center justify-center rounded-full border border-zinc-500/60 bg-white/30 text-zinc-700 hover:bg-neutral-200"
                title="View people in this room"
                aria-label="View people in this room"
              >
                <UserGroupIcon className="h-4 w-4 aspect-square" />
              </button>
            </div>
          </div>
        )}
        {roomLoading ? (
          <div className="absolute inset-0 min-h-full min-w-full" />
        ) : (
        <div
          className="absolute inset-0 min-h-full min-w-full origin-top-left"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            cursor: isPanning ? "grabbing" : tool === "sticky" ? "crosshair" : tool === "move" ? "grab" : "default",
          }}
        >
          <div className="absolute inset-0" />
          {displayNotes.map((note) => {
            const opt = optimisticPosition[note.id];
            const noteX = opt?.x ?? note.x;
            const noteY = opt?.y ?? note.y;
            const noteRotation = optimisticRotation[note.id] ?? note.rotation ?? 0;
            const noteZIndex = frontNoteIds.includes(note.id)
              ? 10 + frontNoteIds.indexOf(note.id)
              : 1;
            return (
              <div
                key={note.id}
                data-sticky
                className="absolute"
                style={{ left: noteX, top: noteY, zIndex: noteZIndex }}
              >
                <Sticky
                  note={note}
                  onUpdate={handleUpdate}
                  onDragEnd={handleDragEnd}
                  onDragMove={handleDragMove}
                  onSelect={handleSelect}
                  isDragging={draggingId === note.id}
                  isSelected={selectedNoteIds.has(note.id)}
                  showToolbar={selectedNoteIds.has(note.id) && !note.imageUrl && (selectedNoteIds.size <= 1 || note.id === primarySelectedId)}
                  autoFocusEdit={lastCreatedNoteId === note.id}
                  onEditEnd={handleEditEnd}
                  onSaveNote={handleSaveNote}
                  onToolbarPatch={selectedNoteIds.size > 0 ? handleToolbarPatch : undefined}
                  onDelete={handleDeleteSelected}
                  dragPosition={{ x: noteX, y: noteY }}
                  zoom={zoom}
                  displayX={0}
                  displayY={0}
                  displayRotation={noteRotation}
                  zIndex={noteZIndex}
                />
              </div>
            );
          })}
        </div>
        )}
      </div>
      </div>

      {selectionBox && (
        <div
          className="pointer-events-none fixed inset-0 z-10"
          aria-hidden
        >
          <div
            className="border-2 border-blue-500 bg-blue-500/20"
            style={{
              position: "fixed",
              left: Math.min(selectionBox.startX, selectionBox.endX),
              top: Math.min(selectionBox.startY, selectionBox.endY),
              width: Math.abs(selectionBox.endX - selectionBox.startX),
              height: Math.abs(selectionBox.endY - selectionBox.startY),
            }}
          />
        </div>
      )}

      <div className="pointer-events-none absolute inset-0 flex items-end justify-center pb-6">
        {draggingId ? (
          <div
            ref={deleteZoneRef}
            data-delete-zone
            className={`pointer-events-auto flex cursor-default items-center gap-2 rounded-full border px-5 py-3 transition ${
              dragOverDeleteZone
                ? "border-red-400 bg-red-100 text-red-700"
                : "border-zinc-200 bg-white hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            }`}
          >
            <DeleteZone active={dragOverDeleteZone} />
          </div>
        ) : (
          <div className="pointer-events-auto flex items-center gap-0.5 rounded-full border border-zinc-200 bg-white px-3 py-2">
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              aria-hidden
              onChange={handleImageUpload}
            />
            <BoardToolbar
              tool={tool}
              onToolChange={setTool}
              onAddStickerClick={handleAddSticker}
              onAddImageClick={handleAddImageClick}
              className="border-0 bg-transparent p-0"
            />
          </div>
        )}
      </div>
    </div>
      <Modal
        open={showMembersModal}
        onClose={() => setShowMembersModal(false)}
      >
        <h2 className="mb-2 text-sm font-semibold text-zinc-900">
          People in this room
        </h2>
        {members.length === 0 ? (
          <p className="text-sm text-zinc-600">
            Only you are here so far.
          </p>
        ) : (
          <ul className="mt-2 space-y-1">
            {members.map((m) => (
              <li
                key={m.id}
                className="flex items-center gap-2 rounded px-2 py-1 text-sm text-zinc-800"
              >
                {m.iconId && (
                  <img
                    src={getAvatarUrl(m.iconId)}
                    alt=""
                    className="h-6 w-6 shrink-0 rounded-full"
                  />
                )}
                <span className="truncate">
                  {m.displayName}
                  {user?.uid === m.id ? " (you)" : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </FridgeLayout>
  );
}
