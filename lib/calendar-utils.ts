import type { CalendarEvent } from "@/lib/types";

export type EventOccurrence = {
  date: string; // YYYY-MM-DD
  time: string | null;
  title: string;
  eventId: string;
  isRecurring: boolean;
};

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function addWeeks(dateStr: string, weeks: number): string {
  return addDays(dateStr, weeks * 7);
}

function addMonths(dateStr: string, months: number): string {
  const d = new Date(dateStr + "T12:00:00");
  d.setMonth(d.getMonth() + months);
  return d.toISOString().slice(0, 10);
}

function dateInRange(dateStr: string, start: string, end: string): boolean {
  return dateStr >= start && dateStr <= end;
}

/** Expand events (including recurring) into occurrences within [startDate, endDate]. */
export function expandEvents(
  events: CalendarEvent[],
  startDate: string,
  endDate: string,
): EventOccurrence[] {
  const result: EventOccurrence[] = [];
  for (const e of events) {
    if (e.recurring === "none") {
      if (dateInRange(e.date, startDate, endDate)) {
        result.push({
          date: e.date,
          time: e.time,
          title: e.title,
          eventId: e.id,
          isRecurring: false,
        });
      }
      continue;
    }
    let cursor = e.date;
    const maxIter = 500;
    let iter = 0;
    const seriesEnd = e.endDate && e.endDate < endDate ? e.endDate : endDate;
    while (cursor <= seriesEnd && iter < maxIter) {
      iter++;
      if (cursor >= startDate) {
        const exceptions = e.exceptionDates ?? [];
        if (!exceptions.includes(cursor)) {
          result.push({
            date: cursor,
            time: e.time,
            title: e.title,
            eventId: e.id,
            isRecurring: true,
          });
        }
      }
      if (e.recurring === "daily") cursor = addDays(cursor, 1);
      else if (e.recurring === "weekly") cursor = addWeeks(cursor, 1);
      else if (e.recurring === "monthly") cursor = addMonths(cursor, 1);
      else break;
    }
  }
  result.sort((a, b) => {
    const d = a.date.localeCompare(b.date);
    if (d !== 0) return d;
    const t1 = a.time ?? "00:00";
    const t2 = b.time ?? "00:00";
    return t1.localeCompare(t2);
  });
  return result;
}

export function getMonthStartEnd(
  year: number,
  month: number,
): { start: string; end: string } {
  const start = new Date(year, month, 1);
  const end = new Date(year, month + 1, 0);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export function getWeekStartEnd(date: Date): { start: string; end: string } {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  const start = new Date(d);
  start.setDate(diff);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  return {
    start: start.toISOString().slice(0, 10),
    end: end.toISOString().slice(0, 10),
  };
}

export function getMonthGrid(year: number, month: number): (string | null)[][] {
  const first = new Date(year, month, 1);
  const last = new Date(year, month + 1, 0);
  const startDay = first.getDay();
  const daysInMonth = last.getDate();
  const rows: (string | null)[][] = [];
  let row: (string | null)[] = [];
  const pad = startDay === 0 ? 6 : startDay - 1;
  for (let i = 0; i < pad; i++) row.push(null);
  for (let d = 1; d <= daysInMonth; d++) {
    row.push(
      `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`,
    );
    if (row.length === 7) {
      rows.push(row);
      row = [];
    }
  }
  if (row.length) {
    while (row.length < 7) row.push(null);
    rows.push(row);
  }
  return rows;
}
