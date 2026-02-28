"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";

export function JoinRoomForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const code = inputRef.current?.value?.trim().toUpperCase();
    if (code) router.push(`/board/${code}`);
  };

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-3 sm:flex-row sm:items-center">
      <input
        ref={inputRef}
        type="text"
        placeholder="Enter room code"
        className="flex-1 rounded-xl border border-zinc-300 bg-white px-4 py-3 text-center text-zinc-900 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-zinc-400 sm:text-left"
        autoComplete="off"
      />
      <button
        type="submit"
        className="rounded-xl bg-zinc-900 px-6 py-3 w-full font-medium text-white transition hover:bg-zinc-800"
      >
        Join room
      </button>
    </form>
  );
}
