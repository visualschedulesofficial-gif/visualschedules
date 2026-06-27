"use client";

export default function AdminUsersPage() {
  const users = [
    { id: "admin-001", email: "admin@dataorc.in", name: "Admin", role: "admin", createdAt: "2026-06-21", purchases: [] },
  ];

  return (
    <>
      <div className="h-[52px] bg-card border-b border-border flex items-center justify-between px-6 shrink-0">
        <span className="text-sm text-ink">Users & Orders</span>
        <span className="text-[11px] text-ink-3">{users.length} total</span>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="bg-card border border-border overflow-hidden">
          <div className="grid grid-cols-[1fr_80px_80px_100px] gap-2 px-4 py-2 border-b border-border text-[10px] tracking-wider uppercase text-ink-3 font-medium">
            <span>Email</span>
            <span>Role</span>
            <span>Orders</span>
            <span>Joined</span>
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {users.map((user) => (
              <div key={user.id} className="grid grid-cols-[1fr_80px_80px_100px] gap-2 px-4 py-3 border-b border-border last:border-b-0 items-center text-[13px]">
                <div>
                  <div className="text-ink">{user.email}</div>
                  {user.name && <div className="text-[11px] text-ink-3">{user.name}</div>}
                </div>
                <span className={`text-[10px] px-1.5 py-0.5 font-medium tracking-wider w-fit ${user.role === "admin" ? "bg-badge-paid-bg text-badge-paid-text" : "bg-badge-free-bg text-badge-free-text"}`}>
                  {user.role.toUpperCase()}
                </span>
                <span className="text-ink-3">{user.purchases.length || "—"}</span>
                <span className="text-ink-3 text-[12px]">{user.createdAt}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
