"use client";

import { FridgeLayout } from "@/components/FridgeLayout";

export function CalendarPageSkeleton() {
  return (
    <FridgeLayout showJars>
      <div className="flex min-h-full flex-col">
        <div className="shrink-0 p-4">
          <div className="h-12 w-48 animate-skeleton-pulse rounded border-2 border-zinc-200 bg-zinc-100" />
        </div>
        <main className="flex-1 overflow-auto p-4" style={{ minHeight: 0 }}>
          <div className="mx-auto max-w-4xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="h-8 w-40 animate-skeleton-pulse rounded bg-zinc-200" />
              <div className="flex gap-2">
                <div className="h-9 w-20 animate-skeleton-pulse rounded-lg bg-zinc-100" style={{ animationDelay: "0.1s" }} />
                <div className="h-9 w-9 animate-skeleton-pulse rounded-lg bg-zinc-100" style={{ animationDelay: "0.15s" }} />
                <div className="h-9 w-9 animate-skeleton-pulse rounded-lg bg-zinc-100" style={{ animationDelay: "0.2s" }} />
              </div>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-white p-4">
              <div className="grid grid-cols-7 gap-1 text-center">
                {["S", "M", "T", "W", "T", "F", "S"].map((_, i) => (
                  <div key={i} className="h-4 w-8 animate-skeleton-pulse rounded bg-zinc-100" />
                ))}
                {Array.from({ length: 35 }).map((_, i) => (
                  <div
                    key={i}
                    className="aspect-square animate-skeleton-pulse rounded bg-zinc-50"
                    style={{ animationDelay: `${(i % 7) * 0.02}s` }}
                  />
                ))}
              </div>
            </div>
          </div>
        </main>
      </div>
    </FridgeLayout>
  );
}
