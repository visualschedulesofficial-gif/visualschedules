import { DAY_KEYS, getDailySpec } from "@/lib/constants";
import type { useScheduleState } from "@/hooks/useScheduleState";

type State = ReturnType<typeof useScheduleState.getState>;

// How many cards are on the schedule and how many it can hold, across all
// pages. Drives the builder's progress bar, step bar and "Next" hint.
export function getScheduleProgress(s: State): { placed: number; total: number } {
  let placed = 0;
  let total = 0;
  const ftN = s.ftStyle === "sequencing" ? 4 : s.ftStyle === "first-then-now" ? 3 : 2;
  const weekCols = s.weekMode === "weekdays" ? 5 : DAY_KEYS.length;

  for (const page of s.pages) {
    // A page can carry both keys (e.g. an empty `slots` on a column page),
    // so count whatever each holds.
    const pg = page as { slots?: unknown[]; columns?: Record<string, unknown[]> };
    placed += (pg.slots || []).filter(Boolean).length;
    Object.values(pg.columns || {}).forEach((col) => { placed += (col || []).filter(Boolean).length; });
    switch (s.scheduleType) {
      case "daily": total += getDailySpec(s.cardType, s.gridCols).slots; break;
      case "mini": total += s.miniCardCount; break;
      case "iwant": total += 9; break;
      case "firstthen": total += ftN === 4 ? 16 : 9; break;
      case "weekly": total += weekCols * 5; break;
      case "custom": total += s.customColNames.length * 5; break;
      case "timetable": total += 2 * 12; break;
      default: break;
    }
  }
  return { placed, total: Math.max(total, placed) };
}

export const LANDSCAPE_TYPES = ["weekly", "custom", "timetable"] as const;
export function isLandscapeType(t: string) {
  return (LANDSCAPE_TYPES as readonly string[]).includes(t);
}
