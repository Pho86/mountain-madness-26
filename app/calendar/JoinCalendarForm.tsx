"use client";

import { useRouter } from "next/navigation";
import { useRef } from "react";

export function JoinCalendarForm() {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const id = inputRef.current?.value?.trim();
    if (id) router.push(`/calendar/${id}`);
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        ref={inputRef}
        type="text"
        placeholder="Or enter calendar ID"
        className="rounded-lg border border-zinc-300 px-4 py-2 outline-none focus:ring-2 focus:ring-zinc-400"
      />
      <button
        type="submit"
        className="rounded-lg bg-zinc-700 px-4 py-2 font-medium text-white hover:bg-zinc-600"
      >
        Join
      </button>
    </form>
  );
}
