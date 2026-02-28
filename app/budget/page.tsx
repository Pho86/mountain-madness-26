import Link from "next/link";
import { JoinBudgetForm } from "./JoinBudgetForm";

export default function BudgetLandingPage() {
  const budgetId = crypto.randomUUID?.()
    ? crypto.randomUUID().slice(0, 8)
    : "demo-budget";

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-zinc-100 px-4">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
          Shared budget tracker
        </h1>
        <p className="mt-2 text-zinc-600">
          Use the same room code as your sticky board. Everyone in the room sees
          the same expenses in real time.
        </p>
      </div>
      <div className="flex flex-col gap-4 sm:flex-row">
        <Link
          href={`/budget/${budgetId}`}
          className="rounded-xl bg-zinc-900 px-6 py-3 text-center font-medium text-white transition hover:bg-zinc-800"
        >
          New budget
        </Link>
        <JoinBudgetForm />
      </div>
      <p className="text-sm text-zinc-500">
        Powered by Firebase Firestore · Real-time shared expenses
      </p>
    </div>
  );
}
