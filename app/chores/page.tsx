import Link from "next/link";
import { JoinChoresForm } from "./JoinChoresForm";

export default function ChoresLandingPage() {
  const choresId = crypto.randomUUID?.()
    ? crypto.randomUUID().slice(0, 8)
    : "demo-chores";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-zinc-100 px-4">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
          Shared chores
        </h1>
        <p className="mt-2 text-zinc-600">
          Use the same room code as your board. Assign tasks to roommates, set
          how often they repeat, and see what’s due soon or overdue.
        </p>
      </div>
      <div className="flex flex-col gap-4 sm:flex-row">
        <Link
          href={`/chores/${choresId}`}
          className="rounded-xl bg-zinc-900 px-6 py-3 text-center font-medium text-white transition hover:bg-zinc-800"
        >
          New chores board
        </Link>
        <JoinChoresForm />
      </div>
      <p className="text-sm text-zinc-500">
        Real-time shared chores · Due soon & overdue reminders
      </p>
    </div>
  );
}
