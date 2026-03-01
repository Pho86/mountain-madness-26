"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useUserProfile } from "@/lib/use-user-profile";
import { AVATAR_IDS, getAvatarUrl } from "@/lib/avatars";

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const { iconId, setIconId, loading: profileLoading } = useUserProfile(
    user?.uid ?? null
  );

  const loading = authLoading || profileLoading;
  const needsAvatar = user && !loading && iconId == null;

  const handleSelect = async (id: string) => {
    await setIconId(id);
    if (needsAvatar) router.replace("/");
  };

  if (!authLoading && !user) {
    router.replace("/login");
    return null;
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-100">
        <p className="text-zinc-500">Loading…</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-100 px-4 py-10">
      <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6">
        <h1 className="mb-2 text-center text-xl font-semibold text-zinc-900">
          {needsAvatar ? "Choose your avatar" : "Profile"}
        </h1>
        <p className="mb-6 text-center text-sm text-zinc-500">
          {needsAvatar
            ? "Pick an avatar to use across the app. You can change it anytime here."
            : "Your avatar appears in the header and on your sticky notes."}
        </p>

        {iconId && !needsAvatar && (
          <div className="mb-6 flex justify-center">
            <img
              src={getAvatarUrl(iconId)}
              alt="Your avatar"
              className="h-20 w-20 rounded-full border-2 border-zinc-200 object-cover"
            />
          </div>
        )}

        <div className="grid grid-cols-5 gap-3">
          {AVATAR_IDS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => handleSelect(id)}
              className={`relative aspect-square overflow-hidden rounded-full border-2 transition hover:scale-105 focus:outline-none focus:ring-2 focus:ring-zinc-400 focus:ring-offset-2 ${
                iconId === id
                  ? "border-zinc-800 ring-2 ring-zinc-400 ring-offset-2"
                  : "border-zinc-200 hover:border-zinc-300"
              }`}
              title={id}
            >
              <img
                src={getAvatarUrl(id)}
                alt=""
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>

        {!needsAvatar && (
          <p className="mt-4 text-center text-sm text-zinc-500">
            Click an avatar to change yours.
          </p>
        )}

        <div className="mt-8 flex flex-col gap-2">
          <Link
            href="/"
            className="rounded-lg border border-zinc-200 bg-zinc-50 py-2 text-center text-sm font-medium text-zinc-700 hover:bg-zinc-100"
          >
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
