"use client";

export function CalendarPageSkeleton() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-100">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 bg-white px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="h-6 w-32 animate-skeleton-pulse rounded bg-zinc-200" />
          <div className="h-4 w-16 font-mono animate-skeleton-pulse rounded bg-zinc-100" />
        </div>
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-zinc-200" />
          <div className="h-4 w-16 animate-skeleton-pulse rounded bg-zinc-100" />
          <div className="h-9 w-28 animate-skeleton-pulse rounded-lg bg-zinc-200" />
        </div>
      </header>

      <main className="flex-1 overflow-auto p-4" style={{ minHeight: "calc(100vh - 56px)" }}>
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
  );
}
