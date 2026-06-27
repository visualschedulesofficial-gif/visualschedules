"use client";

export default function AdminOrdersPage() {
  // TODO: Fetch from D1 subscriptions table
  const orders = [
    { email: "parent@example.com", type: "All categories", category: "All 6", amount: "₹499", date: "Today", status: "Active" },
    { email: "slp@clinic.in", type: "Single", category: "Therapy", amount: "₹199", date: "Today", status: "Active" },
    { email: "teacher@school.in", type: "All categories", category: "All 6", amount: "₹499", date: "Yesterday", status: "Active" },
  ];

  return (
    <>
      <div className="h-[52px] bg-card border-b border-border flex items-center justify-between px-6 shrink-0">
        <span className="text-sm text-ink">Unlock Orders</span>
        <button className="text-[11px] tracking-wider uppercase px-3 py-1.5 border border-border text-ink-2 font-sans font-medium hover:border-ink hover:text-ink flex items-center gap-1.5">
          <svg className="w-[11px] h-[11px] stroke-current stroke-2 fill-none" viewBox="0 0 24 24"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></svg>
          Export CSV
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="flex gap-3 mb-4">
          <input placeholder="Search orders…" className="flex-1 py-1.5 px-2.5 border border-border bg-white font-sans text-xs text-ink outline-none focus:border-accent" />
          <select className="py-1.5 px-2.5 border border-border bg-white font-sans text-xs text-ink-2 outline-none">
            <option>All types</option>
            <option>All categories</option>
            <option>Single category</option>
          </select>
        </div>

        <div className="bg-card border border-border overflow-hidden">
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-border bg-surface-hover text-[10px] tracking-wider uppercase text-ink-3">
                <th className="text-left px-4 py-2 font-medium">Email</th>
                <th className="text-left px-4 py-2 font-medium">Type</th>
                <th className="text-left px-4 py-2 font-medium">Category</th>
                <th className="text-left px-4 py-2 font-medium">Amount</th>
                <th className="text-left px-4 py-2 font-medium">Date</th>
                <th className="text-left px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((order, i) => (
                <tr key={i} className="border-b border-border last:border-b-0 hover:bg-surface-hover">
                  <td className="px-4 py-2.5 text-ink font-medium">{order.email}</td>
                  <td className="px-4 py-2.5">
                    <span className={`text-[10px] px-1.5 py-0.5 font-medium tracking-wider ${order.type === "All categories" ? "bg-badge-free-bg text-badge-free-text" : "bg-badge-paid-bg text-badge-paid-text"}`}>
                      {order.type === "All categories" ? "All cats" : "Single"}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-ink-3">{order.category}</td>
                  <td className="px-4 py-2.5 text-ink">{order.amount}</td>
                  <td className="px-4 py-2.5 text-ink-3">{order.date}</td>
                  <td className="px-4 py-2.5">
                    <span className="text-[10px] px-1.5 py-0.5 bg-badge-free-bg text-badge-free-text font-medium tracking-wider">
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
