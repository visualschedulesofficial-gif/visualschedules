"use client";

import { useState, useEffect } from "react";

type Analytics = {
  users: { totalAllTime: number | null; newLast7Days: number | null };
  subscriptions: { activeNow: number | null; createdAllTime: number | null };
  schedules: { totalAllTime: number | null; updatedLast7Days: number | null };
  orgs: { totalAllTime: number | null; activeNow: number | null; paidNow: number | null; codeRedemptionsAllTime: number | null };
  blog: { publishedPosts: number | null; totalViews: number | null };
  downloads: { totalFiles: number | null; totalViews: number | null; totalDownloads: number | null };
  signupSeries: { day: string; n: number }[];
};

function fmt(n: number | null | undefined) {
  return n === null || n === undefined ? "—" : n.toLocaleString();
}

function KpiCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="bg-card border border-border p-4">
      <p className="font-serif text-[26px] italic text-ink leading-none">{value}</p>
      <p className="text-[11px] tracking-wider uppercase text-ink-3 mt-2">{label}</p>
      {sub && <p className="text-[11px] text-ink-3 mt-0.5">{sub}</p>}
    </div>
  );
}

function SignupChart({ series }: { series: { day: string; n: number }[] }) {
  if (!series.length) {
    return <p className="text-[13px] text-ink-3">No signups recorded in the last 14 days yet.</p>;
  }
  const max = Math.max(1, ...series.map((d) => d.n));
  const w = 640;
  const h = 140;
  const barW = w / series.length - 6;
  return (
    <svg viewBox={`0 0 ${w} ${h + 24}`} className="w-full max-w-[640px]">
      {series.map((d, i) => {
        const barH = (d.n / max) * h;
        const x = i * (w / series.length);
        return (
          <g key={d.day}>
            <rect
              x={x}
              y={h - barH}
              width={barW}
              height={barH}
              fill="#7A8F5E"
              rx={2}
            />
            <text x={x + barW / 2} y={h + 14} textAnchor="middle" fontSize="9" fill="#8A8480">
              {d.day.slice(5)}
            </text>
            {d.n > 0 && (
              <text x={x + barW / 2} y={h - barH - 4} textAnchor="middle" fontSize="10" fill="#4A5A3E" fontWeight="600">
                {d.n}
              </text>
            )}
          </g>
        );
      })}
    </svg>
  );
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/analytics")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then(setData)
      .catch(() => setError("Couldn't load analytics — try refreshing."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <div className="h-[52px] bg-card border-b border-border flex items-center px-6 shrink-0">
        <span className="text-sm text-ink">Analytics</span>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        {loading && <p className="text-[13px] text-ink-3">Loading…</p>}
        {error && <p className="text-[13px] text-[#B05555]">{error}</p>}

        {data && (
          <div className="max-w-[900px] space-y-8">
            {/* People */}
            <section>
              <h2 className="text-[12px] tracking-widest uppercase text-ink-3 mb-3 font-medium">People</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KpiCard label="Accounts created (all time)" value={fmt(data.users.totalAllTime)} />
                <KpiCard label="New this week" value={fmt(data.users.newLast7Days)} />
                <KpiCard
                  label="Active paid subscriptions"
                  value={fmt(data.subscriptions.activeNow)}
                  sub={`${fmt(data.subscriptions.createdAllTime)} created all-time (incl. expired/cancelled)`}
                />
                <KpiCard label="Schedules created (all time)" value={fmt(data.schedules.totalAllTime)} sub={`${fmt(data.schedules.updatedLast7Days)} touched this week`} />
              </div>
            </section>

            {/* Signups over time */}
            <section>
              <h2 className="text-[12px] tracking-widest uppercase text-ink-3 mb-3 font-medium">Signups — last 14 days</h2>
              <div className="bg-card border border-border p-4">
                <SignupChart series={data.signupSeries} />
              </div>
            </section>

            {/* Therapy centers */}
            <section>
              <h2 className="text-[12px] tracking-widest uppercase text-ink-3 mb-3 font-medium">Therapy Centers</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KpiCard label="Total centers" value={fmt(data.orgs.totalAllTime)} />
                <KpiCard label="Active centers" value={fmt(data.orgs.activeNow)} />
                <KpiCard label="Paid (white-label) now" value={fmt(data.orgs.paidNow)} />
                <KpiCard label="Access-code uses (all time)" value={fmt(data.orgs.codeRedemptionsAllTime)} />
              </div>
            </section>

            {/* Content */}
            <section>
              <h2 className="text-[12px] tracking-widest uppercase text-ink-3 mb-3 font-medium">Blog</h2>
              <div className="grid grid-cols-2 gap-4">
                <KpiCard label="Published posts" value={fmt(data.blog.publishedPosts)} />
                <KpiCard label="Total views (all posts)" value={fmt(data.blog.totalViews)} />
              </div>
            </section>

            <section>
              <h2 className="text-[12px] tracking-widest uppercase text-ink-3 mb-3 font-medium">Downloads</h2>
              <div className="grid grid-cols-3 gap-4">
                <KpiCard label="Files listed" value={fmt(data.downloads.totalFiles)} />
                <KpiCard label="Card previews viewed" value={fmt(data.downloads.totalViews)} />
                <KpiCard label="Downloads (all time)" value={fmt(data.downloads.totalDownloads)} />
              </div>
            </section>

            <p className="text-[11px] text-ink-3 pt-2 border-t border-border">
              Every number here is a live count from the database, queried fresh on each page load — nothing is estimated or cached.
              "All time" and "currently active/valid" are always shown as separate figures so they can't be confused for one another.
            </p>
          </div>
        )}
      </div>
    </>
  );
}
