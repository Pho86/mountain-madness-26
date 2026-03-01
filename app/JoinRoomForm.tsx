"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { checkRoomExists } from "@/lib/use-room";

export function JoinRoomForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = inputRef.current?.value?.trim().toUpperCase();
    if (!code) return;
    setError(null);
    setJoining(true);
    try {
      const exists = await checkRoomExists(code);
      if (!exists) {
        setError("Room not found. Check the code or create a new room.");
        return;
      }
      router.push(`/board/${code}`);
    } finally {
      setJoining(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-3 sm:flex-row sm:items-center">
      <input
        ref={inputRef}
        type="text"
        placeholder="Enter room code"
        className="flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-3 text-center text-zinc-900 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-zinc-400 sm:text-left"
        autoComplete="off"
        aria-invalid={!!error}
        aria-describedby={error ? "join-error" : undefined}
      />
      <button
        type="submit"
        disabled={joining}
        className="rounded-xl bg-zinc-900 px-6 py-3 w-full font-medium text-white transition hover:bg-zinc-800 disabled:opacity-60"
      >
        {joining ? "Checking…" : "Join room"}
      </button>
      {error && (
        <p id="join-error" className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
