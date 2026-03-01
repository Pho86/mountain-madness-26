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

function getFrequencyLabel(days: number): string {
  return FREQUENCY_OPTIONS.find((o) => o.days === days)?.label ?? String(days);
}

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
  const [tasksView, setTasksView] = useState<"inProgress" | "completed">("inProgress");
  const [completingChoreIds, setCompletingChoreIds] = useState<Set<string>>(new Set());
  const [capyWiggling, setCapyWiggling] = useState(false);

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

  const handleMarkDone = useCallback(
    (choreId: string) => {
      setCompletingChoreIds((prev) => new Set(prev).add(choreId));
      markDone(choreId);
      setTimeout(() => {
        setCompletingChoreIds((prev) => {
          const next = new Set(prev);
          next.delete(choreId);
          return next;
        });
      }, 500);
    },
    [markDone],
  );

  const assigneeOptions = [
    { value: "", label: "Unassigned", id: "_unassigned" },
    ...members.map((m) => ({ value: m.displayName, label: m.displayName, id: m.id })),
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
      document.title = "Reizoko";
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

  /* SVG clipPath for jagged edges - small frequent teeth on top and bottom */
  const jaggedClipPath = (
    <svg width="0" height="0" aria-hidden className="absolute">
      <defs>
        <clipPath id="chores-jagged-clip" clipPathUnits="objectBoundingBox">
          <path d="M0,0 L0.025,0.018 L0.05,0 L0.075,0.018 L0.1,0 L0.125,0.018 L0.15,0 L0.175,0.018 L0.2,0 L0.225,0.018 L0.25,0 L0.275,0.018 L0.3,0 L0.325,0.018 L0.35,0 L0.375,0.018 L0.4,0 L0.425,0.018 L0.45,0 L0.475,0.018 L0.5,0 L0.525,0.018 L0.55,0 L0.575,0.018 L0.6,0 L0.625,0.018 L0.65,0 L0.675,0.018 L0.7,0 L0.725,0.018 L0.75,0 L0.775,0.018 L0.8,0 L0.825,0.018 L0.85,0 L0.875,0.018 L0.9,0 L0.925,0.018 L0.95,0 L0.975,0.018 L1,0 L1,1 L0.975,0.982 L0.95,1 L0.925,0.982 L0.9,1 L0.875,0.982 L0.85,1 L0.825,0.982 L0.8,1 L0.775,0.982 L0.75,1 L0.725,0.982 L0.7,1 L0.675,0.982 L0.65,1 L0.625,0.982 L0.6,1 L0.575,0.982 L0.55,1 L0.525,0.982 L0.5,1 L0.475,0.982 L0.45,1 L0.425,0.982 L0.4,1 L0.375,0.982 L0.35,1 L0.325,0.982 L0.3,1 L0.275,0.982 L0.25,1 L0.225,0.982 L0.2,1 L0.175,0.982 L0.15,1 L0.125,0.982 L0.1,1 L0.075,0.982 L0.05,1 L0.025,0.982 L0,1 Z" />
        </clipPath>
      </defs>
    </svg>
  );

  return (
    <FridgeLayout showJars>
      {jaggedClipPath}
      <div className="relative flex min-h-0 flex-1 flex-col overflow-hidden pt-8 pb-14">
        <div className="absolute right-[6.5rem] top-[3.5rem] z-10">
          <div
            className="rounded border-2 px-3 py-2 font-serif text-zinc-900"
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
              loading={roomLoading}
              disabled={!user}
              className="flex flex-col items-end gap-0.5 font-serif text-right"
              inputClassName="w-full min-w-0 border-0 border-b-2 border-zinc-600 bg-transparent py-0.5 text-right text-lg font-medium text-zinc-900 outline-none focus:ring-0 [background:transparent]"
              compact
            />
          </div>
        </div>
        <main className="flex flex-1 flex-col overflow-hidden p-4 md:p-6" style={{ minHeight: 0 }}>
          <div className="mx-auto grid w-full max-w-7xl flex-1 gap-6 md:grid-cols-[1fr_1.2fr] md:gap-8">
            {/* Create a Task form - paper-style sticky note with jagged top edge */}
            <section
              className="chores-create-task-jagged relative flex min-h-0 flex-col border-2 p-6 pt-8 pb-8 md:p-8 md:pt-10 md:pb-10"
              style={{
                backgroundColor: "var(--chores-form-bg)",
                borderColor: "#5c4033",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              }}
            >
              <h2 className="chores-label mb-4 text-2xl font-medium">
                Create a Task
              </h2>
              <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                <div className="flex flex-col gap-3">
                  <input
                    type="text"
                    placeholder="Task name (eg. Laundry)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="chores-form-field"
                  />
                  <div className="flex justify-between items-center gap-8">
                    <label htmlFor="assignee" className="chores-label mb-0 block text-2xl text-nowrap font-bold shrink-0">
                      Assign to
                    </label>
                    <select
                      id="assignee"
                      value={assignee}
                      onChange={(e) => setAssignee(e.target.value)}
                      className="chores-form-field w-max"
                    >
                      {assigneeOptions.map((opt) => (
                        <option key={opt.id} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex justify-between items-center gap-8">
                    <label htmlFor="frequency" className="chores-label mb-0 block text-2xl text-nowrap font-bold shrink-0">
                      How often
                    </label>
                    <select
                      id="frequency"
                      value={frequencyDays}
                      onChange={(e) => setFrequencyDays(Number(e.target.value))}
                      className="chores-form-field"
                    >
                      {FREQUENCY_OPTIONS.map((opt) => (
                        <option key={opt.days} value={opt.days}>
                          {opt.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-auto flex items-end gap-4 pt-6">
                  <div className="shrink-0">
                    <img
                      src="/CapyBread.png"
                      alt=""
                      className={`h-18 w-18 object-contain cursor-pointer select-none ${capyWiggling ? "capy-wiggle" : ""}`}
                      aria-hidden
                      onClick={() => {
                        setCapyWiggling(false);
                        requestAnimationFrame(() => setCapyWiggling(true));
                      }}
                      onAnimationEnd={() => setCapyWiggling(false)}
                    />
                  </div>
                  <div className="flex flex-col h-full w-full ">
                    <div className="min-w-0 flex-1 border-t border-dashed" style={{ borderColor: "var(--chores-form-border)" }} />
                    <button
                      type="submit"
                      className=" chores-submit-btn shrink-0 rounded-lg border-2 cursor-pointer px-4 py-2 font-medium transition-colors hover:text-white"
                      style={{
                        borderColor: "var(--chores-form-text)",
                        color: "var(--chores-form-text)",
                      }}
                    >
                      Create Task
                    </button>
                  </div>
                </div>
              </form>
            </section>

            {/* Tasks - blue sticky note cards */}
            <section
              className="rounded-lg border-2 p-4 md:p-5 mt-30"
              style={{
                borderColor: "#F9E1C9",
              }}
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="chores-font text-lg font-medium" style={{ color: "#F7EAD7" }}>
                  Tasks
                </h2>
                <div className="flex rounded-lg border border-white/40 p-0.5">
                  <button
                    type="button"
                    onClick={() => setTasksView("inProgress")}
                    className=" rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
                    style={
                      tasksView === "inProgress"
                        ? { backgroundColor: "#F7EAD7", color: "#5c4033" }
                        : { color: "#F7EAD7" }
                    }
                  >
                    In progress
                  </button>
                  <button
                    type="button"
                    onClick={() => setTasksView("completed")}
                    className="rounded-md px-3 py-1.5 text-sm font-medium transition-colors"
                    style={
                      tasksView === "completed"
                        ? { backgroundColor: "#F7EAD7", color: "#5c4033" }
                        : { color: "#F7EAD7" }
                    }
                  >
                    Completed
                  </button>
                </div>
              </div>
              {tasksView === "inProgress" ? (
                (() => {
                  const inProgressChores = chores.filter(
                    (c) => c.lastDoneAt == null || completingChoreIds.has(c.id),
                  );
                  if (inProgressChores.length === 0) {
                    return (
                      <p className="py-8 text-center text-sm" style={{ color: "rgba(247,234,215,0.8)" }}>
                        No tasks in progress. Add one above.
                      </p>
                    );
                  }
                  return (
                    <ul className="grid gap-3 overflow-hidden">
                      {inProgressChores.map((chore) => {
                        const nextDue = getNextDueMs(chore);
                        const isCompleting = completingChoreIds.has(chore.id);
                        return (
                          <li
                            key={chore.id}
                            className={`flex flex-col gap-3 rounded-lg border p-3 transition-all duration-500 ${
                              isCompleting
                                ? "chore-completing border-green-300"
                                : "border-white"
                            }`}
                            style={{
                              backgroundColor: isCompleting ? "#22c55e" : "var(--chores-blue-dark)",
                            }}
                          >
                            <div
                              className={`rounded-lg border px-3 py-2 ${
                                isCompleting ? "border-green-200 bg-green-100" : "border-white"
                              }`}
                              style={
                                isCompleting ? undefined : { backgroundColor: "var(--chores-blue-dark)" }
                              }
                            >
                              <p
                                className={`font-medium ${
                                  isCompleting ? "text-green-900" : "text-white"
                                }`}
                              >
                                {chore.title}
                              </p>
                            </div>
                            <div className="flex w-full justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`rounded-lg border px-2.5 py-1 text-xs font-medium ${
                                    isCompleting
                                      ? "border-green-300 bg-green-200 text-green-900"
                                      : "border-white text-white"
                                  }`}
                                  style={
                                    isCompleting ? undefined : { backgroundColor: "var(--chores-blue-dark)" }
                                  }
                                >
                                  {chore.assignee}
                                </span>
                                <span
                                  className={`rounded-lg border px-2.5 py-1 text-xs font-medium ${
                                    isCompleting
                                      ? "border-green-300 bg-green-200 text-green-900"
                                      : "border-white text-white"
                                  }`}
                                  style={
                                    isCompleting ? undefined : { backgroundColor: "var(--chores-blue-dark)" }
                                  }
                                >
                                  {getFrequencyLabel(chore.frequencyDays)}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => handleMarkDone(chore.id)}
                                  disabled={isCompleting}
                                  className="flex items-center gap-1.5 rounded-lg border border-white px-3 py-1.5 text-sm font-medium transition-colors hover:brightness-95 disabled:opacity-70"
                                  style={{
                                    backgroundColor: "#f0e9dd",
                                    color: "var(--chores-blue-dark)",
                                  }}
                                  title={formatDue(nextDue)}
                                  aria-label="Mark as complete"
                                >
                                  <span className="flex h-4 w-4 items-center justify-center rounded border border-current">
                                    <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                  </span>
                                  Mark as complete
                                </button>
                                <button
                                  type="button"
                                  onClick={() => deleteChore(chore.id)}
                                  disabled={isCompleting}
                                  className="flex items-center gap-1.5 rounded-lg border border-white px-3 py-1.5 text-sm font-medium transition-colors hover:brightness-95 disabled:opacity-70"
                                  style={{
                                    backgroundColor: "#f0e9dd",
                                    color: "var(--chores-blue-dark)",
                                  }}
                                  title="Remove task"
                                  aria-label="Delete"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                  Delete
                                </button>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  );
                })()
              ) : (
                (() => {
                  const completedChores = chores.filter(
                    (c) => c.lastDoneAt != null && !completingChoreIds.has(c.id),
                  );
                  if (completedChores.length === 0) {
                    return (
                      <p className="py-8 text-center text-sm" style={{ color: "rgba(247,234,215,0.8)" }}>
                        No completed tasks yet.
                      </p>
                    );
                  }
                  return (
                    <ul className="grid gap-3">
                      {completedChores.map((chore) => (
                        <li
                          key={chore.id}
                          className="flex flex-col gap-3 rounded-lg border border-green-300 p-3"
                          style={{ backgroundColor: "#22c55e" }}
                        >
                          <div className="rounded-lg border border-green-200 bg-green-100 px-3 py-2">
                            <p className="font-medium text-green-900">
                              {chore.title}
                            </p>
                          </div>
                          <div className="flex w-full justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="rounded-lg border border-green-300 bg-green-200 px-2.5 py-1 text-xs font-medium text-green-900">
                                {chore.assignee}
                              </span>
                              <span className="rounded-lg border border-green-300 bg-green-200 px-2.5 py-1 text-xs font-medium text-green-900">
                                {getFrequencyLabel(chore.frequencyDays)}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => deleteChore(chore.id)}
                              className="flex items-center gap-1.5 rounded-lg border border-white px-3 py-1.5 text-sm font-medium transition-colors hover:brightness-95"
                              style={{
                                backgroundColor: "#f0e9dd",
                                color: "#5d689b",
                              }}
                              title="Remove task"
                              aria-label="Delete"
                            >
                              <TrashIcon className="h-4 w-4" />
                              Delete
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  );
                })()
              )}
            </section>
          </div>
        </main>
      </div>
    </FridgeLayout>
  );
}
