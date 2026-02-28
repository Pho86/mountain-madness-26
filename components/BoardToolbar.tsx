"use client";

type Tool = "cursor" | "sticky";

export function BoardToolbar({
  tool,
  onToolChange,
}: {
  tool: Tool;
  onToolChange: (t: Tool) => void;
}) {
  return (
    <div className="flex items-center gap-0.5 border-b border-zinc-200 bg-white px-2 py-1.5">
      <button
        type="button"
        onClick={() => onToolChange("cursor")}
        className={`rounded-md p-2 transition ${
          tool === "cursor"
            ? "bg-zinc-200 text-zinc-900"
            : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
        }`}
        title="Cursor (select & move)"
        aria-pressed={tool === "cursor"}
      >
        <CursorIcon className="h-5 w-5" />
      </button>
      <button
        type="button"
        onClick={() => onToolChange("sticky")}
        className={`rounded-md p-2 transition ${
          tool === "sticky"
            ? "bg-zinc-200 text-zinc-900"
            : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
        }`}
        title="Sticky note (click to add)"
        aria-pressed={tool === "sticky"}
      >
        <StickyIcon className="h-5 w-5" />
      </button>
    </div>
  );
}

function CursorIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M4 4l7.5 15 2.5-5.5L22 10 4 4zm2.5 3.8l9.2 3.8-5.9 5.9L6.5 7.8z" />
    </svg>
  );
}

function StickyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}
