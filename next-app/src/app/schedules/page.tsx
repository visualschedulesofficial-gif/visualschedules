"use client";

import Link from "next/link";
import { MobileHome } from "@/components/mobile/MobileHome";
import { useRouter } from "next/navigation";
import { LANGUAGES } from "@/lib/constants";
import { useState, useEffect, useMemo } from "react";
import {
  getRuntimeCards,
  setRuntimeCards,
  setCardImages as setCardImagesGlobal,
  setLabelOverrides,
  getCardImageUrl,
  getCardGender,
  findCard,
  type ParsedCard,
} from "@/lib/card-data";

interface User {
  id: string;
  email: string | null;
  role: string;
}

interface Schedule {
  id: string;
  title: string;
  scheduleType: string;
  updatedAt: string;
  coverCardId: string | null;
  gender: string;
  language: string;
}

const TYPE_LABELS: Record<string, string> = {
  mini: "My Schedule",
  daily: "Daily",
  weekly: "Weekly",
  custom: "Custom",
  timetable: "Timetable",
  firstthen: "First / Then",
  iwant: "I Want",
};

// Landscape layouts built on desktop — too wide to use on a phone. They
// still appear in the list (so nothing looks lost), just marked clearly.
const DESKTOP_ONLY = new Set(["weekly", "custom", "timetable"]);

