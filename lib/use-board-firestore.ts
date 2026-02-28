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
    createdAt: note.createdAt,
  };
}

function fromDoc(data: { id: string; x: number; y: number; text: string; color: string; createdAt: unknown }): StickyNote {
  const created = data.createdAt as { toMillis?: () => number } | number | null;
  return {
    id: data.id,
    x: data.x,
    y: data.y,
    text: data.text ?? "",
    color: data.color ?? "#fef08a",
    createdAt: typeof created === "object" && created?.toMillis ? created.toMillis() : (created as number) ?? Date.now(),
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
