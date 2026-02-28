"use client";

import { useParams } from "next/navigation";
import { useCalendarFirestore } from "@/lib/use-calendar-firestore";
import { BoardCalendar } from "@/components/BoardCalendar";

export default function CalendarPage() {
  const params = useParams();
  const calendarId =
    typeof params.calendarId === "string" ? params.calendarId : null;
  const { events, connected, addEvent, deleteEvent } =
    useCalendarFirestore(calendarId);

  if (!calendarId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-100">
        <p className="text-zinc-500">Invalid calendar</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-100">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 bg-white px-4 py-3 shadow-sm">
        <h1 className="text-lg font-semibold text-zinc-800">
          Calendar
          <span className="ml-2 font-mono text-sm font-normal text-zinc-500">
            /{calendarId}
          </span>
        </h1>
        <div className="flex items-center gap-3">
          <span
            className={`h-2 w-2 rounded-full ${
              connected ? "bg-emerald-500" : "bg-red-500"
            }`}
            title={connected ? "Connected" : "Disconnected"}
          />
          <span className="text-sm text-zinc-500">
            {connected ? "Live" : "Reconnecting…"}
          </span>
          <button
            type="button"
            className="rounded-lg bg-zinc-800 px-3 py-1.5 text-sm text-white hover:bg-zinc-700"
            onClick={() => {
              navigator.clipboard.writeText(
                `${typeof window !== "undefined" ? window.location.origin : ""}/calendar/${calendarId}`,
              );
            }}
          >
            Copy link
          </button>
        </div>
      </header>

      <main
        className="flex-1 overflow-auto p-4"
        style={{ minHeight: "calc(100vh - 56px)" }}
      >
        <BoardCalendar
          calendarId={calendarId}
          events={events}
          connected={connected}
          addEvent={addEvent}
          deleteEvent={deleteEvent}
        />
      </main>
    </div>
  );
}
