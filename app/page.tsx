"use client";

import Link from "next/link";
import { JoinRoomForm } from "./JoinRoomForm";
import { useAuth } from "@/lib/auth-context";
import { useUserRooms } from "@/lib/use-user-rooms";
import { useRoomNames } from "@/lib/use-room-names";

export default function Home() {
  const { user } = useAuth();
  const { rooms, loading } = useUserRooms(user?.uid ?? null);
  const roomNames = useRoomNames(rooms);
  const roomCode =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID().slice(0, 8).toUpperCase()
      : "ABCD1234";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-10 bg-zinc-100 px-4 py-10">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
          Waifu Fridge
        </h1>
        <p className="mt-2 text-zinc-600">
          Share one room for sticky notes and budget tracker. Enter a room code
          to join, or create a new room and share the code.
        </p>
      </div>

      <div className="flex w-full max-w-md flex-col gap-8">
        {user && (
          <section className="rounded-xl border border-zinc-200 bg-white p-4">
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
                  <li key={id}>
                    <Link
                      href={`/board/${id}`}
                      className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-4 py-3 transition hover:border-zinc-300 hover:bg-zinc-100"
                    >
                      <span className="font-medium text-zinc-800">
                        {roomNames[id] && roomNames[id] !== id
                          ? roomNames[id]
                          : "Unnamed room"}
                      </span>
                      <span className="font-mono text-xs text-zinc-400">
                        {id}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        <section className="flex flex-col gap-6">
          <JoinRoomForm />
          <div className="relative flex items-center gap-3">
            <div className="flex-1 border-t border-zinc-300" />
            <span className="text-sm text-zinc-500">or</span>
            <div className="flex-1 border-t border-zinc-300" />
          </div>
          <Link
            href={`/board/${roomCode}`}
            className="rounded-xl border-2 border-dashed border-zinc-300 bg-white px-6 py-3 text-center font-medium text-zinc-700 transition hover:border-zinc-400 hover:bg-zinc-50"
          >
            Create new room
          </Link>
        </section>
      </div>

      <p className="text-center text-sm text-zinc-500">
        Same room code opens stickies and budget · Real-time with Firebase
      </p>
    </div>
  );
}
