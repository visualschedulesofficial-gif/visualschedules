"use client";

import { useState, useMemo } from "react";
import { useDraggable } from "@dnd-kit/core";
import { CATEGORIES, ALL_CARDS, getCardLabel, getCardImageUrl, type ParsedCard } from "@/lib/card-data";
import { useScheduleState } from "@/hooks/useScheduleState";
import { LANGUAGES, type ScheduleType, type Language, type Gender } from "@/lib/constants";

function DraggableCard({ card, lang, gender, onCardClick }: { card: ParsedCard; lang: string; gender: string; onCardClick?: (id: string) => void }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: card.id,
  });

  const label = getCardLabel(card, lang);
  const imageUrl = getCardImageUrl(card.id, gender);

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onDoubleClick={() => onCardClick?.(card.id)}
      className={`bg-surface border border-border select-none relative flex flex-col overflow-hidden touch-none
        ${isDragging
          ? "opacity-30 border-accent/50 shadow-none"
          : "cursor-grab hover:shadow-[0_3px_10px_rgba(0,0,0,0.1)] hover:-translate-y-px active:cursor-grabbing transition-[transform,box-shadow] duration-150"
        }
      `}
    >
      <div className="w-full h-[60px] bg-surface flex items-center justify-center overflow-hidden">
        {imageUrl ? (
          <img src={imageUrl} alt={label} className="w-full h-full object-contain" loading="lazy" />
        ) : (
          <svg
            className="w-5 h-5 stroke-[#CCC] stroke-[1.5] fill-none"
            viewBox="0 0 24 24"
            strokeLinecap="round"
          >
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        )}
      </div>
      <div className="px-1 py-1 bg-surface border-t border-[#EEE] text-[11px] text-[#2C2C2C] text-center leading-tight font-sans line-clamp-2 min-h-[28px] flex items-center justify-center">
        {label}
      </div>
    </div>
  );
}

