"use client";

// Mobile-only linear builder (compact).
// Row 1: Language + Category, then search.
// Row 2: Schedule type + contextual grid size.
// Canvas preview (updates live as the user changes type/cards).
// Row 3: Character — shown only when the selection includes character cards.
// Cards: 5 × 2 quick grid + "View all" full-page picker with added-counter.
// Export at the bottom.

import { useState, useEffect, useMemo } from "react";
import {
  GRID_SPECS,
  getDailySpec,
  A4_PORTRAIT,
  A4_LANDSCAPE,
  LANGUAGES,
  type Language,
  type ScheduleType,
  type Gender,
  type GridCols,
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
import type { CardImageMap } from "@/lib/card-data";

const SCHEDULE_TYPE_OPTIONS: { value: ScheduleType; label: string }[] = [
  { value: "daily", label: "Daily Schedule" },
  { value: "weekly", label: "Weekly Schedule" },
  { value: "custom", label: "Custom Schedule" },
  { value: "firstthen", label: "First/Then Board" },
];

const CHARACTER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "neutral", label: "Neutral" },
  { value: "boy", label: "Boy" },
  { value: "girl", label: "Girl" },
  { value: "brown", label: "Brown" },
];

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-[10px] tracking-widest uppercase text-[#8A8480] font-medium mb-0.5">
      {children}
    </div>
  );
}

const inputCls =
  "w-full py-2 px-2.5 border border-border bg-white font-sans text-[14px] text-ink rounded";

