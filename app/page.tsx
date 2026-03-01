"use client";

import Link from "next/link";
import { FridgeLayout } from "@/components/FridgeLayout";
import { JoinRoomForm } from "./JoinRoomForm";
import { useAuth } from "@/lib/auth-context";
import { useUserRooms } from "@/hooks/use-user-rooms";
import { useRoomNames } from "@/hooks/use-room-names";

export default function Home() {
  const { user } = useAuth();
  const { rooms, loading } = useUserRooms(user?.uid ?? null);
  const roomNames = useRoomNames(rooms);
  const roomCode =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID().slice(0, 8).toUpperCase()
      : "ABCD1234";

  return (
    <FridgeLayout showJars>
      <div className="flex h-full flex-col items-center justify-center overflow-auto px-4 py-6">
        <div className="flex w-full max-w-md flex-col items-center gap-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight text-text-on-red">
            Waifu Fridge
          </h1>
          <p className="mt-2 text-text-on-red-muted">
            Share one room for sticky notes and budget tracker. Enter a room code
            to join, or create a new room and share the code.
          </p>
        </div>

        <div className="flex w-full flex-col gap-6">
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

        <section className="flex flex-col gap-4">
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
        </div>

        <p className="text-center text-sm text-text-on-red-muted">
          Same room code opens stickies and budget · Real-time with Firebase
        </p>
        </div>
      </div>
    </FridgeLayout>
  );
}
