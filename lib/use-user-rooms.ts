"use client";

import { useCallback, useEffect, useState } from "react";
import { doc, onSnapshot, setDoc, arrayUnion } from "firebase/firestore";
import { db } from "@/lib/firebase";

const USERS = "users";

export function useUserRooms(userId: string | null) {
  const [rooms, setRooms] = useState<string[]>([]);
  const [loading, setLoading] = useState(!!userId);

  useEffect(() => {
    if (!userId) {
      setRooms([]);
      setLoading(false);
      return;
    }
    const ref = doc(db, USERS, userId);
    const unsub = onSnapshot(
      ref,
      (snapshot) => {
        const data = snapshot.data();
        const list = (data?.roomIds as string[] | undefined) ?? [];
        setRooms(Array.isArray(list) ? list : []);
        setLoading(false);
      },
      () => {
        setRooms([]);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [userId]);

  const addRoom = useCallback(
    (roomId: string) => {
      if (!userId || !roomId.trim()) return;
      const ref = doc(db, USERS, userId);
      setDoc(ref, { roomIds: arrayUnion(roomId.trim()) }, { merge: true });
    },
    [userId]
  );

  return { rooms, loading, addRoom };
}
