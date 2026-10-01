"use client";

// Phone app home at /schedules: Today · Schedules · Library · Profile.
// Same data and actions as before (open, edit, rename, delete, templates,
// access code); new layout, plus Library (free printable boards) and
// Profile defaults (language, bilingual, character) for new schedules.

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { LANGUAGES, languageLabel, CHARACTER_FACES, type Gender, type Language } from "@/lib/constants";
import {
  setRuntimeCards,
  setCardImages as setCardImagesGlobal,
  setLabelOverrides,
  getCardImageUrl,
  getCardGender,
  getCardLabel,
  getRuntimeCards,
  isCharacterCard,
  findCard,
  type ParsedCard,
} from "@/lib/card-data";
import { getPrefs, setPrefs, getDlFormat, type Prefs } from "@/lib/prefs";
import { scheduleCardIds, readDone } from "@/lib/schedule-steps";
import { openScheduleForEdit } from "@/lib/open-for-edit";

type User = { id: string; email: string | null; role: string };
type Schedule = {
  id: string;
  title: string;
  scheduleType: string;
  updatedAt: string;
  coverCardId: string | null;
  gender: string;
  language: string;
};
type Starter = { id: string; title: string; scheduleType: string; gender?: string; coverCardId?: string | null };
type DFile = { id: string; variant: string; label: string | null; file_url: string; preview_url: string | null; character: string | null; language: string | null };
type DItem = { id: string; title: string; files: DFile[] };
type DBundle = { id: string; title: string; items: DItem[] };
type Tab = "today" | "schedules" | "library" | "profile";

const TYPE_LABELS: Record<string, string> = {
  mini: "My Schedule", daily: "Daily", weekly: "Weekly", custom: "Custom",
  timetable: "Timetable", firstthen: "First / Then", iwant: "I Want",
};
const DESKTOP_ONLY = new Set(["weekly", "custom", "timetable"]);
const CHARACTERS: { value: Gender; label: string }[] = [
  { value: "neutral", label: "Glasses" },
  { value: "boy", label: "Boy" },
  { value: "girl", label: "Girl" },
  { value: "brown", label: "Curly hair" },
];
// Soft tints behind thumbnails so rows don't read as one grey block.
const TINTS = ["#F6E6CF", "#DDE7EC", "#E4E1EE", "#E3E8DA"];

function timeAgo(dateStr: string) {
  // SQLite returns UTC without a zone marker; add Z so IST isn't +5:30 off.
  const iso = /Z|[+-]\d{2}:?\d{2}$/.test(dateStr) ? dateStr : dateStr.replace(" ", "T") + "Z";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000), hours = Math.floor(diff / 3600000), days = Math.floor(diff / 86400000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days === 1) return "yesterday";
  return `${days} days ago`;
}

function cardImg(cardId: string | null | undefined, gender: string) {
  const card = cardId ? findCard(cardId) : undefined;
  if (!card) return null;
  return getCardImageUrl(card.id, getCardGender(card, gender)) || getCardImageUrl(card.id, "neutral") || null;
}

