"use client";

import { useEffect, useState } from "react";
import { UserGroupIcon } from "@heroicons/react/24/outline";
import { useParams } from "next/navigation";
import { useCalendarFirestore } from "@/hooks/use-calendar-firestore";
import { useAuth } from "@/lib/auth-context";
import { useUserRooms } from "@/hooks/use-user-rooms";
import { useRoom } from "@/hooks/use-room";
import { useRoomMembers } from "@/hooks/use-room-members";
import { BoardCalendar } from "@/components/BoardCalendar";
import { EditableRoomName } from "@/components/EditableRoomName";
import { FridgeLayout } from "@/components/FridgeLayout";
import { Modal } from "@/components/Modal";
import { getAvatarUrl } from "@/lib/avatars";

export default function CalendarPage() {
  const params = useParams();
  const calendarId =
    typeof params.calendarId === "string" ? params.calendarId : null;
  const { user } = useAuth();
  const { addRoom } = useUserRooms(user?.uid ?? null);
  const { name: roomName, setName: setRoomName, ensureRoomExists, loading: roomLoading } = useRoom(calendarId);
  const { events, connected, addEvent, deleteEvent, deleteOccurrence } =
    useCalendarFirestore(calendarId);
  const { members, ensureCurrentUser } = useRoomMembers(calendarId);
  const [showMembersModal, setShowMembersModal] = useState(false);

  useEffect(() => {
    if (user && calendarId) addRoom(calendarId);
  }, [user, calendarId, addRoom]);

  useEffect(() => {
    if (calendarId) ensureRoomExists();
  }, [calendarId, ensureRoomExists]);

  useEffect(() => {
    const name = roomName || calendarId;
    if (name) document.title = `${name} · Calendar`;
    return () => { document.title = "Reizoko"; };
  }, [roomName, calendarId]);

  useEffect(() => {
    if (!calendarId || !user) return;
    ensureCurrentUser(user, null);
  }, [calendarId, user, ensureCurrentUser]);

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
    return (
      <FridgeLayout showJars>
        <div className="flex min-h-full flex-1 flex-col" />
      </FridgeLayout>
    );
  }

  return (
    <FridgeLayout showJars>
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden pt-8 pb-14">
        {!roomLoading && calendarId && (
          <div className="absolute right-[6.5rem] top-[3.5rem] z-10">
            <div
              className="flex items-center gap-2 rounded border-2 px-3 py-2 font-serif text-zinc-900"
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
              <button
                type="button"
                onClick={() => setShowMembersModal(true)}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-zinc-500/60 bg-white/80 text-zinc-700 shadow-sm hover:bg-white"
                title="View people in this room"
                aria-label="View people in this room"
              >
                <UserGroupIcon className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
        <main className="flex flex-1 flex-col items-center justify-center overflow-hidden p-4" style={{ minHeight: 0 }}>
          <div className="mx-auto w-full max-w-2xl">
            <BoardCalendar
              calendarId={calendarId}
              events={events}
              connected={connected}
              addEvent={addEvent}
              deleteEvent={deleteEvent}
              deleteOccurrence={deleteOccurrence}
            />
          </div>
        </main>
      </div>
      <Modal
        open={showMembersModal}
        onClose={() => setShowMembersModal(false)}
      >
        <h2 className="mb-2 text-sm font-semibold text-zinc-900">
          People in this room
        </h2>
        {members.length === 0 ? (
          <p className="text-sm text-zinc-600">
            Only you are here so far.
          </p>
        ) : (
          <ul className="mt-2 space-y-1">
            {members.map((m) => (
              <li
                key={m.id}
                className="flex items-center gap-2 rounded px-2 py-1 text-sm text-zinc-800"
              >
                {m.iconId && (
                  <img
                    src={getAvatarUrl(m.iconId)}
                    alt=""
                    className="h-6 w-6 shrink-0 rounded-full"
                  />
                )}
                <span className="truncate">
                  {m.displayName}
                  {user?.uid === m.id ? " (you)" : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </FridgeLayout>
  );
}
