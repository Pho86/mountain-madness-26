"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useCalendarFirestore } from "@/hooks/use-calendar-firestore";
import { useAuth } from "@/lib/auth-context";
import { useUserRooms } from "@/hooks/use-user-rooms";
import { useRoom } from "@/hooks/use-room";
import { BoardCalendar } from "@/components/BoardCalendar";
import { CalendarPageSkeleton } from "@/components/CalendarPageSkeleton";
import { RoomPageHeader } from "@/components/RoomPageHeader";

export default function CalendarPage() {
  const params = useParams();
  const calendarId =
    typeof params.calendarId === "string" ? params.calendarId : null;
  const { user } = useAuth();
  const { addRoom } = useUserRooms(user?.uid ?? null);
  const { name: roomName, ensureRoomExists, loading: roomLoading } = useRoom(calendarId);
  const { events, connected, addEvent, deleteEvent, deleteOccurrence } =
    useCalendarFirestore(calendarId);

  useEffect(() => {
    if (user && calendarId) addRoom(calendarId);
  }, [user, calendarId, addRoom]);

  useEffect(() => {
    if (calendarId) ensureRoomExists();
  }, [calendarId, ensureRoomExists]);

  useEffect(() => {
    const name = roomName || calendarId;
    if (name) document.title = `${name} · Calendar`;
    return () => { document.title = "Waifu Fridge"; };
  }, [roomName, calendarId]);

  if (!calendarId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-100">
        <p className="text-zinc-500">Invalid calendar</p>
      </div>
    );
  }

  if (roomLoading) {
    return <CalendarPageSkeleton />;
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-100 animate-fade-in">
      <RoomPageHeader
        left={`${roomName || calendarId}`}
        roomCode={calendarId}
      />

      <main
        className="flex-1 overflow-auto p-4"
        style={{ minHeight: "calc(100vh - 56px)" }}
      >
        <BoardCalendar
          calendarId={calendarId}
          events={events}
          connected={connected}
          addEvent={addEvent}
          deleteEvent={deleteEvent}
          deleteOccurrence={deleteOccurrence}
        />
      </main>
    </div>
  );
}
