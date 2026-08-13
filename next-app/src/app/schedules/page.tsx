"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";

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
}

const TYPE_LABELS: Record<string, string> = {
  daily: "Daily",
  weekly: "Weekly",
  custom: "Custom",
  firstthen: "First / Then",
};

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 2) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

export default function SchedulesPage() {
  const [user, setUser] = useState<User | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const [checkedMobile, setCheckedMobile] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => { setIsMobile(mq.matches); setCheckedMobile(true); };
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const sessionRes = await fetch("/api/auth/session");
        const sessionData = await sessionRes.json();
        const currentUser = sessionData.user || null;
        setUser(currentUser);

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
  }, []);

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
  // the desktop chrome (nav/footer) on a phone for one frame.
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
        <Link
          href="/schedule"
          className="text-[11px] tracking-wider uppercase px-4 py-[0.42rem] bg-ink text-white border border-ink no-underline font-medium font-sans hover:bg-[#333] transition-all"
        >
          + New Schedule
        </Link>
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
              // Schedule grid
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                {schedules.map((s) => (
                  <div
                    key={s.id}
                    className="bg-surface border border-border hover:shadow-md hover:border-[#C8C4BC] transition-all flex flex-col"
                  >
                    {/* Type badge */}
                    <div className="px-4 pt-4 pb-2">
                      <span className="text-[10px] tracking-wider uppercase font-medium text-ink-3">
                        {TYPE_LABELS[s.scheduleType] || s.scheduleType}
                      </span>
                    </div>

                    {/* Title */}
                    <div className="px-4 pb-3 flex-1">
                      <h2 className="font-serif text-lg italic text-ink leading-snug">
                        {s.title || "Untitled Schedule"}
                      </h2>
                      <p className="text-[11px] text-ink-3 mt-1">
                        Edited {timeAgo(s.updatedAt)}
                      </p>
                    </div>

                    {/* Actions */}
                    <div className="flex border-t border-border">
                      <Link
                        href={`/schedule?id=${s.id}`}
                        className="flex-1 py-2.5 text-[11px] tracking-wider uppercase text-center text-ink-2 no-underline hover:bg-surface-hover hover:text-ink transition-colors border-r border-border font-medium font-sans"
                      >
                        Open
                      </Link>
                      <button
                        onClick={() => handleDelete(s.id, s.title)}
                        className="flex-1 py-2.5 text-[11px] tracking-wider uppercase text-ink-3 hover:bg-[#FAF0F0] hover:text-[#B83232] transition-colors font-medium font-sans"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </main>

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

/* ================================================================== *
 * MOBILE HOME — app-style, zero site chrome (no nav, no footer).
 * Matches the approved screenshot. Lives at the same /schedules URL as
 * the desktop list, so nothing about routing or sharing links changes —
 * it's purely a different render for phones, same as MobileScheduleBuilder
 * is to the desktop 3-panel builder.
 *
 * Two scoped simplifications, both easy to lift later if wanted:
 *  - Row icons are a generic calendar glyph, not a real card image. The
 *    list API (GET /api/schedules) only returns title/type/date, not the
 *    saved cards, so there's no cover image to show without an extra
 *    per-schedule fetch. Say the word and I'll add a lightweight
 *    cover-thumbnail field to that endpoint.
 *  - "Templates" and "My Library" tabs both open the new-schedule wizard
 *    (/schedule/new) — there's no standalone card-browsing page yet to
 *    send "My Library" to on its own.
 * ================================================================== */

const GREEN = "#4A5A3E";
const GREEN_SOFT = "#EAF1E2";
const GREEN_BORDER = "#C7D4B8";
const INK = "#1E2A24";
const SUB = "#6C7A72";
const FAINT = "#9AA69E";
const BORDER = "#E6EBE6";
const BG = "#F5F8F5";

function AppIcon() {
  // A simple checklist/calendar glyph in a rounded green badge — not the
  // leaf mark, per your note.
  return (
    <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: GREEN_SOFT }}>
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M8 3v4M16 3v4M4 10h16" />
        <path d="M8.5 14.5l1.8 1.8L15 12.5" />
      </svg>
    </div>
  );
}
function BellIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={SUB} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  );
}
function DotsIcon() {
  return (
    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill={FAINT}>
      <circle cx="12" cy="5" r="1.6" /><circle cx="12" cy="12" r="1.6" /><circle cx="12" cy="19" r="1.6" />
    </svg>
  );
}
function ScheduleIcon() {
  return (
    <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ background: GREEN_SOFT }}>
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M4 10h16" />
      </svg>
    </div>
  );
}

