"use client";

import { useState, useEffect } from "react";

type Order = {
  id: string;
  email: string;
  type: string;         // "3mo" | "6mo" | "12mo" | "comp" | ...
  status: string;
  expires_at: string | null;
  created_at: string;
};

function isActive(o: Order) {
  return o.status === "active" && (!o.expires_at || o.expires_at > new Date().toISOString());
}

const PLAN_LABEL: Record<string, string> = {
  "3mo": "3 Months", "6mo": "6 Months", "12mo": "12 Months", comp: "Free access (comp)",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "inactive">("all");

  useEffect(() => {
    fetch("/api/admin/orders")
      .then((r) => (r.ok ? r.json() : Promise.reject()))
      .then((d) => setOrders(d.orders || []))
      .catch(() => setError("Couldn't load orders — try refreshing."))
      .finally(() => setLoading(false));
  }, []);

  const filtered = orders.filter((o) => {
    if (search.trim() && !o.email.toLowerCase().includes(search.trim().toLowerCase())) return false;
    const active = isActive(o);
    if (statusFilter === "active" && !active) return false;
    if (statusFilter === "inactive" && active) return false;
    return true;
  });

  const exportCsv = () => {
    const rows = [
      ["Email", "Plan", "Status", "Expires", "Created"],
      ...filtered.map((o) => [o.email, PLAN_LABEL[o.type] || o.type, isActive(o) ? "Active" : "Inactive", o.expires_at || "", o.created_at]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "orders.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="h-[52px] bg-card border-b border-border flex items-center justify-between px-6 shrink-0">
        <span className="text-sm text-ink">Orders &amp; Access</span>
        <button
          onClick={exportCsv}
          className="text-[12px] tracking-wider uppercase px-3 py-1.5 border border-border text-ink-2 font-sans font-medium hover:border-ink hover:text-ink flex items-center gap-1.5"
        >
          <svg className="w-[11px] h-[11px] stroke-current stroke-2 fill-none" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
          Export CSV
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        {loading && <p className="text-[13px] text-ink-3">Loading…</p>}
        {error && <p className="text-[13px] text-[#B05555] mb-3">{error}</p>}

        {!loading && !error && (
          <>
            <div className="flex gap-3 mb-4">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by email…"
                className="flex-1 py-1.5 px-2.5 border border-border bg-white font-sans text-xs text-ink outline-none focus:border-accent"
              />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="py-1.5 px-2.5 border border-border bg-white font-sans text-xs text-ink-2 outline-none"
              >
                <option value="all">All statuses</option>
                <option value="active">Active only</option>
                <option value="inactive">Inactive / expired</option>
              </select>
            </div>

            <div className="bg-card border border-border overflow-hidden">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="border-b border-border bg-surface-hover text-[12px] tracking-wider uppercase text-ink-3">
                    <th className="text-left px-4 py-2 font-medium">Email</th>
                    <th className="text-left px-4 py-2 font-medium">Plan</th>
                    <th className="text-left px-4 py-2 font-medium">Expires</th>
                    <th className="text-left px-4 py-2 font-medium">Created</th>
                    <th className="text-left px-4 py-2 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((o) => (
                    <tr key={o.id} className="border-b border-border last:border-b-0 hover:bg-surface-hover">
                      <td className="px-4 py-2.5 text-ink font-medium">{o.email}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-[12px] px-1.5 py-0.5 font-medium tracking-wider ${o.type === "comp" ? "bg-badge-free-bg text-badge-free-text" : "bg-badge-paid-bg text-badge-paid-text"}`}>
                          {PLAN_LABEL[o.type] || o.type}
                        </span>
                      </td>
                      <td className="px-4 py-2.5 text-ink-3">{o.expires_at ? o.expires_at.slice(0, 10) : "—"}</td>
                      <td className="px-4 py-2.5 text-ink-3">{o.created_at.slice(0, 10)}</td>
                      <td className="px-4 py-2.5">
                        <span className={`text-[12px] px-1.5 py-0.5 font-medium tracking-wider ${isActive(o) ? "bg-badge-free-bg text-badge-free-text" : "bg-[#F0F0F0] text-ink-3"}`}>
                          {isActive(o) ? "Active" : "Inactive"}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-6 text-center text-ink-3 text-[13px]">
                        {orders.length === 0 ? "No orders yet." : "Nothing matches these filters."}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </>
  );
}
