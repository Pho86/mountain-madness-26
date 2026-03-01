"use client";

import { useState } from "react";
import Link from "next/link";
import { TrashIcon } from "@heroicons/react/24/outline";
import { FridgeLayout } from "@/components/FridgeLayout";
import { JoinRoomForm } from "./JoinRoomForm";
import { useAuth } from "@/lib/auth-context";
import { useUserRooms } from "@/hooks/use-user-rooms";
import { useRoomNames } from "@/hooks/use-room-names";

const LANDING_STICKY_TEXT =
  "Share one room for sticky notes and budget tracker.\n\nEnter a room code to join, or create a new room and share the code.";

export default function Home() {
  const { user } = useAuth();
  const { rooms, loading, removeRoom } = useUserRooms(user?.uid ?? null);
  const roomNames = useRoomNames(rooms);
  const [removingId, setRemovingId] = useState<string | null>(null);
  const roomCode =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID().slice(0, 8).toUpperCase()
      : "ABCD1234";

  return (
    <FridgeLayout showJars>
      {!user ? (
        /* Landing for new users: fridge with a single static sticky */
        <div
          className="relative w-full overflow-hidden"
          style={{ minHeight: "calc(100vh - 72px)" }}
        >
          <div className="absolute left-1/2 top-[42%] z-10 w-56 -translate-x-1/2 -translate-y-1/2 -rotate-2">
            <div
              className="relative flex min-h-[200px] flex-col rounded-lg border-2 shadow-sm"
              style={{
                backgroundColor: "#fef9c3",
                borderColor: "#fde047",
              }}
            >
              <div className="flex min-h-0 flex-1 flex-col gap-1 p-3 select-none">
                <p className="rounded text-sm font-normal leading-normal text-zinc-800 whitespace-pre-wrap">
                  {LANDING_STICKY_TEXT}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex h-full flex-col items-center justify-center overflow-auto px-4 py-6">
          <div className="flex w-full max-w-md flex-col items-center gap-6">
            <section className="rounded-xl border border-zinc-200 bg-white p-4 w-full">
              <h2 className="mb-3 text-sm font-medium text-zinc-500">
                Your rooms
              </h2>
              {loading ? (
                <p className="py-4 text-center text-sm text-zinc-400">
                  Loading…
                </p>
              ) : rooms.length === 0 ? (
                <p className="py-4 text-center text-sm text-zinc-400">
                  You haven’t joined any rooms yet. Join or create one below.
                </p>
              ) : (
                <ul className="space-y-2">
                  {rooms.map((id) => (
                    <li
                      key={id}
                      className="flex items-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 transition hover:border-zinc-300 hover:bg-zinc-100"
                    >
                      <Link
                        href={`/board/${id}`}
                        className="min-w-0 flex-1 px-4 py-3"
                      >
                        <span className="font-medium text-zinc-800">
                          {roomNames[id] && roomNames[id] !== id
                            ? roomNames[id]
                            : "Unnamed room"}
                        </span>
                        <span className="ml-2 font-mono text-xs text-zinc-400">
                          {id}
                        </span>
                      </Link>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          if (removingId === id) return;
                          setRemovingId(id);
                          removeRoom(id).finally(() => setRemovingId(null));
                        }}
                        disabled={removingId === id}
                        className="shrink-0 rounded p-2 text-zinc-400 hover:bg-zinc-200 hover:text-red-600 disabled:opacity-50"
                        aria-label="Remove from room list"
                        title="Remove from room list"
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <section className="flex w-full flex-col gap-4">
              <JoinRoomForm />
              <div className="relative flex items-center gap-3">
                <div className="flex-1 border-t border-white/40" />
                <span className="text-sm text-text-on-red-muted">or</span>
                <div className="flex-1 border-t border-white/40" />
              </div>
              <Link
                href={`/board/${roomCode}`}
                className="rounded-xl border-2 border-dashed border-zinc-300 bg-white px-6 py-3 text-center font-medium text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50"
              >
                Create new room
              </Link>
            </section>

            <p className="text-center text-sm text-text-on-red-muted">
              Same room code opens stickies and budget · Real-time with Firebase
            </p>
          </div>
        </div>
      )}
    </FridgeLayout>
  );
}
