"use client";

// Mobile-only linear builder. Desktop keeps the original three-panel layout;
// this component renders INSTEAD of it on small screens (see ScheduleBuilder).
// Flow (top to bottom, one scroll):
//   1. Language
//   2. Category + search
//   3. Schedule type + grid size (grid only where it applies)
//   4. Character (style) selection
//   5. Card strip — tap a card to add it to the schedule
//   6. Live schedule preview (scaled to fit the phone)
//   7. Export buttons

import { useState, useEffect, useMemo } from "react";
import {
  GRID_SPECS,
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
    <div className="text-[11px] tracking-widest uppercase text-[#8A8480] font-medium mb-1.5">
      {children}
    </div>
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
  const gender = useScheduleState((s) => s.gender);
  const setGender = useScheduleState((s) => s.setGender);

  const { exportPDF, exportJPEG, exporting } = useExport();

  const [category, setCategory] = useState("");
  const [search, setSearch] = useState("");
  const [adminCatNames, setAdminCatNames] = useState<Record<string, string>>({});

  // Admin-defined category names (so new categories show properly)
  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const map: Record<string, string> = {};
        (data?.categories || []).forEach((c: { id: string; name: string }) => {
          map[c.id] = c.name;
        });
        setAdminCatNames(map);
      })
      .catch(() => {});
  }, []);

  // Merge DB cards with built-in cards (same rule the desktop sidebar uses)
  const cards: ParsedCard[] = useMemo(() => {
    const db = getRuntimeCards();
    const ids = new Set(db.map((c) => c.id));
    return [...db, ...ALL_CARDS.filter((c) => !ids.has(c.id))];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardsLoaded]);

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
        opts.push({ id: c.categoryId, name: adminCatNames[c.categoryId] || c.categoryId });
      }
    });
    return opts;
  }, [cards, adminCatNames]);

  const filteredCards = useMemo(() => {
    const q = search.trim().toLowerCase();
    return cards.filter((card) => {
      const matchesCategory = !category || card.categoryId === category;
      const matchesSearch =
        q === "" || getCardLabel(card, language).toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [cards, category, search, language]);

  // Scale the A4 canvas to the phone width. CSS zoom keeps layout height
  // correct automatically (unlike transform), so scrolling stays natural.
  const baseW = scheduleType === "daily" ? A4_PORTRAIT.width : A4_LANDSCAPE.width;
  const [zoom, setZoom] = useState(0.42);
  useEffect(() => {
    const update = () =>
      setZoom(Math.min(1, (window.innerWidth - 26) / baseW));
    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
    };
  }, [baseW]);

  return (
    <div className="px-3 pb-10 pt-3 space-y-5 bg-bg min-h-full">
      {/* 1. Language */}
      <section>
        <SectionLabel>Language</SectionLabel>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as Language)}
          className="w-full py-2.5 px-3 border border-border bg-white font-sans text-[15px] text-ink rounded"
        >
          {Object.entries(LANGUAGES).map(([code, name]) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </select>
      </section>

      {/* 2. Category + search */}
      <section>
        <SectionLabel>Find cards</SectionLabel>
        <div className="space-y-2">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full py-2.5 px-3 border border-border bg-white font-sans text-[15px] text-ink rounded"
          >
            <option value="">All categories</option>
            {categoryOptions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cards…"
            className="w-full py-2.5 px-3 border border-border bg-white font-sans text-[15px] text-ink rounded"
          />
        </div>
      </section>

      {/* 3. Schedule type + grid */}
      <section>
        <SectionLabel>Schedule type</SectionLabel>
        <select
          value={scheduleType}
          onChange={(e) => setScheduleType(e.target.value as ScheduleType)}
          className="w-full py-2.5 px-3 border border-border bg-white font-sans text-[15px] text-ink rounded"
        >
          {SCHEDULE_TYPE_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        {scheduleType === "daily" && (
          <div className="flex gap-2 mt-2">
            {(Object.keys(GRID_SPECS) as unknown as GridCols[]).map((colsKey) => {
              const cols = Number(colsKey) as GridCols;
              const spec = GRID_SPECS[cols as 2 | 3 | 4];
              const active = gridCols === cols;
              return (
                <button
                  key={cols}
                  onClick={() => setGridCols(cols)}
                  className={`flex-1 py-2 rounded border text-[13px] font-sans transition-colors ${
                    active
                      ? "border-[#7A8F5E] bg-[#E8EDE0] text-[#4A5A3E] font-semibold"
                      : "border-border bg-white text-ink"
                  }`}
                >
                  {spec.cols} × {spec.rows}
                </button>
              );
            })}
          </div>
        )}
      </section>

      {/* 4. Character selection */}
      <section>
        <SectionLabel>Character</SectionLabel>
        <div className="flex gap-2">
          {CHARACTER_OPTIONS.map((o) => {
            const active = gender === o.value;
            return (
              <button
                key={o.value}
                onClick={() => setGender(o.value)}
                className={`flex-1 py-2 rounded border text-[13px] font-sans transition-colors ${
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
      </section>

      {/* 5. Card strip — tap to add */}
      <section>
        <SectionLabel>
          Cards <span className="normal-case tracking-normal">(tap to add)</span>
        </SectionLabel>
        <div className="flex gap-2.5 overflow-x-auto pb-2 -mx-3 px-3 snap-x">
          {filteredCards.length === 0 && (
            <div className="text-[13px] text-[#8A8480] font-sans py-4">
              No cards match — try another category or search.
            </div>
          )}
          {filteredCards.map((card) => {
            const variant = getCardGender(card, gender);
            const img =
              getCardImageUrl(card.id, variant) ||
              getCardImageUrl(card.id, "neutral");
            return (
              <button
                key={card.id}
                onClick={() => onAddCard(card.id)}
                className="shrink-0 w-[96px] bg-white border border-[#C7D7B8] rounded snap-start active:scale-95 transition-transform"
              >
                <div className="w-full aspect-square flex items-center justify-center overflow-hidden rounded-t">
                  {img ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={img}
                      alt=""
                      className="w-full h-full object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <svg
                      className="w-6 h-6 stroke-[#C7D7B8] stroke-[1.5] fill-none"
                      viewBox="0 0 24 24"
                      strokeLinecap="round"
                    >
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  )}
                </div>
                <div className="px-1 py-1.5 border-t border-[#F0F0F0] text-[12px] font-serif text-ink text-center leading-tight truncate">
                  {getCardLabel(card, language)}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* 6. Live preview */}
      <section>
        <SectionLabel>Your schedule</SectionLabel>
        <div className="w-full overflow-hidden rounded border border-border bg-white">
          <div style={{ zoom }}>
            <ScheduleCanvas
              justDroppedSlot={justDroppedSlot}
              cardImages={cardImages}
            />
          </div>
        </div>
      </section>

      {/* 7. Export */}
      <section className="space-y-2">
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
    </div>
  );
}
