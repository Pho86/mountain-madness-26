/**
 * Shared config and helpers for the fridge jar nav.
 * Jars stay in sync with the current route: section + roomId are derived from pathname.
 */

export type JarSlug = "notes" | "calendar" | "chores" | "budget" | "profile";

export const JAR_SLUGS: JarSlug[] = [
  "notes",
  "calendar",
  "chores",
  "budget",
  "profile",
];

export const JAR_CONFIG: ReadonlyArray<{
  slug: JarSlug;
  label: string;
  bodyColor: string;
  labelBg: string;
  labelBorder: string;
  labelText: string;
}> = [
  {
    slug: "notes",
    label: "NOTES",
    bodyColor: "#D43E3E",
    labelBg: "#9B5573",
    labelBorder: "#7A4463",
    labelText: "#E9D7C5",
  },
  {
    slug: "calendar",
    label: "CALENDAR",
    bodyColor: "#E7A24B",
    labelBg: "#E9D7C5",
    labelBorder: "#7088B4",
    labelText: "#4D6A9E",
  },
  {
    slug: "chores",
    label: "CHORES",
    bodyColor: "#707EA7",
    labelBg: "#D43E3E",
    labelBorder: "#A63030",
    labelText: "#E9D7C5",
  },
  {
    slug: "budget",
    label: "BUDGET",
    bodyColor: "#C8A2D3",
    labelBg: "#9B5573",
    labelBorder: "#7A4463",
    labelText: "#E9D7C5",
  },
  {
    slug: "profile",
    label: "PROFILE",
    bodyColor: "#E7A24B",
    labelBg: "#4D6A9E",
    labelBorder: "#7088B4",
    labelText: "#E9D7C5",
  },
];

export type FridgeSection = JarSlug | null;

/**
 * Derives current section and room id from pathname.
 * Use this so the jar nav can show active state and build correct links.
 */
export function getSectionAndRoomFromPathname(pathname: string): {
  section: FridgeSection;
  roomId: string | null;
} {
  if (!pathname || pathname === "/") {
    return { section: null, roomId: null };
  }
  const segments = pathname.split("/").filter(Boolean);
  const first = segments[0];
  const second = segments[1];

  switch (first) {
    case "board":
      return { section: "notes", roomId: second ?? null };
    case "calendar":
      return { section: "calendar", roomId: second ?? null };
    case "chores":
      return { section: "chores", roomId: second ?? null };
    case "budget":
      return { section: "budget", roomId: second ?? null };
    case "profile":
      return { section: "profile", roomId: null };
    default:
      return { section: null, roomId: null };
  }
}

/**
 * Returns the href for a jar. When we're in a room, all section jars link to that room.
 */
export function getJarHref(slug: JarSlug, roomId: string | null): string {
  switch (slug) {
    case "notes":
      return roomId ? `/board/${roomId}` : "/";
    case "calendar":
      return roomId ? `/calendar/${roomId}` : "/calendar";
    case "chores":
      return roomId ? `/chores/${roomId}` : "/chores";
    case "budget":
      return roomId ? `/budget/${roomId}` : "/budget";
    case "profile":
      return "/profile";
    default:
      return "/";
  }
}
