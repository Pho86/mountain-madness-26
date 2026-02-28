import Link from "next/link";
import { JoinRoomForm } from "./JoinRoomForm";

export default function Home() {
  const roomCode =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID().slice(0, 8).toUpperCase()
      : "ABCD1234";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-10 bg-zinc-100 px-4">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
          Waifu Fridge
        </h1>
        <p className="mt-2 text-zinc-600">
          Share one room for sticky notes and budget tracker. Enter a room code
          to join, or create a new room and share the code.
        </p>
      </div>

      <div className="flex w-full max-w-md flex-col gap-6">
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
      </div>

      <p className="text-center text-sm text-zinc-500">
        Same room code opens stickies and budget · Real-time with Firebase
      </p>
    </div>
  );
}
