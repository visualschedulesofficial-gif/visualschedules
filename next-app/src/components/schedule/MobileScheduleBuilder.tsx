"use client";

// Mobile-only builder — green "Grow Gently mobile" identity.
//
// Drop-in replacement for the previous mobile builder: SAME export name,
// SAME props, SAME state/hooks (useScheduleState, useExport, ScheduleCanvas),
// so ScheduleBuilder.tsx and the build are untouched. Only the look and the
// on-page flow change. Desktop is unaffected — this renders only under the
// max-width:767px switch in ScheduleBuilder.tsx.
//
// Cards, categories, character variants, paid-locking and export are all the
// real thing (D1 via getRuntimeCards, R2 images, /api/user/subscription,
// useExport). Nothing here is placeholder.

import { useState, useEffect, useMemo } from "react";
import { LANGUAGES, GRID_SPECS, type Language, type Gender, type ScheduleType } from "@/lib/constants";
import {
  CATEGORIES,
  ALL_CARDS,
  getRuntimeCards,
  getCardLabel,
  getCardImageUrl,
  getCardGender,
  isCharacterCard,
  type ParsedCard,
} from "@/lib/card-data";
import { useScheduleState } from "@/hooks/useScheduleState";
import { useExport } from "@/hooks/useExport";
import { ScheduleCanvas } from "@/components/schedule/ScheduleCanvas";
import { A4_PORTRAIT } from "@/lib/constants";
import type { CardImageMap } from "@/lib/card-data";

type Step = "layout" | "cards" | "final";

const CHARACTER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "neutral", label: "Neutral" },
  { value: "boy", label: "Boy" },
  { value: "girl", label: "Girl" },
  { value: "brown", label: "Brown" },
];

// Mobile-appropriate schedule types (portrait-friendly). Driven by the verified
// store setter setScheduleType — no dependency on @/lib/layouts.
const TYPES: { id: ScheduleType; label: string }[] = [
  { id: "mini", label: "My Schedule" },
  { id: "daily", label: "Daily" },
  { id: "firstthen", label: "First / Then" },
  { id: "iwant", label: "I Want" },
];

/* Green identity — arbitrary Tailwind values compile fine in the app build. */
const GREEN = "#4A5A3E";
const GREEN_DARK = "#3A4830";
const GREEN_SOFT = "#EAF1E2";
const GREEN_BORDER = "#C7D4B8";
const INK = "#1E2A24";
const SUB = "#6C7A72";
const BORDER = "#E6EBE6";

function SectionLabel({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-2 mb-2">
      <div className="text-[13px] font-semibold" style={{ color: INK }}>{children}</div>
      {right}
    </div>
  );
}

function CardTile({
  card, language, gender, isLocked, onAdd, placed,
}: {
  card: ParsedCard;
  language: Language;
  gender: Gender;
  isLocked: boolean;
  onAdd: (cardId: string) => void;
  placed?: boolean;
}) {
  const variant = getCardGender(card, gender);
  const img = getCardImageUrl(card.id, variant) || getCardImageUrl(card.id, "neutral");
  const [justAdded, setJustAdded] = useState(false);
  return (
    <button
      onClick={() => {
        if (isLocked) { window.location.href = "/plans"; return; }
        onAdd(card.id);
        setJustAdded(true);
        setTimeout(() => setJustAdded(false), 1000);
      }}
      className="relative w-full min-w-0 block bg-white rounded-2xl active:scale-95 transition-transform overflow-hidden"
      style={{ border: `1px solid ${BORDER}` }}
    >
      {isLocked && (
        <span
          className="absolute top-1 right-1 z-10 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ background: "#FFF3E6" }}
        >
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="#B5761F" strokeWidth="2.4" strokeLinecap="round">
            <rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
        </span>
      )}
      {placed && !justAdded && !isLocked && (
        <span className="absolute top-1 right-1 z-10 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: GREEN_SOFT }}>
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
        </span>
      )}
      {justAdded && (
        <span className="absolute inset-0 z-20 flex items-center justify-center" style={{ background: "rgba(255,255,255,0.75)" }}>
          <span className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: GREEN }}>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          </span>
        </span>
      )}
      <div className="w-full aspect-square flex items-center justify-center overflow-hidden" style={{ opacity: isLocked ? 0.55 : 1 }}>
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt="" className="w-full h-full object-contain" loading="lazy" />
        ) : (
          <div className="w-full h-full" style={{ background: GREEN_SOFT }} />
        )}
      </div>
      <div className="px-1 py-1.5 text-center leading-tight truncate text-[11px] font-semibold" style={{ borderTop: `1px solid ${BORDER}`, color: isLocked ? SUB : INK }}>
        {getCardLabel(card, language)}
      </div>
    </button>
  );
}