export function MobileHome({ user, schedules, loading, onDelete }: {
  user: User | null; schedules: Schedule[]; loading: boolean; onDelete: (id: string, title: string) => void;
}) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("today");
  const [list, setList] = useState(schedules);
  useEffect(() => setList(schedules), [schedules]);
  const [menuFor, setMenuFor] = useState<string | null>(null);
  const [renaming, setRenaming] = useState<{ id: string; title: string } | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const [renameSaving, setRenameSaving] = useState(false);
  const [prefs, setPrefsState] = useState<Prefs>(() => getPrefs());
  const updatePrefs = (p: Partial<Prefs>) => setPrefsState(setPrefs(p));

  // Card data + images live in module stores; bump a counter so thumbnails
  // re-render once they arrive.
  const [assetsVersion, setAssetsVersion] = useState(0);
  useEffect(() => {
    fetch("/api/cards")
      .then((r) => r.json())
      .then((data) => {
        if (data.cards?.length > 0) {
          setRuntimeCards(data.cards.map((c: ParsedCard) => ({
            ...c,
            isFree: !(c.icon || "").startsWith("paid:"),
            icon: c.icon?.replace(/^(free|paid):/, "") || "s-star",
          })));
        }
      })
      .catch(() => {})
      .finally(() => setAssetsVersion((v) => v + 1));
    fetch("/api/cards/images")
      .then((r) => r.json())
      .then((data) => {
        if (data.images) setCardImagesGlobal(data.images);
        if (data.labels) setLabelOverrides(data.labels);
      })
      .catch(() => {})
      .finally(() => setAssetsVersion((v) => v + 1));
  }, []);

  const [starters, setStarters] = useState<Starter[]>([]);
  useEffect(() => {
    fetch("/api/templates")
      .then((r) => r.json())
      .then((d) => setStarters((d.templates || []).slice(0, 10)))
      .catch(() => setStarters([]));
  }, []);

  // Cards of the schedules shown on Today (latest = hero, next 3 = rows).
  const latest = list[0] || null;
  const [cardsOf, setCardsOf] = useState<Record<string, string[]>>({});
  useEffect(() => {
    list.slice(0, 4).forEach((sch) => {
      if (cardsOf[sch.id]) return;
      fetch(`/api/schedules/${sch.id}`, { cache: "no-store" })
        .then((r) => r.json())
        .then((full) => setCardsOf((m) => ({ ...m, [sch.id]: scheduleCardIds(full?.data?.pages) })))
        .catch(() => {});
    });
  }, [list]); // eslint-disable-line react-hooks/exhaustive-deps
  const latestCards = latest ? cardsOf[latest.id] || [] : [];
  // Progress comes from "Show to child", which ticks steps on this device.
  const [done, setDone] = useState<Record<string, boolean>>({});
  useEffect(() => {
    if (!latest) return;
    const load = () => setDone(readDone(latest.id));
    load();
    window.addEventListener("focus", load);
    return () => window.removeEventListener("focus", load);
  }, [latest?.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const stepDone = latestCards.map((c, i) => !!done[`${c}-${i}`]);
  // Same done-map "Show to child" uses, so both stay in step.
  const writeDone = (next: Record<string, boolean>) => {
    if (!latest) return;
    setDone(next);
    try { localStorage.setItem(`vs_done_${latest.id}`, JSON.stringify(next)); } catch {}
  };
  const stepForward = () => {
    const i = stepDone.findIndex((d) => !d);
    if (i === -1) return;
    writeDone({ ...done, [`${latestCards[i]}-${i}`]: true });
  };
  const stepBack = () => {
    let i = stepDone.findIndex((d) => !d);
    i = (i === -1 ? latestCards.length : i) - 1;
    if (i < 0) return;
    const next = { ...done };
    delete next[`${latestCards[i]}-${i}`];
    writeDone(next);
  };
  const [touchX, setTouchX] = useState<number | null>(null);
  const doneCount = stepDone.filter(Boolean).length;
  const nowIdx = stepDone.findIndex((d) => !d);

  const newSchedule = () => {
    try {
      sessionStorage.removeItem("vs_active_schedule_id");
      sessionStorage.removeItem("vs_draft_mobile_schedule");
    } catch {}
    router.push("/schedule");
  };

  const [startingTemplate, setStartingTemplate] = useState<string | null>(null);
  const startFromTemplate = async (id: string) => {
    setStartingTemplate(id);
    try {
      const full = await fetch(`/api/templates/${id}`, { cache: "no-store" }).then((r) => r.json());
      if (!full?.data) { setStartingTemplate(null); return; }
      sessionStorage.removeItem("vs_active_schedule_id");
      sessionStorage.setItem("vs_draft_mobile_schedule", JSON.stringify({
        title: full.title, scheduleType: full.scheduleType, language: full.language,
        gender: full.gender, gridCols: full.gridCols, pages: full.data.pages || [],
      }));
      router.push("/schedule");
    } catch {
      setStartingTemplate(null);
    }
  };

  const startEdit = async (id: string) => {
    setMenuFor(null);
    await openScheduleForEdit(id, (href) => router.push(href));
  };

  const confirmRename = async () => {
    if (!renaming || !renameValue.trim()) return;
    setRenameSaving(true);
    try {
      // PUT replaces the whole row, so send everything back with the new title.
      const full = await fetch(`/api/schedules/${renaming.id}`).then((r) => r.json());
      await fetch(`/api/schedules/${renaming.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: renameValue.trim(), scheduleType: full.scheduleType, language: full.language,
          gender: full.gender, gridCols: full.gridCols, customColNames: full.customColNames,
          weekMode: full.weekMode, cardStyle: full.cardStyle, data: full.data,
        }),
      });
      setList((prev) => prev.map((s) => (s.id === renaming.id ? { ...s, title: renameValue.trim() } : s)));
    } catch {
      alert("Couldn't rename — please try again.");
    } finally {
      setRenameSaving(false);
      setRenaming(null);
    }
  };

  const rowProps = (s: Schedule) => ({
    s,
    menuOpen: menuFor === s.id,
    onOpen: () => router.push(`/schedule/${s.id}/do`),
    onMenu: () => setMenuFor(menuFor === s.id ? null : s.id),
    onRename: () => { setMenuFor(null); setRenaming({ id: s.id, title: s.title }); setRenameValue(s.title); },
    onEdit: () => startEdit(s.id),
    onDelete: () => { setMenuFor(null); onDelete(s.id, s.title); setList((prev) => prev.filter((x) => x.id !== s.id)); },
  });

  return (
    <div className="h-dvh overflow-hidden flex flex-col bg-[#F4F3EE] text-ink" onClick={() => menuFor && setMenuFor(null)}>
      <div key={tab} className="flex-1 min-h-0 overflow-y-auto px-[18px] pt-4 pb-6 flex flex-col gap-[18px] animate-[vsFadeIn_220ms_ease-out]">
        {tab === "today" && (
          <>
            <Header
              kicker={new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "short" })}
              title="Today"
              logo
              right={<LangSelect value={prefs.language} onChange={(l) => updatePrefs({ language: l })} />}
            />

            {loading ? (
              <Spinner />
            ) : latest ? (
              <section className="bg-white rounded-3xl p-[18px] flex flex-col gap-4">
                <div className="flex justify-between items-baseline gap-3">
                  <b className="text-[16px] truncate">{latest.title || "My schedule"}</b>
                  <span className="text-[14px] text-ink-2 shrink-0">
                    {latestCards.length ? `${doneCount} of ${latestCards.length} done` : timeAgo(latest.updatedAt)}
                  </span>
                </div>
                {latestCards.length > 0 && (
                  <div className="flex gap-[5px]" aria-hidden>
                    {latestCards.slice(0, 12).map((_, i) => (
                      <span key={i} className={`flex-1 h-2 rounded-full transition-colors duration-300 ${stepDone[i] ? "bg-accent-strong" : i === nowIdx ? "bg-[#C9D3BB]" : "bg-[#E6E6DD]"}`} />
                    ))}
                  </div>
                )}
                <div
                  className="flex items-center gap-2"
                  onTouchStart={(e) => setTouchX(e.touches[0].clientX)}
                  onTouchEnd={(e) => {
                    if (touchX == null) return;
                    const dx = e.changedTouches[0].clientX - touchX;
                    if (dx < -50) stepForward();
                    else if (dx > 50) stepBack();
                    setTouchX(null);
                  }}
                >
                  <button type="button" onClick={() => router.push(`/schedule/${latest.id}/do`)} className="flex-1 min-w-0 flex gap-4 items-center text-left" aria-label={`Show ${latest.title} to child`}>
                  <Thumb key={`h-${assetsVersion}`} src={cardImg(latestCards[nowIdx === -1 ? 0 : nowIdx] || latest.coverCardId, latest.gender)} size={112} tint={TINTS[1]} radius={20} />
                  <span className="min-w-0">
                    <span className="block text-[13px] font-bold tracking-[.08em] uppercase text-accent-strong">
                      {nowIdx === -1 && latestCards.length ? "All done" : "Now"}
                    </span>
                    <span className="block text-[30px] font-bold leading-[1.05] break-words">
                      {nowIdx === -1 && latestCards.length ? "Great job!" : cardLabel(latestCards[nowIdx] || latest.coverCardId, latest.language) || latest.title}
                    </span>
                  </span>
                </button>
                  {latestCards.length > 0 && (
                    <div className="flex flex-col gap-2 shrink-0">
                      <button type="button" onClick={stepForward} disabled={nowIdx === -1} aria-label="Mark done, next step"
                        className="w-11 h-11 rounded-full bg-accent-strong text-white flex items-center justify-center disabled:opacity-30 active:scale-95 transition-transform">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M9 6l6 6-6 6" /></svg>
                      </button>
                      <button type="button" onClick={stepBack} disabled={doneCount === 0} aria-label="Back one step"
                        className="w-11 h-11 rounded-full bg-[#F4F3EE] flex items-center justify-center disabled:opacity-30 active:scale-95 transition-transform">
                        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#1E2A24" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M15 6l-6 6 6 6" /></svg>
                      </button>
                    </div>
                  )}
                </div>
                {nowIdx > -1 && latestCards[nowIdx + 1] && (
                  <div className="flex items-center gap-2.5 bg-[#F4F3EE] rounded-2xl px-3 py-2.5 text-[16px]">
                    <Thumb key={`n-${assetsVersion}`} src={cardImg(latestCards[nowIdx + 1], latest.gender)} size={36} tint={TINTS[0]} radius={10} />
                    <span className="min-w-0 truncate"><span className="text-ink-2">Next</span> · <b>{cardLabel(latestCards[nowIdx + 1], latest.language)}</b></span>
                  </div>
                )}
              </section>
            ) : null}

            {/* Create sits on the page background, full width, so the card
                above stays just the schedule. */}
            {!loading && latest && (
              <button type="button" onClick={newSchedule} className="w-full min-h-[56px] rounded-2xl bg-accent-strong text-white font-semibold text-[17px] flex items-center justify-center gap-2 shadow-[0_4px_14px_rgba(74,90,62,0.25)] active:scale-[.99] transition-transform">
                <PlusIcon /> Create Schedule
              </button>
            )}

            {!loading && !latest && (
              <section className="bg-white rounded-3xl p-5 flex flex-col gap-3">
                <h1 className="m-0 text-[24px] font-bold leading-tight">Make your child&apos;s routine easier to follow.</h1>
                <p className="m-0 text-[15px] text-ink-2">Pick pictures, put them in order, print or show on the phone.</p>
                <button type="button" onClick={newSchedule} className="min-h-[56px] rounded-2xl bg-accent-strong text-white font-medium text-[17px] flex items-center justify-center gap-2 animate-[vsPulse_1.8s_ease-in-out_3]">
                  + Create Schedule
                </button>
                {!user && <p className="m-0 text-[12px] text-ink-3">No account needed to create and download. Sign in only to keep them.</p>}
              </section>
            )}

            {starters.length > 0 && (
              <section className="flex flex-col gap-3">
                <SecHead title="Start from a routine" link={<Link href="/templates" className="text-[16px] font-bold no-underline text-accent-strong">Templates</Link>} />
                <div className="flex gap-3 overflow-x-auto -mx-[18px] px-[18px] pb-1 [scrollbar-width:none]">
                  {starters.map((t, i) => (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => startFromTemplate(t.id)}
                      disabled={startingTemplate === t.id}
                      className="shrink-0 w-[140px] h-[138px] rounded-[20px] p-3.5 flex flex-col justify-between text-left disabled:opacity-60"
                      style={{ background: TINTS[i % TINTS.length] }}
                    >
                      <Thumb key={`t-${t.id}-${assetsVersion}`} src={cardImg(t.coverCardId, t.gender || "boy")} size={44} tint="rgba(255,255,255,.6)" radius={12} />
                      <span>
                        <b className="block text-[18px] leading-tight line-clamp-2">{t.title}</b>
                        <small className="block text-[14px] text-ink-2 mt-0.5">{startingTemplate === t.id ? "Opening…" : TYPE_LABELS[t.scheduleType] || "Ready-made"}</small>
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {list.length > 1 && (
              <section className="flex flex-col gap-2.5">
                <SecHead title="Other schedules" link={list.length > 4 ? <button type="button" onClick={() => setTab("schedules")} className="text-[16px] font-bold text-accent-strong">See all</button> : null} />
                {list.slice(1, 4).map((s) => <ScheduleRow key={`${s.id}-${assetsVersion}`} {...rowProps(s)} cards={cardsOf[s.id]} />)}
              </section>
            )}
          </>
        )}

        {tab === "schedules" && (
          <SchedulesTab
            list={list}
            loading={loading}
            user={user}
            prefs={prefs}
            updatePrefs={updatePrefs}
            onCreate={newSchedule}
            rowProps={rowProps}
            assetsVersion={assetsVersion}
          />
        )}

        {tab === "library" && <LibraryTab prefs={prefs} updatePrefs={updatePrefs} />}

        {tab === "profile" && (
          <ProfileTab user={user} prefs={prefs} updatePrefs={updatePrefs} assetsVersion={assetsVersion} />
        )}
      </div>

      <nav aria-label="Main" className="shrink-0 h-[72px] bg-white border-t border-[#E3E2DA] flex px-2 pt-2 pb-3">
        {([
          ["today", "Today", <path key="p" d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z" />],
          ["schedules", "Schedules", <path key="p" d="M3 8a3 3 0 0 1 3-3h12a3 3 0 0 1 3 3v10a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3zM8 3v4M16 3v4M3 10h18" />],
          ["library", "Library", <path key="p" d="M5 4h11a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3zM5 17a3 3 0 0 1 3-3h11" />],
          ["profile", "Profile", <path key="p" d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4 21a8 8 0 0 1 16 0" />],
        ] as const).map(([key, label, icon]) => {
          const on = tab === key;
          return (
            <button key={key} type="button" onClick={() => setTab(key)} aria-current={on ? "page" : undefined}
              className={`flex-1 flex flex-col items-center gap-0.5 text-[12px] ${on ? "text-ink font-semibold" : "text-[#5B6356] font-medium"}`}>
              <span className={`w-14 h-[30px] rounded-full flex items-center justify-center transition-colors ${on ? "bg-accent-soft" : ""}`}>
                <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={on ? 2 : 1.8} strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
              </span>
              {label}
            </button>
          );
        })}
      </nav>

      {renaming && (
        <Sheet onClose={() => setRenaming(null)} title="Rename schedule">
          <input
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            maxLength={40}
            autoFocus
            aria-label="Schedule name"
            className="w-full h-[52px] px-4 rounded-2xl text-[16px] font-semibold outline-none border-[1.5px] border-input-border focus:border-accent-strong"
          />
          <div className="flex gap-2.5">
            <button type="button" onClick={() => setRenaming(null)} className="flex-1 min-h-[50px] rounded-2xl font-semibold bg-white border-[1.5px] border-[#C9CCBF]">Cancel</button>
            <button type="button" onClick={confirmRename} disabled={renameSaving || !renameValue.trim()} className="flex-1 min-h-[50px] rounded-2xl font-semibold text-white bg-accent-strong disabled:opacity-60">
              {renameSaving ? "Saving…" : "Save"}
            </button>
          </div>
        </Sheet>
      )}
    </div>
  );
}

function cardLabel(cardId: string | null | undefined, lang: string) {
  const card = cardId ? findCard(cardId) : undefined;
  return card ? getCardLabel(card, lang) : "";
}

/* ───────────────────────── Schedules ───────────────────────── */

function SchedulesTab({ list, loading, user, prefs, updatePrefs, onCreate, rowProps, assetsVersion }: {
  list: Schedule[]; loading: boolean; user: User | null; prefs: Prefs; updatePrefs: (p: Partial<Prefs>) => void;
  onCreate: () => void; rowProps: (s: Schedule) => React.ComponentProps<typeof ScheduleRow>; assetsVersion: number;
}) {
  const [type, setType] = useState("all");
  const types = useMemo(() => Array.from(new Set(list.map((s) => s.scheduleType))), [list]);
  const shown = type === "all" ? list : list.filter((s) => s.scheduleType === type);
  return (
    <>
      <Header kicker="Saved and ready to print" title="My schedules" right={<LangSelect value={prefs.language} onChange={(l) => updatePrefs({ language: l })} />} />
      <button type="button" onClick={onCreate} className="min-h-[52px] rounded-2xl bg-accent-strong text-white font-semibold text-[16px] flex items-center justify-center gap-2">
        <PlusIcon /> Create new schedule
      </button>
      {types.length > 1 && (
        <div className="flex gap-2 overflow-x-auto -mx-[18px] px-[18px] [scrollbar-width:none]" role="group" aria-label="Filter by type">
          {["all", ...types].map((t) => (
            <button key={t} type="button" onClick={() => setType(t)} aria-pressed={type === t}
              className={`h-9 px-3.5 rounded-full border text-[14px] font-medium whitespace-nowrap ${type === t ? "bg-accent-strong border-accent-strong text-white" : "bg-white border-[#E3E2DA]"}`}>
              {t === "all" ? "All" : TYPE_LABELS[t] || t}
            </button>
          ))}
        </div>
      )}
      {loading ? <Spinner /> : shown.length === 0 ? (
        <div className="bg-white rounded-2xl p-5 text-center text-[14px] text-ink-2">
          {user ? "No schedules yet — create your first one above." : (
            <>Your saved schedules show here. <Link href="/login?next=/schedules" className="font-semibold text-accent-strong">Sign in</Link> to keep them.</>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5">
          {shown.map((s) => <ScheduleRow key={`${s.id}-${assetsVersion}`} {...rowProps(s)} />)}
        </div>
      )}
    </>
  );
}

function ScheduleRow({ s, menuOpen, onOpen, onMenu, onRename, onDelete, onEdit, cards }: {
  s: Schedule; menuOpen: boolean; onOpen: () => void; onMenu: () => void; onRename: () => void; onDelete: () => void; onEdit: () => void;
  cards?: string[];
}) {
  const tint = TINTS[(s.id.charCodeAt(0) || 0) % TINTS.length];
  const strip = (cards || []).slice(0, 3);
  return (
    <div className="relative bg-white rounded-[18px] p-3 flex items-center gap-3">
      <button type="button" onClick={onOpen} className="flex items-center gap-3 flex-1 min-w-0 text-left">
        {strip.length > 1 ? (
          <span className="flex gap-[3px] shrink-0">
            {strip.map((c, i) => (
              <Thumb key={i} src={cardImg(c, s.gender)} size={strip.length === 2 ? 50 : 34} height={52} tint={TINTS[(i + 1) % TINTS.length]} radius={8} />
            ))}
          </span>
        ) : (
          <Thumb src={cardImg(s.coverCardId, s.gender)} size={52} tint={tint} radius={12} />
        )}
        <span className="flex-1 min-w-0">
          <b className="block text-[16px] leading-tight truncate">{s.title || "Untitled schedule"}</b>
          <span className="text-[13px] text-[#5B6356]">
            {TYPE_LABELS[s.scheduleType] || s.scheduleType} · {timeAgo(s.updatedAt)}
            {DESKTOP_ONLY.has(s.scheduleType) && <span className="ml-1.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#FFF3E6] text-[#9A5F12]">Desktop</span>}
          </span>
        </span>
      </button>
      <button type="button" onClick={(e) => { e.stopPropagation(); onMenu(); }} aria-label={`More options for ${s.title}`} aria-expanded={menuOpen} className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0">
        <svg className="w-5 h-5" viewBox="0 0 24 24" fill="#5B6356"><circle cx="12" cy="5" r="1.8" /><circle cx="12" cy="12" r="1.8" /><circle cx="12" cy="19" r="1.8" /></svg>
      </button>
      {menuOpen && (
        <div onClick={(e) => e.stopPropagation()} className="absolute right-3 top-[58px] z-10 bg-white rounded-xl border border-[#E3E2DA] shadow-[0_8px_20px_rgba(0,0,0,0.12)] overflow-hidden animate-[vsSlideDown_150ms_ease-out]">
          <button type="button" onClick={onEdit} className="block w-full text-left px-4 py-3 text-[14px] font-semibold">Edit</button>
          <button type="button" onClick={onRename} className="block w-full text-left px-4 py-3 text-[14px] font-semibold">Rename</button>
          <button type="button" onClick={onDelete} className="block w-full text-left px-4 py-3 text-[14px] font-semibold text-[#C53030]">Delete</button>
        </div>
      )}
    </div>
  );
}

/* ───────────────────────── Library ───────────────────────── */

function LibraryTab({ prefs, updatePrefs }: { prefs: Prefs; updatePrefs: (p: Partial<Prefs>) => void }) {
  const [bundles, setBundles] = useState<DBundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [bundle, setBundle] = useState("all");
  const [lang, setLang] = useState("all");
  const [filters, setFilters] = useState(false);
  const [open, setOpen] = useState<{ item: DItem; file: DFile; bundle: DBundle } | null>(null);
  useEffect(() => {
    fetch("/api/downloads")
      .then((r) => (r.ok ? r.json() : { bundles: [] }))
      .then((d) => setBundles(d.bundles || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);
  const languages = useMemo(() => {
    const set = new Set<string>();
    bundles.forEach((b) => b.items.forEach((i) => i.files.forEach((f) => f.language && set.add(f.language))));
    return Array.from(set).sort();
  }, [bundles]);
  const rows = useMemo(() => {
    const out: { bundle: DBundle; item: DItem; file: DFile }[] = [];
    const needle = q.trim().toLowerCase();
    bundles.forEach((b) => {
      if (bundle !== "all" && b.id !== bundle) return;
      b.items.forEach((item) => item.files.forEach((file) => {
        if (lang !== "all" && (file.language || "") !== lang) return;
        if (needle && !`${item.title} ${b.title} ${file.language || ""}`.toLowerCase().includes(needle)) return;
        out.push({ bundle: b, item, file });
      }));
    });
    return out;
  }, [bundles, bundle, lang, q]);
  const activeFilters = (bundle !== "all" ? 1 : 0) + (lang !== "all" ? 1 : 0);

  const track = (fileId: string, kind: "view" | "download") =>
    fetch("/api/downloads/track", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ fileId, kind }) }).catch(() => {});

  // A plain link the parent taps — reliable on every phone (the old
  // fetch-then-share path failed for files on other domains). Uses their
  // remembered format: image unless they last chose PDF.
  const dlUrl = (file: DFile) => {
    const wantPdf = getDlFormat() === "pdf";
    const isPdf = /\.pdf($|\?)/i.test(file.file_url);
    const url = wantPdf || !file.preview_url ? file.file_url : isPdf ? file.preview_url : file.file_url;
    // Google Drive "view" links → direct download.
    const m = url.match(/drive\.google\.com\/file\/d\/([^/]+)/);
    return m ? `https://drive.google.com/uc?export=download&id=${m[1]}` : url;
  };
  const dlName = (title: string, url: string) => {
    const ext = (url.split("?")[0].match(/\.(\w{3,4})$/)?.[1] || "jpg").toLowerCase();
    return `${title.replace(/[^\w\u0900-\u097F -]+/g, "").trim() || "schedule"}.${ext}`;
  };

  const DlIcon = ({ c = "#1E2A24" }: { c?: string }) => (
    <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></svg>
  );

  return (
    <>
      <Header kicker="Printable visual boards" title="Library" right={<LangSelect value={prefs.language} onChange={(l) => updatePrefs({ language: l })} />} />
      <div className="flex gap-2.5 items-center">
        <label className="flex-1 flex items-center gap-2 bg-white border-[1.5px] border-[#C9CCBF] rounded-2xl h-[50px] px-3.5 focus-within:border-accent-strong">
          <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="#1E2A24" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search this board" aria-label="Search boards" className="flex-1 min-w-0 bg-transparent outline-none text-[16px]" />
        </label>
        <button type="button" onClick={() => setFilters(true)} aria-label={`Filters${activeFilters ? ` (${activeFilters} on)` : ""}`}
          className="relative w-[50px] h-[50px] rounded-2xl flex items-center justify-center shrink-0">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="#1E2A24" strokeWidth="1.9" strokeLinecap="round"><path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><circle cx="16" cy="7" r="2" /><circle cx="10" cy="17" r="2" /></svg>
          {activeFilters > 0 && <span className="absolute top-2 right-2 w-4 h-4 rounded-full bg-accent-strong text-white text-[10px] font-bold flex items-center justify-center">{activeFilters}</span>}
        </button>
      </div>

      {loading ? <Spinner /> : rows.length === 0 ? (
        <p className="text-center text-[14px] text-ink-2 py-8">{bundles.length ? "No boards match." : "New boards are coming soon."}</p>
      ) : (
        <div className="columns-2 gap-3">
          {rows.map(({ bundle: b, item, file }) => (
            <div key={file.id} className="mb-3 break-inside-avoid bg-white rounded-2xl p-1.5 pb-2 shadow-[0_1px_0_rgba(0,0,0,0.03)]">
              <button type="button" onClick={() => { setOpen({ item, file, bundle: b }); track(file.id, "view"); }} className="block w-full text-left" aria-label={`Preview ${item.title}`}>
                {file.preview_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={file.preview_url} alt="" loading="lazy" decoding="async" className="w-full h-auto rounded-[12px] block bg-[#FAFBF8]" />
                ) : (
                  <span className="block rounded-[12px] bg-[#EEF2EA] py-10 text-center text-[12px] text-ink-3">{item.title}</span>
                )}
              </button>
              <div className="flex items-center gap-1 pl-1.5 pt-2">
                <span className="flex-1 min-w-0 text-[15px] leading-tight truncate">{item.title}</span>
                <a href={dlUrl(file)} download={dlName(item.title, dlUrl(file))} target="_blank" rel="noopener"
                  onClick={() => track(file.id, "download")} aria-label={`Download ${item.title}`}
                  className="w-10 h-10 -my-1 rounded-xl flex items-center justify-center shrink-0 active:bg-accent-soft">
                  <DlIcon />
                </a>
              </div>
            </div>
          ))}
        </div>
      )}

      {filters && (
        <Sheet onClose={() => setFilters(false)} title="Filter boards">
          <span className="text-[14px] font-semibold text-ink-2">Category</span>
          <div className="flex flex-wrap gap-2">
            {[{ id: "all", title: "All" }, ...bundles].map((b) => (
              <button key={b.id} type="button" onClick={() => setBundle(b.id)} aria-pressed={bundle === b.id}
                className={`h-10 px-4 rounded-full border text-[14px] font-medium ${bundle === b.id ? "bg-accent-strong border-accent-strong text-white" : "bg-white border-[#E3E2DA]"}`}>
                {b.title}
              </button>
            ))}
          </div>
          {languages.length > 1 && (
            <>
              <span className="text-[14px] font-semibold text-ink-2">Language</span>
              <div className="flex flex-wrap gap-2">
                {["all", ...languages].map((l) => (
                  <button key={l} type="button" onClick={() => setLang(l)} aria-pressed={lang === l}
                    className={`h-10 px-4 rounded-full border text-[14px] font-medium capitalize ${lang === l ? "bg-accent-strong border-accent-strong text-white" : "bg-white border-[#E3E2DA]"}`}>
                    {l === "all" ? "All" : l}
                  </button>
                ))}
              </div>
            </>
          )}
          <div className="flex gap-2.5 pt-1">
            <button type="button" onClick={() => { setBundle("all"); setLang("all"); }} className="min-h-[50px] px-5 rounded-2xl font-semibold bg-white border-[1.5px] border-[#C9CCBF]">Clear</button>
            <button type="button" onClick={() => setFilters(false)} className="flex-1 min-h-[50px] rounded-2xl bg-accent-strong text-white font-semibold">Show {rows.length} boards</button>
          </div>
        </Sheet>
      )}

      {open && (
        <Sheet onClose={() => setOpen(null)}>
          <div className="max-h-[52dvh] overflow-y-auto rounded-2xl bg-[#EEF2EA]">
            {open.file.preview_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={open.file.preview_url} alt={open.item.title} className="w-full h-auto block" />
            ) : <div className="py-16 text-center text-ink-3">{open.item.title}</div>}
          </div>
          <div>
            <b className="block text-[19px]">{open.item.title}</b>
            <span className="text-[14px] text-ink-2 capitalize">{[open.bundle.title, open.file.language, open.file.character].filter(Boolean).join(" · ")}</span>
          </div>
          <div className="flex gap-2.5">
            <button type="button" onClick={() => setOpen(null)} className="min-h-[52px] px-5 rounded-2xl font-semibold bg-white border-[1.5px] border-[#C9CCBF]">Cancel</button>
            <a href={dlUrl(open.file)} download={dlName(open.item.title, dlUrl(open.file))} target="_blank" rel="noopener"
              onClick={() => track(open.file.id, "download")}
              className="flex-1 min-h-[52px] rounded-2xl bg-accent-strong text-white font-semibold text-[16px] flex items-center justify-center gap-2 no-underline">
              <DlIcon c="#fff" /> Download
            </a>
          </div>
        </Sheet>
      )}
    </>
  );
}

/* ───────────────────────── Profile ───────────────────────── */

function ProfileTab({ user, prefs, updatePrefs, assetsVersion }: {
  user: User | null; prefs: Prefs; updatePrefs: (p: Partial<Prefs>) => void; assetsVersion: number;
}) {
  const router = useRouter();

  const [orgInfo, setOrgInfo] = useState<{ name: string } | null>(null);
  const [codeInput, setCodeInput] = useState("");
  const [codeBusy, setCodeBusy] = useState(false);
  const [codeMsg, setCodeMsg] = useState<{ ok: boolean; text: string } | null>(null);
  useEffect(() => {
    if (!user) return;
    fetch("/api/me/org").then((r) => r.json()).then((d) => setOrgInfo(d?.org ? { name: d.org.name } : null)).catch(() => setOrgInfo(null));
  }, [user]);
  const applyCode = async () => {
    if (!codeInput.trim()) return;
    setCodeBusy(true);
    setCodeMsg(null);
    try {
      const res = await fetch("/api/me/org", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: codeInput.trim() }) });
      const data = await res.json();
      if (res.ok && data.ok) { setOrgInfo({ name: data.org.name }); setCodeInput(""); setCodeMsg({ ok: true, text: `Connected to ${data.org.name}.` }); }
      else setCodeMsg({ ok: false, text: data.error || "That code wasn't recognized." });
    } catch {
      setCodeMsg({ ok: false, text: "Couldn't check the code — try again." });
    } finally {
      setCodeBusy(false);
    }
  };

  const shareApp = async () => {
    const data = { title: "Visual Schedules", text: "Free picture schedules for kids — English, Hindi, Marathi and more.", url: "https://visualschedule.app" };
    try {
      if (navigator.share) await navigator.share(data);
      else { await navigator.clipboard.writeText(data.url); alert("Link copied"); }
    } catch {}
  };

  return (
    <>
      <Header kicker="Account and settings" title="Profile" />

      <Card>
        {user ? (
          <div className="flex items-center gap-3">
            <span className="w-[52px] h-[52px] rounded-full bg-accent-strong text-white text-[20px] font-bold flex items-center justify-center shrink-0">{(user.email || "?")[0].toUpperCase()}</span>
            <span className="min-w-0">
              <b className="block text-[16px] truncate">{user.email || "Signed in with a centre code"}</b>
              <span className="text-[13px] text-ink-2">Your schedules are saved to this account</span>
            </span>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <span className="w-[52px] h-[52px] rounded-full bg-accent-soft flex items-center justify-center shrink-0">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="#3A4830" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
              </span>
              <span><b className="block text-[16px]">Sign in</b><span className="text-[13px] text-ink-2">Keep your schedules on every device</span></span>
            </div>
            <Link href="/login?next=/schedules" className="min-h-[50px] rounded-2xl bg-accent-strong text-white font-semibold text-[16px] flex items-center justify-center no-underline">
              Log in with email
            </Link>
          </>
        )}
      </Card>

      <Card>
        <b className="text-[16px]">Defaults for new schedules</b>
        <div className="flex items-center justify-between gap-3">
          <span className="text-[15px]">Main language</span>
          <LangSelect value={prefs.language} onChange={(l) => updatePrefs({ language: l })} />
        </div>
        <label className="flex items-start gap-3 cursor-pointer">
          <input type="checkbox" className="peer sr-only" checked={prefs.bilingual} onChange={(e) => updatePrefs({ bilingual: e.target.checked })} />
          <span className="mt-0.5 w-10 h-6 shrink-0 rounded-full bg-[#CDD5C7] relative transition-colors peer-checked:bg-accent-strong peer-focus-visible:ring-2 peer-focus-visible:ring-weekly-accent after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:w-[18px] after:h-[18px] after:rounded-full after:bg-white after:shadow after:transition-all peer-checked:after:left-[19px]" />
          <span className="leading-tight"><b className="block text-[15px]">Bilingual cards</b><span className="text-[13px] text-ink-3">Show a second language under each card</span></span>
        </label>
        {prefs.bilingual && (
          <div className="flex items-center justify-between gap-3 animate-[vsSlideDown_220ms_ease-out]">
            <span className="text-[15px]">Second language</span>
            <LangSelect value={prefs.secondLanguage} exclude={prefs.language} onChange={(l) => updatePrefs({ secondLanguage: l })} />
          </div>
        )}
        <div className="flex flex-col gap-2">
          <span className="text-[15px]">Character on cards</span>
          <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Character on cards">
            {CHARACTERS.map((c) => {
              const on = prefs.gender === c.value;
              const img = CHARACTER_FACES[c.value];
              return (
                <button key={c.value} type="button" role="radio" aria-checked={on} onClick={() => updatePrefs({ gender: c.value })}
                  className={`rounded-2xl border-2 p-1.5 flex flex-col items-center gap-1 text-[12px] font-semibold transition-colors ${on ? "border-accent-strong bg-accent-soft" : "border-[#E3E2DA] bg-white"}`}>
                  <span className="w-full aspect-square rounded-xl overflow-hidden bg-[#F1EFE8] flex items-center justify-center">
                    {img ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={img} alt="" className="w-full h-full object-cover object-top" />
                    ) : <span className="text-ink-3 text-[18px]">{c.label[0]}</span>}
                  </span>
                  {c.label}
                </button>
              );
            })}
          </div>
          <small className="text-[12px] text-ink-3">New schedules start with these. You can still change them in each schedule.</small>
        </div>
      </Card>

      <Card>
        <b className="text-[16px]">Share the app</b>
        <div className="flex items-center gap-3.5">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/art/qr-visualschedule.svg" alt="QR code for visualschedule.app" className="w-[108px] h-[108px] p-1.5 bg-white border border-[#E3E2DA] rounded-xl shrink-0" />
          <span className="text-[14px] text-ink-2">Scan to open <b className="text-ink">visualschedule.app</b>, or show it to a teacher or therapist.</span>
        </div>
        <button type="button" onClick={shareApp} className="min-h-[46px] rounded-xl bg-white border-[1.5px] border-[#C9CCBF] font-semibold">Share link</button>
      </Card>

      <Card>
        <b className="text-[16px]">Follow us</b>
        <div className="grid grid-cols-4 gap-2.5">
          {([
            ["https://www.instagram.com/visual_schedule_official/", "Instagram", "#F7E1EA", "#9B2D5B", <><rect key="a" x="3" y="3" width="18" height="18" rx="5" /><circle key="b" cx="12" cy="12" r="4" /></>],
            ["https://www.youtube.com/@VisualSchedulesOfficial", "YouTube", "#F8E0DC", "#A3291B", <><rect key="a" x="2" y="5" width="20" height="14" rx="4" /><path key="b" d="M10 9l5 3-5 3z" /></>],
            ["https://chat.whatsapp.com/F452loR5KUE5RzcffScGw5", "WhatsApp", "#DDEEDF", "#1E6B34", <path key="a" d="M4 20l1.3-3.9A8 8 0 1 1 8 19z" />],
            ["mailto:visualschedulesofficial@gmail.com", "Email", "#DDE7EC", "#2F5566", <><rect key="a" x="3" y="5" width="18" height="14" rx="3" /><path key="b" d="M4 7l8 6 8-6" /></>],
          ] as const).map(([href, label, bg, fg, icon]) => (
            <a key={label} href={href} target={href.startsWith("mailto:") ? undefined : "_blank"} rel="noopener noreferrer"
              className="flex flex-col items-center gap-1.5 no-underline text-ink text-[12px] font-medium">
              <span className="w-[52px] h-[52px] rounded-2xl flex items-center justify-center" style={{ background: bg }}>
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke={fg} strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">{icon}</svg>
              </span>
              {label}
            </a>
          ))}
        </div>
      </Card>

      {user && (
        <Card>
          <b className="text-[16px]">Access code</b>
          {orgInfo ? (
            <>
              <span className="text-[14px] text-ink-2">Linked to <b className="text-accent-hover">{orgInfo.name}</b>. Schedules you save carry their branding.</span>
              <button type="button" onClick={async () => { await fetch("/api/me/org", { method: "DELETE" }); setOrgInfo(null); setCodeMsg(null); }}
                className="min-h-[46px] rounded-xl bg-white border border-[#E3E2DA] font-semibold text-[#C53030]">Remove code</button>
            </>
          ) : (
            <>
              <span className="text-[14px] text-ink-2">Have a code from your therapy centre? It unlocks paid cards and adds their branding.</span>
              <input value={codeInput} onChange={(e) => setCodeInput(e.target.value.toUpperCase())} placeholder="e.g. SUNSHINE24" aria-label="Access code"
                className="h-[48px] px-4 rounded-xl text-[15px] tracking-widest outline-none border-[1.5px] border-input-border focus:border-accent-strong" />
              <button type="button" onClick={applyCode} disabled={codeBusy || !codeInput.trim()} className="min-h-[46px] rounded-xl bg-accent-strong text-white font-semibold disabled:opacity-60">
                {codeBusy ? "Checking…" : "Apply code"}
              </button>
              {codeMsg && <p className={`m-0 text-[13px] text-center font-semibold ${codeMsg.ok ? "text-accent-hover" : "text-[#C53030]"}`}>{codeMsg.text}</p>}
            </>
          )}
        </Card>
      )}

      <div className="bg-white rounded-[20px] px-[18px] flex flex-col">
        <Link href="/plans" className="flex items-center min-h-[52px] no-underline text-ink text-[16px] border-b border-[#E3E2DA]">Plans</Link>
        <button type="button" onClick={() => { try { localStorage.removeItem("vs_tour_seen_v1"); } catch {} router.push("/schedule"); }}
          className="flex items-center min-h-[52px] text-[16px] text-left border-b border-[#E3E2DA]">Show me around again</button>
        <Link href="/privacy" className="flex items-center min-h-[52px] no-underline text-ink text-[16px] border-b border-[#E3E2DA]">Privacy and terms</Link>
        {user && (
          <button type="button" onClick={() => { window.location.href = `/api/auth/logout?t=${Date.now()}`; }} className="flex items-center min-h-[52px] text-[16px] text-left text-[#C53030]">
            Sign out
          </button>
        )}
      </div>
    </>
  );
}

