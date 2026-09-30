import { DAY_KEYS } from "@/lib/constants";

type CardRef = { cardId?: string } | null;
type Page = { slots?: CardRef[]; columns?: Record<string, CardRef[]> };

// Card ids in the order "Show to child" steps through them. Keep in step
// with flattenPages in schedule/[id]/do — its done-keys are `${cardId}-${i}`.
export function scheduleCardIds(pages: Page[] | undefined): string[] {
  const out: string[] = [];
  const colOrder = ["0", "cutout", ...DAY_KEYS, "extra"];
  const rank = (k: string) => (colOrder.indexOf(k) === -1 ? 999 : colOrder.indexOf(k));
  (pages || []).forEach((p) => {
    (p?.slots || []).forEach((s) => { if (s?.cardId) out.push(s.cardId); });
    if (p?.columns) {
      Object.keys(p.columns).sort((a, b) => rank(a) - rank(b))
        .forEach((k) => (p.columns![k] || []).forEach((c) => { if (c?.cardId) out.push(c.cardId); }));
    }
  });
  return out;
}

export function readDone(scheduleId: string): Record<string, boolean> {
  try { return JSON.parse(localStorage.getItem(`vs_done_${scheduleId}`) || "{}"); } catch { return {}; }
}
