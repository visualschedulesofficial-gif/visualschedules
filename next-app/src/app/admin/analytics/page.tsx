"use client";

export default function AdminAnalyticsPage() {
  return (
    <>
      <div className="h-[52px] bg-card border-b border-border flex items-center px-6 shrink-0">
        <span className="text-sm text-ink">Analytics</span>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-4 gap-4 mb-6">
          {[
            { label: "Page Views", value: "0" },
            { label: "Exports", value: "0" },
            { label: "Signups", value: "1" },
            { label: "Unlocks", value: "0" },
          ].map((stat) => (
            <div key={stat.label} className="bg-card border border-border p-4 text-center">
              <p className="font-serif text-2xl italic text-ink">{stat.value}</p>
              <p className="text-[10px] tracking-wider uppercase text-ink-3 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>

        <div className="bg-card border border-border p-4">
          <h3 className="text-[11px] tracking-widest uppercase text-ink-3 mb-3 font-medium">Activity Log</h3>
          <p className="text-[13px] text-ink-3">Analytics will populate as users create schedules, export, and purchase unlocks.</p>
        </div>
      </div>
    </>
  );
}