function timeAgo(dateStr: string) {
  // SQLite's datetime('now') returns UTC as "YYYY-MM-DD HH:MM:SS" with no
  // timezone marker, so browsers parse it as LOCAL time. In IST (+5:30)
  // that made a just-saved schedule read as "5h ago". Normalise to ISO
  // with an explicit Z so it's correctly treated as UTC.
  const iso = /Z|[+-]\d{2}:?\d{2}$/.test(dateStr)
    ? dateStr
    : dateStr.replace(" ", "T") + "Z";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

export default function SchedulesPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [checkedMobile, setCheckedMobile] = useState(false);
  const [showCentre, setShowCentre] = useState(false);
  const [centreName, setCentreName] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/me/org")
      .then((r) => r.json())
      .then((d) => setCentreName(d?.org?.name || null))
      .catch(() => setCentreName(null));
  }, [showCentre]);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => { setIsMobile(mq.matches); setCheckedMobile(true); };
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    if (!checkedMobile) return;
    (async () => {
      try {
        const sessionRes = await fetch("/api/auth/session", { cache: "no-store" });
        const sessionData = await sessionRes.json();
        const currentUser = sessionData.user || null;
        setUser(currentUser);

        // Mobile: nothing opens without signing in first — not just Create
        // and Plans, the home screen itself. Desktop keeps its existing
        // browse-without-an-account behavior.
        // Signed-out visitors now see the home screen and can start
        // creating. Sign-in is asked for at Save instead — see the builder.

        if (currentUser) {
          const schedulesRes = await fetch("/api/schedules");
          if (schedulesRes.ok) {
            const data = await schedulesRes.json();
            setSchedules(data.schedules || []);
          }
        }
      } catch (err) {
        console.error("Failed to load:", err);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [checkedMobile]);

  async function handleDelete(id: string, title: string) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    try {
      await fetch(`/api/schedules/${id}`, { method: "DELETE" });
      setSchedules((prev) => prev.filter((s) => s.id !== id));
    } catch {
      alert("Failed to delete. Please try again.");
    }
  }

  // Wait for the mobile check before picking a layout, so we never flash
  // the desktop chrome (nav/footer) on a phone for one frame — and on
  // mobile, never flash the home screen itself while redirecting a
  // signed-out visitor to login.
  if (!checkedMobile) {
    return <div className="min-h-dvh bg-bg" />;
  }

  if (isMobile) {
    return <MobileHome user={user} schedules={schedules} loading={loading} onDelete={handleDelete} />;
  }

  return (
    <div className="min-h-dvh bg-bg flex flex-col">
      {/* Nav */}
      <nav className="h-[56px] md:h-[66px] bg-surface border-b border-border flex items-center justify-between px-4 md:px-7 shrink-0">
        <Link
          href="/schedule"
          className="font-serif text-base md:text-2xl italic text-ink no-underline leading-none"
        >
          Visual Schedules
        </Link>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowCentre(true)}
            className="text-[11px] tracking-wider uppercase px-4 py-[0.42rem] border border-border text-ink-2 font-medium font-sans hover:border-ink hover:text-ink transition-all"
          >
            {centreName ? `Centre: ${centreName}` : "Centre code"}
          </button>
          <Link
            href="/schedule"
            className="cta-pulse text-[11px] tracking-wider uppercase px-4 py-[0.42rem] bg-ink text-white border border-ink no-underline font-medium font-sans hover:bg-[#333]"
          >
            + New Schedule
          </Link>
          {/* Desktop had no sign-out at all before — only mobile did. */}
          {user && (
            <a
              href="/api/auth/logout"
              className="text-[11px] tracking-wider uppercase px-4 py-[0.42rem] border border-border text-ink-2 font-medium font-sans no-underline hover:border-ink hover:text-ink transition-all"
            >
              Sign Out
            </a>
          )}
        </div>
      </nav>

      <main className="flex-1 px-4 py-8 max-w-4xl mx-auto w-full">

        {loading ? (
          // Loading state
          <div className="flex items-center justify-center py-24">
            <div className="w-6 h-6 border-2 border-border border-t-accent rounded-full animate-spin" />
          </div>

        ) : !user ? (
          // Not logged in
          <div className="text-center py-24">
            <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-surface border border-border flex items-center justify-center">
              <svg className="w-6 h-6 stroke-ink-3 stroke-[1.5] fill-none" viewBox="0 0 24 24">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <h1 className="font-serif text-2xl italic text-ink mb-2">My Schedules</h1>
            <p className="text-[13px] text-ink-2 mb-6 max-w-xs mx-auto leading-relaxed">
              Sign in to save your schedules and access them from any device.
            </p>
            <div className="flex gap-3 justify-center flex-wrap">
              <Link
                href="/login"
                className="text-[11px] tracking-wider uppercase px-6 py-2.5 bg-ink text-white border border-ink no-underline font-medium font-sans hover:bg-[#333] transition-all"
              >
                Sign In
              </Link>
              <Link
                href="/schedule"
                className="text-[11px] tracking-wider uppercase px-6 py-2.5 border border-border text-[#4A4540] no-underline font-medium font-sans hover:border-ink hover:text-ink transition-all"
              >
                Continue Without Account
              </Link>
            </div>
          </div>

        ) : (
          // Logged in
          <>
            <div className="flex items-center justify-between mb-6">
              <h1 className="font-serif text-2xl italic text-ink">My Schedules</h1>
              <span className="text-[11px] text-ink-3">
                {schedules.length} schedule{schedules.length !== 1 ? "s" : ""} saved
              </span>
            </div>


            {schedules.length === 0 ? (
              // Empty state
              <div className="bg-surface border border-border p-12 text-center">
                <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-bg flex items-center justify-center">
                  <svg className="w-6 h-6 stroke-ink-3 stroke-[1.5] fill-none" viewBox="0 0 24 24">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="12" y1="18" x2="12" y2="12" />
                    <line x1="9" y1="15" x2="15" y2="15" />
                  </svg>
                </div>
                <h2 className="text-[15px] font-medium text-ink mb-2">
                  No saved schedules yet
                </h2>
                <p className="text-[13px] text-ink-2 leading-relaxed mb-6 max-w-xs mx-auto">
                  Create a schedule and use the Save button to keep it here. Your schedules are saved to your account and accessible on any device.
                </p>
                <Link
                  href="/schedule"
                  className="text-[11px] tracking-wider uppercase px-6 py-2.5 bg-accent text-white border border-accent no-underline font-medium font-sans hover:bg-accent-hover transition-all inline-block"
                >
                  Create Your First Schedule
                </Link>
              </div>

            ) : (
              // Schedule grid — taller cards, 3 per row, with the first card
              // as a thumbnail and tags for type / language / created date.
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {schedules.map((s) => {
                  const card = s.coverCardId ? findCard(s.coverCardId) : undefined;
                  const thumb = card
                    ? (getCardImageUrl(card.id, getCardGender(card, s.gender)) || getCardImageUrl(card.id, "neutral") || null)
                    : null;
                  const desktopOnly = DESKTOP_ONLY.has(s.scheduleType);
                  return (
                    <div
                      key={s.id}
                      className="bg-surface border border-border hover:shadow-md hover:border-[#C8C4BC] transition-all flex flex-col overflow-hidden"
                    >
                      {/* Thumbnail — first card of the schedule */}
                      <div className="h-[150px] flex items-center justify-center bg-bg-muted border-b border-border">
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={thumb} alt="" className="h-full w-full object-contain p-3" />
                        ) : (
                          <svg className="w-9 h-9 stroke-ink-3 stroke-[1.4] fill-none" viewBox="0 0 24 24">
                            <rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M4 10h16" />
                          </svg>
                        )}
                      </div>

                      <div className="px-4 pt-3 pb-3 flex-1">
                        <h2 className="font-serif text-lg italic text-ink leading-snug">
                          {s.title || "Untitled Schedule"}
                        </h2>

                        {/* Tags */}
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          <span className="text-[10px] tracking-wider uppercase font-medium px-2 py-1 rounded bg-bg-muted text-ink-2">
                            {TYPE_LABELS[s.scheduleType] || s.scheduleType}
                          </span>
                          <span className="text-[10px] tracking-wider uppercase font-medium px-2 py-1 rounded bg-bg-muted text-ink-2">
                            {LANGUAGES[s.language as keyof typeof LANGUAGES] || s.language}
                          </span>
                          {desktopOnly && (
                            <span className="text-[10px] tracking-wider uppercase font-medium px-2 py-1 rounded" style={{ background: "#FFF3E6", color: "#B5761F" }}>
                              Desktop only
                            </span>
                          )}
                        </div>

                        <p className="text-[11px] text-ink-3 mt-2">
                          Edited {timeAgo(s.updatedAt)}
                        </p>
                      </div>

                      {/* Actions */}
                      <div className="flex border-t border-border">
                        <Link
                          href={`/schedule?id=${s.id}`}
                          className="flex-1 py-2.5 text-[11px] tracking-wider uppercase text-center text-ink-2 no-underline hover:bg-surface-hover hover:text-ink transition-colors border-r border-border font-medium font-sans"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(s.id, s.title)}
                          className="flex-1 py-2.5 text-[11px] tracking-wider uppercase text-ink-3 hover:bg-[#FAF0F0] hover:text-[#B83232] transition-colors font-medium font-sans"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </main>

      {showCentre && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center p-4"
          style={{ background: "rgba(28,27,25,0.45)" }}
          onClick={() => setShowCentre(false)}
        >
          <div className="bg-surface border border-border p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <DesktopAccessCode onDone={(name) => setCentreName(name)} />
            <button
              onClick={() => setShowCentre(false)}
              className="mt-5 w-full text-[11px] tracking-wider uppercase py-2.5 border border-border text-ink-2 font-medium font-sans hover:border-ink hover:text-ink transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-ink text-[#9A9690] px-7 py-4 flex items-center justify-between gap-4 flex-wrap text-xs max-md:px-4 mt-auto">
        <span className="font-serif text-base italic text-[#F5F2EC]">Grow Gently</span>
        <div className="flex items-center gap-4 flex-wrap">
          <Link href="/privacy" className="text-[#9A9690] no-underline hover:text-[#F5F2EC]">Privacy</Link>
          <Link href="/terms" className="text-[#9A9690] no-underline hover:text-[#F5F2EC]">Terms</Link>
          <Link href="/refund" className="text-[#9A9690] no-underline hover:text-[#F5F2EC]">Refunds</Link>
        </div>
      </footer>
    </div>
  );
}

const GREEN = "#4A5A3E";
const GREEN_SOFT = "#EAF1E2";

/* Access code panel for the desktop list page. Mirrors the mobile Profile
   version: shows the linked centre, lets you apply a code, or remove it. */
function DesktopAccessCode({ onDone }: { onDone?: (name: string | null) => void }) {
  const [orgInfo, setOrgInfo] = useState<{ name: string } | null>(null);
  const [codeInput, setCodeInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  useEffect(() => {
    fetch("/api/me/org")
      .then((r) => r.json())
      .then((d) => setOrgInfo(d?.org ? { name: d.org.name } : null))
      .catch(() => setOrgInfo(null));
  }, []);

  const apply = async () => {
    if (!codeInput.trim()) return;
    setBusy(true); setMsg(null);
    try {
      const res = await fetch("/api/me/org", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: codeInput.trim() }),
      });
      const data = await res.json();
      if (res.ok && data.ok) {
        setOrgInfo({ name: data.org.name });
        setCodeInput("");
        setMsg({ ok: true, text: `Connected to ${data.org.name}. Branding will be applied to schedules you save.` });
        onDone?.(data.org.name);
      } else {
        setMsg({ ok: false, text: data.error || "That code wasn't recognized." });
      }
    } catch {
      setMsg({ ok: false, text: "Couldn't check the code — try again." });
    }
    setBusy(false);
  };

  const remove = async () => {
    setBusy(true);
    try {
      await fetch("/api/me/org", { method: "DELETE" });
      setOrgInfo(null);
      onDone?.(null);
      setMsg({ ok: true, text: "Access code removed." });
    } catch {}
    setBusy(false);
  };

  return (
    <div>
      <h2 className="font-serif text-lg italic text-ink mb-1">Centre access code</h2>
      {orgInfo ? (
        <>
          <p className="text-[12px] text-ink-2 mb-3">
            Linked to <strong className="text-ink">{orgInfo.name}</strong>. Schedules you save carry their branding, and all paid cards are unlocked.
          </p>
          <button
            onClick={remove}
            disabled={busy}
            className="text-[11px] tracking-wider uppercase px-4 py-2 border border-border text-ink-3 font-medium font-sans hover:text-[#C53030] hover:border-[#C53030] transition-all disabled:opacity-50"
          >
            Remove code
          </button>
        </>
      ) : (
        <>
          <p className="text-[12px] text-ink-2 mb-3">
            Have a code from your therapy centre? Add it to unlock all paid cards and apply their branding.
          </p>
          <div className="flex gap-2 max-w-sm">
            <input
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value.toUpperCase())}
              placeholder="e.g. SUNSHINE24"
              className="flex-1 min-w-0 px-3 py-2 border border-input-border bg-surface-hover font-sans text-[13px] tracking-widest uppercase text-ink outline-none focus:border-accent"
            />
            <button
              onClick={apply}
              disabled={busy || !codeInput.trim()}
              className="text-[11px] tracking-wider uppercase px-4 py-2 bg-accent text-white border border-accent font-medium font-sans hover:bg-accent-hover transition-all disabled:opacity-50 shrink-0"
            >
              {busy ? "…" : "Apply"}
            </button>
          </div>
        </>
      )}
      {msg && (
        <p className={`mt-2 text-[12px] ${msg.ok ? "text-ink-2" : "text-[#C53030]"}`}>{msg.text}</p>
      )}
    </div>
  );
}
