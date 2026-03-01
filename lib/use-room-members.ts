"use client";

import { useEffect, useState, useCallback } from "react";
import { collection, doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { User } from "firebase/auth";

const ROOMS = "rooms";
const MEMBERS = "members";

function membersRef(roomId: string) {
  return collection(db, ROOMS, roomId, MEMBERS);
}

function memberRef(roomId: string, userId: string) {
  return doc(db, ROOMS, roomId, MEMBERS, userId);
}

export type RoomMember = { id: string; displayName: string };

export function useRoomMembers(roomId: string | null) {
  const [members, setMembers] = useState<RoomMember[]>([]);

  useEffect(() => {
    if (!roomId) {
      setMembers([]);
      return;
    }
    const ref = membersRef(roomId);
    const unsub = onSnapshot(ref, (snapshot) => {
      const list: RoomMember[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        const id = d.id;
        const displayName =
          (data?.displayName as string) || (data?.email as string) || "Someone";
        if (id) list.push({ id, displayName });
      });
      list.sort((a, b) => a.displayName.localeCompare(b.displayName));
      setMembers(list);
    });
    return () => unsub();
  }, [roomId]);

  const ensureCurrentUser = useCallback(
    (user: User | null) => {
      if (!roomId || !user) return;
      const ref = memberRef(roomId, user.uid);
      const displayName =
        user.displayName || user.email?.split("@")[0] || "Someone";
      setDoc(ref, { displayName, email: user.email ?? null }, { merge: true });
    },
    [roomId],
  );

  return { members, ensureCurrentUser };
}
