"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";

const BOARDS = "boards";
const CURSORS = "cursors";

const CURSOR_THROTTLE_MS = 32;
const CURSOR_STALE_MS = 5000;

export type CursorPresence = {
  userId: string;
  x: number;
  y: number;
  displayName: string;
  updatedAt: number;
};

function cursorRef(boardId: string, userId: string) {
  return doc(db, BOARDS, boardId, CURSORS, userId);
}

function cursorsRef(boardId: string) {
  return collection(db, BOARDS, boardId, CURSORS);
}

export function useBoardCursors(
  boardId: string | null,
  userId: string | null,
  displayName: string | undefined
) {
  const [otherCursors, setOtherCursors] = useState<CursorPresence[]>([]);
  const lastWriteRef = useRef(0);
  const pendingRef = useRef<{ x: number; y: number } | null>(null);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    if (!boardId || !userId) return;
    // DISABLED to reduce Firebase costs: real-time cursor presence
    // const ref = cursorsRef(boardId);
    // const unsub = onSnapshot(ref, (snapshot) => {
    //   const now = Date.now();
    //   const list: CursorPresence[] = [];
    //   snapshot.forEach((d) => {
    //     if (d.id === userId) return;
    //     const data = d.data();
    //     const updatedAt =
    //       data?.updatedAt && typeof data.updatedAt.toMillis === "function"
    //         ? data.updatedAt.toMillis()
    //         : 0;
    //     if (now - updatedAt > CURSOR_STALE_MS) return;
    //     const x = typeof data?.x === "number" ? data.x : 0;
    //     const y = typeof data?.y === "number" ? data.y : 0;
    //     list.push({
    //       userId: d.id,
    //       x,
    //       y,
    //       displayName: (data?.displayName as string) || "Someone",
    //       updatedAt,
    //     });
    //   });
    //   setOtherCursors(list);
    // });
    // return () => unsub();
    return () => {};
  }, [boardId, userId]);

  const setMyCursor = useCallback(
    (_contentX: number, _contentY: number) => {
      // DISABLED to reduce Firebase costs: no cursor writes
      // if (!boardId || !userId) return;
      // const now = Date.now();
      // pendingRef.current = { x: contentX, y: contentY };
      // ...
      // setDoc(cursorRef(boardId, userId), { ... }, { merge: true });
    },
    [] // [boardId, userId, displayName]
  );

  useEffect(() => {
    if (!boardId || !userId) return;
    // DISABLED to reduce Firebase costs: no cursor cleanup write
    // return () => {
    //   deleteDoc(cursorRef(boardId, userId)).catch(() => {});
    // };
    return () => {};
  }, [boardId, userId]);

  return { otherCursors, setMyCursor };
}
