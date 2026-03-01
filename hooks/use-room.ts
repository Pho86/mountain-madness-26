"use client";

import { useCallback, useEffect, useState } from "react";
import { doc, getDoc, onSnapshot, setDoc, serverTimestamp } from "firebase/firestore";
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
    const ref = doc(db, ROOMS, roomId);
    const unsub = onSnapshot(
      ref,
      (snapshot) => {
        const data = snapshot.data();
        setNameState((data?.name as string) ?? roomId);
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
      const trimmed = newName.trim() || roomId;
      const ref = doc(db, ROOMS, roomId);
      setDoc(ref, { name: trimmed }, { merge: true });
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
