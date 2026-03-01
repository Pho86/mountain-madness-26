"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { useParams } from "next/navigation";
import { useBoardFirestore } from "@/lib/use-board-firestore";
import { useAuth } from "@/lib/auth-context";
import { useUserRooms } from "@/lib/use-user-rooms";
import { Sticky, useAddSticky } from "@/components/Sticky";
import { BoardToolbar } from "@/components/BoardToolbar";
import { DeleteZone } from "@/components/DeleteZone";
import { EditableRoomName } from "@/components/EditableRoomName";
import { RoomPageHeader } from "@/components/RoomPageHeader";
import { BoardPageSkeleton } from "@/components/BoardPageSkeleton";
import { useRoom } from "@/lib/use-room";
import type { StickyNote } from "@/lib/types";

type Tool = "cursor" | "move" | "sticky";

const DELETE_ZONE_SELECTOR = "[data-delete-zone]";

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
  const createSticky = useAddSticky(authorName);
  const [tool, setTool] = useState<Tool>("cursor");
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [selectedNoteIds, setSelectedNoteIds] = useState<Set<string>>(new Set());
  const [primarySelectedId, setPrimarySelectedId] = useState<string | null>(null);
  const [lastCreatedNoteId, setLastCreatedNoteId] = useState<string | null>(null);
  const [dragOverDeleteZone, setDragOverDeleteZone] = useState(false);
  const [frontNoteIds, setFrontNoteIds] = useState<string[]>([]);
  const [optimisticPosition, setOptimisticPosition] = useState<Record<string, { x: number; y: number }>>({});
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

  const noteIds = new Set(notes.map((n) => n.id));
  const displayNotes = [...notes, ...pendingNotes.filter((p) => !noteIds.has(p.id))];

  const handleBoardClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
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
      if ((e.target as HTMLElement).closest("[data-sticky]")) return;
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
      setIsPanning(true);
      panStartRef.current = {
        clientX: e.clientX,
        clientY: e.clientY,
        panX: pan.x,
        panY: pan.y,
      };
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

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Delete" && e.key !== "Backspace") return;
      if ((e.target as HTMLElement).closest("textarea, input")) return;
      if (selectedNoteIds.size === 0) return;
      e.preventDefault();
      selectedNoteIds.forEach((id) => deleteNote(id));
      setSelectedNoteIds(new Set());
      setPrimarySelectedId(null);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectedNoteIds, deleteNote]);

  useEffect(() => {
    if (primarySelectedId && !selectedNoteIds.has(primarySelectedId)) {
      setPrimarySelectedId(selectedNoteIds.size > 0 ? (selectedNoteIds.values().next().value ?? null) : null);
    }
  }, [selectedNoteIds, primarySelectedId]);

  const handleUpdate = useCallback((note: StickyNote) => {
    const id = note.id;
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

  useEffect(() => {
    if (user && boardId) addRoom(boardId);
  }, [user, boardId, addRoom]);

  useEffect(() => {
    if (boardId) ensureRoomExists();
  }, [boardId, ensureRoomExists]);

  useEffect(() => {
    const name = roomName || boardId;
    if (name) document.title = `${name} · Board`;
    return () => { document.title = "Waifu Fridge"; };
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
      <div className="flex min-h-screen items-center justify-center bg-zinc-100">
        <p className="text-zinc-500">Invalid board</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-100 animate-fade-in">
      <RoomPageHeader
        left={
          <EditableRoomName
            name={roomName}
            roomCode={boardId}
            onSave={setRoomName}
            hideCode
            loading={roomLoading}
          />
        }
        roomCode={boardId}
      />

      <main
        ref={mainRef}
        className="relative flex-1 overflow-hidden"
        style={{
          minHeight: "calc(100vh - 56px)",
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
        {roomLoading ? (
          <div className="absolute inset-0 min-h-full min-w-full">
            <div className="absolute left-[8%] top-[12%] -rotate-2">
              <div className="h-28 w-44 rounded-lg bg-zinc-200/90 animate-skeleton-pulse" />
            </div>
            <div className="absolute left-[42%] top-[8%] rotate-1">
              <div className="h-32 w-40 rounded-lg bg-zinc-200/80 animate-skeleton-pulse" style={{ animationDelay: "0.15s" }} />
            </div>
            <div className="absolute right-[15%] top-[22%] -rotate-1">
              <div className="h-24 w-36 rounded-lg bg-zinc-200/85 animate-skeleton-pulse" style={{ animationDelay: "0.3s" }} />
            </div>
            <div className="absolute left-[15%] top-[45%] rotate-2">
              <div className="h-28 w-40 rounded-lg bg-zinc-200/75 animate-skeleton-pulse" style={{ animationDelay: "0.1s" }} />
            </div>
            <div className="absolute left-[55%] top-[38%] -rotate-1">
              <div className="h-28 w-40 rounded-lg bg-zinc-200/80 animate-skeleton-pulse" style={{ animationDelay: "0.25s" }} />
            </div>
            <div className="absolute right-[25%] top-[55%] rotate-1">
              <div className="h-24 w-32 rounded-lg bg-zinc-200/70 animate-skeleton-pulse" style={{ animationDelay: "0.35s" }} />
            </div>
          </div>
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
            const noteZIndex = frontNoteIds.includes(note.id)
              ? 10 + frontNoteIds.indexOf(note.id)
              : 1;
            return (
              <div key={note.id} data-sticky>
                <Sticky
                  note={note}
                  onUpdate={handleUpdate}
                  onDragEnd={handleDragEnd}
                  onDragMove={handleDragMove}
                  onSelect={handleSelect}
                  isDragging={draggingId === note.id}
                  isSelected={selectedNoteIds.has(note.id)}
                  showToolbar={selectedNoteIds.has(note.id) && (selectedNoteIds.size <= 1 || note.id === primarySelectedId)}
                  autoFocusEdit={lastCreatedNoteId === note.id}
                  onEditEnd={handleEditEnd}
                  onSaveNote={updateNote}
                  onToolbarPatch={selectedNoteIds.size > 0 ? handleToolbarPatch : undefined}
                  displayX={opt?.x}
                  displayY={opt?.y}
                  zIndex={noteZIndex}
                />
              </div>
            );
          })}
        </div>
        )}
      </main>

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
          <div className="pointer-events-auto flex items-center gap-0.5 rounded-full border border-zinc-200 bg-white px-3 py-2 shadow-sm">
            <BoardToolbar
              tool={tool}
              onToolChange={setTool}
              className="border-0 bg-transparent p-0"
            />
          </div>
        )}
      </div>
    </div>
  );
}