/* ───────────────────────── Small parts ───────────────────────── */

function Header({ kicker, title, right, logo }: { kicker: string; title: string; right?: React.ReactNode; logo?: boolean }) {
  return (
    <header className="flex items-center gap-2.5">
      {logo && (
        <span className="w-10 h-10 rounded-xl bg-accent-strong flex items-center justify-center shrink-0">
          <svg className="w-[22px] h-[22px]" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="5" width="18" height="16" rx="3" /><path d="M8 3v4M16 3v4M3 10h18M9 15l2 2 4-4" /></svg>
        </span>
      )}
      <div className="flex-1 min-w-0">
        <small className="block text-[13px] text-[#5B6356] leading-tight truncate">{kicker}</small>
        <h1 className="m-0 text-[21px] font-bold leading-tight">{title}</h1>
      </div>
      {right}
    </header>
  );
}

function LangSelect({ value, onChange, exclude }: { value: Language; onChange: (l: Language) => void; exclude?: string }) {
  return (
    <label className="relative flex items-center shrink-0">
      <svg className="absolute left-3 w-4 h-4 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="#1E2A24" strokeWidth="1.8"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></svg>
      <select value={value} onChange={(e) => onChange(e.target.value as Language)} aria-label="Language"
        className="appearance-none h-10 pl-9 pr-8 rounded-full border border-[#E3E2DA] bg-white text-[14px] font-semibold max-w-[170px] truncate">
        {Object.keys(LANGUAGES).filter((c) => c !== exclude).map((c) => <option key={c} value={c}>{languageLabel(c)}</option>)}
      </select>
      <svg className="absolute right-3 w-3.5 h-3.5 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="#1E2A24" strokeWidth="2.2" strokeLinecap="round"><path d="M6 9l6 6 6-6" /></svg>
    </label>
  );
}

