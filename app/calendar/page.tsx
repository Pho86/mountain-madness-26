import Link from "next/link";
import { FridgeLayout } from "@/components/FridgeLayout";
import { JoinCalendarForm } from "./JoinCalendarForm";

export default function CalendarLandingPage() {
  const calendarId = crypto.randomUUID?.()
    ? crypto.randomUUID().slice(0, 8)
    : "demo-cal";

  return (
    <FridgeLayout showJars>
      <div className="flex min-h-full flex-col items-center justify-center gap-8 px-4 py-10">
        <div className="max-w-md text-center">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
            Shared calendar
          </h1>
          <p className="mt-2 text-zinc-600">
            Create a calendar and share the room code. Everyone with the code can
            add events and see the same schedule in real time.
          </p>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row">
          <Link
            href={`/calendar/${calendarId}`}
            className="rounded-xl bg-zinc-900 px-6 py-3 text-center font-medium text-white transition hover:bg-zinc-800"
          >
            New calendar
          </Link>
          <JoinCalendarForm />
        </div>
        <p className="text-sm text-zinc-500">
          Powered by Firebase Firestore · Real-time shared events
        </p>
      </div>
    </FridgeLayout>
  );
}
