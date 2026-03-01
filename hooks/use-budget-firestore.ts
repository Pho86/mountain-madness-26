"use client";

import { useCallback, useEffect, useState } from "react";
import {
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { Expense } from "@/lib/types";

const BUDGETS = "budgets";
const EXPENSES = "expenses";

function expensesRef(budgetId: string) {
  return collection(db, BUDGETS, budgetId, EXPENSES);
}

function expenseRef(budgetId: string, expenseId: string) {
  return doc(db, BUDGETS, budgetId, EXPENSES, expenseId);
}

function toDoc(expense: Expense) {
  return {
    id: expense.id,
    description: expense.description,
    amount: expense.amount,
    paidBy: expense.paidBy,
    splitCount: expense.splitCount,
    createdAt: expense.createdAt,
  };
}

function fromDoc(data: {
  id: string;
  description: string;
  amount: number;
  paidBy: string;
  splitCount: number;
  createdAt: unknown;
}): Expense {
  const created = data.createdAt as { toMillis?: () => number } | number | null;
  const createdAt =
    typeof created === "object" && created?.toMillis
      ? created.toMillis()
      : (created as number) ?? Date.now();
  return {
    id: data.id,
    description: data.description ?? "",
    amount: typeof data.amount === "number" ? data.amount : 0,
    paidBy: data.paidBy ?? "",
    splitCount:
      typeof data.splitCount === "number" && data.splitCount > 0
        ? data.splitCount
        : 1,
    createdAt,
  };
}

export function useBudgetFirestore(budgetId: string | null) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    if (!budgetId) return;
    const ref = expensesRef(budgetId);
    const unsub = onSnapshot(
      ref,
      (snapshot) => {
        setConnected(true);
        const list: Expense[] = [];
        snapshot.forEach((d) => {
          const data = d.data() as Parameters<typeof fromDoc>[0];
          if (data) list.push(fromDoc(data));
        });
        list.sort((a, b) => b.createdAt - a.createdAt);
        setExpenses(list);
      },
      () => setConnected(false)
    );
    return () => {
      unsub();
      setConnected(false);
    };
  }, [budgetId]);

  const addExpense = useCallback(
    (expense: Expense) => {
      if (!budgetId) return;
      setDoc(expenseRef(budgetId, expense.id), toDoc(expense));
    },
    [budgetId]
  );

  const deleteExpense = useCallback(
    (id: string) => {
      if (!budgetId) return;
      deleteDoc(expenseRef(budgetId, id));
    },
    [budgetId]
  );

  return { expenses, connected, addExpense, deleteExpense };
}
