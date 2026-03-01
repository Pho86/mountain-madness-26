"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FridgeLayout } from "@/components/FridgeLayout";
import { useAuth } from "@/lib/auth-context";
import { useUserRooms } from "@/hooks/use-user-rooms";
import { useRoomNames } from "@/hooks/use-room-names";
import { checkRoomExists } from "@/hooks/use-room";

function DottedHoles({ count = 7 }: { count?: number }) {
  return (
    <div className="absolute left-4 right-4 top-4 flex flex-nowrap justify-between gap-0">
      {[...Array(count)].map((_, i) => (
        <span
          key={i}
          className="h-2.5 w-2.5 shrink-0 rounded-sm"
          style={{ backgroundColor: "#DB3131" }}
        />
      ))}
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg className="h-5 w-5 shrink-0" viewBox="0 0 24 24" aria-hidden>
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
    </svg>
  );
}

export default function Home() {
  const { user, signInWithGoogle } = useAuth();
  const { rooms } = useUserRooms(user?.uid ?? null);
  const roomNames = useRoomNames(rooms);
  const [signInError, setSignInError] = useState("");
  const [signInBusy, setSignInBusy] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joining, setJoining] = useState(false);
  const [joinError, setJoinError] = useState<string | null>(null);
  const router = useRouter();
  const roomCode =
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID().slice(0, 8).toUpperCase()
      : "ABCD1234";

  const handleGoogleSignIn = async () => {
    setSignInError("");
    setSignInBusy(true);
    try {
      await signInWithGoogle();
    } catch (err) {
      setSignInError(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setSignInBusy(false);
    }
  };

  const handleJoinRoom = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = joinCode.trim().toUpperCase();
    if (!code) return;
    setJoinError(null);
    setJoining(true);
    try {
      const exists = await checkRoomExists(code);
      if (!exists) {
        setJoinError("Room not found. Check the code or create a new room.");
        return;
      }
      router.push(`/board/${code}`);
    } finally {
      setJoining(false);
    }
  };

  return (
    <FridgeLayout showJars>
      {!user ? (
        /* Sign-in page first: Reizoko + Sign in with Google only */
        <div
          className="relative flex min-h-0 flex-1 flex-col items-center justify-center overflow-hidden px-4"
          style={{ minHeight: "calc(100vh - 64px)" }}
        >
          <div className="flex flex-col items-center gap-10">
            <h1 className="animate-sign-in-hero text-center font-serif text-4xl font-medium tracking-wide text-[#F7EAD7] md:text-6xl">
              Reizoko
            </h1>
            <div className="animate-sign-in-sticky w-full max-w-md">
              <div
                className="relative rounded-lg border-2 px-6 py-6"
                style={{
                  backgroundColor: "#6E4537",
                  borderColor: "#5c4033",
                }}
              >
                <DottedHoles count={7} />
                <h2 className="mb-5 mt-5 text-center font-serif text-3xl font-medium text-[#F7EAD7]">
                  Sign In
                </h2>
                <button
                  type="button"
                  onClick={handleGoogleSignIn}
                  disabled={signInBusy}
                  className="sign-in-google-btn flex w-full cursor-pointer items-center justify-center gap-3 rounded-lg border border-[#F9E1C9] px-4 py-3 font-normal text-[#F7EAD7] transition disabled:opacity-50"
                >
                  <GoogleIcon />
                  <span>{signInBusy ? "Signing in…" : "Sign in with Google"}</span>
                </button>
                {signInError && (
                  <p className="mt-3 text-center text-sm text-red-200">
                    {signInError}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Room-choosing page: two panels (info + join/create) */
        <div
          className="relative flex min-h-0 flex-1 flex-col items-center justify-center overflow-auto px-4"
          style={{ minHeight: "calc(100vh - 64px)" }}
        >
          <div className="flex w-full max-w-3xl flex-col items-center gap-10">
            <h1 className="text-center font-serif text-4xl font-medium tracking-wide md:text-6xl" style={{ color: "#F7EAD7" }}>
              Reizoko
            </h1>
            <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-[40fr_57fr]">
              <div
                className="relative rounded-lg px-6 pb-6 pt-14"
                style={{ backgroundColor: "#804938" }}
              >
                <DottedHoles count={7} />
                <p className="mb-3 text-left font-light leading-relaxed" style={{ color: "#F7EAD7" }}>
                  Share one room for sticky notes and budget tracker.
                </p>
                <p className="text-left text-base leading-relaxed" style={{ color: "#F7EAD7" }}>
                  Enter a <strong>room code</strong> to join, or create a new room and share the code.
                </p>
              </div>
              <div
                className="relative flex flex-col rounded-lg px-6 pb-6 pt-14"
                style={{ backgroundColor: "#5B769D" }}
              >
                <DottedHoles count={7} />
                <form onSubmit={handleJoinRoom} className="mb-4 flex flex-wrap items-center gap-3">
                  <input
                    type="text"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    placeholder="Enter room code"
                    className="room-code-input min-w-0 flex-1 rounded-xl border border-white/60 px-4 py-2.5 text-center text-base focus:border-white/80 focus:outline-none focus:ring-0 placeholder:text-white"
                    style={{
                      backgroundColor: "transparent",
                      color: "#FFFFFF",
                    }}
                  />
                  <button
                    type="submit"
                    disabled={joining}
                    className="shrink-0 rounded-lg px-4 py-2.5 font-medium disabled:opacity-50"
                    style={{ backgroundColor: "#F9E1C9", color: "#304359" }}
                  >
                    {joining ? "Joining…" : "Join room"}
                  </button>
                </form>
                {joinError && (
                  <p className="mb-3 text-sm" style={{ color: "#F7EAD7" }}>{joinError}</p>
                )}
                <div className="relative flex items-center gap-3 py-2">
                  <div className="flex-1 border-t border-white/30" />
                  <span className="text-sm" style={{ color: "#F7EAD7" }}>or</span>
                  <div className="flex-1 border-t border-white/30" />
                </div>
                <Link
                  href={`/board/${roomCode}`}
                  className="mt-2 rounded-lg border-2 border-dashed px-4 py-3 text-center font-medium"
                  style={{ borderColor: "#B8CCD7", backgroundColor: "#5B769D", color: "#F7EAD7" }}
                >
                  Create new room
                </Link>
              </div>
            </div>
            {rooms.length > 0 && (
              <section
                className="relative w-full max-w-3xl rounded-lg px-6 pb-6 pt-14"
                style={{ backgroundColor: "#6E4537" }}
              >
                <DottedHoles count={7} />
                <h2 className="mb-3 font-serif text-lg font-medium" style={{ color: "#F7EAD7" }}>
                  Your rooms
                </h2>
                <ul className="space-y-1">
                  {rooms.slice(0, 5).map((id) => (
                    <li key={id}>
                      <Link
                        href={`/board/${id}`}
                        className="block rounded-lg py-2 pl-3 pr-3 -ml-3 mr-3 text-sm transition-all duration-200 hover:bg-white/20"
                        style={{ color: "#F7EAD7" }}
                      >
                        {roomNames[id] && roomNames[id] !== id ? roomNames[id] : "Unnamed room"}
                        <span className="ml-2 font-mono text-xs opacity-80">{id}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        </div>
      )}
    </FridgeLayout>
  );
}
