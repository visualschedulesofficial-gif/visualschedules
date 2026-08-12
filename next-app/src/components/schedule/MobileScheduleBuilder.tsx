"use client";

// Mobile-only builder — ONE scrolling page (no wizard steps).
//
// Order down the page, matching the design sketch:
//   1. Your schedule  — live preview of what's been built so far
//   2. Layouts        — tap a tile to switch layout
//   3. Visuals        — cards grouped by category (Daily, OT, …), tap to add
//   4. Create         — sticky button at the bottom, opens the download sheet
//
// Everything is visible at once, so there's no "next step" to find and no
// state to lose by going back. Language and character controls sit in the
// header and apply to the whole page.

import { useState, useEffect, useMemo } from "react";
import {
  LANGUAGES,
  type Language,
  type Gender,
} from "@/lib/constants";
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
import { LAYOUTS, isActiveLayout, type LayoutId } from "@/lib/layouts";
import { LayoutIcon } from "@/components/schedule/LayoutIcon";

// Kept in the signature so ScheduleBuilder.tsx doesn't need changing — the
// page no longer has steps, so this only decides whether to jump the user
// down to the cards on open.
type Step = "layout" | "cards" | "final";

const CHARACTER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "neutral", label: "Neutral" },
  { value: "boy", label: "Boy" },
  { value: "girl", label: "Girl" },
  { value: "brown", label: "Brown" },
];

function SectionLabel({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-2 mb-1.5">
      <div className="text-[14px] tracking-wide uppercase text-[#3A3733] font-semibold">
        {children}
      </div>
      {right}
    </div>
  );
}

function Divider() {
  return <div className="border-t border-[#D8D4CC] my-4" />;
}

function CardTile({
  card,
  language,
  gender,
  isLocked,
  onAdd,
  placed,
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
        if (isLocked) {
          window.location.href = "/plans";
          return;
        }
        onAdd(card.id);
        setJustAdded(true);
        setTimeout(() => setJustAdded(false), 1200);
      }}
      className="relative w-full min-w-0 block bg-white border border-[#C7D7B8] rounded active:scale-95 transition-transform overflow-hidden"
    >
      {isLocked && (
        <span className="absolute top-0.5 left-0.5 z-10 text-[12px] font-bold tracking-wide px-1 py-[1px] rounded-sm leading-tight bg-[#FBF0DD] text-[#9A6B12] border border-[#EBD3A0]">
          🔒
        </span>
      )}
      {placed && !justAdded && (
        <span className="absolute top-0.5 right-0.5 z-10 w-4 h-4 rounded-full bg-success flex items-center justify-center">
          <svg className="w-2.5 h-2.5 stroke-white stroke-[3] fill-none" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
      )}
      {justAdded && (
        <span className="absolute inset-0 z-20 flex items-center justify-center bg-white/70">
          <span className="w-7 h-7 rounded-full bg-success flex items-center justify-center">
            <svg className="w-4 h-4 stroke-white stroke-[3] fill-none" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </span>
        </span>
      )}
      <div className="w-full aspect-square flex items-center justify-center overflow-hidden">
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt="" className="w-full h-full object-contain" loading="lazy" />
        ) : (
          <svg className="w-5 h-5 stroke-[#C7D7B8] stroke-[1.5] fill-none" viewBox="0 0 24 24" strokeLinecap="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        )}
      </div>
      <div className="px-0.5 py-1.5 border-t border-[#F0F0F0] font-serif text-ink text-center leading-tight truncate text-[12px]">
        {getCardLabel(card, language)}
      </div>
    </button>
  );
}

