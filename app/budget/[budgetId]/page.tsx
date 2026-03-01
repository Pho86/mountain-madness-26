"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { TrashIcon } from "@heroicons/react/24/outline";
import { useBudgetFirestore } from "@/hooks/use-budget-firestore";
import { useAuth } from "@/lib/auth-context";
import { useUserRooms } from "@/hooks/use-user-rooms";
import { useRoom } from "@/hooks/use-room";
import { useRoomMembers } from "@/hooks/use-room-members";
import { useUserProfile } from "@/lib/use-user-profile";
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
  const { iconId: currentUserIconId } = useUserProfile(user?.uid ?? null);
  const { members, ensureCurrentUser } = useRoomMembers(budgetId);
  const { expenses, connected, addExpense, deleteExpense } =
    useBudgetFirestore(budgetId);

  const [description, setDescription] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [paidBy, setPaidBy] = useState("");
  const [splitCount, setSplitCount] = useState(2);
  const [capyWiggling, setCapyWiggling] = useState(false);

  const payerOptions = [
    { value: "", label: "Someone", id: "_someone" },
    ...members.map((m) => ({ value: m.displayName, label: m.displayName, id: m.id })),
  ];

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
    if (user && budgetId) ensureCurrentUser(user, currentUserIconId);
  }, [user, budgetId, ensureCurrentUser, currentUserIconId]);

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
        <main className="flex flex-1 flex-col overflow-hidden p-4 md:p-6" style={{ minHeight: 0 }}>
          <div className="mx-auto grid w-full max-w-7xl flex-1 gap-6 md:grid-cols-[1fr_1.2fr] md:gap-8">
            {/* Create an Expense form - paper-style with jagged top edge */}
            <section
              className="expenses-create-form-jagged relative flex min-h-0 flex-col border-2 p-6 pt-8 pb-8 md:p-8 md:pt-10 md:pb-10"
              style={{
                backgroundColor: "var(--expenses-purple)",
                borderColor: "#5c4033",
                boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
              }}
            >
              <h2 className="expenses-label mb-4 text-2xl font-medium" style={{ color: "var(--expenses-form-text-on-purple)" }}>
                Create an Expense
              </h2>
              <form onSubmit={handleSubmit} className="flex min-h-0 flex-1 flex-col">
                <div className="flex flex-col gap-4">
                  <input
                    type="text"
                    placeholder="What was it? (eg. Groceries)"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="expenses-form-field"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex flex-col gap-1">
                      <label htmlFor="amount" className="expenses-label text-sm font-bold" style={{ color: "var(--expenses-form-text-on-purple)" }}>Amount</label>
                      <input
                        id="amount"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="0.00"
                        value={amountStr}
                        onChange={(e) => setAmountStr(e.target.value)}
                        className="expenses-form-field"
                      />
                    </div>
                    <div className="flex flex-col gap-1">
                      <label htmlFor="payer" className="expenses-label text-sm font-bold" style={{ color: "var(--expenses-form-text-on-purple)" }}>Payer</label>
                      <select
                        id="payer"
                        value={paidBy}
                        onChange={(e) => setPaidBy(e.target.value)}
                        className="expenses-form-field"
                      >
                      {payerOptions.map((opt) => (
                        <option key={opt.id} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                      </select>
                    </div>
                  </div>
                  <input
                    id="splitCount"
                    type="number"
                    min={1}
                    max={20}
                    placeholder="Number of people to split cost"
                    value={splitCount === 0 ? "" : splitCount}
                    onChange={(e) => {
                      const v = e.target.value;
                      setSplitCount(v === "" ? 0 : Math.max(1, Math.min(20, parseInt(v, 10) || 1)));
                    }}
                    className="expenses-form-field w-full"
                  />
                </div>
                <div className="mt-auto flex items-end gap-4 pt-6">
                  <div className="shrink-0">
                    <img
                      src="/Capybank.png"
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
                  <div className="flex flex-col h-full w-full">
                    <div className="min-w-0 flex-1 border-t border-dashed" style={{ borderColor: "var(--expenses-form-text-on-purple)" }} />
                    <button
                      type="submit"
                      className="expenses-label expenses-submit-btn shrink-0 rounded-lg border-2 cursor-pointer px-4 py-2 font-medium transition-colors"
                      style={{
                        backgroundColor: "var(--expenses-purple)",
                        borderColor: "var(--expenses-form-text-on-purple)",
                        color: "var(--expenses-form-text-on-purple)",
                      }}
                    >
                      Create Expense
                    </button>
                  </div>
                </div>
              </form>
            </section>

            {/* Expenses list - beige/cream cards */}
            <section
              className="rounded-lg border-2 p-4 md:p-5 mt-32"
              style={{
                borderColor: "#F9E1C9",
              }}
            >
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="expenses-font text-lg font-medium" style={{ color: "#F9E1C9" }}>
                  Expenses
                </h2>
                <p className="text-sm" style={{ color: "#F9E1C9", opacity: 0.8 }}>
                  {formatCurrency(total)} total · {expenses.length} expense{expenses.length !== 1 ? "s" : ""}
                </p>
              </div>
              <ul className="space-y-3">
                {expenses.length === 0 ? (
                  <li className="py-8 text-center text-sm" style={{ color: "#F9E1C9", opacity: 0.7 }}>
                    No expenses yet. Add one to get started.
                  </li>
                ) : (
                  expenses.map((expense) => (
                    <li
                      key={expense.id}
                      className="flex items-center justify-between gap-3 rounded-xl border p-4 shadow-sm"
                      style={{
                        backgroundColor: "var(--expenses-card-bg)",
                        borderColor: "var(--expenses-form-border)",
                      }}
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-bold" style={{ color: "#A96C8D" }}>
                          {expense.description}
                        </p>
                        <p className="truncate text-sm" style={{ color: "#A96C8D", opacity: 0.85 }}>
                          Split between {expense.splitCount}: {formatCurrency(expense.amount / expense.splitCount)} each
                        </p>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className="rounded-lg border-2 px-3 py-1.5 font-mono text-sm font-medium"
                          style={{
                            borderColor: "#A96C8D",
                            color: "#A96C8D",
                          }}
                        >
                          {formatCurrency(expense.amount)}
                        </span>
                        <button
                          type="button"
                          onClick={() => deleteExpense(expense.id)}
                          className="rounded-lg border-2 p-2 transition-colors hover:opacity-80"
                          style={{
                            borderColor: "#A96C8D",
                            color: "#A96C8D",
                          }}
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
