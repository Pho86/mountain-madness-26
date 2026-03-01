"use client";

import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "@/lib/firebase";

const ROOMS = "rooms";

export function useRoomNames(roomIds: string[]) {
  const [names, setNames] = useState<Record<string, string>>({});

  useEffect(() => {
    if (roomIds.length === 0) {
      setNames({});
      return;
    }
    const unsubs = roomIds.map((id) => {
      const ref = doc(db, ROOMS, id);
      return onSnapshot(
        ref,
        (snapshot) => {
          const data = snapshot.data();
          setNames((prev) => ({
            ...prev,
            [id]: (data?.name as string) ?? id,
          }));
        },
        () => {
          setNames((prev) => ({ ...prev, [id]: id }));
        }
      );
    });
    return () => unsubs.forEach((u) => u());
  }, [roomIds.join(",")]);

  return names;
}
