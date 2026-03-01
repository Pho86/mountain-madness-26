"use client";

import { CursorArrowRippleIcon, HandRaisedIcon } from "@heroicons/react/24/outline";

type Tool = "cursor" | "move" | "sticky";

export function BoardToolbar({
  tool,
  onToolChange,
  className = "",
}: {
  tool: Tool;
  onToolChange: (t: Tool) => void;
  className?: string;
}) {
  return (
    <div className={`flex items-center gap-0.5 ${className}`}>
      <button
        type="button"
        onClick={() => onToolChange("cursor")}
        className={`group flex items-center gap-1.5 rounded-md px-3 py-2 transition ${
          tool === "cursor"
            ? "bg-zinc-200 text-zinc-900"
            : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
        }`}
        title="Select (click to select & point)"
        aria-pressed={tool === "cursor"}
      >
        <CursorArrowRippleIcon className="h-5 w-5 shrink-0" />
        <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-medium transition-[max-width] duration-200 group-hover:max-w-[4.5rem]">Select</span>
      </button>
      <button
        type="button"
        onClick={() => onToolChange("move")}
        className={`group flex items-center gap-1.5 rounded-md px-3 py-2 transition ${
          tool === "move"
            ? "bg-zinc-200 text-zinc-900"
            : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
        }`}
        title="Move (pan around the board)"
        aria-pressed={tool === "move"}
      >
        <HandRaisedIcon className="h-5 w-5 shrink-0" />
        <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-medium transition-[max-width] duration-200 group-hover:max-w-[3.5rem]">Move</span>
      </button>
      <button
        type="button"
        onClick={() => onToolChange("sticky")}
        className={`group flex items-center gap-1.5 rounded-md px-3 py-2 transition ${
          tool === "sticky"
            ? "bg-zinc-200 text-zinc-900"
            : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
        }`}
        title="Sticky note (click to add)"
        aria-pressed={tool === "sticky"}
      >
        <StickyIcon className="h-5 w-5 shrink-0" />
        <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-medium transition-[max-width] duration-200 group-hover:max-w-[4rem]">Sticky</span>
      </button>
    </div>
  );
}

function StickyIcon({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
    </svg>
  );
}
