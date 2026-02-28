"use client";

import { useCallback, useEffect, useState } from "react";

export function EditableRoomName({
  name,
  roomCode,
  onSave,
  disabled,
}: {
  name: string;
  roomCode: string;
  onSave: (value: string) => void;
  disabled?: boolean;
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

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onBlur={handleSave}
          onKeyDown={handleKeyDown}
          autoFocus
          placeholder="Room name"
          className="rounded border border-zinc-300 bg-white px-2 py-0.5 text-lg font-semibold text-zinc-800 outline-none focus:border-zinc-400 focus:ring-1 focus:ring-zinc-400"
        />
        <span className="font-mono text-sm text-zinc-500">Code: {roomCode}</span>
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={() => !disabled && setEditing(true)}
      disabled={disabled}
      className="text-left hover:underline disabled:no-underline"
    >
      <span className="text-lg font-semibold text-zinc-800">
        {name && name !== roomCode ? name : "Unnamed room"}
      </span>
      <span className="ml-2 font-mono text-sm font-normal text-zinc-500">
        Code: {roomCode}
      </span>
    </button>
  );
}
