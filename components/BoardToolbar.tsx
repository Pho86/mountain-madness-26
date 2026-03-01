"use client";

import { CursorArrowRippleIcon, DocumentTextIcon, HandRaisedIcon, PhotoIcon } from "@heroicons/react/24/outline";

type Tool = "cursor" | "move" | "sticky";

export function BoardToolbar({
  tool,
  onToolChange,
  onAddImageClick,
  className = "",
}: {
  tool: Tool;
  onToolChange: (t: Tool) => void;
  onAddImageClick?: () => void;
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
        <DocumentTextIcon className="h-5 w-5 shrink-0" />
        <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-medium transition-[max-width] duration-200 group-hover:max-w-[4rem]">Sticky</span>
      </button>
      {onAddImageClick && (
        <button
          type="button"
          onClick={onAddImageClick}
          className="group flex items-center gap-1.5 rounded-md px-3 py-2 text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
          title="Upload image as sticker"
          aria-label="Upload image as sticker"
        >
          <PhotoIcon className="h-5 w-5 shrink-0" />
          <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-medium transition-[max-width] duration-200 group-hover:max-w-16">Image</span>
        </button>
      )}
    </div>
  );
}
