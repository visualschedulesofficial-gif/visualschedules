"use client";

import { useState, useEffect, useCallback } from "react";

type UserRow = {
  id: string;
  email: string;
  name: string | null;
  role: string;
  created_at: string;
  sub_id: string | null;
  sub_type: string | null;
  sub_status: string | null;
  sub_expires: string | null;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [email, setEmail] = useState("");
  const [months, setMonths] = useState(6);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(() => {
    fetch("/api/admin/users")
      .then((r) => (r.ok ? r.json() : { users: [] }))
      .then((d) => setUsers(d.users || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const grant = async () => {
    if (!email.trim()) return;
    setBusy(true);
    setMessage("");
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), months }),
      });
      const d = await res.json();
      if (res.ok) {
        setMessage(`Free access granted to ${email.trim()} for ${months} month${months > 1 ? "s" : ""}.`);
        setEmail("");
        load();
      } else {
        setMessage(d.error || "Something went wrong.");
      }
    } catch {
      setMessage("Something went wrong.");
    }
    setBusy(false);
  };

  const revoke = async (subscriptionId: string, userEmail: string) => {
    if (!confirm(`Remove free access for ${userEmail}?`)) return;
    await fetch("/api/admin/users", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ subscriptionId }),
    });
    load();
  };

  const accessBadge = (u: UserRow) => {
    if (!u.sub_id) return <span className="text-ink-3">—</span>;
    const until = u.sub_expires ? u.sub_expires.slice(0, 10) : "no expiry";
    if (u.sub_type === "comp") {
      return (
        <span className="text-[10px] px-1.5 py-0.5 font-medium tracking-wider w-fit bg-badge-free-bg text-badge-free-text">
          FREE ACCESS · until {until}
        </span>
      );
    }
    return (
      <span className="text-[10px] px-1.5 py-0.5 font-medium tracking-wider w-fit bg-badge-paid-bg text-badge-paid-text">
        PAID · {u.sub_type} · until {until}
      </span>
    );
  };

  return (
    <>
      <div className="h-[52px] bg-card border-b border-border flex items-center justify-between px-6 shrink-0">
        <span className="text-sm text-ink">Users & Access</span>
        <span className="text-[11px] text-ink-3">{users.length} total</span>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {/* Grant free access */}
        <div className="bg-card border border-border p-4">
          <h2 className="text-[13px] font-semibold text-ink mb-1">Grant free access</h2>
          <p className="text-[11px] text-ink-3 mb-3">
            For therapists, educators and partners. They log in with this email (OTP) and
            get full access — paid cards and branding-free exports — until it expires.
            If they have not signed up yet, the access will be waiting for them.
          </p>
          <div className="flex flex-wrap gap-2 items-center">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="therapist@example.com"
              className="flex-1 min-w-[220px] px-3 py-2 border border-border bg-white text-[13px] text-ink"
            />
            <select
              value={months}
              onChange={(e) => setMonths(Number(e.target.value))}
              className="px-3 py-2 border border-border bg-white text-[13px] text-ink"
            >
              <option value={1}>1 month</option>
              <option value={3}>3 months</option>
              <option value={6}>6 months</option>
              <option value={12}>12 months</option>
            </select>
            <button
              onClick={grant}
              disabled={busy || !email.trim()}
              className="px-4 py-2 bg-[#4A5A3E] text-white text-[13px] font-medium disabled:opacity-50"
            >
              {busy ? "Granting…" : "Grant access"}
            </button>
          </div>
          {message && <p className="text-[12px] text-ink-2 mt-2">{message}</p>}
        </div>

        {/* Users table */}
        <div className="bg-card border border-border overflow-hidden">
          <div className="grid grid-cols-[1fr_70px_1fr_90px_80px] gap-2 px-4 py-2 border-b border-border text-[10px] tracking-wider uppercase text-ink-3 font-medium">
            <span>Email</span>
            <span>Role</span>
            <span>Access</span>
            <span>Joined</span>
            <span></span>
          </div>
          <div className="max-h-[60vh] overflow-y-auto">
            {loading && (
              <div className="px-4 py-6 text-[12px] text-ink-3">Loading…</div>
            )}
            {!loading && users.length === 0 && (
              <div className="px-4 py-6 text-[12px] text-ink-3">No users yet.</div>
            )}
            {users.map((user) => (
              <div
                key={user.id}
                className="grid grid-cols-[1fr_70px_1fr_90px_80px] gap-2 px-4 py-3 border-b border-border last:border-b-0 items-center text-[13px]"
              >
                <div>
                  <div className="text-ink break-all">{user.email}</div>
                  {user.name && <div className="text-[11px] text-ink-3">{user.name}</div>}
                </div>
                <span
                  className={`text-[10px] px-1.5 py-0.5 font-medium tracking-wider w-fit ${
                    user.role === "admin"
                      ? "bg-badge-paid-bg text-badge-paid-text"
                      : "bg-badge-free-bg text-badge-free-text"
                  }`}
                >
                  {user.role.toUpperCase()}
                </span>
                <div>{accessBadge(user)}</div>
                <span className="text-ink-3 text-[12px]">
                  {(user.created_at || "").slice(0, 10)}
                </span>
                <div>
                  {user.sub_type === "comp" && user.sub_id && (
                    <button
                      onClick={() => revoke(user.sub_id!, user.email)}
                      className="text-[11px] px-2 py-1 border border-border text-ink-3 hover:bg-surface-hover"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
