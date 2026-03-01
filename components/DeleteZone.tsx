"use client";

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

export function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
  );
}
