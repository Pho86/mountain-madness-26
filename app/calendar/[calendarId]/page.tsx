"use client";

import { useEffect } from "react";
import { useParams } from "next/navigation";
import { useCalendarFirestore } from "@/hooks/use-calendar-firestore";
import { useAuth } from "@/lib/auth-context";
import { useUserRooms } from "@/hooks/use-user-rooms";
import { useRoom } from "@/hooks/use-room";
import { BoardCalendar } from "@/components/BoardCalendar";
import { CalendarPageSkeleton } from "@/components/CalendarPageSkeleton";
import { EditableRoomName } from "@/components/EditableRoomName";
import { FridgeLayout } from "@/components/FridgeLayout";

export default function CalendarPage() {
  const params = useParams();
  const calendarId =
    typeof params.calendarId === "string" ? params.calendarId : null;
  const { user } = useAuth();
  const { addRoom } = useUserRooms(user?.uid ?? null);
  const { name: roomName, setName: setRoomName, ensureRoomExists, loading: roomLoading } = useRoom(calendarId);
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
      <FridgeLayout showJars>
        <div className="flex min-h-full items-center justify-center">
          <p className="text-zinc-500">Invalid calendar</p>
        </div>
      </FridgeLayout>
    );
  }

  if (roomLoading) {
    return <CalendarPageSkeleton />;
  }

  return (
    <FridgeLayout showJars>
      <div className="flex min-h-full flex-col overflow-auto">
        {!roomLoading && calendarId && (
          <div className="shrink-0 p-4 pr-6 pt-6 flex justify-end">
            <div
              className="rounded border-2 px-4 py-2 font-serif text-zinc-900"
              style={{
                backgroundColor: "var(--fridge-cream)",
                borderColor: "#5c4033",
              }}
            >
              <EditableRoomName
                name={roomName || calendarId || "Calendar"}
                roomCode={calendarId}
                onSave={setRoomName}
                hideCode={false}
                loading={false}
                className="flex flex-col items-end gap-0.5 font-serif text-right"
                inputClassName="w-full min-w-0 border-0 border-b-2 border-zinc-600 bg-transparent py-0.5 text-right text-lg font-medium text-zinc-900 outline-none focus:ring-0 [background:transparent]"
                compact
              />
            </div>
          </div>
        )}
        <main className="flex-1 overflow-auto p-4" style={{ minHeight: 0 }}>
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
    </FridgeLayout>
  );
}