function CategoryRow({
  name, cards, language, gender, placedIds, isLockedCard, onAddCard,
}: {
  name: string;
  cards: ParsedCard[];
  language: Language;
  gender: Gender;
  placedIds: Set<string>;
  isLockedCard: (c: ParsedCard) => boolean;
  onAddCard: (cardId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const COLLAPSED = 9;
  const tooMany = cards.length > COLLAPSED;
  const shown = expanded || !tooMany ? cards : cards.slice(0, COLLAPSED);

  return (
    <div className="pt-1">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-[13px] font-bold" style={{ color: INK }}>
          {name} <span className="font-medium" style={{ color: SUB }}>({cards.length})</span>
        </span>
        {tooMany && (
          <button onClick={() => setExpanded((v) => !v)} className="text-[12px] font-semibold shrink-0" style={{ color: GREEN }}>
            {expanded ? "Show less" : `See all ${cards.length}`}
          </button>
        )}
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        {shown.map((card) => (
          <CardTile
            key={card.id}
            card={card}
            language={language}
            gender={gender}
            isLocked={isLockedCard(card)}
            placed={placedIds.has(card.id)}
            onAdd={onAddCard}
          />
        ))}
      </div>
    </div>
  );
}

export function MobileScheduleBuilder({
  onAddCard,
  cardsLoaded,
  justDroppedSlot,
  cardImages,
  loading = false,
  initialStep,
}: {
  onAddCard: (cardId: string) => void;
  cardsLoaded: boolean;
  justDroppedSlot: string | null;
  cardImages: CardImageMap;
  loading?: boolean;
  initialStep?: Step;
}) {
  const language = useScheduleState((s) => s.language);
  const setLanguage = useScheduleState((s) => s.setLanguage);
  const scheduleType = useScheduleState((s) => s.scheduleType);
  const setScheduleType = useScheduleState((s) => s.setScheduleType);
  const miniCardCount = useScheduleState((s) => s.miniCardCount);
  const setMiniCardCount = useScheduleState((s) => s.setMiniCardCount);
  const gridCols = useScheduleState((s) => s.gridCols);
  const setGridCols = useScheduleState((s) => s.setGridCols);
  const gender = useScheduleState((s) => s.gender);
  const setGender = useScheduleState((s) => s.setGender);
  const pages = useScheduleState((s) => s.pages);

  const { exportPDF, exportJPEG, exporting } = useExport();

  // Landscape types don't suit phones — fall back to Daily if one was opened.
  useEffect(() => {
    if (scheduleType === "weekly" || scheduleType === "custom" || scheduleType === "timetable") {
      setScheduleType("daily");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduleType]);

  const [orgBanner, setOrgBanner] = useState<{ name: string; code: string } | null>(null);
  useEffect(() => {
    fetch("/api/me/org")
      .then((r) => r.json())
      .then((d) => setOrgBanner(d.via === "code" ? { name: d.org.name, code: d.code } : null))
      .catch(() => setOrgBanner(null));
  }, []);
  const leaveOrgCode = async () => {
    await fetch("/api/me/org", { method: "DELETE" });
    window.location.reload();
  };

  const [adminCatNames, setAdminCatNames] = useState<Record<string, string>>({});
  const [hasSubscription, setHasSubscription] = useState(false);

  useEffect(() => {
    fetch("/api/user/subscription")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setHasSubscription(!!d?.subscription))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const map: Record<string, string> = {};
        (data?.categories || []).forEach((c: any) => { map[c.id] = c.name; });
        setAdminCatNames(map);
      })
      .catch(() => {});
  }, []);

  const cards: ParsedCard[] = useMemo(() => {
    const db = getRuntimeCards();
    const ids = new Set(db.map((c) => c.id));
    return [...db, ...ALL_CARDS.filter((c) => !ids.has(c.id))];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardsLoaded]);

  const catName = (id: string) => adminCatNames[id] || id;

  const groupedCategories = useMemo(() => {
    const order: string[] = [];
    const seen = new Set<string>();
    CATEGORIES.forEach((c: any) => { if (!seen.has(c.id)) { seen.add(c.id); order.push(c.id); } });
    cards.forEach((c) => { if (c.categoryId && !seen.has(c.categoryId)) { seen.add(c.categoryId); order.push(c.categoryId); } });

    const byCat = new Map<string, ParsedCard[]>();
    cards.forEach((card) => {
      const key = card.categoryId || "other";
      if (!byCat.has(key)) byCat.set(key, []);
      byCat.get(key)!.push(card);
    });

    const groups = order
      .filter((id) => (byCat.get(id) || []).length > 0)
      .map((id) => ({ id, name: catName(id), cards: byCat.get(id)! }));

    const orphans = byCat.get("other");
    if (orphans?.length) groups.push({ id: "other", name: "Other", cards: orphans });
    return groups;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards, adminCatNames]);

  const showCharacters = useMemo(() => cards.some((c) => isCharacterCard(c)), [cards]);
  useEffect(() => {
    if (!showCharacters && gender !== "neutral") setGender("neutral");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCharacters]);

  const isLockedCard = (card: ParsedCard) => (card as any).isFree === false && !hasSubscription;
  const faceCard = useMemo(() => cards.find((c) => isCharacterCard(c)) || null, [cards]);

  const placedIds = useMemo(() => {
    const ids = new Set<string>();
    pages.forEach((p: any) => {
      (p.slots || []).forEach((s: any) => s?.cardId && ids.add(s.cardId));
      Object.values(p.columns || {}).forEach((col: any) => (col || []).forEach((e: any) => e?.cardId && ids.add(e.cardId)));
    });
    return ids;
  }, [pages]);

  const { placedCount, totalSlots } = useMemo(() => {
    const p = pages[0] as any;
    if (scheduleType === "daily") {
      const placed = (p?.slots || []).filter((s: any) => !!s).length;
      return { placedCount: placed, totalSlots: p?.slots?.length || 0 };
    }
    if (scheduleType === "mini") return { placedCount: (p?.columns?.["0"] || []).length, totalSlots: miniCardCount };
    if (scheduleType === "iwant") return { placedCount: (p?.columns?.["cutout"] || []).length, totalSlots: 6 };
    if (scheduleType === "firstthen") return { placedCount: (p?.columns?.["cutout"] || []).length, totalSlots: 0 };
    return { placedCount: 0, totalSlots: 0 };
  }, [pages, scheduleType, miniCardCount]);

  const [zoom, setZoom] = useState(0.5);
  useEffect(() => {
    const update = () => setZoom(Math.min(1, (window.innerWidth - 26) / A4_PORTRAIT.width));
    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => { window.removeEventListener("resize", update); window.removeEventListener("orientationchange", update); };
  }, []);

  useEffect(() => {
    if (initialStep === "cards") {
      setTimeout(() => setShowAddStep(true), 300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [showDownload, setShowDownload] = useState(false);
  const [showAddStep, setShowAddStep] = useState(false);
  const [addStepCat, setAddStepCat] = useState<string>("all");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-full py-24" style={{ background: "#F5F8F5" }}>
        <div className="w-6 h-6 rounded-full animate-spin" style={{ border: `2px solid ${BORDER}`, borderTopColor: GREEN }} />
      </div>
    );
  }

  return (
    <div className="px-4 pb-24 pt-3 min-h-full" style={{ background: "#F5F8F5" }}>
      {orgBanner && (
        <div className="flex items-center justify-between gap-2 rounded-2xl px-3 py-2 mb-3" style={{ background: GREEN_SOFT, border: `1px solid ${GREEN_BORDER}` }}>
          <span className="text-[12px]" style={{ color: GREEN_DARK }}>
            Branding: <span className="font-semibold">{orgBanner.name}</span> (code {orgBanner.code})
          </span>
          <button onClick={leaveOrgCode} className="text-[12px] font-semibold underline shrink-0" style={{ color: "#C53030" }}>
            Not you? Leave
          </button>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-4">
        <div className="flex items-center gap-2">
          <span className="text-xl">🌱</span>
          <h1 className="font-bold text-[17px]" style={{ color: INK }}>Visual Schedule</h1>
        </div>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as Language)}
          className="py-1.5 px-2.5 bg-white text-[13px] rounded-xl shrink-0"
          style={{ border: `1px solid ${BORDER}`, color: INK }}
          aria-label="Language"
        >
          {Object.entries(LANGUAGES).map(([code, name]) => (
            <option key={code} value={code}>{name}</option>
          ))}
        </select>
      </div>

      {/* 1 · Type — above the canvas, per your note */}
      <section>
        <SectionLabel>Schedule type</SectionLabel>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4">
          {TYPES.map((t) => {
            const active = scheduleType === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  if (t.id !== scheduleType && placedIds.size > 0 &&
                      !window.confirm("Changing type clears the cards you've added. Continue?")) return;
                  setScheduleType(t.id);
                }}
                className="px-4 py-2.5 rounded-2xl bg-white text-[13px] font-semibold whitespace-nowrap active:scale-95 transition-transform"
                style={active ? { border: `2px solid ${GREEN}`, color: GREEN_DARK } : { border: `1px solid ${BORDER}`, color: SUB }}
              >
                {t.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* 2 · Card count — only where the store has an adjustable count.
          My Schedule → miniCardCount (2-5), default 3. Daily → gridCols,
          shown as its slot count (6/12/24), default 3 cols → 12 cards.
          First/Then and I Want have fixed structural capacities, so no
          dropdown for those. */}
      {(scheduleType === "mini" || scheduleType === "daily") && (
        <section className="mt-3">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold" style={{ color: INK }}>Number of cards</span>
            {scheduleType === "mini" ? (
              <select
                value={miniCardCount}
                onChange={(e) => setMiniCardCount(Number(e.target.value) as 2 | 3 | 4 | 5)}
                className="py-1.5 px-2.5 bg-white text-[13px] rounded-xl"
                style={{ border: `1px solid ${BORDER}`, color: INK }}
              >
                {[2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} cards</option>)}
              </select>
            ) : (
              <select
                value={gridCols}
                onChange={(e) => setGridCols(Number(e.target.value) as 2 | 3 | 4)}
                className="py-1.5 px-2.5 bg-white text-[13px] rounded-xl"
                style={{ border: `1px solid ${BORDER}`, color: INK }}
              >
                {([2, 3, 4] as const).map((c) => <option key={c} value={c}>{GRID_SPECS[c].slots} cards</option>)}
              </select>
            )}
          </div>
        </section>
      )}

      {/* 3 · Character — just the 4 faces, sitting directly above the canvas */}
      {showCharacters && (
        <div className="flex gap-2 mt-3">
          {CHARACTER_OPTIONS.map((o) => {
            const active = gender === o.value;
            const faceImg = faceCard ? getCardImageUrl(faceCard.id, o.value) || getCardImageUrl(faceCard.id, "neutral") : null;
            return (
              <button
                key={o.value}
                onClick={() => setGender(o.value)}
                aria-label={o.label}
                className="w-11 h-11 rounded-full overflow-hidden flex items-center justify-center shrink-0"
                style={active ? { border: `2.5px solid ${GREEN}` } : { border: `1.5px solid ${BORDER}`, opacity: 0.7 }}
              >
                {faceImg ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={faceImg} alt={o.label} className="w-[200%] h-[200%] max-w-none object-cover -translate-x-1/4" />
                ) : (
                  <span className="text-[13px] font-semibold" style={{ color: SUB }}>{o.label[0]}</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* 4 · Your schedule — the canvas, with one clear + to add a step */}
      <section className="mt-3">
        <SectionLabel right={totalSlots > 0 ? <span className="text-[12px]" style={{ color: SUB }}>{placedCount}/{totalSlots} added</span> : undefined}>
          Your schedule
        </SectionLabel>
        <div className="relative">
          <div className={exporting ? "w-full" : "w-full overflow-hidden rounded-2xl bg-white"} style={exporting ? undefined : { border: `1px solid ${BORDER}` }}>
            <div style={{ zoom: exporting ? 1 : zoom }}>
              <ScheduleCanvas justDroppedSlot={justDroppedSlot} cardImages={cardImages} />
            </div>
          </div>
          {(totalSlots === 0 || placedCount < totalSlots) && (
            <button
              onClick={() => setShowAddStep(true)}
              className="absolute -bottom-3 -right-3 w-12 h-12 rounded-full flex items-center justify-center text-white text-2xl font-bold z-10"
              style={{ background: GREEN, boxShadow: "0 6px 16px rgba(74,90,62,0.35)" }}
              aria-label="Add step"
            >
              +
            </button>
          )}
        </div>
      </section>

      {/* 5 · Create — sticky */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-4 pt-3" style={{ background: "linear-gradient(to top, #F5F8F5 60%, transparent)" }}>
        <button
          onClick={() => setShowDownload(true)}
          className="w-full py-3.5 rounded-2xl text-white text-[15px] font-bold"
          style={{ background: GREEN, boxShadow: "0 6px 16px rgba(74,90,62,0.28)" }}
        >
          Print / Download
        </button>
      </div>

      {/* Download sheet */}
      {showDownload && (
        <div className="fixed inset-0 z-[300] flex items-end justify-center" style={{ background: "rgba(28,27,25,0.5)" }} onClick={() => setShowDownload(false)}>
          <div className="bg-white w-full rounded-t-3xl p-5 pb-7 space-y-2.5" onClick={(e) => e.stopPropagation()}>
            <p className="font-bold text-[16px] mb-1" style={{ color: INK }}>Print / Download</p>

            <button
              onClick={() => window.print()}
              className="w-full flex items-center gap-3 p-4 rounded-2xl text-left"
              style={{ border: `1px solid ${BORDER}` }}
            >
              <span className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: GREEN_SOFT }}>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>
              </span>
              <span className="flex-1"><span className="block font-bold text-[14px]" style={{ color: INK }}>Print</span><span className="block text-[12px]" style={{ color: SUB }}>Best for charts and checklists</span></span>
            </button>

            <button
              onClick={exportPDF}
              disabled={exporting}
              className="w-full flex items-center gap-3 p-4 rounded-2xl text-left disabled:opacity-60"
              style={{ border: `1px solid ${BORDER}` }}
            >
              <span className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "#FBECEC" }}>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#D9534F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
              </span>
              <span className="flex-1"><span className="block font-bold text-[14px]" style={{ color: INK }}>{exporting ? "Preparing…" : "Download PDF"}</span><span className="block text-[12px]" style={{ color: SUB }}>Save to your device</span></span>
            </button>

            <button
              onClick={exportJPEG}
              disabled={exporting}
              className="w-full flex items-center gap-3 p-4 rounded-2xl text-left disabled:opacity-60"
              style={{ border: `1px solid ${BORDER}` }}
            >
              <span className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "#E9F1FA" }}>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#3E7CB1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
              </span>
              <span className="flex-1"><span className="block font-bold text-[14px]" style={{ color: INK }}>{exporting ? "Preparing…" : "Download Images"}</span><span className="block text-[12px]" style={{ color: SUB }}>Save each step as images</span></span>
            </button>

            <div className="p-3 rounded-xl text-[12px] flex items-center gap-2 mt-1" style={{ background: "#FCF6E4", color: "#8A6D1F" }}>
              <span>💡</span><span>Tip: Print on A4 and use Velcro or magnets.</span>
            </div>

            <button onClick={() => setShowDownload(false)} className="w-full py-2.5 text-[13px] font-semibold" style={{ color: SUB }}>Close</button>
          </div>
        </div>
      )}

      {/* Add Step — opened by the + on the canvas. Category as a dropdown
          and the 4 character faces up top, per your note. */}
      {showAddStep && (
        <div className="fixed inset-0 z-[300] flex flex-col" style={{ background: "#F5F8F5" }}>
          <div className="flex items-center justify-between px-4 pt-4 pb-3" style={{ background: "#fff", borderBottom: `1px solid ${BORDER}` }}>
            <span className="font-bold text-[16px]" style={{ color: INK }}>Add Step</span>
            <button onClick={() => setShowAddStep(false)} aria-label="Close" className="w-8 h-8 flex items-center justify-center">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={SUB} strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>

          <div className="px-4 pt-3">
            {showCharacters && (
              <div className="flex gap-2 mb-3">
                {CHARACTER_OPTIONS.map((o) => {
                  const active = gender === o.value;
                  const faceImg = faceCard ? getCardImageUrl(faceCard.id, o.value) || getCardImageUrl(faceCard.id, "neutral") : null;
                  return (
                    <button
                      key={o.value}
                      onClick={() => setGender(o.value)}
                      aria-label={o.label}
                      className="w-11 h-11 rounded-full overflow-hidden flex items-center justify-center shrink-0"
                      style={active ? { border: `2.5px solid ${GREEN}` } : { border: `1.5px solid ${BORDER}`, opacity: 0.7 }}
                    >
                      {faceImg ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={faceImg} alt={o.label} className="w-[200%] h-[200%] max-w-none object-cover -translate-x-1/4" />
                      ) : (
                        <span className="text-[13px] font-semibold" style={{ color: SUB }}>{o.label[0]}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            <select
              value={addStepCat}
              onChange={(e) => setAddStepCat(e.target.value)}
              className="w-full py-2.5 px-3 bg-white text-[14px] font-semibold rounded-xl mb-3"
              style={{ border: `1px solid ${BORDER}`, color: INK }}
            >
              <option value="all">All categories</option>
              {groupedCategories.map((g) => (
                <option key={g.id} value={g.id}>{g.name} ({g.cards.length})</option>
              ))}
            </select>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-6">
            {(() => {
              const groups = addStepCat === "all" ? groupedCategories : groupedCategories.filter((g) => g.id === addStepCat);
              if (groups.length === 0) return <p className="text-[12px] py-3" style={{ color: SUB }}>No cards available yet.</p>;
              return (
                <div className="space-y-4">
                  {groups.map((g) => (
                    <CategoryRow
                      key={g.id}
                      name={g.name}
                      cards={g.cards}
                      language={language}
                      gender={gender}
                      placedIds={placedIds}
                      isLockedCard={isLockedCard}
                      onAddCard={onAddCard}
                    />
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
}
