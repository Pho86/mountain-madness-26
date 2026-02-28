"use client";

import { useEffect } from "react";
import { AuthProvider } from "@/lib/auth-context";
import { initAnalytics } from "@/lib/firebase";

export function Providers({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    initAnalytics();
  }, []);
  return <AuthProvider>{children}</AuthProvider>;
}
