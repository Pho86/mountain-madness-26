"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { useUserProfile } from "@/lib/use-user-profile";

export function RedirectIfNoAvatar() {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const { iconId, loading: profileLoading } = useUserProfile(user?.uid ?? null);

  useEffect(() => {
    if (!user || profileLoading) return;
    if (iconId != null) return;
    if (pathname === "/profile" || pathname === "/login") return;
    router.replace("/profile");
  }, [user, profileLoading, iconId, pathname, router]);

  return null;
}
