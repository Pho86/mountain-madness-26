"use client";

import { useState, useCallback } from "react";
import { ChevronLeftIcon, ChevronRightIcon, TrashIcon } from "@heroicons/react/24/outline";
import type { CalendarEvent } from "@/lib/types";
import {
  expandEvents,
  getMonthStartEnd,
  getWeekStartEnd,
  getMonthGrid,
  type EventOccurrence,
} from "@/lib/calendar-utils";
import { Modal } from "@/components/Modal";

type ViewMode = "month" | "week" | "list";

const RECURRING_OPTIONS: {
  value: CalendarEvent["recurring"];
  label: string;
}[] = [
  { value: "none", label: "Once" },
  { value: "daily", label: "Daily" },
  { value: "weekly", label: "Weekly" },
  { value: "monthly", label: "Monthly" },
];

function formatDateShort(dateStr: string) {
  const d = new Date(dateStr + "T12:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

function formatMonthYear(year: number, month: number) {
  return new Date(year, month, 1).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export function BoardCalendar({
  calendarId,
  events,
  connected,
  addEvent,
  deleteEvent,
  deleteOccurrence,
}: {
  calendarId: string;
  events: CalendarEvent[];
  connected: boolean;
  addEvent: (e: CalendarEvent) => void;
  deleteEvent: (id: string) => void;
  deleteOccurrence: (eventId: string, date: string) => void;
}) {
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [current, setCurrent] = useState(() => new Date());
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("");
  const [recurring, setRecurring] =
    useState<CalendarEvent["recurring"]>("none");
  const [endDate, setEndDate] = useState<string>("");
  type PendingDelete = { eventId: string; date: string; isRecurring: boolean };
  const [pendingDelete, setPendingDelete] = useState<PendingDelete | null>(null);

  const year = current.getFullYear();
  const month = current.getMonth();

  const handleAddEvent = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!title.trim()) return;
      const event: CalendarEvent = {
        id: crypto.randomUUID?.() ?? `ev-${Date.now()}`,
        title: title.trim(),
        date,
        time: time.trim() || null,
        recurring,
        endDate: recurring === "none" ? null : (endDate || date),
        createdAt: Date.now(),
      };
      addEvent(event);
      setTitle("");
      setTime("");
      setRecurring("none");
      setEndDate("");
      setShowAddForm(false);
    },
    [addEvent, title, date, time, recurring],
  );

  const goPrev = useCallback(() => {
    const d = new Date(current);
    if (viewMode === "month") d.setMonth(d.getMonth() - 1);
    else if (viewMode === "week") d.setDate(d.getDate() - 7);
    else d.setDate(d.getDate() - 30);
    setCurrent(d);
  }, [current, viewMode]);

  const goNext = useCallback(() => {
    const d = new Date(current);
    if (viewMode === "month") d.setMonth(d.getMonth() + 1);
    else if (viewMode === "week") d.setDate(d.getDate() + 7);
    else d.setDate(d.getDate() + 30);
    setCurrent(d);
  }, [current, viewMode]);

  const goToday = useCallback(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    setCurrent(d);
  }, []);

  const handleRequestDelete = useCallback((o: EventOccurrence) => {
    setPendingDelete({
      eventId: o.eventId,
      date: o.date,
      isRecurring: o.isRecurring,
    });
  }, []);

  function rangeForList() {
    const start = new Date(current);
    const end = new Date(current);
    end.setDate(end.getDate() + 30);
    return {
      start: start.toISOString().slice(0, 10),
      end: end.toISOString().slice(0, 10),
    };
  }

  const { start: rangeStart, end: rangeEnd } =
    viewMode === "month"
      ? getMonthStartEnd(year, month)
      : viewMode === "week"
        ? getWeekStartEnd(current)
        : rangeForList();

  const occurrences = expandEvents(events, rangeStart, rangeEnd);

  const monthGrid = viewMode === "month" ? getMonthGrid(year, month) : [];

  const occurrencesByDate = new Map<string, EventOccurrence[]>();
  for (const o of occurrences) {
    const list = occurrencesByDate.get(o.date) ?? [];
    list.push(o);
    occurrencesByDate.set(o.date, list);
  }

  const todayStr = new Date().toISOString().slice(0, 10);

  return (
    <div
      className="flex h-full flex-col rounded-lg overflow-hidden"
      style={{
        backgroundColor: "var(--chores-form-bg)",
        border: "1px solid #e3c7a2",
      }}
    >
      {/* Calendar header: view toggle + nav */}
      <div
        className="flex flex-wrap items-center justify-between gap-3 px-6 py-3"
        style={{ backgroundColor: "var(--chores-blue-dark)" }}
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex rounded-full border border-white/40 bg-white/10 p-0.5">
            {(["month", "week", "list"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`min-h-[36px] rounded-full px-4 text-sm font-medium capitalize ${
                  viewMode === mode
                    ? "bg-[#F7EAD7] text-[#3B4078]"
                    : "text-[#F7EAD7] hover:bg-white/10"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
          <span className="chores-font text-sm font-medium text-[#F7EAD7]">
            {viewMode === "month" && formatMonthYear(year, month)}
            {viewMode === "week" &&
              `${formatDateShort(rangeStart)} – ${formatDateShort(rangeEnd)}`}
            {viewMode === "list" && "Upcoming"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={goPrev}
            className="min-h-[36px] rounded-full border border-white/60 p-1.5 text-[#F7EAD7] hover:bg-white/10"
            aria-label="Previous"
          >
            <ChevronLeftIcon className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={goToday}
            className="min-h-[36px] rounded-full border border-white/60 px-3 text-sm font-medium text-[#F7EAD7] hover:bg-white/10"
          >
            Today
          </button>
          <button
            type="button"
            onClick={goNext}
            className="min-h-[36px] rounded-full border border-white/60 p-1.5 text-[#F7EAD7] hover:bg-white/10"
            aria-label="Next"
          >
            <ChevronRightIcon className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Add event */}
      <div className="border-b border-[#e3c7a2] px-6 py-3">
        {showAddForm ? (
          <form onSubmit={handleAddEvent} className="flex flex-col gap-3">
            <input
              type="text"
              placeholder="Event title *"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="chores-form-field w-full"
              autoFocus
            />
            <div className="flex flex-wrap gap-2">
              <input
                type="date"
                placeholder="Date *"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="chores-form-field"
              />
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="chores-form-field"
                placeholder="Time (optional)"
              />
              <select
                value={recurring}
                onChange={(e) => {
                  const next = e.target.value as CalendarEvent["recurring"];
                  setRecurring(next);
                  if (next !== "none" && !endDate) {
                    setEndDate(date);
                  }
                  if (next === "none") {
                    setEndDate("");
                  }
                }}
                className="chores-form-field"
              >
                {RECURRING_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              {recurring !== "none" && (
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="chores-form-field"
                  min={date}
                  placeholder="End date *"
                />
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="rounded bg-zinc-800 px-3 py-1.5 text-sm text-white hover:bg-zinc-700"
              >
                Add event
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="rounded bg-zinc-200 px-3 py-1.5 text-sm text-zinc-700 hover:bg-zinc-300"
              >
                Cancel
              </button>
            </div>
          </form>
        ) : (
          <button
            type="button"
            onClick={() => setShowAddForm(true)}
            className="min-h-[36px] rounded-full bg-[#505786] px-4 text-sm font-medium text-white shadow-sm hover:bg-[#3f4568]"
          >
            + Add Event
          </button>
        )}
      </div>

      {/* View content */}
      <div className="flex-1 overflow-auto p-6 min-h-[320px]">
        {viewMode === "month" && (
          <div className="grid grid-cols-7 gap-px rounded-lg border border-[#e3c7a2] bg-[#e3c7a2] overflow-hidden">
            {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day) => (
              <div
                key={day}
                className="bg-[#e5c29a] py-1.5 text-center text-xs font-medium text-[#3B4078]"
              >
                {day}
              </div>
            ))}
            {monthGrid.flat().map((cell, i) => (
              <div
                key={i}
                className={`min-h-[80px] bg-[#fbe4c5] p-2 ${!cell ? "bg-[#f5d6b3]" : ""} ${cell === todayStr ? "relative" : ""}`}
              >
                {cell && (
                  <>
                    {cell === todayStr && (
                      <span className="absolute left-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-xs font-medium text-white">
                        {new Date(cell + "T12:00:00").getDate()}
                      </span>
                    )}
                    {cell !== todayStr && (
                      <span className="text-sm font-medium text-[#c8463a]">
                        {new Date(cell + "T12:00:00").getDate()}
                      </span>
                    )}
                    {cell === todayStr && (
                      <span className="invisible text-sm">0</span>
                    )}
                    <ul className={`mt-1 space-y-0.5 ${cell === todayStr ? "mt-8" : ""}`}>
                      {(occurrencesByDate.get(cell) ?? [])
                        .slice(0, 3)
                        .map((o, j) => (
                          <li
                            key={`${o.date}-${o.eventId}-${j}`}
                            className="truncate rounded bg-blue-100 px-1 py-0.5 text-xs text-blue-900"
                            title={o.time ? `${o.title} ${o.time}` : o.title}
                          >
                            {o.time ? `${o.time} ` : ""}
                            {o.title}
                          </li>
                        ))}
                      {(occurrencesByDate.get(cell) ?? []).length > 3 && (
                        <li className="text-xs text-zinc-400">
                          +{(occurrencesByDate.get(cell) ?? []).length - 3} more
                        </li>
                      )}
                    </ul>
                  </>
                )}
              </div>
            ))}
          </div>
        )}

        {viewMode === "week" && (
          <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 7 }, (_, i) => {
              const d = new Date(rangeStart + "T12:00:00");
              d.setDate(d.getDate() + i);
              const dateStr = d.toISOString().slice(0, 10);
              const dayEvents = occurrencesByDate.get(dateStr) ?? [];
              return (
                <div
                  key={dateStr}
                  className="rounded border border-zinc-200 bg-zinc-50/50 p-2"
                >
                  <p className="text-sm font-medium text-zinc-700">
                    {formatDateShort(dateStr)}
                  </p>
                  <ul className="mt-2 space-y-1">
                    {dayEvents.map((o, j) => (
                      <li
                        key={`${o.date}-${o.eventId}-${j}`}
                        className="flex items-center justify-between gap-1 rounded bg-blue-100 px-2 py-1 text-xs text-blue-900"
                      >
                        <span>
                          {o.time ?? "All day"} {o.title}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRequestDelete(o)}
                          className="text-blue-600 hover:text-red-600"
                          aria-label={o.isRecurring ? "Remove this occurrence" : "Delete"}
                        >
                          ×
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        )}

        {viewMode === "list" && (
          <ul className="space-y-2">
            {occurrences.length === 0 ? (
              <li className="text-sm text-zinc-400">
                No events in this range.
              </li>
            ) : (
              occurrences.map((o, i) => (
                <li
                  key={`${o.date}-${o.eventId}-${i}`}
                  className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50/50 px-3 py-2"
                >
                  <div>
                    <p className="font-medium text-zinc-800">{o.title}</p>
                    <p className="text-xs text-zinc-500">
                      {formatDateShort(o.date)}
                      {o.time ? ` · ${o.time}` : " · All day"}
                      {o.isRecurring && " · Recurring"}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRequestDelete(o)}
                    className="rounded p-1 text-zinc-400 hover:bg-zinc-200 hover:text-red-600"
                    aria-label={o.isRecurring ? "Remove this occurrence" : "Delete event"}
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      <Modal
        open={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
      >
        {pendingDelete && (
          <>
            <p className="mb-3 text-sm text-zinc-800">
              {pendingDelete.isRecurring
                ? "This event repeats. What would you like to delete?"
                : "Delete this event?"}
            </p>
            <div className="flex flex-col gap-2">
              {pendingDelete.isRecurring && (
                <button
                  type="button"
                  className="min-h-[36px] rounded-full border border-zinc-300 px-3 text-sm font-medium text-zinc-700 hover:bg-zinc-100"
                  onClick={() => {
                    deleteOccurrence(pendingDelete.eventId, pendingDelete.date);
                    setPendingDelete(null);
                  }}
                >
                  Delete only this date
                </button>
              )}
              <button
                type="button"
                className="min-h-[36px] rounded-full bg-red-600 px-3 text-sm font-medium text-white hover:bg-red-700"
                onClick={() => {
                  deleteEvent(pendingDelete.eventId);
                  setPendingDelete(null);
                }}
              >
                {pendingDelete.isRecurring ? "Delete all occurrences" : "Delete event"}
              </button>
              <button
                type="button"
                className="min-h-[36px] rounded-full border border-zinc-300 px-3 text-sm font-medium text-zinc-600 hover:bg-zinc-100"
                onClick={() => setPendingDelete(null)}
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </Modal>
    </div>
  );
}
