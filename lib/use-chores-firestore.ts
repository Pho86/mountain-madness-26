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

function fromDoc(data: {
  id: string;
  title: string;
  assignee: string;
  frequencyDays: number;
  lastDoneAt: unknown;
  createdAt: unknown;
}): Chore {
  const created = data.createdAt as { toMillis?: () => number } | number | null;
  const lastDone = data.lastDoneAt as { toMillis?: () => number } | number | null | undefined;
  return {
    id: data.id,
    title: data.title ?? "",
    assignee: data.assignee ?? "",
    frequencyDays:
      typeof data.frequencyDays === "number" && data.frequencyDays >= 1
        ? data.frequencyDays
        : 7,
    lastDoneAt:
      lastDone == null
        ? null
        : typeof lastDone === "object" && (lastDone as { toMillis?: () => number })?.toMillis
          ? (lastDone as { toMillis: () => number }).toMillis()
          : (lastDone as number),
    createdAt:
      typeof created === "object" && (created as { toMillis?: () => number })?.toMillis
        ? (created as { toMillis: () => number }).toMillis()
        : ((created as number) ?? Date.now()),
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
      () => setConnected(false),
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
    [choresId],
  );

  const markDone = useCallback(
    (id: string) => {
      if (!choresId) return;
      updateDoc(taskRef(choresId, id), { lastDoneAt: Date.now() });
    },
    [choresId],
  );

  const deleteChore = useCallback(
    (id: string) => {
      if (!choresId) return;
      deleteDoc(taskRef(choresId, id));
    },
    [choresId],
  );

  return { chores, connected, addChore, markDone, deleteChore };
}
