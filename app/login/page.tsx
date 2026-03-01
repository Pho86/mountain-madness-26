"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const { signInWithGoogle } = useAuth();
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    setError("");
    setBusy(true);
    try {
      await signInWithGoogle();
      router.push("/");
      router.refresh();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Sign in failed";
      setError(message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-100 px-4">
      <div className="w-full max-w-sm rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="mb-6 text-center text-lg font-semibold text-zinc-900">
          Sign in to Waifu Fridge
        </h2>

        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={busy}
          className="flex w-full items-center justify-center gap-3 rounded-lg border border-zinc-300 bg-white px-4 py-3 text-zinc-800 transition hover:bg-zinc-50 disabled:opacity-50"
        >
          <ArrowRightOnRectangleIcon className="h-5 w-5 shrink-0" />
          <span className="font-medium">
            {busy ? "Signing in…" : "Sign in with Google"}
          </span>
        </button>

        {error && (
          <p className="mt-4 text-center text-sm text-red-600">{error}</p>
        )}

        <p className="mt-6 text-center text-sm text-zinc-500">
          <Link href="/" className="underline hover:text-zinc-700">
            Back to home
          </Link>
        </p>
      </div>
    </div>
  );
}
