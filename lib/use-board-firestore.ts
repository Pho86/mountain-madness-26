"use client";

import { useEffect, useState, useCallback } from "react";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { StickyNote } from "@/lib/types";

const NOTES = "notes";
const BOARDS = "boards";

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
    ...(note.fontSize != null && { fontSize: note.fontSize }),
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
  fontSize?: number | "sm" | "base" | "lg";
  fontWeight?: "normal" | "bold";
  fontStyle?: "normal" | "italic";
  listStyle?: "none" | "bullet";
  authorName?: string;
  authorIconId?: string;
}): StickyNote {
  const created = data.createdAt as { toMillis?: () => number } | number | null;
  return {
    id: data.id,
    x: data.x,
    y: data.y,
    text: data.text ?? "",
    color: data.color ?? "#fef08a",
    fontSize: normalizeFontSize(data.fontSize),
    fontWeight: data.fontWeight ?? "normal",
    fontStyle: data.fontStyle ?? "normal",
    listStyle: data.listStyle ?? "none",
    createdAt: typeof created === "object" && created?.toMillis ? created.toMillis() : (created as number) ?? Date.now(),
    authorName: data.authorName,
    authorIconId: data.authorIconId,
  };
}

export function useBoardFirestore(boardId: string | null) {
  const [notes, setNotes] = useState<StickyNote[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!boardId) return;
    const ref = notesRef(boardId);
    const unsub = onSnapshot(
      ref,
      (snapshot) => {
        setConnected(true);
        const list: StickyNote[] = [];
        snapshot.forEach((d) => {
          const data = d.data() as Parameters<typeof fromDoc>[0];
          if (data) list.push(fromDoc(data));
        });
        list.sort((a, b) => a.createdAt - b.createdAt);
        setNotes(list);
      },
      () => setConnected(false)
    );
    return () => {
      unsub();
      setConnected(false);
    };
  }, [boardId]);

  const addNote = useCallback(
    (note: StickyNote) => {
      if (!boardId) return;
      setDoc(noteRef(boardId, note.id), toDoc(note));
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
        ...(note.fontSize != null && { fontSize: note.fontSize }),
        ...(note.fontWeight != null && { fontWeight: note.fontWeight }),
        ...(note.fontStyle != null && { fontStyle: note.fontStyle }),
        ...(note.listStyle != null && { listStyle: note.listStyle }),
        ...(note.authorName != null && { authorName: note.authorName }),
        ...(note.authorIconId != null && { authorIconId: note.authorIconId }),
      });
    },
    [boardId]
  );

  const deleteNote = useCallback(
    (id: string) => {
      if (!boardId) return;
      deleteDoc(noteRef(boardId, id));
    },
    [boardId]
  );

  return { notes, connected, addNote, updateNote, deleteNote };
}
