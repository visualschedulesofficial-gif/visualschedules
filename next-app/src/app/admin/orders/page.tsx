"use client";

// Orders & Access — replaces the placeholder that never fetched anything.
//
// Two jobs:
//  1. Show every subscription, so you can see whether a payment was actually
//     recorded and which account it landed on.
//  2. Grant access by email, to credit a payment that didn't record properly
//     or to comp a therapist.

import { useState, useEffect, useCallback } from "react";

type Sub = {
  id: string;
  user_id: string;
  type: string;
  status: string;
  created_at: string;
  expires_at: string | null;
  email: string | null;
};

type User = { id: string; email: string | null; role: string; created_at: string };

function fmt(dateStr: string | null) {
  if (!dateStr) return "—";
  const iso = /Z|[+-]\d{2}:?\d{2}$/.test(dateStr) ? dateStr : dateStr.replace(" ", "T") + "Z";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? dateStr : d.toLocaleString();
}

export default function AdminOrdersPage() {
  const [subs, setSubs] = useState<Sub[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [email, setEmail] = useState("");
  const [months, setMonths] = useState(12);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/subscriptions", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Could not load");
      setSubs(data.subscriptions || []);
      setUsers(data.users || []);
    } catch (e: any) {
      setError(e?.message || "Could not load");
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const grant = async () => {
    if (!email.trim()) return;
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/admin/subscriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), months }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setMsg({ ok: true, text: `Access granted to ${data.email} for ${data.months} months.` });
        setEmail("");
        load();
      } else {
        setMsg({ ok: false, text: data?.error || "Could not grant access." });
      }
    } catch {
      setMsg({ ok: false, text: "Something went wrong." });
    }
    setBusy(false);
  };

  const revoke = async (id: string) => {
    if (!confirm("Revoke this access?")) return;
    await fetch(`/api/admin/subscriptions?id=${encodeURIComponent(id)}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="max-w-[900px]">
      <h1 className="font-serif text-[22px] text-ink mb-1">Orders &amp; Access</h1>
      <p className="text-[12px] text-ink-3 mb-5 max-w-[620px]">
        Every subscription on the account. If a payment went through but the person still
        sees locked cards, check whether a row exists here — and whether it shows their
        email. A blank email means the payment was recorded against a different sign-in.
      </p>

      {/* Grant access */}
      <div className="bg-surface border border-border p-4 mb-6">
        <h2 className="text-[13px] font-medium text-ink mb-1">Grant access</h2>
        <p className="text-[12px] text-ink-2 mb-3">
          Unlocks all paid cards for this email. They must have signed in at least once.
        </p>
        <div className="flex gap-2 flex-wrap items-center">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="their@email.com"
            className="flex-1 min-w-[220px] px-3 py-2 border border-input-border bg-surface-hover font-sans text-[13px] text-ink outline-none focus:border-accent"
          />
          <select
            value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
            className="px-3 py-2 border border-input-border bg-white font-sans text-[13px] text-ink outline-none"
          >
            <option value={3}>3 months</option>
            <option value={6}>6 months</option>
            <option value={12}>12 months</option>
            <option value={120}>10 years (comp)</option>
          </select>
          <button
            onClick={grant}
            disabled={busy || !email.trim()}
            className="text-[11px] tracking-wider uppercase px-4 py-2 bg-accent text-white border border-accent font-medium font-sans hover:bg-accent-hover transition-all disabled:opacity-50"
          >
            {busy ? "…" : "Grant"}
          </button>
        </div>
        {msg && (
          <p className={`mt-2 text-[12px] ${msg.ok ? "text-ink-2" : "text-[#C53030]"}`}>{msg.text}</p>
        )}
      </div>

      {/* Subscriptions */}
      <h2 className="text-[13px] font-medium text-ink mb-2">Subscriptions ({subs.length})</h2>
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="w-6 h-6 border-2 border-border border-t-accent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <p className="text-[13px] text-[#C53030]">{error}</p>
      ) : subs.length === 0 ? (
        <div className="bg-surface border border-border p-6 text-center">
          <p className="text-[13px] text-ink-2">
            No subscriptions recorded yet — so no payment has ever been saved.
          </p>
        </div>
      ) : (
        <div className="bg-surface border border-border mb-8">
          {subs.map((s, i) => (
            <div key={s.id} className={`flex items-center gap-4 px-4 py-3 ${i > 0 ? "border-t border-border" : ""}`}>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] text-ink font-medium truncate">
                  {s.email || <span className="text-[#C53030]">no matching account</span>}
                </div>
                <div className="text-[11px] text-ink-3 mt-0.5 truncate">
                  {s.type} · {s.status} · started {fmt(s.created_at)} · expires {fmt(s.expires_at)}
                </div>
                <div className="text-[10px] text-ink-3 mt-0.5 truncate">user id: {s.user_id}</div>
              </div>
              {s.status === "active" && (
                <button
                  onClick={() => revoke(s.id)}
                  className="text-[11px] tracking-wider uppercase px-3 py-2 text-ink-3 font-medium hover:text-[#C53030] transition-all shrink-0"
                >
                  Revoke
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Accounts */}
      <h2 className="text-[13px] font-medium text-ink mb-2">Accounts ({users.length})</h2>
      <div className="bg-surface border border-border">
        {users.map((u, i) => (
          <div key={u.id} className={`flex items-center gap-4 px-4 py-2.5 ${i > 0 ? "border-t border-border" : ""}`}>
            <div className="flex-1 min-w-0">
              <div className="text-[13px] text-ink truncate">{u.email || "(no email)"}</div>
              <div className="text-[10px] text-ink-3 truncate">{u.id}</div>
            </div>
            <span className="text-[11px] text-ink-3 shrink-0">{u.role}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