// One category block: a heading, then its cards. Long categories start as a
// single swipeable row and expand to a full grid on demand, so a category
// with 80 cards never buries the rest of the page.
function CategoryRow({
  name,
  cards,
  language,
  gender,
  placedIds,
  isLockedCard,
  onAddCard,
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
      <div className="flex items-center justify-between gap-2 mb-1.5">
        <span className="text-[13px] font-sans font-semibold text-ink">
          {name} <span className="text-ink-3 font-medium">({cards.length})</span>
        </span>
        {tooMany && (
          <button
            onClick={() => setExpanded((v) => !v)}
            className="text-[12px] font-sans font-semibold text-accent-strong shrink-0"
          >
            {expanded ? "Show less" : `See all ${cards.length}`}
          </button>
        )}
      </div>

      {expanded || !tooMany ? (
        <div className="grid grid-cols-3 gap-2">
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
      ) : (
        // Swipeable row — matches the sketch and keeps each category to one line
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-3 px-3 snap-x">
          {shown.map((card) => (
            <div key={card.id} className="w-[30%] shrink-0 snap-start">
              <CardTile
                card={card}
                language={language}
                gender={gender}
                isLocked={isLockedCard(card)}
                placed={placedIds.has(card.id)}
                onAdd={onAddCard}
              />
            </div>
          ))}
        </div>
      )}
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
  const cardType = useScheduleState((s) => s.cardType);
  const miniCardCount = useScheduleState((s) => s.miniCardCount);
  const gender = useScheduleState((s) => s.gender);
  const setGender = useScheduleState((s) => s.setGender);
  const pages = useScheduleState((s) => s.pages);

  const { exportPNG, exportJPEG, exporting } = useExport();

  // Landscape schedules (weekly/custom/timetable) don't suit phone screens —
  // if one was opened here (e.g. edited earlier on desktop), fall back to Daily.
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
        (data?.categories || []).forEach((c: any) => {
          map[c.id] = c.name;
        });
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

  // Every category that actually has cards, in a stable order, each with its
  // cards attached — this drives the whole Visuals section.
  const groupedCategories = useMemo(() => {
    const order: string[] = [];
    const seen = new Set<string>();
    CATEGORIES.forEach((c: any) => {
      if (!seen.has(c.id)) { seen.add(c.id); order.push(c.id); }
    });
    cards.forEach((c) => {
      if (c.categoryId && !seen.has(c.categoryId)) { seen.add(c.categoryId); order.push(c.categoryId); }
    });

    const byCat = new Map<string, ParsedCard[]>();
    cards.forEach((card) => {
      const key = card.categoryId || "other";
      if (!byCat.has(key)) byCat.set(key, []);
      byCat.get(key)!.push(card);
    });

    const groups = order
      .filter((id) => (byCat.get(id) || []).length > 0)
      .map((id) => ({ id, name: catName(id), cards: byCat.get(id)! }));

    // Anything with no known category still needs somewhere to live
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

  const isLockedCard = (card: ParsedCard) =>
    (card as any).isFree === false && !hasSubscription;

  const faceCard = useMemo(() => cards.find((c) => isCharacterCard(c)) || null, [cards]);

  const placedIds = useMemo(() => {
    const ids = new Set<string>();
    pages.forEach((p: any) => {
      (p.slots || []).forEach((s: any) => s?.cardId && ids.add(s.cardId));
      Object.values(p.columns || {}).forEach((col: any) =>
        (col || []).forEach((e: any) => e?.cardId && ids.add(e.cardId))
      );
    });
    return ids;
  }, [pages]);

  const { placedCount, totalSlots } = useMemo(() => {
    const p = pages[0] as any;
    if (scheduleType === "daily") {
      const placed = (p?.slots || []).filter((s: any) => !!s).length;
      return { placedCount: placed, totalSlots: p?.slots?.length || 0 };
    }
    if (scheduleType === "mini") {
      return { placedCount: (p?.columns?.["0"] || []).length, totalSlots: miniCardCount };
    }
    if (scheduleType === "iwant") {
      return { placedCount: (p?.columns?.["cutout"] || []).length, totalSlots: 6 };
    }
    if (scheduleType === "firstthen") {
      return { placedCount: (p?.columns?.["cutout"] || []).length, totalSlots: 0 };
    }
    return { placedCount: 0, totalSlots: 0 };
  }, [pages, scheduleType, miniCardCount]);

  // Preview zoom — the canvas is A4-wide, the phone is not.
  const [zoom, setZoom] = useState(0.5);
  useEffect(() => {
    const update = () => setZoom(Math.min(1, (window.innerWidth - 26) / A4_PORTRAIT.width));
    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, []);

  // Opened from a saved schedule or ?start=cards — skip past the preview and
  // layouts straight to the cards, since the layout is already chosen.
  useEffect(() => {
    if (initialStep === "cards") {
      const el = document.getElementById("visuals-section");
      if (el) setTimeout(() => el.scrollIntoView({ behavior: "smooth", block: "start" }), 300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeLayoutState = { scheduleType, cardType, miniCardCount };

  const pickLayout = (apply: () => void, id: LayoutId) => {
    if (!isActiveLayout(id, activeLayoutState) && placedIds.size > 0) {
      const ok = window.confirm("Changing layout clears the cards you've added. Continue?");
      if (!ok) return;
    }
    apply();
  };

  const [showDownload, setShowDownload] = useState(false);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-full py-24">
        <div className="w-6 h-6 border-2 border-border border-t-accent-strong rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="px-3 pb-24 pt-2.5 bg-bg min-h-full">
      {orgBanner && (
        <div className="flex items-center justify-between gap-2 bg-accent-soft border border-weekly-accent rounded px-3 py-2 mb-3">
          <span className="text-[12px] text-accent-strong font-sans">
            Branding: <span className="font-semibold">{orgBanner.name}</span> (code {orgBanner.code})
          </span>
          <button onClick={leaveOrgCode} className="text-[12px] font-sans font-semibold text-[#C53030] underline shrink-0">
            Not you? Leave
          </button>
        </div>
      )}

      {/* Header — language applies to the whole page */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <h1 className="font-serif text-[20px] text-ink">Visual Schedule</h1>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as Language)}
          className="py-1.5 px-2 border border-border bg-white font-sans text-[13px] text-ink rounded shrink-0"
          aria-label="Language"
        >
          {Object.entries(LANGUAGES).map(([code, name]) => (
            <option key={code} value={code}>{name}</option>
          ))}
        </select>
      </div>

      {/* 1 · Your schedule so far */}
      <section>
        <SectionLabel
          right={
            totalSlots > 0 ? (
              <span className="text-[12px] font-sans text-ink-2">{placedCount}/{totalSlots} added</span>
            ) : undefined
          }
        >
          Your schedule
        </SectionLabel>
        <div className={exporting ? "w-full" : "w-full overflow-hidden rounded border border-border bg-white"}>
          <div style={{ zoom: exporting ? 1 : zoom }}>
            <ScheduleCanvas justDroppedSlot={justDroppedSlot} cardImages={cardImages} />
          </div>
        </div>
      </section>

      <Divider />

      {/* 2 · Layouts */}
      <section>
        <SectionLabel>Layouts</SectionLabel>
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-3 px-3 snap-x">
          {LAYOUTS.map((l) => {
            const active = isActiveLayout(l.id, activeLayoutState);
            return (
              <button
                key={l.id}
                onClick={() => pickLayout(l.apply, l.id)}
                className={`w-[30%] shrink-0 snap-start flex flex-col items-center gap-2 py-3 px-2 rounded border bg-white active:scale-95 transition-transform ${
                  active ? "border-accent-strong ring-2 ring-[#BCD9B4]" : "border-[#D8D4CC]"
                }`}
              >
                <LayoutIcon cells={l.cells} cols={l.cols} />
                <span className="text-[12px] font-sans font-semibold text-ink text-center leading-tight">{l.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <Divider />

      {/* 3 · Visuals, grouped by category */}
      <section id="visuals-section">
        <SectionLabel
          right={
            showCharacters ? (
              <div className="flex gap-1.5">
                {CHARACTER_OPTIONS.map((o) => {
                  const active = gender === o.value;
                  const faceImg = faceCard
                    ? getCardImageUrl(faceCard.id, o.value) || getCardImageUrl(faceCard.id, "neutral")
                    : null;
                  return (
                    <button
                      key={o.value}
                      onClick={() => setGender(o.value)}
                      aria-label={o.label}
                      title={o.label}
                      className={`w-8 h-8 rounded-full overflow-hidden border shrink-0 transition-all ${
                        active ? "border-success ring-2 ring-[#BCD9B4]" : "border-[#D8D4CC] opacity-75"
                      }`}
                    >
                      {faceImg ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={faceImg} alt={o.label} className="w-[200%] h-[200%] max-w-none object-cover -translate-x-1/4" />
                      ) : (
                        <span className="text-[12px] font-sans text-ink-3">{o.label[0]}</span>
                      )}
                    </button>
                  );
                })}
              </div>
            ) : undefined
          }
        >
          Visuals <span className="normal-case tracking-normal font-medium text-ink-2 text-[12px]">(tap to add)</span>
        </SectionLabel>

        {groupedCategories.length === 0 ? (
          <p className="text-[12px] text-ink-2 font-sans py-3">No cards available yet.</p>
        ) : (
          <div className="space-y-3">
            {groupedCategories.map((g) => (
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
        )}
      </section>

      {/* 4 · Create — always reachable */}
      <div className="fixed bottom-0 left-0 right-0 px-3 pb-3 pt-2 bg-gradient-to-t from-bg via-bg to-transparent">
        <button
          onClick={() => setShowDownload(true)}
          className="w-full py-3 rounded bg-accent-strong text-white font-sans text-[15px] font-semibold shadow-lg"
        >
          Create
        </button>
      </div>

      {/* Download sheet */}
      {showDownload && (
        <div
          className="fixed inset-0 z-[300] bg-ink/50 flex items-end justify-center"
          onClick={() => setShowDownload(false)}
        >
          <div
            className="bg-white w-full rounded-t-xl p-4 space-y-2"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-serif text-[17px] text-ink mb-1">Download your schedule</p>
            <button
              onClick={exportPNG}
              disabled={exporting}
              className="w-full flex items-center justify-center gap-2 py-3 rounded bg-accent-strong text-white font-sans text-[14px] font-semibold disabled:opacity-60"
            >
              <svg className="w-5 h-5 stroke-white stroke-[2] fill-none" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              {exporting ? "Preparing…" : "Download PNG"}
            </button>
            <button
              onClick={exportJPEG}
              disabled={exporting}
              className="w-full flex items-center justify-center gap-2 py-3 rounded border border-accent-strong text-accent-strong bg-white font-sans text-[14px] font-semibold disabled:opacity-60"
            >
              <svg className="w-5 h-5 stroke-accent-strong stroke-[2] fill-none" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="7 10 12 15 17 10" />
                <line x1="12" y1="15" x2="12" y2="3" />
              </svg>
              {exporting ? "Preparing…" : "Download Image"}
            </button>
            <button
              onClick={() => setShowDownload(false)}
              className="w-full py-2.5 text-[13px] font-sans text-ink-2"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
