"use client";

import { ALL_CARDS, CATEGORIES } from "@/lib/card-data";

export default function AdminDashboard() {
  const totalCards = ALL_CARDS.length;
  const freeCards = ALL_CARDS.filter((c) => CATEGORIES.find((cat) => cat.id === c.categoryId)?.isFree).length;
  const paidCards = totalCards - freeCards;

  return (
    <>
      <div className="h-[52px] bg-card border-b border-border flex items-center justify-between px-6 shrink-0">
        <span className="text-sm text-ink">Dashboard</span>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        {/* Stats */}
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-card border border-border p-4">
            <p className="text-[11px] tracking-widest uppercase text-ink-3 mb-1.5">Total Cards</p>
            <p className="font-serif text-3xl italic text-ink leading-none">{totalCards}</p>
            <p className="text-[11px] text-green mt-1">Daily: {freeCards} · Paid: {paidCards}</p>
          </div>
          <div className="bg-card border border-border p-4">
            <p className="text-[11px] tracking-widest uppercase text-ink-3 mb-1.5">Images Uploaded</p>
            <p className="font-serif text-3xl italic text-ink leading-none">0</p>
            <p className="text-[11px] text-ink-3 mt-1">{totalCards * 4} still needed</p>
          </div>
          <div className="bg-card border border-border p-4">
            <p className="text-[11px] tracking-widest uppercase text-ink-3 mb-1.5">Languages</p>
            <p className="font-serif text-3xl italic text-ink leading-none">25</p>
            <p className="text-[11px] text-green mt-1">All active</p>
          </div>
          <div className="bg-card border border-border p-4">
            <p className="text-[11px] tracking-widest uppercase text-ink-3 mb-1.5">Unlock Orders</p>
            <p className="font-serif text-3xl italic text-ink leading-none">0</p>
            <p className="text-[11px] text-ink-3 mt-1">No orders yet</p>
          </div>
        </div>

        {/* Two columns */}
        <div className="grid grid-cols-2 gap-5">
          <div className="bg-card border border-border">
            <div className="px-4 py-3 border-b border-border flex justify-between items-center">
              <h3 className="text-[13px] text-ink">Recent Activity</h3>
              <span className="text-[11px] text-ink-3">Today</span>
            </div>
            <div className="p-4 text-[13px] text-ink-3">
              <p>Activity feed will appear here as users interact with the app.</p>
            </div>
          </div>
          <div className="bg-card border border-border">
            <div className="px-4 py-3 border-b border-border">
              <h3 className="text-[13px] text-ink">Cards by Category</h3>
            </div>
            <div className="p-4 space-y-3">
              {CATEGORIES.map((cat) => {
                const count = ALL_CARDS.filter((c) => c.categoryId === cat.id).length;
                const pct = Math.round((count / totalCards) * 100);
                return (
                  <div key={cat.id}>
                    <div className="flex justify-between text-[12px] mb-1">
                      <span className="text-ink">{cat.name}</span>
                      <span className="text-ink-3">{count} cards</span>
                    </div>
                    <div className="h-[6px] bg-bg rounded-full overflow-hidden">
                      <div className="h-full bg-accent/60 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
