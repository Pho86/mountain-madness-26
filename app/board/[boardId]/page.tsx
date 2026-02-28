"use client";

import { useCallback, useEffect, useRef, useState } from "react";
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

type Tool = "cursor" | "sticky";

const DELETE_ZONE_SELECTOR = "[data-delete-zone]";

function isPointInRect(x: number, y: number, rect: DOMRect): boolean {
  return x >= rect.left && x <= rect.right && y >= rect.top && y <= rect.bottom;
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
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [lastCreatedNoteId, setLastCreatedNoteId] = useState<string | null>(null);
  const [optimisticPosition, setOptimisticPosition] = useState<Record<string, { x: number; y: number }>>({});
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState(false);
  const panStartRef = useRef<{ clientX: number; clientY: number; panX: number; panY: number } | null>(null);
  const didPanRef = useRef(false);
  const deleteZoneRef = useRef<HTMLDivElement>(null);

  const handleBoardClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (didPanRef.current) {
        didPanRef.current = false;
        return;
      }
      if ((e.target as HTMLElement).closest("[data-sticky]")) return;
      if (tool === "sticky") {
        const rect = e.currentTarget.getBoundingClientRect();
        const x = e.clientX - rect.left - pan.x - 80;
        const y = e.clientY - rect.top - pan.y - 40;
        const note = createSticky(x, y);
        addNote(note);
        setLastCreatedNoteId(note.id);
      } else {
        setSelectedNoteId(null);
      }
    },
    [tool, addNote, createSticky, pan.x, pan.y]
  );

  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      if ((e.target as HTMLElement).closest("[data-sticky]")) return;
      if (tool !== "cursor") return;
      setIsPanning(true);
      panStartRef.current = {
        clientX: e.clientX,
        clientY: e.clientY,
        panX: pan.x,
        panY: pan.y,
      };
    },
    [tool, pan.x, pan.y]
  );

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const start = panStartRef.current;
      if (!start) return;
      didPanRef.current = true;
      setPan({
        x: start.panX + (e.clientX - start.clientX),
        y: start.panY + (e.clientY - start.clientY),
      });
    },
    []
  );

  const handlePointerUp = useCallback(() => {
    panStartRef.current = null;
    setIsPanning(false);
  }, []);

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

  const mainRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = mainRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if ((e.target as HTMLElement).closest("textarea")) return;
      e.preventDefault();
      setPan((prev) => ({
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY,
      }));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  if (!boardId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-100">
        <p className="text-zinc-500">Invalid board</p>
      </div>
    );
  }

  if (roomLoading) {
    return <BoardPageSkeleton />;
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
          />
        }
        roomCode={boardId}
      />

      <BoardToolbar tool={tool} onToolChange={setTool} />

      <main
        ref={mainRef}
        className="relative flex-1 overflow-hidden"
        style={{
          minHeight: "calc(100vh - 56px - 44px)",
          cursor: isPanning ? "grabbing" : tool === "sticky" ? "crosshair" : "grab",
        }}
        onClick={handleBoardClick}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        role="application"
        aria-label="Board canvas"
      >
        <div
          className="absolute inset-0 min-h-full min-w-full"
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px)`,
            cursor: isPanning ? "grabbing" : tool === "sticky" ? "crosshair" : "grab",
          }}
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
                  onSaveNote={updateNote}
                  displayX={opt?.x}
                  displayY={opt?.y}
                />
              </div>
            );
          })}
        </div>
      </main>

      <div className="pointer-events-none absolute inset-0 flex items-end justify-center pb-6">
        <div
          ref={deleteZoneRef}
          data-delete-zone
          className="pointer-events-auto flex cursor-default items-center gap-2 rounded-full border border-zinc-200 bg-white px-5 py-3 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
        >
          <DeleteZone />
        </div>
      </div>
    </div>
  );
}
