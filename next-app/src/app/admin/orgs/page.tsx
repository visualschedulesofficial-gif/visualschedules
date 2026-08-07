"use client";

// Therapy Centers — white-label branding management.
// Create a center (name + logo), get its shareable access code, and link
// member emails. Anything created under a linked login or an active code
// session carries the center's branding on every exported schedule.
import { useState, useEffect, useCallback } from "react";

type Org = {
  id: string; name: string; logo_url: string | null; access_code: string | null; active: number;
  plan: "free" | "paid"; plan_expires_at: string | null;
};
type Member = { email: string; org_id: string };
type Usage = { org_id: string; total_uses: number; unique_devices: number; last_used: string };

async function uploadFile(file: File): Promise<string | null> {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/admin/uploads", { method: "POST", body: fd });
  if (!res.ok) return null;
  const data = await res.json();
  return data.url || null;
}

export default function AdminOrgsPage() {
  const [orgs, setOrgs] = useState<Org[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [usage, setUsage] = useState<Usage[]>([]);
  const [busy, setBusy] = useState(false);
  const [newName, setNewName] = useState("");
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [memberEmail, setMemberEmail] = useState<Record<string, string>>({});

  const load = useCallback(async () => {
    const res = await fetch("/api/admin/orgs");
    if (!res.ok) return;
    const data = await res.json();
    setOrgs(data.orgs || []);
    setMembers(data.members || []);
    setUsage(data.usage || []);
  }, []);

  useEffect(() => { load(); }, [load]);

  const createOrg = async () => {
    if (!newName.trim()) return;
    setBusy(true);
    const logoUrl = logoFile ? await uploadFile(logoFile) : null;
    await fetch("/api/admin/orgs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "org", name: newName.trim(), logoUrl }),
    });
    setBusy(false);
    setNewName(""); setLogoFile(null);
    load();
  };

  const addMember = async (orgId: string) => {
    const email = (memberEmail[orgId] || "").trim();
    if (!email) return;
    await fetch("/api/admin/orgs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "member", orgId, email }),
    });
    setMemberEmail((m) => ({ ...m, [orgId]: "" }));
    load();
  };

  const removeMember = async (email: string) => {
    await fetch(`/api/admin/orgs?email=${encodeURIComponent(email)}`, { method: "DELETE" });
    load();
  };

  const regenCode = async (orgId: string) => {
    await fetch("/api/admin/orgs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "regenerate-code", orgId }),
    });
    load();
  };

  const [payUntil, setPayUntil] = useState<Record<string, string>>({});

  const markPaid = async (org: Org) => {
    const expiresAt = payUntil[org.id];
    if (!expiresAt) { alert("Pick the date their paid plan runs until first."); return; }
    await fetch("/api/admin/orgs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "mark-paid", orgId: org.id, expiresAt: new Date(expiresAt).toISOString() }),
    });
    load();
  };

  const markFree = async (org: Org) => {
    if (!confirm(`Move "${org.name}" back to the free plan? Their footer will show Visual Schedules branding + QR again.`)) return;
    await fetch("/api/admin/orgs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind: "mark-free", orgId: org.id }),
    });
    load();
  };

  const changeLogo = async (org: Org, file: File) => {
    setBusy(true);
    const logoUrl = await uploadFile(file);
    setBusy(false);
    if (!logoUrl) { alert("Logo upload failed"); return; }
    await fetch("/api/admin/orgs", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: org.id, name: org.name, logoUrl, active: !!org.active }),
    });
    load();
  };

  const toggleActive = async (org: Org) => {
    await fetch("/api/admin/orgs", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: org.id, name: org.name, logoUrl: org.logo_url, active: !org.active }),
    });
    load();
  };

  const deleteOrg = async (org: Org) => {
    if (!confirm(`Delete "${org.name}" and unlink all its members?`)) return;
    await fetch(`/api/admin/orgs?orgId=${org.id}`, { method: "DELETE" });
    load();
  };

  return (
    <div className="max-w-[860px]">
      <h1 className="font-serif text-[22px] text-ink mb-1">Therapy Centers</h1>
      <p className="text-[12px] text-ink-3 mb-5 max-w-[560px]">
        White-label branding. Each center gets a shareable access code for its families,
        and any linked member email gets the center's logo + name on every exported schedule.
      </p>

      {/* Create */}
      <div className="bg-white border border-border p-3 mb-6 flex flex-wrap items-center gap-2">
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Center name e.g. Sunshine Therapy Center"
          className="flex-1 min-w-[220px] px-2 py-1.5 border border-border text-[12px]"
        />
        <label className="text-[12px] text-ink-3 cursor-pointer border border-border px-2 py-1.5">
          {logoFile ? logoFile.name.slice(0, 18) : "Logo (optional)"}
          <input type="file" accept="image/*" className="hidden" onChange={(e) => setLogoFile(e.target.files?.[0] || null)} />
        </label>
        <button disabled={busy || !newName.trim()} onClick={createOrg} className="py-1.5 px-4 bg-accent-strong text-white text-[12px] disabled:opacity-50">
          {busy ? "Creating…" : "Add Center"}
        </button>
      </div>

      {/* List */}
      <div className="space-y-4">
        {orgs.map((org) => {
          const orgMembers = members.filter((m) => m.org_id === org.id);
          const u = usage.find((x) => x.org_id === org.id);
          return (
            <div key={org.id} className={`bg-white border border-border p-3 ${org.active ? "" : "opacity-60"}`}>
              <div className="flex items-center gap-3 mb-2">
                {org.logo_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={org.logo_url} alt="" className="w-10 h-10 object-contain border border-border rounded bg-white" />
                ) : (
                  <div className="w-10 h-10 border border-border rounded bg-[#F8F7F4] flex items-center justify-center text-[12px] text-ink-3">
                    {org.name[0]}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-semibold text-ink">{org.name}</div>
                  <div className="text-[12px] text-ink-3">
                    Access code: <span className="font-mono font-semibold text-accent-strong">{org.access_code}</span>
                    <button onClick={() => regenCode(org.id)} className="ml-2 underline">regenerate</button>
                  </div>
                  <div className="text-[12px] text-ink-3 mt-0.5">
                    {u
                      ? `Code used ${u.total_uses}× · ~${u.unique_devices} device${u.unique_devices === 1 ? "" : "s"} · last ${String(u.last_used).slice(0, 10)}`
                      : "Code not used yet"}
                  </div>
                  <div className="mt-1.5 flex items-center gap-2">
                    {org.plan === "paid" ? (
                      <>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#EAF5EA] text-[#2D6A2D] font-semibold">
                          White-label paid — until {String(org.plan_expires_at).slice(0, 10)}
                        </span>
                        <button onClick={() => markFree(org)} className="text-[11px] underline text-ink-3">
                          Move to free
                        </button>
                      </>
                    ) : (
                      <>
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-[#F0EEE9] text-ink-3">Free plan</span>
                        <input
                          type="date"
                          value={payUntil[org.id] || ""}
                          onChange={(e) => setPayUntil((m) => ({ ...m, [org.id]: e.target.value }))}
                          className="text-[11px] border border-border px-1.5 py-0.5"
                        />
                        <button onClick={() => markPaid(org)} className="text-[11px] px-2 py-0.5 bg-accent-strong text-white">
                          Mark paid until…
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <label className="text-[12px] px-2 py-1 border border-border cursor-pointer">
                  Change logo
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => { const f = e.target.files?.[0]; if (f) changeLogo(org, f); e.target.value = ""; }}
                  />
                </label>
                <button onClick={() => toggleActive(org)} className="text-[12px] px-2 py-1 border border-border">
                  {org.active ? "Active" : "Inactive"}
                </button>
                <button onClick={() => deleteOrg(org)} className="text-[12px] px-2 py-1 border border-border text-[#C53030]">
                  Delete
                </button>
              </div>

              {/* Members */}
              <div className="pl-13 ml-13">
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {orgMembers.map((m) => (
                    <span key={m.email} className="text-[12px] px-2 py-0.5 bg-[#F8F7F4] border border-border rounded-full">
                      {m.email}
                      <button onClick={() => removeMember(m.email)} className="ml-1.5 text-[#C53030]">×</button>
                    </span>
                  ))}
                  {orgMembers.length === 0 && (
                    <span className="text-[12px] text-ink-3">No linked emails yet</span>
                  )}
                </div>
                <div className="flex gap-2">
                  <input
                    value={memberEmail[org.id] || ""}
                    onChange={(e) => setMemberEmail((m) => ({ ...m, [org.id]: e.target.value }))}
                    placeholder="Link member email e.g. therapist@center.com"
                    className="flex-1 px-2 py-1.5 border border-border text-[12px]"
                  />
                  <button onClick={() => addMember(org.id)} className="py-1.5 px-3 bg-accent-strong text-white text-[12px]">
                    Link email
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {orgs.length === 0 && (
          <p className="text-[12px] text-ink-3">No centers yet — add your first above.</p>
        )}
      </div>
    </div>
  );
}
