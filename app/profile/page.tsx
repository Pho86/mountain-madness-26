"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { useUserProfile } from "@/lib/use-user-profile";
import { AVATAR_IDS, getAvatarUrl } from "@/lib/avatars";
import { useRoom } from "@/hooks/use-room";
import { FridgeLayout, LAST_ROOM_STORAGE_KEY } from "@/components/FridgeLayout";

export default function ProfilePage() {
  const router = useRouter();
  const { user, signOut, loading: authLoading } = useAuth();
  const { iconId, setIconId, loading: profileLoading } = useUserProfile(
    user?.uid ?? null
  );
  const [lastRoomId, setLastRoomId] = useState<string | null>(null);
  const { name: roomName } = useRoom(lastRoomId);

  useEffect(() => {
    if (typeof window === "undefined") return;
    setLastRoomId(window.sessionStorage.getItem(LAST_ROOM_STORAGE_KEY));
  }, []);

  const loading = authLoading || profileLoading;
  const needsAvatar = user && !loading && iconId == null;
  const fridgeLabel = roomName?.trim() ? roomName : "Your Fridge";

  const handleSelect = async (id: string) => {
    await setIconId(id);
    if (needsAvatar) router.replace("/");
  };

  if (!authLoading && !user) {
    router.replace("/");
    return null;
  }

  if (loading) {
    return (
      <FridgeLayout showJars>
        <div className="flex min-h-full items-center justify-center">
          <p style={{ color: "#F7EAD7" }}>Loading…</p>
        </div>
      </FridgeLayout>
    );
  }

  const selectedId = iconId ?? AVATAR_IDS[0];

  return (
    <FridgeLayout showJars>
      <div
        className="relative flex min-h-0 flex-1 flex-col overflow-auto"
        style={{ minHeight: "calc(100vh - 64px)" }}
      >
        {/* Main content: description + avatar selection */}
        <div className="flex flex-1 flex-col items-center justify-center px-6 pb-12 pt-8">
          <div className="flex max-w-xl flex-col items-center gap-8">
            <p
              className="text-center text-base leading-relaxed"
              style={{ color: "#F7EAD7" }}
            >
              Your avatar appears in the header and on your sticky notes.
            </p>
            <p
              className="-mt-6 text-center text-base leading-relaxed"
              style={{ color: "#F7EAD7" }}
            >
              Select an avatar to change yours.
            </p>

            {/* Selected avatar (larger, above the row) */}
            <div
              className="profile-avatar-option flex shrink-0 p-2 overflow-hidden rounded-full border-2 transition"
              style={{
                width: "clamp(100px, 22vw, 140px)",
                height: "clamp(100px, 22vw, 140px)",
                backgroundColor: "#8FC4D4",
                borderColor: "#8FC4D4",
              }}
            >
              <img
                src={getAvatarUrl(selectedId)}
                alt=""
                className="h-full w-full"
              />
            </div>

            {/* Row of avatar options */}
            <div className="flex flex-wrap items-center justify-center gap-6">
              {AVATAR_IDS.map((id) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => handleSelect(id)}
                  className={`profile-avatar-option p-2 relative cursor-pointer overflow-hidden rounded-full border-2 transition focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-transparent ${
                    iconId === id
                      ? "ring-2 ring-offset-2"
                      : "border-white/30 hover:border-white/60"
                  }`}
                  style={{
                    width: "clamp(72px, 16vw, 96px)",
                    height: "clamp(72px, 16vw, 96px)",
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
      </div>
    </FridgeLayout>
  );
}
