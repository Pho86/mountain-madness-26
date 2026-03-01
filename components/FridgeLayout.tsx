"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  JAR_CONFIG,
  getSectionAndRoomFromPathname,
  getJarHref,
  type JarSlug,
} from "@/lib/fridge-jars";

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
  const jarsClickable = pathname !== "/";
  const showJarLabels = pathname !== "/";
  const { signOut } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-fridge-outer animate-fade-in">
      {showJars && (
        <div
          className="flex shrink-0 flex-wrap items-end gap-4 bg-fridge-cream mx-12"
          style={{ minHeight: "72px" }}
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
            const href = getJarHref(slug, roomId);
            const baseClassName =
              "relative flex w-20 shrink-0 flex-col items-center transition-transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fridge-cream focus:ring-offset-fridge-outer";
            const activeClassName = isActive ? " ring-2 ring-amber-600 ring-offset-2 ring-offset-fridge-cream scale-105" : "";
            const interactiveClassName = jarsClickable ? " hover:scale-105" : " cursor-default";
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
              <span className="relative z-10 text-sm font-semibold uppercase tracking-wide text-white drop-shadow-md">
                Sign out
              </span>
            </button>
          </div>
        </div>
      )}

      <main
        className="flex-1 overflow-hidden bg-fridge-canvas"
        style={{ minHeight: showJars ? "calc(100vh - 72px)" : "100vh" }}
      >
        {children}
      </main>
    </div>
  );
}
