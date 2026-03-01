"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  JAR_CONFIG,
  getSectionAndRoomFromPathname,
  getJarHref,
  type JarSlug,
} from "@/lib/fridge-jars";

export const LAST_ROOM_STORAGE_KEY = "reizoko-last-room-id";

function JarContent({
  label,
  bodyColor,
  labelBg,
  labelBorder,
  labelText,
  slug,
  showLabel = true,
}: {
  label: string;
  bodyColor: string;
  labelBg: string;
  labelBorder: string;
  labelText: string;
  slug: JarSlug;
  /** When false, hide the label badge (e.g. on homepage). */
  showLabel?: boolean;
}) {
  return (
    <>
      <div
        className="relative h-10 w-full mt-3 rounded-b rounded-t-sm pt-2"
        style={{ backgroundColor: bodyColor }}
      >
        {showLabel && (
          <span
            className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded border px-1.5 py-0.5 text-[10px] font-semibold uppercase"
            style={{
              backgroundColor: labelBg,
              borderColor: labelBorder,
              color: labelText,
              textShadow: "0 0 1px rgba(0,0,0,0.2)",
            }}
          >
            {label}
          </span>
        )}
      </div>
      <img
        src={`/jars/${slug}-jar-lid.svg`}
        alt=""
        className="absolute left-0 top-0 z-10 h-6 w-full object-contain object-center"
        aria-hidden
      />
    </>
  );
}

export function FridgeLayout({
  children,
  showJars = true,
}: {
  children: React.ReactNode;
  /** When false, no jar shelf (e.g. login). */
  showJars?: boolean;
}) {
  const pathname = usePathname();
  const { section, roomId } = getSectionAndRoomFromPathname(pathname ?? "");
  const { user, signOut } = useAuth();
  /** On landing (/) only; when logged in jars are still not clickable on /, when logged out other tabs (jars) not accessible */
  const jarsClickable = pathname !== "/";
  const showJarLabels = pathname !== "/";

  const [storedRoomId, setStoredRoomId] = useState<string | null>(null);

  // Persist room id when we have one; use as fallback when pathname has no id so Notes jar links back to board
  useEffect(() => {
    if (roomId) {
      if (typeof window !== "undefined") window.sessionStorage.setItem(LAST_ROOM_STORAGE_KEY, roomId);
      setStoredRoomId(roomId);
    } else if (typeof window !== "undefined") {
      setStoredRoomId(window.sessionStorage.getItem(LAST_ROOM_STORAGE_KEY));
    }
  }, [roomId]);

  const effectiveRoomId = roomId ?? storedRoomId;

  return (
    <div className="relative flex min-h-screen flex-col bg-fridge-outer animate-fade-in">
      {showJars && (
        <div
          className="flex shrink-0 flex-wrap items-end gap-4 bg-fridge-cream jars-shelf"
          style={{ minHeight: "64px" }}
          aria-label="Top of fridge"
        >
          <img
            src="/fridge/Knob.png"
            alt=""
            className="h-8 w-auto object-contain"
            aria-hidden
          />
          {JAR_CONFIG.map(({ slug, label, bodyColor, labelBg, labelBorder, labelText }) => {
            const isActive = section === slug;
            const href = getJarHref(slug, effectiveRoomId);
            const baseClassName =
              "relative flex w-20 shrink-0 flex-col items-center transition-transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fridge-cream focus:ring-offset-fridge-outer";
            const activeClassName = isActive ? " ring-2 ring-amber-600 ring-offset-2 ring-offset-fridge-cream scale-105" : "";
            const interactiveClassName = jarsClickable ? " hover:[animation:wiggle_0.4s_ease-in-out_infinite] hover:scale-100" : " cursor-default";
            const jarClassName = baseClassName + activeClassName + interactiveClassName;

            const content = (
              <JarContent
                slug={slug}
                label={label}
                bodyColor={bodyColor}
                labelBg={labelBg}
                labelBorder={labelBorder}
                labelText={labelText}
                showLabel={showJarLabels}
              />
            );

            if (jarsClickable) {
              return (
                <Link
                  key={slug}
                  href={href}
                  className={jarClassName}
                  aria-label={label}
                  aria-current={isActive ? "page" : undefined}
                >
                  {content}
                </Link>
              );
            }
            return (
              <span key={slug} className={jarClassName} aria-label={label}>
                {content}
              </span>
            );
          })}
          <div className="ml-auto flex items-end gap-2">
            {user ? (
              <button
                type="button"
                onClick={() => signOut?.()}
                className="relative flex h-14 min-w-40 items-center justify-center overflow-hidden bg-transparent transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-700 focus:ring-offset-2 focus:ring-offset-fridge-cream"
                style={{
                  backgroundImage: "url(/jars/signout-pot.svg)",
                  backgroundSize: "100% 100%",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "center",
                }}
                aria-label="Sign out"
              >
                <span className="relative z-10 text-sm font-semibold uppercase tracking-wide text-white">
                  Sign out
                </span>
              </button>
            ) : (
              <Link
                href="/"
                className="relative flex h-14 min-w-40 items-center justify-center overflow-hidden bg-transparent transition-transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-amber-700 focus:ring-offset-2 focus:ring-offset-fridge-cream"
                style={{
                  backgroundImage: "url(/jars/signout-pot.svg)",
                  backgroundSize: "100% 100%",
                  backgroundRepeat: "no-repeat",
                  backgroundPosition: "center",
                }}
                aria-label="Sign in"
              >
                <span className="relative z-10 text-sm font-semibold uppercase tracking-wide text-white">
                  Sign in
                </span>
              </Link>
            )}
          </div>
        </div>
      )}

      {showJars && (
        <div className="pointer-events-none absolute right-90 top-0 z-10 w-48 -translate-y-2">
          <img
            src="/fridge/plant.png"
            alt=""
            aria-hidden
            className="w-full object-contain object-top"
          />
        </div>
      )}

      <main
        className="flex flex-1 flex-col overflow-hidden bg-fridge-canvas"
        style={{ minHeight: showJars ? "calc(100vh - 64px)" : "100vh" }}
      >
        <div className="fridge-canvas-max flex min-h-0 flex-1 flex-col overflow-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}