function Thumb({ src, size, height, tint, radius }: { src: string | null; size: number; height?: number; tint: string; radius: number }) {
  return (
    <span className="shrink-0 overflow-hidden flex items-center justify-center" style={{ width: size, height: height ?? size, background: tint, borderRadius: radius }}>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="w-full h-full object-contain" />
      ) : (
        <svg className="w-1/3 h-1/3 opacity-50" viewBox="0 0 24 24" fill="none" stroke="#1E2A24" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="3" /><circle cx="9" cy="10" r="2" /><path d="M21 16l-5-5-9 9" /></svg>
      )}
    </span>
  );
}

function SecHead({ title, link }: { title: string; link?: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between">
      <h2 className="m-0 text-[19px] font-semibold">{title}</h2>
      {link}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <section className="bg-white rounded-[20px] p-[18px] flex flex-col gap-3">{children}</section>;
}

function Sheet({ children, onClose, title }: { children: React.ReactNode; onClose: () => void; title?: string }) {
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [onClose]);
  return (
    <div className="fixed inset-0 z-[300] flex items-end justify-center bg-[rgba(28,27,25,0.5)] animate-[vsFadeIn_150ms_ease-out]" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={title} className="bg-[#F4F3EE] w-full max-w-[520px] rounded-t-3xl px-[18px] pt-3 pb-7 flex flex-col gap-3.5 max-h-[92dvh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <span className="w-10 h-1.5 rounded-full bg-[#C9CCBF] self-center" />
        {title && <b className="text-[18px]">{title}</b>}
        {children}
      </div>
    </div>
  );
}

function Spinner() {
  return <div className="flex justify-center py-10"><div className="w-6 h-6 rounded-full border-2 border-[#E6EBE6] border-t-accent-strong animate-spin" /></div>;
}

function PlusIcon() {
  return <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>;
}
