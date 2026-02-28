"use client";

import { useCallback, useState } from "react";
import { useParams } from "next/navigation";
import { useBudgetFirestore } from "@/lib/use-budget-firestore";
import type { Expense } from "@/lib/types";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
  }).format(amount);
}

export default function BudgetTrackerPage() {
  const params = useParams();
  const budgetId = typeof params.budgetId === "string" ? params.budgetId : null;
  const { expenses, connected, addExpense, deleteExpense } =
    useBudgetFirestore(budgetId);

  const [description, setDescription] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [splitCount, setSplitCount] = useState(2);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const amount = parseFloat(amountStr);
      if (!description.trim() || Number.isNaN(amount) || amount <= 0) return;
      const expense: Expense = {
        id: crypto.randomUUID?.() ?? `e-${Date.now()}`,
        description: description.trim(),
        amount: Math.round(amount * 100) / 100,
        paidBy: paidBy.trim() || "Someone",
        splitCount: splitCount < 1 ? 1 : splitCount,
        createdAt: Date.now(),
      };
      addExpense(expense);
      setDescription("");
      setAmountStr("");
    },
    [addExpense, description, amountStr, paidBy, splitCount],
  );

  const total = expenses.reduce((sum, e) => sum + e.amount, 0);

  if (!budgetId) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-100">
        <p className="text-zinc-500">Invalid budget</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-zinc-100">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 bg-white px-4 py-3 shadow-sm">
        <h1 className="text-lg font-semibold text-zinc-800">
          Budget tracker
          <span className="ml-2 font-mono text-sm font-normal text-zinc-500">
            /{budgetId}
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
                `${typeof window !== "undefined" ? window.location.origin : ""}/budget/${budgetId}`,
              );
            }}
          >
            Copy link
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-4">
        <div className="mx-auto max-w-2xl space-y-6">
          {/* Summary */}
          <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <h2 className="text-sm font-medium text-zinc-500">Total spent</h2>
            <p className="mt-1 text-2xl font-bold text-zinc-900">
              {formatCurrency(total)}
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              {expenses.length} expense{expenses.length !== 1 ? "s" : ""}
            </p>
          </section>

          {/* Add expense form */}
          <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
            <h2 className="mb-3 text-sm font-medium text-zinc-700">
              Add expense
            </h2>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              <input
                type="text"
                placeholder="What was it? (e.g. Groceries)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400"
              />
              <div className="grid grid-cols-2 gap-3">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="Amount"
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400"
                />
                <input
                  type="text"
                  placeholder="Paid by (name)"
                  value={paidBy}
                  onChange={(e) => setPaidBy(e.target.value)}
                  className="rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-zinc-400"
                />
              </div>
              <div className="flex items-center gap-2">
                <label htmlFor="splitCount" className="text-sm text-zinc-600">
                  Split between
                </label>
                <input
                  id="splitCount"
                  type="number"
                  min={1}
                  max={20}
                  value={splitCount}
                  onChange={(e) =>
                    setSplitCount(
                      Math.max(1, parseInt(e.target.value, 10) || 1),
                    )
                  }
                  className="w-16 rounded-lg border border-zinc-300 px-2 py-1.5 text-sm outline-none focus:ring-2 focus:ring-zinc-400"
                />
                <span className="text-sm text-zinc-500">people</span>
              </div>
              <button
                type="submit"
                className="rounded-lg bg-zinc-800 py-2 text-sm font-medium text-white hover:bg-zinc-700"
              >
                Add expense
              </button>
            </form>
          </section>

          {/* Expense list */}
          <section className="rounded-xl border border-zinc-200 bg-white shadow-sm">
            <h2 className="border-b border-zinc-100 px-4 py-3 text-sm font-medium text-zinc-700">
              Expenses
            </h2>
            <ul className="divide-y divide-zinc-100">
              {expenses.length === 0 ? (
                <li className="px-4 py-8 text-center text-sm text-zinc-400">
                  No expenses yet. Add one above to get started.
                </li>
              ) : (
                expenses.map((expense) => (
                  <li
                    key={expense.id}
                    className="flex items-center justify-between gap-3 px-4 py-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-zinc-800">
                        {expense.description}
                      </p>
                      <p className="text-xs text-zinc-500">
                        {expense.paidBy} · split between {expense.splitCount} (
                        {formatCurrency(expense.amount / expense.splitCount)}{" "}
                        each)
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-medium text-zinc-700">
                        {formatCurrency(expense.amount)}
                      </span>
                      <button
                        type="button"
                        onClick={() => deleteExpense(expense.id)}
                        className="rounded p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-red-600"
                        title="Remove expense"
                        aria-label="Remove expense"
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
                    </div>
                  </li>
                ))
              )}
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}
