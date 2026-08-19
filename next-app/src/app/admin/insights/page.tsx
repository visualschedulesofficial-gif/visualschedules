"use client";

// Insights — what people actually DO, without identifying anyone.
//
// Google Analytics tells you how many arrived. This tells you how many got
// value: opened the builder, added a card, saved, and — the one that matters
// most — came back and ticked steps off.

import { useState, useEffect, useCallback } from "react";

type Total = { event: string; count: number; by_signed_in: number };
type Row = { day: string; event: string; count: number };

const LABELS: Record<string, string> = {
  builder_opened: "Opened the builder",
  card_added: "Added a card",
  schedule_saved: "Saved a schedule",
  schedule_downloaded: "Downloaded / printed",
  schedule_used: "Opened a schedule to use",
  step_checked: "Ticked a step off",
  paywall_seen: "Tapped a locked card",
  plans_viewed: "Viewed pricing",
};

// The order a person moves through. Each step should be smaller than the last;
// wherever the drop is biggest is where to focus.
const FUNNEL = [
  "builder_opened",
  "card_added",
  "schedule_saved",
  "schedule_downloaded",
  "schedule_used",
  "step_checked",
];

export default function AdminInsightsPage() {
  const [totals, setTotals] = useState<Total[]>([]);
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/activity", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Could not load");
      setTotals(data.totals || []);
      setRows(data.rows || []);
    } catch (e: any) {
      setError(e?.message || "Could not load");
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const get = (ev: string) => totals.find((t) => t.event === ev)?.count || 0;
  const top = get("builder_opened") || 1;

  const days = Array.from(new Set(rows.map((r) => r.day))).slice(0, 14);

  return (
    <div className="max-w-[900px]">
      <h1 className="font-serif text-[22px] text-ink mb-1">Insights</h1>
      <p className="text-[12px] text-ink-3 mb-5 max-w-[620px]">
        What people do in the app over the last 30 days. No names or emails are
        collected — this only counts actions, so it works for signed-out visitors too.
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-border border-t-accent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <p className="text-[13px] text-[#C53030]">{error}</p>
      ) : totals.length === 0 ? (
        <div className="bg-surface border border-border p-8 text-center">
          <p className="text-[13px] text-ink-2">
            No activity recorded yet. Numbers appear here as people use the app.
          </p>
        </div>
      ) : (
        <>
          {/* Funnel */}
          <div className="bg-surface border border-border p-5 mb-6">
            <h2 className="text-[13px] font-medium text-ink mb-1">The journey</h2>
            <p className="text-[11px] text-ink-3 mb-4">
              Each step should be smaller than the one above. The biggest drop is where to focus.
            </p>
            {FUNNEL.map((ev, i) => {
              const n = get(ev);
              const pct = Math.round((n / top) * 100);
              const prev = i === 0 ? n : get(FUNNEL[i - 1]);
              const drop = prev > 0 ? Math.round(((prev - n) / prev) * 100) : 0;
              return (
                <div key={ev} className="mb-3">
                  <div className="flex items-center justify-between text-[12px] mb-1">
                    <span className="text-ink">{LABELS[ev] || ev}</span>
                    <span className="text-ink-2">
                      {n}
                      {i > 0 && drop > 0 && (
                        <span className="text-ink-3"> · {drop}% drop</span>
                      )}
                    </span>
                  </div>
                  <div className="h-2 bg-bg-muted rounded">
                    <div
                      className="h-2 bg-accent rounded"
                      style={{ width: `${Math.max(pct, n > 0 ? 2 : 0)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>

          {/* Everything, including paywall + pricing */}
          <div className="bg-surface border border-border mb-6">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="text-[13px] font-medium text-ink">All activity (30 days)</h2>
            </div>
            {totals.map((t, i) => (
              <div key={t.event} className={`flex items-center justify-between px-4 py-2.5 ${i > 0 ? "border-t border-border" : ""}`}>
                <span className="text-[13px] text-ink">{LABELS[t.event] || t.event}</span>
                <span className="text-[12px] text-ink-2">
                  {t.count}
                  <span className="text-ink-3"> · {t.by_signed_in} signed in</span>
                </span>
              </div>
            ))}
          </div>

          {/* Daily */}
          <div className="bg-surface border border-border">
            <div className="px-4 py-3 border-b border-border">
              <h2 className="text-[13px] font-medium text-ink">Last 14 days</h2>
            </div>
            {days.map((day, i) => {
              const forDay = rows.filter((r) => r.day === day);
              return (
                <div key={day} className={`px-4 py-2.5 ${i > 0 ? "border-t border-border" : ""}`}>
                  <div className="text-[12px] text-ink font-medium mb-1">{day}</div>
                  <div className="flex flex-wrap gap-x-4 gap-y-1">
                    {forDay.map((r) => (
                      <span key={r.event} className="text-[11px] text-ink-2">
                        {LABELS[r.event] || r.event}: <strong className="text-ink">{r.count}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