export function CardLibrarySidebar({ onCardClick }: { onCardClick?: (id: string) => void }) {
  const [search, setSearch] = useState("");
  const [selectedCat, setSelectedCat] = useState("all");

  const language = useScheduleState((s) => s.language);
  const scheduleType = useScheduleState((s) => s.scheduleType);
  const gender = useScheduleState((s) => s.gender);
  const setScheduleType = useScheduleState((s) => s.setScheduleType);
  const setLanguage = useScheduleState((s) => s.setLanguage);
  const setGender = useScheduleState((s) => s.setGender);

  const filtered = useMemo(() => {
    return ALL_CARDS.filter((card) => {
      const label = getCardLabel(card, language);
      const enLabel = card.translations["en"] || "";
      const matchSearch =
        label.toLowerCase().includes(search.toLowerCase()) ||
        enLabel.toLowerCase().includes(search.toLowerCase());
      const matchCat = selectedCat === "all" || card.categoryId === selectedCat;
      return matchSearch && matchCat;
    });
  }, [search, selectedCat, language]);

  const activeCat = CATEGORIES.find((c) => c.id === selectedCat);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Schedule Type */}
      <div className="p-3 pb-0 shrink-0 border-b border-border">
        <label className="text-[12px] tracking-widest uppercase text-[#8A8480] mb-2 block font-medium">
          Schedule Type
        </label>
        <div className="flex gap-[2px] mb-3">
          {(["daily", "weekly", "custom", "firstthen"] as ScheduleType[]).map((type) => (
            <button
              key={type}
              onClick={() => setScheduleType(type)}
              className={`flex-1 py-[6px] text-[12px] border font-sans text-center transition-all font-medium
                ${scheduleType === type
                  ? "bg-ink text-white border-ink"
                  : "border-border text-ink-3 hover:bg-ink hover:text-white hover:border-ink"
                }`}
            >
              {type === "firstthen" ? "1st-Then" : type.charAt(0).toUpperCase() + type.slice(1)}
            </button>
          ))}
        </div>

        {/* Language + Character row */}
        <div className="flex gap-1.5 mb-3">
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className="flex-1 py-[6px] px-2 border border-border bg-surface font-sans text-[13px] text-ink-2 outline-none cursor-pointer font-medium focus:border-accent"
          >
            {Object.entries(LANGUAGES).map(([code, name]) => (
              <option key={code} value={code}>{name}</option>
            ))}
          </select>
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value as Gender)}
            className="flex-1 py-[6px] px-2 border border-border bg-surface font-sans text-[13px] text-ink-2 outline-none cursor-pointer font-medium focus:border-accent"
          >
            <option value="neutral">Glasses</option>
            <option value="boy">Boy</option>
            <option value="girl">Girl</option>
            <option value="brown">Curly Hair</option>
          </select>
        </div>
      </div>

      {/* Search + Category */}
      <div className="p-2.5 pb-0 shrink-0">
        <div className="relative">
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 stroke-ink-3 stroke-2 fill-none pointer-events-none"
            viewBox="0 0 24 24"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Search cards..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full py-[0.42rem] pl-8 pr-2.5 border border-border bg-surface-hover font-sans text-[13px] text-ink outline-none focus:border-accent mb-1.5"
          />
        </div>
        <select
          value={selectedCat}
          onChange={(e) => setSelectedCat(e.target.value)}
          className="w-full py-[0.42rem] px-2.5 border border-border bg-surface font-sans text-[13px] text-ink-2 outline-none cursor-pointer font-medium"
        >
          <option value="all">All Categories ({ALL_CARDS.length})</option>
          {CATEGORIES.map((cat) => {
            const count = ALL_CARDS.filter((c) => c.categoryId === cat.id).length;
            return (
              <option key={cat.id} value={cat.id}>
                {cat.name} ({count}) {cat.isFree ? "— Free" : ""}
              </option>
            );
          })}
        </select>
      </div>

      {/* Category badge */}
      <div className="px-2.5 py-1.5 flex items-center gap-1.5 border-b border-border shrink-0 text-xs text-ink-3">
        {(activeCat?.isFree ?? true) ? (
          <span className="bg-badge-free-bg text-badge-free-text px-[5px] py-[1px] text-[9px] font-medium tracking-wider">FREE</span>
        ) : (
          <span className="bg-badge-paid-bg text-badge-paid-text px-[5px] py-[1px] text-[9px] font-medium tracking-wider">PRO</span>
        )}
        <span className="text-[11px]">{filtered.length} cards</span>
      </div>

      {/* Card grid */}
      <div className="flex-1 overflow-y-auto p-2">
        {selectedCat === "all" ? (
          CATEGORIES.map((cat) => {
            const catCards = filtered.filter((c) => c.categoryId === cat.id);
            if (catCards.length === 0) return null;
            return (
              <div key={cat.id} className="mb-3 last:mb-0">
                <div className="flex items-center gap-1.5 mb-1 px-0.5 sticky top-0 bg-surface py-1 z-[1]">
                  <span className={`px-[5px] py-[1px] text-[9px] font-medium tracking-wider ${cat.isFree ? "bg-badge-free-bg text-badge-free-text" : "bg-badge-paid-bg text-badge-paid-text"}`}>
                    {cat.isFree ? "FREE" : "PRO"}
                  </span>
                  <span className="text-[11px] text-ink-3 font-medium">{cat.name}</span>
                  <span className="text-[10px] text-ink-3/60">({catCards.length})</span>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  {catCards.map((card) => (
                    <DraggableCard key={card.id} card={card} lang={language} gender={gender} onCardClick={onCardClick} />
                  ))}
                </div>
              </div>
            );
          })
        ) : (
          <div className="grid grid-cols-2 gap-1.5">
            {filtered.map((card) => (
              <DraggableCard key={card.id} card={card} lang={language} gender={gender} onCardClick={onCardClick} />
            ))}
          </div>
        )}
      </div>

      {/* Unlock banner */}
      <div className="px-2.5 py-2 bg-badge-paid-bg border-t border-[#F0D8B8] shrink-0">
        <p className="text-[12px] text-accent leading-relaxed mb-1.5">
          Unlock all categories with a license key
        </p>
        <button
          onClick={() => window.location.href = "/login"}
          className="w-full text-[12px] tracking-wider uppercase py-[0.45rem] bg-accent text-white border-none cursor-pointer font-sans font-medium hover:bg-accent-hover"
        >
          Unlock All Packs
        </button>
      </div>
    </div>
  );
}
