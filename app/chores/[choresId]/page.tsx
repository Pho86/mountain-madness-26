"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { TrashIcon } from "@heroicons/react/24/outline";
import { useChoresFirestore } from "@/hooks/use-chores-firestore";
import { useAuth } from "@/lib/auth-context";
import { useUserRooms } from "@/hooks/use-user-rooms";
import { useRoom } from "@/hooks/use-room";
import { useRoomMembers } from "@/hooks/use-room-members";
import { useUserProfile } from "@/lib/use-user-profile";
import { getAvatarUrl } from "@/lib/avatars";
import { ChoresPageSkeleton } from "@/components/ChoresPageSkeleton";
import { EditableRoomName } from "@/components/EditableRoomName";
import { FridgeLayout } from "@/components/FridgeLayout";
import type { Chore } from "@/lib/types";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const DUE_SOON_DAYS = 1;

const FREQUENCY_OPTIONS: { label: string; days: number }[] = [
  { label: "Daily", days: 1 },
  { label: "Weekly", days: 7 },
  { label: "Biweekly", days: 14 },
  { label: "Monthly", days: 30 },
];

function getNextDueMs(chore: Chore): number {
  const base = chore.lastDoneAt ?? chore.createdAt;
  return base + chore.frequencyDays * MS_PER_DAY;
}

function getStatus(
  chore: Chore,
): "overdue" | "due_soon" | "on_track" {
  const now = Date.now();
  const nextDue = getNextDueMs(chore);
  if (now >= nextDue) return "overdue";
  const daysUntilDue = (nextDue - now) / MS_PER_DAY;
  if (daysUntilDue <= DUE_SOON_DAYS) return "due_soon";
  return "on_track";
}

function formatDue(nextDueMs: number): string {
  const now = Date.now();
  const diff = nextDueMs - now;
  const days = Math.ceil(diff / MS_PER_DAY);
  if (days < 0) return `${Math.abs(days)} day(s) overdue`;
  if (days === 0) return "Due today";
  if (days === 1) return "Due tomorrow";
  return `Due in ${days} days`;
}

