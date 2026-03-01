"use client";

import { useCallback, useEffect, useState } from "react";

export function EditableRoomName({
  name,
  roomCode,
  onSave,
  disabled,
  hideCode,
  loading,
}: {
  name: string;
  roomCode: string;
  onSave: (value: string) => void;
  disabled?: boolean;
  hideCode?: boolean;
  loading?: boolean;
}) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);

  useEffect(() => {
    setValue(name);
  }, [name]);

  const handleSave = useCallback(() => {
    setEditing(false);
    const trimmed = value.trim();
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
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          autoFocus
          placeholder="Room name"
          className="min-w-48 flex-1 border-0 border-b-2 border-zinc-300 bg-transparent px-0 py-1 text-xl font-semibold text-zinc-800 outline-none focus:border-zinc-500 focus:ring-0"
        />
        {!hideCode && (
          <span className="shrink-0 font-mono text-sm text-zinc-500">Code: {roomCode}</span>
        )}
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => !disabled && setEditing(true)}
      disabled={disabled}
      className="min-w-0 flex-1 text-left hover:underline disabled:no-underline"
    >
      <span className="block truncate text-xl font-semibold text-zinc-800">
        {name && name !== roomCode ? name : "Unnamed room"}
      </span>
      {!hideCode && (
        <span className="ml-2 shrink-0 font-mono text-sm font-normal text-zinc-500">
          Code: {roomCode}
        </span>
      )}
    </button>
  );
}
