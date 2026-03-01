"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { StickyNote } from "@/lib/types";

const BOARDS = "boards";
const NOTES = "notes";

function notesRef(boardId: string) {
  return collection(db, BOARDS, boardId, NOTES);
}

function noteRef(boardId: string, noteId: string) {
  return doc(db, BOARDS, boardId, NOTES, noteId);
}

/** Firestore document shape (createdAt is stored as Timestamp). */
function toDoc(note: StickyNote) {
  return {
    id: note.id,
    x: note.x,
    y: note.y,
    text: note.text,
    color: note.color,
    ...(note.imageUrl != null && { imageUrl: note.imageUrl }),
    ...(note.imageScale != null && { imageScale: note.imageScale }),
    ...(note.fontSize != null && { fontSize: note.fontSize }),
    ...(note.rotation != null && { rotation: note.rotation }),
    ...(note.fontWeight != null && { fontWeight: note.fontWeight }),
    ...(note.fontStyle != null && { fontStyle: note.fontStyle }),
    ...(note.listStyle != null && { listStyle: note.listStyle }),
    createdAt: note.createdAt,
    ...(note.authorName != null && { authorName: note.authorName }),
    ...(note.authorIconId != null && { authorIconId: note.authorIconId }),
  };
}

function normalizeFontSize(v: unknown): number {
  if (typeof v === "number" && v >= 10 && v <= 48) return v;
  if (v === "sm") return 12;
  if (v === "base") return 16;
  if (v === "lg") return 20;
  return 16;
}

function fromDoc(data: {
  id: string;
  x: number;
  y: number;
  text: string;
  color: string;
  createdAt: unknown;
  imageUrl?: string;
  imageScale?: number;
  fontSize?: number | "sm" | "base" | "lg";
  rotation?: number;
  fontWeight?: "normal" | "bold";
  fontStyle?: "normal" | "italic";
  listStyle?: "none" | "bullet";
  authorName?: string;
  authorIconId?: string;
}): StickyNote {
  const created = data.createdAt as { toMillis?: () => number } | number | null;
  const createdAt =
    typeof created === "object" && created?.toMillis
      ? created.toMillis()
      : (created as number) ?? Date.now();
  return {
    id: data.id,
    x: data.x,
    y: data.y,
    text: data.text ?? "",
    color: data.color ?? "#fef08a",
    imageUrl: data.imageUrl,
    imageScale: typeof data.imageScale === "number" && data.imageScale >= 0.25 && data.imageScale <= 4
      ? data.imageScale
      : undefined,
    fontSize: normalizeFontSize(data.fontSize),
    rotation: typeof data.rotation === "number" ? data.rotation : undefined,
    fontWeight: data.fontWeight ?? "normal",
    fontStyle: data.fontStyle ?? "normal",
    listStyle: data.listStyle ?? "none",
    createdAt,
    authorName: data.authorName,
    authorIconId: data.authorIconId,
  };
}

export function useBoardFirestore(boardId: string | null) {
  const [notes, setNotes] = useState<StickyNote[]>([]);
  const [connected, setConnected] = useState(false);
  const retriedRef = useRef(false);

  const loadNotes = useCallback(async () => {
    if (!boardId) return;
    try {
      const snapshot = await getDocs(notesRef(boardId));
      const list: StickyNote[] = [];
      snapshot.forEach((d) => {
        const data = d.data() as Parameters<typeof fromDoc>[0];
        if (data) list.push(fromDoc(data));
      });
      list.sort((a, b) => a.createdAt - b.createdAt);
      setNotes(list);
      setConnected(true);
    } catch (err) {
      setConnected(false);
      setNotes([]);
      if (!retriedRef.current) {
        retriedRef.current = true;
        setTimeout(() => loadNotes(), 3000);
      }
    }
  }, [boardId]);

  useEffect(() => {
    if (!boardId) {
      setNotes([]);
      setConnected(false);
      retriedRef.current = false;
      return;
    }
    retriedRef.current = false;
    loadNotes();
  }, [boardId, loadNotes]);

  const addNote = useCallback(
    (note: StickyNote) => {
      if (!boardId) return;
      setDoc(noteRef(boardId, note.id), toDoc(note));
      setNotes((prev) => [...prev, note].sort((a, b) => a.createdAt - b.createdAt));
    },
    [boardId]
  );

  const updateNote = useCallback(
    (note: StickyNote) => {
      if (!boardId) return;
      updateDoc(noteRef(boardId, note.id), {
        x: note.x,
        y: note.y,
        text: note.text,
        color: note.color,
        ...(note.imageUrl != null && { imageUrl: note.imageUrl }),
        ...(note.imageScale != null && { imageScale: note.imageScale }),
        ...(note.fontSize != null && { fontSize: note.fontSize }),
        ...(note.rotation != null && { rotation: note.rotation }),
        ...(note.fontWeight != null && { fontWeight: note.fontWeight }),
        ...(note.fontStyle != null && { fontStyle: note.fontStyle }),
        ...(note.listStyle != null && { listStyle: note.listStyle }),
        ...(note.authorName != null && { authorName: note.authorName }),
        ...(note.authorIconId != null && { authorIconId: note.authorIconId }),
      });
      setNotes((prev) =>
        prev.map((n) => (n.id === note.id ? note : n))
      );
    },
    [boardId]
  );

  const deleteNote = useCallback(
    (id: string) => {
      if (!boardId) return;
      deleteDoc(noteRef(boardId, id));
      setNotes((prev) => prev.filter((n) => n.id !== id));
    },
    [boardId]
  );

  return { notes, connected, addNote, updateNote, deleteNote };
}
