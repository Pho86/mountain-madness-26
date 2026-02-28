"use client";

import { useState, useCallback } from "react";
import type { CalendarEvent } from "@/lib/types";
import {
  expandEvents,
  getMonthStartEnd,
  getWeekStartEnd,
  getMonthGrid,
  type EventOccurrence,
} from "@/lib/calendar-utils";

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
}: {
  calendarId: string;
  events: CalendarEvent[];
  connected: boolean;
  addEvent: (e: CalendarEvent) => void;
  deleteEvent: (id: string) => void;
}) {
  const [viewMode, setViewMode] = useState<ViewMode>("month");
  const [current, setCurrent] = useState(() => new Date());
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("");
  const [recurring, setRecurring] =
    useState<CalendarEvent["recurring"]>("none");

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
        createdAt: Date.now(),
      };
      addEvent(event);
      setTitle("");
      setTime("");
      setRecurring("none");
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
    setCurrent(new Date());
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

  return (
    <div className="flex flex-col h-full bg-white rounded-lg border border-zinc-200 overflow-hidden">
      {/* Calendar header: view toggle + nav */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-200 bg-zinc-50 px-4 py-2">
        <div className="flex items-center gap-2">
          <div className="flex rounded-lg border border-zinc-200 bg-white p-0.5">
            {(["month", "week", "list"] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`rounded-md px-3 py-1.5 text-sm font-medium capitalize ${
                  viewMode === mode
                    ? "bg-zinc-800 text-white"
                    : "text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                {mode}
              </button>
            ))}
          </div>
          <span className="text-sm text-zinc-500">
            {viewMode === "month" && formatMonthYear(year, month)}
            {viewMode === "week" &&
              `${formatDateShort(rangeStart)} – ${formatDateShort(rangeEnd)}`}
            {viewMode === "list" && "Upcoming"}
          </span>
        </div>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={goPrev}
            className="rounded p-1.5 text-zinc-600 hover:bg-zinc-200"
            aria-label="Previous"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <button
            type="button"
            onClick={goToday}
            className="rounded px-2 py-1 text-sm text-zinc-600 hover:bg-zinc-200"
          >
            Today
          </button>
          <button
            type="button"
            onClick={goNext}
            className="rounded p-1.5 text-zinc-600 hover:bg-zinc-200"
            aria-label="Next"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Add event */}
      <div className="border-b border-zinc-100 px-4 py-2">
        {showAddForm ? (
          <form onSubmit={handleAddEvent} className="flex flex-col gap-2">
            <input
              type="text"
              placeholder="Event title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded border border-zinc-300 px-3 py-2 text-sm"
              autoFocus
            />
            <div className="flex flex-wrap gap-2">
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="rounded border border-zinc-300 px-3 py-2 text-sm"
              />
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="rounded border border-zinc-300 px-3 py-2 text-sm"
                placeholder="Time (optional)"
              />
              <select
                value={recurring}
                onChange={(e) =>
                  setRecurring(e.target.value as CalendarEvent["recurring"])
                }
                className="rounded border border-zinc-300 px-3 py-2 text-sm"
              >
                {RECURRING_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
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
            className="rounded bg-zinc-100 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-200"
          >
            + Add event
          </button>
        )}
      </div>

      {/* View content */}
      <div className="flex-1 overflow-auto p-4 min-h-[320px]">
        {viewMode === "month" && (
          <div className="grid grid-cols-7 gap-px bg-zinc-200 rounded-lg overflow-hidden">
            {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day) => (
              <div
                key={day}
                className="bg-zinc-50 py-1 text-center text-xs font-medium text-zinc-500"
              >
                {day}
              </div>
            ))}
            {monthGrid.flat().map((cell, i) => (
              <div
                key={i}
                className={`min-h-[80px] bg-white p-1 ${!cell ? "bg-zinc-50/50" : ""}`}
              >
                {cell && (
                  <>
                    <span className="text-sm text-zinc-600">
                      {new Date(cell + "T12:00:00").getDate()}
                    </span>
                    <ul className="mt-1 space-y-0.5">
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
                          onClick={() => deleteEvent(o.eventId)}
                          className="text-blue-600 hover:text-red-600"
                          aria-label="Delete"
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
                    onClick={() => deleteEvent(o.eventId)}
                    className="rounded p-1 text-zinc-400 hover:bg-zinc-200 hover:text-red-600"
                    aria-label="Delete event"
                  >
                    <svg
                      className="h-4 w-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>
    </div>
  );
}
