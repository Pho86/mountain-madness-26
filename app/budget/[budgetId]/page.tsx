"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { TrashIcon } from "@heroicons/react/24/outline";
import { useBudgetFirestore } from "@/hooks/use-budget-firestore";
import { useAuth } from "@/lib/auth-context";
import { useUserRooms } from "@/hooks/use-user-rooms";
import { useRoom } from "@/hooks/use-room";
import { BudgetPageSkeleton } from "@/components/BudgetPageSkeleton";
import { EditableRoomName } from "@/components/EditableRoomName";
import { FridgeLayout } from "@/components/FridgeLayout";
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
  const { user } = useAuth();
  const { addRoom } = useUserRooms(user?.uid ?? null);
  const { name: roomName, setName: setRoomName, ensureRoomExists, loading: roomLoading } = useRoom(budgetId);
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

  useEffect(() => {
    if (user && budgetId) addRoom(budgetId);
  }, [user, budgetId, addRoom]);

  useEffect(() => {
    if (budgetId) ensureRoomExists();
  }, [budgetId, ensureRoomExists]);

  useEffect(() => {
    const name = roomName || budgetId;
    if (name) document.title = `${name} · Budget`;
    return () => { document.title = "Reizoko"; };
  }, [roomName, budgetId]);

  if (!budgetId) {
    return (
      <FridgeLayout showJars>
        <div className="flex min-h-full items-center justify-center">
          <p className="text-zinc-500">Invalid budget</p>
        </div>
      </FridgeLayout>
    );
  }

  if (roomLoading) {
    return <BudgetPageSkeleton />;
  }

  return (
    <FridgeLayout showJars>
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
              name={roomName || budgetId || "Budget"}
              roomCode={budgetId}
              onSave={setRoomName}
              hideCode={false}
              loading={false}
              className="flex flex-col items-end gap-0.5 font-serif text-right"
              inputClassName="w-full min-w-0 border-0 border-b-2 border-zinc-600 bg-transparent py-0.5 text-right text-lg font-medium text-zinc-900 outline-none focus:ring-0 [background:transparent]"
              compact
            />
          </div>
        </div>
        <main className="flex flex-1 flex-col items-center justify-center overflow-hidden p-4" style={{ minHeight: 0 }}>
        <div className="mx-auto w-full max-w-2xl space-y-6">
          {/* Summary */}
          <section className="rounded-xl border border-zinc-200 bg-white p-4">
            <h2 className="text-sm font-medium text-zinc-500">Total spent</h2>
            <p className="mt-1 text-2xl font-bold text-zinc-900">
              {formatCurrency(total)}
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              {expenses.length} expense{expenses.length !== 1 ? "s" : ""}
            </p>
          </section>

          {/* Add expense form */}
          <section className="rounded-xl border border-zinc-200 bg-white p-4">
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
          <section className="rounded-xl border border-zinc-200 bg-white p-4">
            <h2 className="border-b border-zinc-100 pb-3 text-sm font-medium text-zinc-700">
              Expenses
            </h2>
            <ul className="divide-y divide-zinc-100 pt-1">
              {expenses.length === 0 ? (
                <li className="py-8 text-center text-sm text-zinc-400">
                  No expenses yet. Add one above to get started.
                </li>
              ) : (
                expenses.map((expense) => (
                  <li
                    key={expense.id}
                    className="flex items-center justify-between gap-3 py-3"
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
                        <TrashIcon className="h-4 w-4" />
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
    </FridgeLayout>
  );
}
