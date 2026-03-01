"use client";

import { FridgeLayout } from "@/components/FridgeLayout";

export function BudgetPageSkeleton() {
  return (
    <FridgeLayout showJars>
      <div className="flex min-h-full flex-col overflow-auto p-4">
        <div className="mx-auto max-w-2xl space-y-6">
          <section className="rounded-xl border border-zinc-200 bg-white p-4">
            <div className="h-4 w-20 animate-skeleton-pulse rounded bg-zinc-200" />
            <div className="mt-2 h-8 w-32 animate-skeleton-pulse rounded bg-zinc-200" />
            <div className="mt-2 h-4 w-24 animate-skeleton-pulse rounded bg-zinc-100" />
          </section>

          <section className="rounded-xl border border-zinc-200 bg-white p-4">
            <div className="mb-3 h-4 w-24 animate-skeleton-pulse rounded bg-zinc-200" />
            <div className="flex flex-col gap-3">
              <div className="h-10 w-full animate-skeleton-pulse rounded-lg bg-zinc-100" />
              <div className="grid grid-cols-2 gap-3">
                <div className="h-10 animate-skeleton-pulse rounded-lg bg-zinc-100" />
                <div className="h-10 animate-skeleton-pulse rounded-lg bg-zinc-100" />
              </div>
              <div className="flex items-center gap-2">
                <div className="h-4 w-24 animate-skeleton-pulse rounded bg-zinc-100" />
                <div className="h-9 w-16 animate-skeleton-pulse rounded-lg bg-zinc-100" />
                <div className="h-4 w-12 animate-skeleton-pulse rounded bg-zinc-100" />
              </div>
              <div className="h-10 w-full animate-skeleton-pulse rounded-lg bg-zinc-200" />
            </div>
          </section>

          <section className="rounded-xl border border-zinc-200 bg-white p-4">
            <div className="border-b border-zinc-100 pb-3">
              <div className="h-4 w-20 animate-skeleton-pulse rounded bg-zinc-200" />
            </div>
            <ul className="divide-y divide-zinc-100 pt-1">
              {[1, 2, 3].map((i) => (
                <li key={i} className="flex items-center justify-between gap-3 py-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="h-4 w-32 animate-skeleton-pulse rounded bg-zinc-200" />
                    <div className="h-3 w-40 animate-skeleton-pulse rounded bg-zinc-100" />
                  </div>
                  <div className="h-4 w-16 animate-skeleton-pulse rounded bg-zinc-200" />
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </FridgeLayout>
  );
}
