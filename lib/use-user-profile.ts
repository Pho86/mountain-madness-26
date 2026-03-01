"use client";

import { useCallback, useEffect, useState } from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";

const USERS = "users";

export function useUserProfile(userId: string | null) {
  const [iconId, setIconIdState] = useState<string | null>(null);
  const [loading, setLoading] = useState(!!userId);

  useEffect(() => {
    if (!userId) {
      setIconIdState(null);
      setLoading(false);
      return;
    }
    const ref = doc(db, USERS, userId);
    const unsub = onSnapshot(
      ref,
      (snapshot) => {
        const data = snapshot.data();
        const id = typeof data?.iconId === "string" ? data.iconId : null;
        setIconIdState(id);
        setLoading(false);
      },
      () => {
        setIconIdState(null);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [userId]);

  const setIconId = useCallback(
    (newIconId: string) => {
      if (!userId) return Promise.resolve();
      const ref = doc(db, USERS, userId);
      setIconIdState(newIconId);
      return setDoc(ref, { iconId: newIconId }, { merge: true });
    },
    [userId]
  );

  return { iconId, setIconId, loading };
}
