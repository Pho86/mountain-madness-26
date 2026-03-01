"use client";

export function ChoresPageSkeleton() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-100">
      <main className="flex-1 overflow-auto p-4">
        <div className="mx-auto max-w-2xl space-y-6">
          <section className="rounded-xl border border-zinc-200 bg-white p-4">
            <div className="mb-3 h-4 w-28 animate-skeleton-pulse rounded bg-zinc-200" />
            <div className="flex flex-col gap-3">
              <div className="h-10 w-full animate-skeleton-pulse rounded-lg bg-zinc-100" />
              <div className="grid grid-cols-2 gap-3">
                <div className="h-10 animate-skeleton-pulse rounded-lg bg-zinc-100" />
                <div className="h-10 animate-skeleton-pulse rounded-lg bg-zinc-100" />
              </div>
              <div className="h-10 w-full animate-skeleton-pulse rounded-lg bg-zinc-200" />
            </div>
          </section>

          <section className="rounded-xl border border-zinc-200 bg-white">
            <div className="h-10 border-b border-zinc-100 px-4 py-3">
              <div className="h-4 w-24 animate-skeleton-pulse rounded bg-zinc-200" />
            </div>
            <ul className="divide-y divide-zinc-100">
              {[1, 2, 3].map((i) => (
                <li key={i} className="flex items-center justify-between gap-3 px-4 py-3">
                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="h-4 w-32 animate-skeleton-pulse rounded bg-zinc-200" />
                    <div className="h-3 w-40 animate-skeleton-pulse rounded bg-zinc-100" />
                  </div>
                  <div className="h-8 w-16 animate-skeleton-pulse rounded bg-zinc-100" />
                </li>
              ))}
            </ul>
          </section>
        </div>
      </main>
    </div>
  );
}