export default function ChoresPage() {
  const params = useParams();
  const choresId =
    typeof params.choresId === "string" ? params.choresId : null;
  const { user } = useAuth();
  const { addRoom } = useUserRooms(user?.uid ?? null);
  const { name: roomName, setName: setRoomName, ensureRoomExists, loading: roomLoading } =
    useRoom(choresId);
  const { iconId: currentUserIconId } = useUserProfile(user?.uid ?? null);
  const { members, ensureCurrentUser } = useRoomMembers(choresId);
  const { chores, connected, addChore, markDone, deleteChore } =
    useChoresFirestore(choresId);

  const [title, setTitle] = useState("");
  const [assignee, setAssignee] = useState("");
  const [frequencyDays, setFrequencyDays] = useState(7);

  useEffect(() => {
    if (user && choresId) ensureCurrentUser(user, currentUserIconId);
  }, [user, choresId, ensureCurrentUser, currentUserIconId]);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!title.trim()) return;
      const chore: Chore = {
        id: crypto.randomUUID?.() ?? `chore-${Date.now()}`,
        title: title.trim(),
        assignee: assignee.trim() || "Unassigned",
        frequencyDays: frequencyDays < 1 ? 1 : frequencyDays,
        lastDoneAt: null,
        createdAt: Date.now(),
      };
      addChore(chore);
      setTitle("");
    },
    [addChore, title, assignee, frequencyDays],
  );

  const assigneeOptions = [
    { value: "", label: "Unassigned" },
    ...members.map((m) => ({ value: m.displayName, label: m.displayName })),
  ];

  useEffect(() => {
    if (user && choresId) addRoom(choresId);
  }, [user, choresId, addRoom]);

  useEffect(() => {
    if (choresId) ensureRoomExists();
  }, [choresId, ensureRoomExists]);

  useEffect(() => {
    const name = roomName || choresId;
    if (name) document.title = `${name} · Chores`;
    return () => {
      document.title = "Waifu Fridge";
    };
  }, [roomName, choresId]);

  if (!choresId) {
    return (
      <FridgeLayout showJars>
        <div className="flex min-h-full items-center justify-center">
          <p className="text-zinc-500">Invalid chores board</p>
        </div>
      </FridgeLayout>
    );
  }

  if (roomLoading) {
    return <ChoresPageSkeleton />;
  }

  return (
    <FridgeLayout showJars>
      <div className="flex min-h-full flex-col overflow-auto">
        <div className="shrink-0 p-4 pr-6 pt-6 flex justify-end">
          <div
            className="rounded border-2 px-4 py-2 font-serif text-zinc-900"
            style={{
              backgroundColor: "var(--fridge-cream)",
              borderColor: "#5c4033",
            }}
          >
            <EditableRoomName
              name={roomName || choresId || "Chores"}
              roomCode={choresId}
              onSave={setRoomName}
              hideCode={false}
              loading={false}
              className="flex flex-col items-end gap-0.5 font-serif text-right"
              inputClassName="w-full min-w-0 border-0 border-b-2 border-zinc-600 bg-transparent py-0.5 text-right text-lg font-medium text-zinc-900 outline-none focus:ring-0 [background:transparent]"
              compact
            />
          </div>
        </div>
        <main className="flex-1 overflow-auto p-4" style={{ minHeight: 0 }}>
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Add chore form */}
          <section className="rounded-xl border border-zinc-200 bg-white p-4">
            <h2 className="mb-3 text-sm font-medium text-zinc-700">
              Add task
            </h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="Task name (e.g. Laundry)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400"
              />
              <div className="flex flex-wrap items-center gap-2">
                <label htmlFor="assignee" className="text-sm text-zinc-600">
                  Assign to
                </label>
                <select
                  id="assignee"
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                  className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400"
                >
                  {assigneeOptions.map((opt) => (
                    <option key={opt.value || "_unassigned"} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <label htmlFor="frequency" className="text-sm text-zinc-600">
                  How often
                </label>
                <select
                  id="frequency"
                  value={frequencyDays}
                  onChange={(e) =>
                    setFrequencyDays(Number(e.target.value))
                  }
                  className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400"
                >
                  {FREQUENCY_OPTIONS.map((opt) => (
                    <option key={opt.days} value={opt.days}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="submit"
                className="rounded-lg bg-zinc-800 py-2 text-sm font-medium text-white hover:bg-zinc-700"
              >
                Add task
              </button>
            </form>
          </section>

          {/* Chore list */}
          <section className="rounded-xl border border-zinc-200 bg-white">
            <h2 className="border-b border-zinc-100 px-4 py-3 text-sm font-medium text-zinc-700">
              Tasks
            </h2>
            <ul className="divide-y divide-zinc-100">
              {chores.length === 0 ? (
                <li className="px-4 py-8 text-center text-sm text-zinc-400">
                  No tasks yet. Add one above and assign it to a roommate.
                </li>
              ) : (
                chores.map((chore) => {
                  const status = getStatus(chore);
                  const nextDue = getNextDueMs(chore);
                  return (
                    <li
                      key={chore.id}
                      className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-zinc-800">
                          {chore.title}
                        </p>
                        <p className="flex items-center gap-1.5 text-xs text-zinc-500">
                          {(() => {
                            const member = members.find(
                              (m) => m.displayName === chore.assignee
                            );
                            return member?.iconId ? (
                              <>
                                <img
                                  src={getAvatarUrl(member.iconId)}
                                  alt=""
                                  className="h-6 w-6 shrink-0 rounded-full object-cover"
                                />
                                <span>
                                  {chore.assignee} · every {chore.frequencyDays}{" "}
                                  {chore.frequencyDays === 1 ? "day" : "days"}
                                </span>
                              </>
                            ) : (
                              <span>
                                {chore.assignee} · every {chore.frequencyDays}{" "}
                                {chore.frequencyDays === 1 ? "day" : "days"}
                              </span>
                            );
                          })()}
                        </p>
                        <span
                          className={`mt-1 inline-block rounded px-2 py-0.5 text-xs font-medium ${
                            status === "overdue"
                              ? "bg-red-100 text-red-800"
                              : status === "due_soon"
                                ? "bg-amber-100 text-amber-800"
                                : "bg-zinc-100 text-zinc-600"
                          }`}
                          title={formatDue(nextDue)}
                        >
                          {status === "overdue"
                            ? "Overdue"
                            : status === "due_soon"
                              ? "Due soon"
                              : formatDue(nextDue)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => markDone(chore.id)}
                          className="rounded-lg bg-zinc-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700"
                        >
                          Mark done
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteChore(chore.id)}
                          className="rounded p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-red-600"
                          title="Remove task"
                          aria-label="Remove task"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  );
                })
              )}
            </ul>
          </section>
        </div>
      </main>
      </div>
    </FridgeLayout>
  );
}
