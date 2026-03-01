"use client";

import { useCallback, useEffect, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Chore } from "@/lib/types";

const CHORES_COLLECTION = "chores";
const TASKS = "tasks";

function tasksRef(choresId: string) {
  return collection(db, CHORES_COLLECTION, choresId, TASKS);
}

function taskRef(choresId: string, taskId: string) {
  return doc(db, CHORES_COLLECTION, choresId, TASKS, taskId);
}

function toDoc(chore: Chore) {
  return {
    id: chore.id,
    title: chore.title,
    assignee: chore.assignee,
    frequencyDays: chore.frequencyDays,
    lastDoneAt: chore.lastDoneAt,
    createdAt: chore.createdAt,
  };
}

type TimestampLike = { toMillis?: () => number } | number | null;

function fromMillis(v: unknown): number {
  const t = v as TimestampLike;
  if (typeof t === "object" && t?.toMillis) return t.toMillis();
  return (t as number) ?? Date.now();
}

function fromDoc(data: {
  id: string;
  title: string;
  assignee: string;
  frequencyDays: number;
  lastDoneAt: unknown;
  createdAt: unknown;
}): Chore {
  return {
    id: data.id,
    title: data.title ?? "",
    assignee: data.assignee ?? "",
    frequencyDays:
      typeof data.frequencyDays === "number" && data.frequencyDays >= 1
        ? data.frequencyDays
        : 7,
    lastDoneAt:
      data.lastDoneAt == null ? null : fromMillis(data.lastDoneAt),
    createdAt: fromMillis(data.createdAt),
  };
}

export function useChoresFirestore(choresId: string | null) {
  const [chores, setChores] = useState<Chore[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!choresId) return;
    const ref = tasksRef(choresId);
    const unsub = onSnapshot(
      ref,
      (snapshot) => {
        setConnected(true);
        const list: Chore[] = [];
        snapshot.forEach((d) => {
          const data = d.data() as Parameters<typeof fromDoc>[0];
          if (data) list.push(fromDoc(data));
        });
        list.sort((a, b) => a.createdAt - b.createdAt);
        setChores(list);
      },
      () => setConnected(false)
    );
    return () => {
      unsub();
      setConnected(false);
    };
  }, [choresId]);

  const addChore = useCallback(
    (chore: Chore) => {
      if (!choresId) return;
      setDoc(taskRef(choresId, chore.id), toDoc(chore));
    },
    [choresId]
  );

  const markDone = useCallback(
    (id: string) => {
      if (!choresId) return;
      updateDoc(taskRef(choresId, id), { lastDoneAt: serverTimestamp() });
    },
    [choresId]
  );

  const deleteChore = useCallback(
    (id: string) => {
      if (!choresId) return;
      deleteDoc(taskRef(choresId, id));
    },
    [choresId]
  );

  return { chores, connected, addChore, markDone, deleteChore };
}
