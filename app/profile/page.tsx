"use client";

import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useUserProfile } from "@/lib/use-user-profile";
import { AVATAR_IDS, getAvatarUrl } from "@/lib/avatars";
import { FridgeLayout } from "@/components/FridgeLayout";

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
      <FridgeLayout showJars>
        <div className="flex min-h-full items-center justify-center">
          <p className="text-zinc-500">Loading…</p>
        </div>
      </FridgeLayout>
    );
  }

  return (
    <FridgeLayout showJars>
      <div className="flex min-h-full flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
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
            <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full shadow-[0_0_0_0.5px_rgb(228_228_231)]">
              <img
                src={getAvatarUrl(iconId)}
                alt="Your avatar"
                className={`h-16 w-16 rounded-full object-cover ${iconId === "Emily" || iconId === "Philip" ? "object-[50%_12%]" : "object-[50%_25%]"}`}
              />
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 sm:max-w-[200px] sm:mx-auto">
          {AVATAR_IDS.map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => handleSelect(id)}
              className={`relative flex h-24 w-24 items-center justify-center overflow-hidden rounded-full shadow-[0_0_0_0.5px_rgb(228_228_231)] transition hover:scale-105 focus:outline-none focus:ring-[0.5px] focus:ring-zinc-400 focus:ring-offset-2 ${
                iconId === id
                  ? "shadow-[0_0_0_0.5px_rgb(39_39_42)]"
                  : "hover:shadow-[0_0_0_0.5px_rgb(212_212_216)]"
              }`}
              title={id}
            >
              <img
                src={getAvatarUrl(id)}
                alt=""
                className={`h-20 w-20 rounded-full object-cover ${id === "Emily" || id === "Philip" ? "object-[50%_12%]" : "object-[50%_25%]"}`}
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
    </FridgeLayout>
  );
}
