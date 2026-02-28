"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export function AuthHeader() {
  const pathname = usePathname();
  const { user, loading, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

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
      <div className="flex items-center justify-end gap-3">
        {user ? (
          <>
            <span className="text-sm text-zinc-600">{user.email}</span>
            <button
              type="button"
              onClick={handleSignOut}
              disabled={signingOut}
              className="rounded-lg bg-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-800 hover:bg-zinc-300 disabled:opacity-50"
            >
              {signingOut ? "Signing out…" : "Sign out"}
            </button>
          </>
        ) : (
          <Link
            href="/login"
            className="rounded-lg bg-zinc-800 px-3 py-1.5 text-sm font-medium text-white hover:bg-zinc-700"
          >
            Sign in
          </Link>
        )}
      </div>
    </header>
  );
}
