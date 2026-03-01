"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ArrowUpLeftIcon, DocumentTextIcon, HandRaisedIcon, PhotoIcon, SparklesIcon } from "@heroicons/react/24/outline";

const STICKER_OPTIONS = [
  { id: "CapyBread", url: "/CapyBread.png" },
  { id: "Bearburger", url: "/Bearburger.png" },
  { id: "LemonDuck", url: "/LemonDuck.png" },
  { id: "Philip", url: "/avatars/Philip.svg" },
  { id: "Alexis", url: "/avatars/Alexis.svg" },
  { id: "Stella", url: "/avatars/Stella.svg" },
  { id: "Emily", url: "/avatars/Emily.svg" },
] as const;

type Tool = "cursor" | "move" | "sticky";

export function BoardToolbar({
  tool,
  onToolChange,
  onAddStickerClick,
  onAddImageClick,
  className = "",
}: {
  tool: Tool;
  onToolChange: (t: Tool) => void;
  onAddStickerClick?: (url: string) => void;
  onAddImageClick?: () => void;
  className?: string;
}) {
  const [stickersOpen, setStickersOpen] = useState(false);
  const stickersRef = useRef<HTMLDivElement>(null);
  const stickerButtonRef = useRef<HTMLButtonElement>(null);
  const [popoverRect, setPopoverRect] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!stickersOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (stickersRef.current?.contains(target)) return;
      if (document.querySelector("[data-stickers-popover]")?.contains(target)) return;
      setStickersOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [stickersOpen]);

  useEffect(() => {
    if (stickersOpen && stickerButtonRef.current && typeof document !== "undefined") {
      const rect = stickerButtonRef.current.getBoundingClientRect();
      setPopoverRect({ top: rect.top - 8, left: rect.left + rect.width / 2 });
    } else {
      setPopoverRect(null);
    }
  }, [stickersOpen]);
  return (
    <div className={`flex cursor-default items-center gap-0.5 ${className}`}>
      <button
        type="button"
        onClick={() => onToolChange("cursor")}
        className={`group flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-2 transition ${
          tool === "cursor"
            ? "bg-zinc-200 text-zinc-900"
            : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
        }`}
        title="Select (click to select & point)"
        aria-pressed={tool === "cursor"}
      >
        <img src="/cursor.svg" alt="Select" className="h-5 w-5 shrink-0" />
        <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-medium transition-[max-width] duration-200 group-hover:max-w-[4.5rem]">Select</span>
      </button>
      <button
        type="button"
        onClick={() => onToolChange("move")}
        className={`group flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-2 transition ${
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
        className={`group flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-2 transition ${
          tool === "sticky"
            ? "bg-zinc-200 text-zinc-900"
            : "text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700"
        }`}
        title="Note (click to add)"
        aria-pressed={tool === "sticky"}
      >
        <DocumentTextIcon className="h-5 w-5 shrink-0" />
        <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-medium transition-[max-width] duration-200 group-hover:max-w-[4rem]">Note</span>
      </button>
      {onAddStickerClick && (
        <div ref={stickersRef} className="relative">
          <button
            ref={stickerButtonRef}
            type="button"
            onClick={() => setStickersOpen((o) => !o)}
            className="group flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-700"
            title="Add sticker"
            aria-label="Add sticker"
            aria-expanded={stickersOpen}
          >
            <span className="flex h-5 w-5 shrink-0 items-center justify-center">
              <SparklesIcon className="h-5 w-5" />
            </span>
            <span className="max-w-0 overflow-hidden whitespace-nowrap text-sm font-medium transition-[max-width] duration-200 group-hover:max-w-[4.5rem]">Stickers</span>
          </button>
          {stickersOpen && popoverRect && typeof document !== "undefined" &&
            createPortal(
              <div
                data-stickers-popover
                className="fixed z-[9999] flex flex-col gap-1 p-1"
                style={{
                  top: popoverRect.top,
                  left: popoverRect.left,
                  transform: "translate(-50%, -110%)",
                }}
              >
                <div className="flex justify-center gap-1">
                  {STICKER_OPTIONS.slice(0, 3).map(({ url }) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => {
                        onAddStickerClick(url);
                        setStickersOpen(false);
                      }}
                      className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md transition hover:opacity-80"
                      aria-label="Add sticker"
                    >
                      <img src={url} alt="" className="h-8 w-8 object-contain" />
                    </button>
                  ))}
                </div>
                <div className="flex justify-center gap-1">
                  {STICKER_OPTIONS.slice(3, 7).map(({ url }) => (
                    <button
                      key={url}
                      type="button"
                      onClick={() => {
                        onAddStickerClick(url);
                        setStickersOpen(false);
                      }}
                      className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-md transition hover:opacity-80"
                      aria-label="Add sticker"
                    >
                      <img src={url} alt="" className="h-8 w-8 object-contain" />
                    </button>
                  ))}
                </div>
              </div>,
              document.body
            )}
        </div>
      )}
      {onAddImageClick && (
        <button
          type="button"
          onClick={onAddImageClick}
          className="group flex cursor-pointer items-center gap-1.5 rounded-md px-3 py-2 text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-700"
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