function CardTile({
  card,
  language,
  gender,
  isLocked,
  onAdd,
  size,
  placed,
}: {
  card: ParsedCard;
  language: Language;
  gender: Gender;
  isLocked: boolean;
  onAdd: (cardId: string) => void;
  size: "small" | "large";
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
      className="relative bg-white border border-[#C7D7B8] rounded active:scale-95 transition-transform overflow-hidden"
    >
      {isLocked && (
        <span className="absolute top-0.5 left-0.5 z-10 text-[8px] font-bold tracking-wide px-1 py-[1px] rounded-sm leading-tight bg-[#FBF0DD] text-[#9A6B12] border border-[#EBD3A0]">
          🔒
        </span>
      )}
      {placed && !justAdded && (
        <span className="absolute top-0.5 right-0.5 z-10 w-4 h-4 rounded-full bg-[#4A8A4A] flex items-center justify-center">
          <svg className="w-2.5 h-2.5 stroke-white stroke-[3] fill-none" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </span>
      )}
      {justAdded && (
        <span className="absolute inset-0 z-20 flex items-center justify-center bg-white/70">
          <span className="w-7 h-7 rounded-full bg-[#4A8A4A] flex items-center justify-center">
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
      <div
        className={`px-0.5 border-t border-[#F0F0F0] font-serif text-ink text-center leading-tight truncate ${
          size === "small" ? "py-0.5 text-[9px]" : "py-1.5 text-[12px]"
        }`}
      >
        {getCardLabel(card, language)}
      </div>
    </button>
  );
}

export function MobileScheduleBuilder({
  onAddCard,
  cardsLoaded,
  justDroppedSlot,
  cardImages,
}: {
  onAddCard: (cardId: string) => void;
  cardsLoaded: boolean;
  justDroppedSlot: string | null;
  cardImages: CardImageMap;
}) {
  const language = useScheduleState((s) => s.language);
  const setLanguage = useScheduleState((s) => s.setLanguage);
  const scheduleType = useScheduleState((s) => s.scheduleType);
  const setScheduleType = useScheduleState((s) => s.setScheduleType);
  const gridCols = useScheduleState((s) => s.gridCols);
  const setGridCols = useScheduleState((s) => s.setGridCols);
  const weekMode = useScheduleState((s) => s.weekMode);
  const setWeekMode = useScheduleState((s) => s.setWeekMode);
  const cardType = useScheduleState((s) => s.cardType);
  const setCardType = useScheduleState((s) => s.setCardType);
  const gender = useScheduleState((s) => s.gender);
  const setGender = useScheduleState((s) => s.setGender);
  const pages = useScheduleState((s) => s.pages);

  const { exportPDF, exportJPEG, exporting } = useExport();

  const [category, setCategory] = useState("");
  const search = useScheduleState((s) => s.uiSearch);
  const [adminCatNames, setAdminCatNames] = useState<Record<string, string>>({});
  const [catFlags, setCatFlags] = useState<Record<string, boolean>>({});
  const [flagsLoaded, setFlagsLoaded] = useState(false);
  const [showAll, setShowAll] = useState(false);
  const [freeOnly, setFreeOnly] = useState(false);
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
        const flags: Record<string, boolean> = {};
        (data?.categories || []).forEach((c: any) => {
          map[c.id] = c.name;
          flags[c.id] = !!c.hasCharacters;
        });
        setAdminCatNames(map);
        setCatFlags(flags);
        setFlagsLoaded(true);
      })
      .catch(() => {});
  }, []);

  // Lock body scroll while the full-page picker is open
  useEffect(() => {
    document.body.style.overflow = showAll ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [showAll]);

  const cards: ParsedCard[] = useMemo(() => {
    const db = getRuntimeCards();
    const ids = new Set(db.map((c) => c.id));
    return [...db, ...ALL_CARDS.filter((c) => !ids.has(c.id))];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardsLoaded]);

  const catName = (id: string) => adminCatNames[id] || id;

  const categoryOptions = useMemo(() => {
    const seen = new Set<string>();
    const opts: { id: string; name: string }[] = [];
    CATEGORIES.forEach((c: any) => {
      if (!seen.has(c.id)) {
        seen.add(c.id);
        opts.push({ id: c.id, name: adminCatNames[c.id] || c.name || c.id });
      }
    });
    cards.forEach((c) => {
      if (c.categoryId && !seen.has(c.categoryId)) {
        seen.add(c.categoryId);
        opts.push({ id: c.categoryId, name: catName(c.categoryId) });
      }
    });
    return opts;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards, adminCatNames]);

  const filteredCards = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cards.filter((card) => {
      const matchesCategory = !category || card.categoryId === category;
      const matchesSearch = q === "" || getCardLabel(card, language).toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [cards, category, search, language]);

  // Character row shows only for categories the admin marked as having characters
  // (All categories -> visible). Otherwise gender silently resets to Neutral.
  const categoryHasCharacterCards = useMemo(() => {
    const m: Record<string, boolean> = {};
    cards.forEach((c) => {
      if (isCharacterCard(c)) m[c.categoryId] = true;
    });
    return m;
  }, [cards]);
  const showCharacters =
    !category ||
    (flagsLoaded && category in catFlags
      ? !!catFlags[category]
      : !!categoryHasCharacterCards[category]);
  useEffect(() => {
    if (!showCharacters && gender !== "neutral") setGender("neutral");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCharacters]);

  // How many cards are placed (for the picker counter)
  const { placedCount, totalSlots } = useMemo(() => {
    if (scheduleType === "daily") {
      let placed = 0;
      let total = 0;
      const spec = getDailySpec(cardType, gridCols);
      const perPage = spec.slots;
      pages.forEach((p: any) => {
        total += perPage;
        (p.slots || []).forEach((s: any) => {
          if (s) placed++;
        });
      });
      return { placedCount: placed, totalSlots: total };
    }
    let placed = 0;
    pages.forEach((p: any) => {
      Object.values(p.columns || {}).forEach((col: any) => {
        placed += (col || []).length;
      });
    });
    return { placedCount: placed, totalSlots: 0 };
  }, [pages, scheduleType, gridCols, cardType]);

  const isLockedCard = (card: ParsedCard) =>
    (card as any).isFree === false && !hasSubscription;

  // Cards currently placed anywhere in the schedule (for the ✓ badge)
  // A character card whose variant images serve as the face avatars
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

  // Canvas preview zoom (zoom must be 1 while exporting — the capture engine
  // mis-renders fonts inside CSS zoom)
  const baseW =
    scheduleType === "daily" || scheduleType === "firstthen"
      ? A4_PORTRAIT.width
      : A4_LANDSCAPE.width;
  const [zoom, setZoom] = useState(0.42);
  useEffect(() => {
    const update = () => setZoom(Math.min(1, (window.innerWidth - 26) / baseW));
    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, [baseW]);

  return (
    <div className="px-3 pb-8 pt-2.5 space-y-3 bg-bg min-h-full">
      {/* Row 1: Language + Category, then search */}
      <section>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <SectionLabel>Language</SectionLabel>
            <select value={language} onChange={(e) => setLanguage(e.target.value as Language)} className={inputCls}>
              {Object.entries(LANGUAGES).map(([code, name]) => (
                <option key={code} value={code}>{name}</option>
              ))}
            </select>
          </div>
          <div>
            <SectionLabel>Category</SectionLabel>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
              <option value="">All categories</option>
              {categoryOptions.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

      </section>

      {/* Row 2: Schedule type + contextual grid */}
      <section>
        <div className={`grid gap-2 ${scheduleType === "daily" ? "grid-cols-2" : "grid-cols-1"}`}>
          <div>
            <SectionLabel>Schedule type</SectionLabel>
            <select
              value={scheduleType}
              onChange={(e) => setScheduleType(e.target.value as ScheduleType)}
              className={inputCls}
            >
              {SCHEDULE_TYPE_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          {scheduleType === "daily" && (
            <div>
              <SectionLabel>Card Type</SectionLabel>
              <select
                value={cardType}
                onChange={(e) => setCardType(e.target.value as "visual" | "equal" | "text")}
                className={inputCls}
              >
                <option value="visual">Visual Focus</option>
                <option value="equal">Equal Focus</option>
                <option value="text">Text Focus</option>
              </select>
            </div>
          )}
        </div>
        {scheduleType === "daily" && cardType === "visual" && (
          <div className="mt-2">
              <SectionLabel>Grid</SectionLabel>
              <div className="flex gap-1">
                {(Object.keys(GRID_SPECS) as unknown as GridCols[]).map((colsKey) => {
                  const cols = Number(colsKey) as GridCols;
                  const spec = GRID_SPECS[cols as 2 | 3 | 4];
                  const active = gridCols === cols;
                  return (
                    <button
                      key={cols}
                      onClick={() => setGridCols(cols)}
                      className={`flex-1 py-2 rounded border text-[12px] font-sans transition-colors ${
                        active
                          ? "border-[#7A8F5E] bg-[#E8EDE0] text-[#4A5A3E] font-semibold"
                          : "border-border bg-white text-ink"
                      }`}
                    >
                      {spec.cols}×{spec.rows}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        {scheduleType === "weekly" && (
          <div className="mt-2">
              <SectionLabel>Days</SectionLabel>
              <div className="flex gap-1">
                {[
                  { value: "week", label: "Full week" },
                  { value: "weekdays", label: "Weekdays" },
                ].map((o) => {
                  const active = weekMode === o.value;
                  return (
                    <button
                      key={o.value}
                      onClick={() => setWeekMode(o.value as "week" | "weekdays")}
                      className={`flex-1 py-2 rounded border text-[12px] font-sans transition-colors ${
                        active
                          ? "border-[#7A8F5E] bg-[#E8EDE0] text-[#4A5A3E] font-semibold"
                          : "border-border bg-white text-ink"
                      }`}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
          </div>
        )}
      </section>

      {/* Canvas preview */}
      <section>
        <SectionLabel>Your schedule</SectionLabel>
        <div className={exporting ? "w-full" : "w-full overflow-hidden rounded border border-border bg-white"}>
          <div style={{ zoom: exporting ? 1 : zoom }}>
            <ScheduleCanvas justDroppedSlot={justDroppedSlot} cardImages={cardImages} />
          </div>
        </div>
      </section>

      {/* Cards: 5 × 2 quick grid + View all */}
      <section>
        <div className="flex items-end justify-between mb-1 gap-2">
          <div className="text-[10px] tracking-widest uppercase text-[#8A8480] font-medium">
            Cards <span className="normal-case tracking-normal">(tap to add)</span>
          </div>
          {showCharacters && (
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
                    className={`w-9 h-9 rounded-full overflow-hidden border-2 shrink-0 transition-all ${
                      active
                        ? "border-[#4A8A4A] ring-2 ring-[#BCD9B4]"
                        : "border-[#D8D4CC] opacity-75"
                    }`}
                  >
                    {faceImg ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={faceImg}
                        alt={o.label}
                        className="w-[200%] h-[200%] max-w-none object-cover -translate-x-1/4"
                      />
                    ) : (
                      <span className="text-[10px] font-sans text-ink-3">{o.label[0]}</span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>
        {filteredCards.length === 0 ? (
          <div className="text-[12px] text-[#8A8480] font-sans py-3">
            No cards match — try another category or search.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-5 gap-1.5">
              {filteredCards.slice(0, 10).map((card) => (
                <CardTile
                  key={card.id}
                  card={card}
                  language={language}
                  gender={gender}
                  isLocked={isLockedCard(card)}
                  placed={placedIds.has(card.id)}
                  onAdd={onAddCard}
                  size="small"
                />
              ))}
            </div>
            {filteredCards.length > 10 && (
              <button
                onClick={() => setShowAll(true)}
                className="w-full mt-2 py-2 rounded border border-[#7A8F5E] text-[#4A5A3E] bg-white text-[13px] font-sans font-semibold"
              >
                View all {filteredCards.length} cards
              </button>
            )}
          </>
        )}
      </section>

      {/* Export */}
      <section className="space-y-2 pt-1">
        <SectionLabel>Export</SectionLabel>
        <button
          onClick={exportPDF}
          disabled={exporting}
          className="w-full py-3 rounded bg-[#4A5A3E] text-white font-sans text-[15px] font-semibold disabled:opacity-60"
        >
          {exporting ? "Preparing…" : "Download PDF"}
        </button>
        <button
          onClick={exportJPEG}
          disabled={exporting}
          className="w-full py-3 rounded border border-[#4A5A3E] text-[#4A5A3E] bg-white font-sans text-[15px] font-semibold disabled:opacity-60"
        >
          {exporting ? "Preparing…" : "Download JPEG"}
        </button>
      </section>

      {/* Full-page card picker */}
      {showAll && (
        <div className="fixed inset-0 z-50 bg-bg flex flex-col">
          <div className="shrink-0 flex items-center justify-between px-3 py-2.5 bg-white border-b border-border">
            <span className="text-[13px] font-sans text-ink-2">
              {scheduleType === "daily"
                ? `${placedCount}/${totalSlots} added`
                : `${placedCount} added`}
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFreeOnly(!freeOnly)}
                className={`px-3 py-1.5 rounded-full border text-[12px] font-sans ${
                  freeOnly
                    ? "border-[#7A8F5E] bg-[#E8EDE0] text-[#4A5A3E] font-semibold"
                    : "border-border bg-white text-ink-3"
                }`}
              >
                {freeOnly ? "Free only" : "All cards"}
              </button>
              <button
                onClick={() => setShowAll(false)}
                className="px-4 py-1.5 rounded bg-[#4A5A3E] text-white text-[13px] font-semibold"
              >
                Done
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
            {categoryOptions
              .filter((c) => !category || c.id === category)
              .map((c) => {
                const catCards = filteredCards.filter(
                  (card) =>
                    card.categoryId === c.id &&
                    (!freeOnly || (card as any).isFree !== false)
                );
                if (catCards.length === 0) return null;
                return (
                  <div key={c.id}>
                    <div className="text-[10px] tracking-widest uppercase text-[#8A8480] font-medium mb-1.5">
                      {c.name} ({catCards.length})
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {catCards.map((card) => (
                        <CardTile
                          key={card.id}
                          card={card}
                          language={language}
                          gender={gender}
                          isLocked={isLockedCard(card)}
                          placed={placedIds.has(card.id)}
                          onAdd={onAddCard}
                          size="large"
                        />
                      ))}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
