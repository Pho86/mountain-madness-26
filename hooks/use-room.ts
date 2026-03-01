"use client";

import { useCallback, useEffect, useState } from "react";
import { doc, getDoc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

const ROOMS = "rooms";
const BOARDS = "boards";

/** Returns true if a room document exists in Firestore. */
export async function checkRoomExists(roomId: string): Promise<boolean> {
  const id = roomId?.trim();
  if (!id) return false;
  const ref = doc(db, ROOMS, id);
  const snapshot = await getDoc(ref);
  return snapshot.exists();
}

/** Room name is stored in boards/{boardId} so it uses the same Firestore path as notes. */
function boardRef(boardId: string) {
  return doc(db, BOARDS, boardId);
}

export function useRoom(roomId: string | null) {
  const [name, setNameState] = useState<string>("");
  const [loading, setLoading] = useState(!!roomId);

  useEffect(() => {
    if (!roomId) {
      setNameState("");
      setLoading(false);
      return;
    }
    setLoading(true);
    const ref = boardRef(roomId);
    const unsub = onSnapshot(
      ref,
      (snapshot) => {
        const data = snapshot.data();
        const savedName = data?.name;
        setNameState(typeof savedName === "string" && savedName.trim() ? savedName.trim() : roomId);
        setLoading(false);
      },
      () => {
        setNameState(roomId);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [roomId]);

  const ensureRoomExists = useCallback(() => {
    if (!roomId) return;
    const ref = doc(db, ROOMS, roomId);
    setDoc(ref, { updatedAt: serverTimestamp() }, { merge: true });
  }, [roomId]);

  const setName = useCallback(
    (newName: string) => {
      if (!roomId) return;
      const trimmed = (newName.trim() || roomId).slice(0, 18);
      const ref = boardRef(roomId);
      setDoc(ref, { name: trimmed }, { merge: true })
        .then(() => setNameState(trimmed))
        .catch((err) => {
          console.error("[useRoom] Failed to save room name:", err);
        });
    },
    [roomId]
  );

  return {
    name: name || roomId || "",
    setName,
    loading,
    ensureRoomExists,
  };
}
