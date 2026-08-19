"use client";

// Leads — enquiries from schools and therapy centres submitted on /plans.

import { useState, useEffect, useCallback } from "react";

type Lead = {
  id: string;
  name: string;
  org: string;
  kind: string;
  email: string;
  phone: string;
  city: string | null;
  seats: string | null;
  message: string | null;
  status: string;
  created_at: string;
};

function fmt(dateStr: string) {
  const iso = /Z|[+-]\d{2}:?\d{2}$/.test(dateStr) ? dateStr : dateStr.replace(" ", "T") + "Z";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? dateStr : d.toLocaleString();
}

export default function AdminLeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/leads", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || "Could not load");
      setLeads(data.leads || []);
    } catch (e: any) {
      setError(e?.message || "Could not load");
    }
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  return (
    <div className="max-w-[900px]">
      <h1 className="font-serif text-[22px] text-ink mb-1">Leads</h1>
      <p className="text-[12px] text-ink-3 mb-5">
        Schools and therapy centres who asked about pricing on the Plans page.
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-6 h-6 border-2 border-border border-t-accent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <p className="text-[13px] text-[#C53030]">{error}</p>
      ) : leads.length === 0 ? (
        <div className="bg-surface border border-border p-8 text-center">
          <p className="text-[13px] text-ink-2">No enquiries yet.</p>
        </div>
      ) : (
        <div className="bg-surface border border-border">
          {leads.map((l, i) => (
            <div key={l.id} className={`px-4 py-4 ${i > 0 ? "border-t border-border" : ""}`}>
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div className="min-w-0">
                  <div className="text-[14px] text-ink font-medium">{l.org}</div>
                  <div className="text-[12px] text-ink-2 mt-0.5">
                    {l.name} · {l.kind}
                    {l.city ? ` · ${l.city}` : ""}
                    {l.seats ? ` · ${l.seats} staff` : ""}
                  </div>
                </div>
                <div className="text-[11px] text-ink-3 shrink-0">{fmt(l.created_at)}</div>
              </div>

              <div className="flex gap-4 flex-wrap mt-2">
                <a href={`mailto:${l.email}`} className="text-[12px] text-ink underline">{l.email}</a>
                <a
                  href={`https://wa.me/${l.phone.replace(/[^0-9]/g, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[12px] text-ink underline"
                >
                  {l.phone}
                </a>
              </div>

              {l.message && (
                <p className="text-[12px] text-ink-2 mt-2 leading-relaxed whitespace-pre-wrap">{l.message}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
