"use client";

import { useEffect, useState, useCallback } from "react";
import {
  collection,
  doc,
  onSnapshot,
  setDoc,
  deleteDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { CalendarEvent } from "@/lib/types";

const EVENTS = "events";
const CALENDARS = "calendars";

function eventsRef(calendarId: string) {
  return collection(db, CALENDARS, calendarId, EVENTS);
}

function eventRef(calendarId: string, eventId: string) {
  return doc(db, CALENDARS, calendarId, EVENTS, eventId);
}

function toDoc(event: CalendarEvent) {
  return {
    id: event.id,
    title: event.title,
    date: event.date,
    time: event.time,
    recurring: event.recurring,
    createdAt: event.createdAt,
  };
}

function fromDoc(data: {
  id: string;
  title: string;
  date: string;
  time: string | null;
  recurring: CalendarEvent["recurring"];
  createdAt: unknown;
}): CalendarEvent {
  const created = data.createdAt as { toMillis?: () => number } | number | null;
  return {
    id: data.id,
    title: data.title ?? "",
    date: data.date ?? "",
    time: data.time ?? null,
    recurring: data.recurring ?? "none",
    createdAt:
      typeof created === "object" && created?.toMillis
        ? created.toMillis()
        : ((created as number) ?? Date.now()),
  };
}

export function useCalendarFirestore(calendarId: string | null) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!calendarId) return;
    const ref = eventsRef(calendarId);
    const unsub = onSnapshot(
      ref,
      (snapshot) => {
        setConnected(true);
        const list: CalendarEvent[] = [];
        snapshot.forEach((d) => {
          const data = d.data() as Parameters<typeof fromDoc>[0];
          if (data) list.push(fromDoc(data));
        });
        list.sort((a, b) => a.createdAt - b.createdAt);
        setEvents(list);
      },
      () => setConnected(false),
    );
    return () => {
      unsub();
      setConnected(false);
    };
  }, [calendarId]);

  const addEvent = useCallback(
    (event: CalendarEvent) => {
      if (!calendarId) return;
      setDoc(eventRef(calendarId, event.id), toDoc(event));
    },
    [calendarId],
  );

  const deleteEvent = useCallback(
    (id: string) => {
      if (!calendarId) return;
      deleteDoc(eventRef(calendarId, id));
    },
    [calendarId],
  );

  return { events, connected, addEvent, deleteEvent };
}
