"use client";

import { useCallback, useEffect, useState } from "react";
import { doc, getDoc, getDocFromServer, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";

const ROOMS = "rooms";

/** Returns true if a room document exists in Firestore. */
export async function checkRoomExists(roomId: string): Promise<boolean> {
  const id = roomId?.trim();
  if (!id) return false;
  const ref = doc(db, ROOMS, id);
  const snapshot = await getDoc(ref);
  return snapshot.exists();
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
    let cancelled = false;
    setLoading(true);
    const ref = doc(db, ROOMS, roomId);
    getDocFromServer(ref)
      .then((snapshot) => {
        if (cancelled) return;
        const data = snapshot.data();
        const savedName = data?.name;
        setNameState(typeof savedName === "string" && savedName.trim() ? savedName.trim() : roomId);
      })
      .catch(() => {
        if (!cancelled) setNameState(roomId);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
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
      const ref = doc(db, ROOMS, roomId);
      setDoc(ref, { name: trimmed }, { merge: true })
        .then(() => setNameState(trimmed))
        .catch(() => {});
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
