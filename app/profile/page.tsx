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
          <p className="text-text-on-red-muted">Loading…</p>
        </div>
      </FridgeLayout>
    );
  }

  return (
    <FridgeLayout showJars>
      <div
        className="relative flex h-full min-h-0 flex-1 flex-col items-center justify-center overflow-hidden px-4 py-10"
        style={{ minHeight: "calc(100vh - 64px)" }}
      >
        {/* Centered content */}
        <div className="flex flex-col items-center gap-10">
          <h1 className="text-center text-2xl font-semibold text-white drop-shadow-sm">
            Select your avatar.
          </h1>

          {/* Avatar row – horizontal, centered */}
          <div className="flex flex-wrap items-center justify-center gap-6">
            {AVATAR_IDS.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => handleSelect(id)}
                className={`profile-avatar-option p-2.5 relative cursor-pointer overflow-hidden rounded-full border-2 transition focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent ${
                  iconId === id
                    ? "border-amber-400 ring-2 ring-amber-300 ring-offset-2 ring-offset-fridge-cream"
                    : "border-white/30 hover:border-white/60"
                }`}
                style={{
                  width: "clamp(80px, 18vw, 120px)",
                  height: "clamp(80px, 18vw, 120px)",
                }}
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
          
        </div>
      </div>
    </FridgeLayout>
  );
}
