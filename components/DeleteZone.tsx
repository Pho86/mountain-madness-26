"use client";

import { TrashIcon } from "@heroicons/react/24/outline";

export function DeleteZone({ active = false }: { active?: boolean }) {
  return (
    <>
      <TrashIcon
        className={`h-5 w-5 shrink-0 transition-colors ${
          active ? "text-red-600" : "text-zinc-500"
        }`}
      />
      <span
        className={`text-sm font-medium transition-colors ${
          active ? "text-red-700" : "text-zinc-600"
        }`}
      >
        {active ? "Release to delete" : "Drop to delete"}
      </span>
    </>
  );
}
