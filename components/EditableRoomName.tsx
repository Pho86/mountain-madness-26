"use client";

import { useCallback, useEffect, useRef, useState } from "react";

export function EditableRoomName({
  name,
  roomCode,
  onSave,
  disabled,
  hideCode,
  loading,
  className,
  inputClassName,
  compact,
}: {
  name: string;
  roomCode: string;
  onSave: (value: string) => void;
  disabled?: boolean;
  hideCode?: boolean;
  loading?: boolean;
  className?: string;
  /** Optional class for the name input when editing (e.g. transparent bg, border-b only). */
  inputClassName?: string;
  /** When true, layout is always column and name/code don't grow (for plaque-style UI). */
  compact?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [copied, setCopied] = useState(false);
  const copyTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setValue(name);
  }, [name]);

  const handleCopyCode = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      navigator.clipboard.writeText(roomCode);
      setCopied(true);
      copyTimeoutRef.current = setTimeout(() => {
        setCopied(false);
        copyTimeoutRef.current = null;
      }, 2000);
    },
    [roomCode]
  );

  const handleSave = useCallback(() => {
    setEditing(false);
    const trimmed = value.trim().slice(0, 18);
    if (trimmed !== name) onSave(trimmed);
    else setValue(name);
  }, [value, name, onSave]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter") handleSave();
      if (e.key === "Escape") {
        setValue(name);
        setEditing(false);
      }
    },
    [handleSave, name]
  );

  if (loading) {
    return (
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <div className="h-7 w-48 min-w-48 animate-skeleton-pulse rounded bg-zinc-200" />
        {!hideCode && (
          <span className="shrink-0 font-mono text-sm text-zinc-500">Code: {roomCode}</span>
        )}
      </div>
    );
  }

  if (editing) {
    return (
      <div
        className={`flex min-w-0 flex-1 flex-col gap-1 ${compact ? "items-end" : "sm:flex-row sm:items-center sm:gap-2"} ${className ?? ""}`.trim()}
      >
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          autoFocus
          autoComplete="off"
          placeholder="Room name"
          maxLength={18}
          className={inputClassName ?? "min-w-48 flex-1 border-0 border-b-2 border-zinc-300 bg-transparent px-0 py-1 text-xl font-semibold text-zinc-800 outline-none focus:border-zinc-500 focus:ring-0"}
          style={{ backgroundColor: "transparent" }}
        />
        {!hideCode && (
          <span className="shrink-0 font-mono text-sm text-zinc-500">Code: {roomCode}</span>
        )}
      </div>
    );
  }

  return (
    <div
      className={`flex min-w-0 flex-1 flex-col gap-0.5 ${compact ? "items-end" : "sm:flex-row sm:items-baseline sm:gap-2"} ${className ?? ""}`.trim()}
    >
      <button
        type="button"
        onClick={() => !disabled && setEditing(true)}
        disabled={disabled}
        className={`min-w-0 text-right hover:underline disabled:no-underline ${compact ? "flex-none" : "flex-1"}`}
      >
        <span className="block truncate text-xl font-semibold text-zinc-800">
          {name && name !== roomCode ? name : "Unnamed room"}
        </span>
      </button>
      {!hideCode && (
        <button
          type="button"
          onClick={handleCopyCode}
          className={`shrink-0 rounded px-1.5 py-0.5 font-mono text-sm text-zinc-500 hover:bg-zinc-100 hover:text-zinc-700 ${copied ? "cursor-default" : "cursor-copy"}`}
          title={copied ? "Copied!" : "Copy room code"}
        >
          {copied ? "Copied!" : roomCode}
        </button>
      )}
    </div>
  );
}