function MobileHome({ user, schedules, loading, onDelete }: {
  user: User | null; schedules: Schedule[]; loading: boolean; onDelete: (id: string, title: string) => void;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<"home" | "library" | "profile">("home");
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<{ id: string; title: string } | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameSaving, setRenameSaving] = useState(false);
  const [localSchedules, setLocalSchedules] = useState(schedules);
  useEffect(() => setLocalSchedules(schedules), [schedules]);

  // "Most used" — approximated per-device since there's no usage-count
  // column in the schedules table (see the counter written in
  // /schedule/[id]/do). Falls back to recency (the order the API already
  // returns) for anything with no recorded opens yet.
  const [openCounts, setOpenCounts] = useState<Record<string, number>>({});
  useEffect(() => {
    try {
      const raw = localStorage.getItem("vs_open_counts");
      if (raw) setOpenCounts(JSON.parse(raw));
    } catch {}
  }, []);
  const mostUsed = useMemo(
    () => [...localSchedules].sort((a, b) => (openCounts[b.id] || 0) - (openCounts[a.id] || 0)),
    [localSchedules, openCounts]
  );

  const signOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.reload();
  };

  const startRename = (id: string, title: string) => {
    setMenuFor(null);
    setRenaming({ id, title });
    setRenameValue(title);
  };
  const confirmRename = async () => {
    if (!renaming || !renameValue.trim()) return;
    setRenameSaving(true);
    try {
      // The PUT endpoint upserts the WHOLE row — sending only { title }
      // would reset scheduleType/language/data etc. to their defaults and
      // wipe the saved cards. Fetch the full record first, then send it
      // all back with just the title changed.
      const full = await fetch(`/api/schedules/${renaming.id}`).then((r) => r.json());
      await fetch(`/api/schedules/${renaming.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: renameValue.trim(),
          scheduleType: full.scheduleType,
          language: full.language,
          gender: full.gender,
          gridCols: full.gridCols,
          customColNames: full.customColNames,
          weekMode: full.weekMode,
          cardStyle: full.cardStyle,
          data: full.data,
        }),
      });
      setLocalSchedules((prev) => prev.map((s) => (s.id === renaming.id ? { ...s, title: renameValue.trim() } : s)));
    } catch {
      alert("Couldn't rename — please try again.");
    } finally {
      setRenameSaving(false);
      setRenaming(null);
    }
  };

  const handleDeleteLocal = (id: string, title: string) => {
    onDelete(id, title);
    setLocalSchedules((prev) => prev.filter((s) => s.id !== id));
  };

  return (
    <div className="min-h-dvh flex flex-col" style={{ background: BG }}>
      {tab === "home" ? (
        <>
          {/* Header — no site nav, just this */}
          <div className="flex items-center justify-between px-5 pt-4 pb-2">
            <div className="flex items-center gap-2.5">
              <AppIcon />
              <span className="font-bold text-[16px]" style={{ color: INK }}>Visual Schedule</span>
            </div>
            <BellIcon />
          </div>

          <div className="flex-1 overflow-y-auto px-5 pb-4">
            <h1 className="text-[26px] font-extrabold leading-tight mt-3" style={{ color: INK }}>
              Make your child&apos;s routine easier to follow.
            </h1>
            <p className="text-[14px] mt-2 mb-4" style={{ color: SUB }}>
              Create simple visual schedules in under a minute.
            </p>
            <button
              onClick={() => router.push("/schedule")}
              className="w-full py-3.5 rounded-2xl font-bold text-[15px] text-white flex items-center justify-center gap-2"
              style={{ background: GREEN, boxShadow: "0 6px 16px rgba(74,90,62,0.28)" }}
            >
              <span className="text-lg leading-none">+</span> Create Schedule
            </button>

            <div className="flex items-center justify-between mt-7 mb-2">
              <span className="font-bold text-[15px]" style={{ color: INK }}>Most Used</span>
              {localSchedules.length > 3 && (
                <button onClick={() => setTab("library")} className="text-[13px] font-semibold" style={{ color: GREEN }}>See all</button>
              )}
            </div>

            {loading ? (
              <div className="flex justify-center py-10">
                <div className="w-6 h-6 rounded-full animate-spin" style={{ border: `2px solid ${BORDER}`, borderTopColor: GREEN }} />
              </div>
            ) : !user ? (
              <div className="rounded-2xl p-5 text-center" style={{ background: "#fff", border: `1px solid ${BORDER}` }}>
                <p className="text-[13px] mb-3" style={{ color: SUB }}>Sign in to save schedules and use them on any device.</p>
                <Link href="/login" className="inline-block px-5 py-2.5 rounded-xl font-bold text-[13px] text-white no-underline" style={{ background: GREEN }}>Sign In</Link>
              </div>
            ) : localSchedules.length === 0 ? (
              <div className="rounded-2xl p-5 text-center" style={{ background: "#fff", border: `1px solid ${BORDER}` }}>
                <p className="text-[13px]" style={{ color: SUB }}>No schedules yet — create your first one above.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {mostUsed.slice(0, 3).map((s) => (
                  <ScheduleRow key={s.id} s={s} menuOpen={menuFor === s.id}
                    onOpen={() => router.push(`/schedule/${s.id}/do`)}
                    onMenu={() => setMenuFor(menuFor === s.id ? null : s.id)}
                    onRename={() => startRename(s.id, s.title)}
                    onDelete={() => { setMenuFor(null); handleDeleteLocal(s.id, s.title); }}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      ) : tab === "library" ? (
        <>
          <div className="flex items-center gap-3 px-5 pt-4 pb-3">
            <button onClick={() => setTab("home")} className="w-8 h-8 -ml-1 flex items-center justify-center">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
            <span className="font-bold text-[18px]" style={{ color: INK }}>My Library</span>
          </div>
          <div className="flex-1 overflow-y-auto px-5 pb-4">
            {localSchedules.length === 0 ? (
              <div className="rounded-2xl p-5 text-center" style={{ background: "#fff", border: `1px solid ${BORDER}` }}>
                <p className="text-[13px]" style={{ color: SUB }}>No schedules yet.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {localSchedules.map((s) => (
                  <ScheduleRow key={s.id} s={s} menuOpen={menuFor === s.id}
                    onOpen={() => router.push(`/schedule/${s.id}/do`)}
                    onMenu={() => setMenuFor(menuFor === s.id ? null : s.id)}
                    onRename={() => startRename(s.id, s.title)}
                    onDelete={() => { setMenuFor(null); handleDeleteLocal(s.id, s.title); }}
                  />
                ))}
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="flex-1 overflow-y-auto px-5 pt-5 pb-4">
          <h1 className="font-bold text-[20px] mb-4" style={{ color: INK }}>Profile</h1>
          {user ? (
            <>
              <div className="rounded-2xl p-4 mb-4" style={{ background: "#fff", border: `1px solid ${BORDER}` }}>
                <div className="font-bold text-[14px]" style={{ color: INK }}>{user.email || "Signed in via center code"}</div>
                <div className="text-[12px] mt-0.5" style={{ color: SUB }}>Signed in</div>
              </div>
              <button onClick={signOut} className="w-full py-3 rounded-2xl font-bold text-[14px]" style={{ background: "#fff", color: SUB, border: `1px solid ${BORDER}` }}>Sign Out</button>
            </>
          ) : (
            <Link href="/login" className="block text-center py-3 rounded-2xl font-bold text-[14px] text-white no-underline" style={{ background: GREEN }}>Sign In</Link>
          )}
        </div>
      )}

      {/* Bottom tab bar */}
      <div className="flex shrink-0" style={{ background: "#fff", borderTop: `1px solid ${BORDER}` }}>
        <button onClick={() => setTab("home")} className="flex-1 py-2.5 flex flex-col items-center gap-1">
          <svg className="w-[21px] h-[21px]" viewBox="0 0 24 24" fill="none" stroke={tab === "home" ? GREEN : FAINT} strokeWidth={tab === "home" ? 2.4 : 1.9} strokeLinecap="round" strokeLinejoin="round"><path d="M3 9.5 12 3l9 6.5V21a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1z" /></svg>
          <span className="text-[10px] font-semibold" style={{ color: tab === "home" ? GREEN : FAINT }}>Home</span>
        </button>
        <button onClick={() => router.push("/templates")} className="flex-1 py-2.5 flex flex-col items-center gap-1">
          <svg className="w-[21px] h-[21px]" viewBox="0 0 24 24" fill="none" stroke={FAINT} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.2" /><rect x="14" y="3" width="7" height="7" rx="1.2" /><rect x="3" y="14" width="7" height="7" rx="1.2" /><rect x="14" y="14" width="7" height="7" rx="1.2" /></svg>
          <span className="text-[10px] font-semibold" style={{ color: FAINT }}>Templates</span>
        </button>
        <button onClick={() => setTab("library")} className="flex-1 py-2.5 flex flex-col items-center gap-1">
          <svg className="w-[21px] h-[21px]" viewBox="0 0 24 24" fill="none" stroke={tab === "library" ? GREEN : FAINT} strokeWidth={tab === "library" ? 2.4 : 1.9} strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" /><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" /></svg>
          <span className="text-[10px] font-semibold" style={{ color: tab === "library" ? GREEN : FAINT }}>My Library</span>
        </button>
        <button onClick={() => setTab("profile")} className="flex-1 py-2.5 flex flex-col items-center gap-1">
          <svg className="w-[21px] h-[21px]" viewBox="0 0 24 24" fill="none" stroke={tab === "profile" ? GREEN : FAINT} strokeWidth={tab === "profile" ? 2.4 : 1.9} strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
          <span className="text-[10px] font-semibold" style={{ color: tab === "profile" ? GREEN : FAINT }}>Profile</span>
        </button>
      </div>

      {/* Rename sheet */}
      {renaming && (
        <div className="fixed inset-0 z-[300] flex items-end justify-center" style={{ background: "rgba(28,27,25,0.5)" }} onClick={() => setRenaming(null)}>
          <div className="bg-white w-full rounded-t-3xl p-5 pb-7" onClick={(e) => e.stopPropagation()}>
            <p className="font-bold text-[16px] mb-3" style={{ color: INK }}>Rename schedule</p>
            <input
              value={renameValue}
              onChange={(e) => setRenameValue(e.target.value)}
              maxLength={40}
              autoFocus
              className="w-full px-4 py-3 rounded-2xl text-[16px] font-semibold outline-none mb-4"
              style={{ border: `1.5px solid ${GREEN_BORDER}`, color: INK }}
            />
            <div className="flex gap-3">
              <button onClick={() => setRenaming(null)} className="flex-1 py-3 rounded-2xl font-bold text-[14px]" style={{ background: BG, color: SUB, border: `1px solid ${BORDER}` }}>Cancel</button>
              <button onClick={confirmRename} disabled={renameSaving || !renameValue.trim()} className="flex-1 py-3 rounded-2xl font-bold text-[14px] text-white disabled:opacity-60" style={{ background: GREEN }}>
                {renameSaving ? "Saving…" : "Save"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ScheduleRow({ s, menuOpen, onOpen, onMenu, onRename, onDelete }: {
  s: Schedule; menuOpen: boolean; onOpen: () => void; onMenu: () => void; onRename: () => void; onDelete: () => void;
}) {
  return (
    <div className="relative flex items-center gap-3 p-3 rounded-2xl" style={{ background: "#fff", border: `1px solid ${BORDER}` }}>
      <button onClick={onOpen} className="flex items-center gap-3 flex-1 min-w-0 text-left">
        <ScheduleIcon />
        <div className="flex-1 min-w-0">
          <div className="font-bold text-[14px] truncate" style={{ color: INK }}>{s.title || "Untitled Schedule"}</div>
          <div className="text-[12px]" style={{ color: SUB }}>{TYPE_LABELS[s.scheduleType] || s.scheduleType} · {timeAgo(s.updatedAt)}</div>
        </div>
      </button>
      <button onClick={onMenu} className="p-1"><DotsIcon /></button>
      {menuOpen && (
        <div className="absolute right-2 top-12 z-10 rounded-xl overflow-hidden" style={{ background: "#fff", border: `1px solid ${BORDER}`, boxShadow: "0 8px 20px rgba(0,0,0,0.12)" }}>
          <button onClick={onRename} className="block w-full text-left px-4 py-2.5 text-[13px] font-semibold whitespace-nowrap" style={{ color: INK }}>Rename</button>
          <Link href={`/schedule?id=${s.id}`} className="block px-4 py-2.5 text-[13px] font-semibold no-underline whitespace-nowrap" style={{ color: INK }}>Edit</Link>
          <button onClick={onDelete} className="block w-full text-left px-4 py-2.5 text-[13px] font-semibold whitespace-nowrap" style={{ color: "#DC4C4C" }}>Delete</button>
        </div>
      )}
    </div>
  );
}
