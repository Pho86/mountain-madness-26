"use client";

export function BoardPageSkeleton() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-100">
      {/* No header skeleton - navbar (AuthHeader) is already shown by layout */}

      <div className="flex items-center gap-0.5 border-b border-zinc-200 bg-white px-2 py-1.5">
        <div className="h-9 w-9 rounded-md bg-zinc-200 animate-skeleton-pulse" />
        <div className="h-9 w-9 rounded-md bg-zinc-100 animate-skeleton-pulse" style={{ animationDelay: "0.2s" }} />
      </div>

      <main
        className="relative flex-1 overflow-hidden"
        style={{ minHeight: "calc(100vh - 56px - 44px)" }}
      >
        {/* Sticky note skeletons: scattered across the board for a natural look */}
        <div className="absolute left-[8%] top-[12%] -rotate-2">
          <div className="h-28 w-44 rounded-lg bg-zinc-200/90 animate-skeleton-pulse" />
        </div>
        <div className="absolute left-[42%] top-[8%] rotate-1">
          <div className="h-32 w-40 rounded-lg bg-zinc-200/80 animate-skeleton-pulse" style={{ animationDelay: "0.15s" }} />
        </div>
        <div className="absolute right-[15%] top-[22%] -rotate-1">
          <div className="h-24 w-36 rounded-lg bg-zinc-200/85 animate-skeleton-pulse" style={{ animationDelay: "0.3s" }} />
        </div>
        <div className="absolute left-[15%] top-[45%] rotate-2">
          <div className="h-28 w-40 rounded-lg bg-zinc-200/75 animate-skeleton-pulse" style={{ animationDelay: "0.1s" }} />
        </div>
        <div className="absolute left-[55%] top-[38%] -rotate-1">
          <div className="h-28 w-40 rounded-lg bg-zinc-200/80 animate-skeleton-pulse" style={{ animationDelay: "0.25s" }} />
        </div>
        <div className="absolute right-[25%] top-[55%] rotate-1">
          <div className="h-24 w-32 rounded-lg bg-zinc-200/70 animate-skeleton-pulse" style={{ animationDelay: "0.35s" }} />
        </div>
        <div className="absolute left-[10%] bottom-[25%] -rotate-2">
          <div className="h-24 w-36 rounded-lg bg-zinc-200/75 animate-skeleton-pulse" style={{ animationDelay: "0.05s" }} />
        </div>
        <div className="absolute right-[12%] bottom-[30%] rotate-[1.5deg]">
          <div className="h-28 w-40 rounded-lg bg-zinc-200/85 animate-skeleton-pulse" style={{ animationDelay: "0.2s" }} />
        </div>
        <div className="absolute bottom-4 left-4">
          <div className="h-4 w-64 rounded bg-zinc-200/60 animate-skeleton-pulse" style={{ animationDelay: "0.18s" }} />
        </div>
      </main>

      <div className="pointer-events-none absolute inset-0 flex items-end justify-center pb-6">
        <div className="h-12 w-32 rounded-full bg-zinc-200/80 animate-skeleton-pulse" style={{ animationDelay: "0.12s" }} />
      </div>
    </div>
  );
}
