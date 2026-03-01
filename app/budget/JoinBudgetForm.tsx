"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { checkRoomExists } from "@/lib/use-room";

export function JoinBudgetForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [joining, setJoining] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = inputRef.current?.value?.trim();
    if (!id) return;
    setError(null);
    setJoining(true);
    try {
      const exists = await checkRoomExists(id);
      if (!exists) {
        setError("Room not found. Check the code or create a new room.");
        return;
      }
      router.push(`/budget/${id}`);
    } finally {
      setJoining(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <div className="flex gap-2">
        <input
          ref={inputRef}
          type="text"
          placeholder="Enter room code"
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-zinc-900 placeholder:text-zinc-500 outline-none focus:ring-2 focus:ring-zinc-400"
          aria-invalid={!!error}
        />
        <button
          type="submit"
          disabled={joining}
          className="rounded-lg bg-zinc-700 px-4 py-2 font-medium text-white hover:bg-zinc-600 disabled:opacity-60"
        >
          {joining ? "Checking…" : "Join"}
        </button>
      </div>
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
