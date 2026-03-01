"use client";

import { useState, useCallback, useRef } from "react";

export function RoomPageHeader({
  left,
  roomCode,
  hideCopySection,
}: {
  left: React.ReactNode;
  roomCode: string;
  /** When true, only show left content (e.g. when left already shows room name + copyable code) */
  hideCopySection?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleCopy = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    navigator.clipboard.writeText(roomCode);
    setCopied(true);
    timeoutRef.current = setTimeout(() => {
      setCopied(false);
      timeoutRef.current = null;
    }, 2000);
  }, [roomCode]);

  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 bg-white px-4 py-3">
      <div className="min-w-0 flex-1 text-lg font-semibold text-zinc-800">{left}</div>
      {!hideCopySection && (
        <div className="flex shrink-0 items-center gap-3">
          <span className="font-mono text-sm text-zinc-500">{roomCode}</span>
          <button
            type="button"
            className="rounded-lg bg-zinc-800 px-3 py-1.5 text-sm text-white hover:bg-zinc-700"
            onClick={handleCopy}
          >
            {copied ? "Copied!" : "Copy room code"}
          </button>
        </div>
      )}
    </header>
  );
}
