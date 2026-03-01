"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useUserProfile } from "@/lib/use-user-profile";
import { getAvatarUrl } from "@/lib/avatars";

function getRoomIdFromPath(pathname: string): string | null {
  const boardMatch = pathname.match(/^\/board\/([^/]+)/);
  if (boardMatch) return boardMatch[1];
  const budgetMatch = pathname.match(/^\/budget\/([^/]+)/);
  if (budgetMatch) return budgetMatch[1];
  const calendarMatch = pathname.match(/^\/calendar\/([^/]+)/);
  if (calendarMatch) return calendarMatch[1];
  const choresMatch = pathname.match(/^\/chores\/([^/]+)/);
  if (choresMatch) return choresMatch[1];
  return null;
}

export function AuthHeader() {
  const pathname = usePathname();
  const { user, loading, signOut } = useAuth();
  const { iconId } = useUserProfile(user?.uid ?? null);
  const [signingOut, setSigningOut] = useState(false);
  const roomId = getRoomIdFromPath(pathname ?? "");

  if (pathname === "/login") return null;

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
    } finally {
      setSigningOut(false);
    }
  };

  if (loading) {
    return (
      <header className="border-b border-zinc-200 bg-white px-4 py-2">
        <div className="flex justify-end">
          <span className="text-sm text-zinc-400">Loading…</span>
        </div>
      </header>
    );
  }

  return (
    <header className="border-b border-zinc-200 bg-white px-4 py-2">
      <div className="flex items-center justify-between gap-4">
        <nav className="flex items-center gap-1">
          <Link
            href="/"
            className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
          >
            Home
          </Link>
          {roomId && (
            <>
              <Link
                href={`/board/${roomId}`}
                className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
              >
                Board
              </Link>
              <Link
                href={`/budget/${roomId}`}
                className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
              >
                Budget
              </Link>
              <Link
                href={`/calendar/${roomId}`}
                className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
              >
                Calendar
              </Link>
              <Link
                href={`/chores/${roomId}`}
                className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
              >
                Chores
              </Link>
            </>
          )}
          <Link
            href="/profile"
            className="rounded-lg px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900"
          >
            Profile
          </Link>
        </nav>
        <div className="flex items-center gap-3">
          {user ? (
            <>
              {iconId ? (
                <img
                  src={getAvatarUrl(iconId)}
                  alt=""
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt=""
                  className="h-8 w-8 rounded-full object-cover"
                  referrerPolicy="no-referrer"
                />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-zinc-300 text-sm font-medium text-zinc-600">
                  {(user.displayName || user.email || "?")
                    .charAt(0)
                    .toUpperCase()}
                </span>
              )}
              <span className="text-sm font-medium text-zinc-700">
                {user.displayName || user.email?.split("@")[0] || "User"}
              </span>
              <button
                type="button"
                onClick={handleSignOut}
                disabled={signingOut}
                className="rounded-lg bg-zinc-200 px-3 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-300 disabled:opacity-50"
              >
                {signingOut ? "Signing out…" : "Sign out"}
              </button>
            </>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-zinc-800 px-3 py-2 text-sm font-medium text-white hover:bg-zinc-700"
            >
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
