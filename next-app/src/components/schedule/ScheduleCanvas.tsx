"use client";

import { useDroppable } from "@dnd-kit/core";
import { GRID_SPECS, A4_PORTRAIT, A4_LANDSCAPE, LANGUAGES, DAYS, DAY_KEYS, MAX_WEEKLY_CARDS, MAX_CUSTOM_CARDS } from "@/lib/constants";
import { ALL_CARDS, getCardLabel, getCardImageUrl } from "@/lib/card-data";
import { useScheduleState } from "@/hooks/useScheduleState";
import type { DailyPageData, ColumnPageData } from "@/types/schedule";

function DailyDropSlot({ slotIdx, pageIdx, justDropped }: { slotIdx: number; pageIdx: number; justDropped: boolean }) {
  const pages = useScheduleState((s) => s.pages);
  const removeCard = useScheduleState((s) => s.removeCard);
  const placeCard = useScheduleState((s) => s.placeCard);
  const cardStyle = useScheduleState((s) => s.cardStyle);
  const language = useScheduleState((s) => s.language);
  const gender = useScheduleState((s) => s.gender);
  const page = pages[pageIdx] as DailyPageData;
  const cardRef = page?.slots?.[slotIdx] ?? null;
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  const { setNodeRef, isOver, active } = useDroppable({
    id: `${pageIdx}-${slotIdx}`,
  });

  const card = cardRef ? ALL_CARDS.find((c) => c.id === cardRef.cardId) : null;
  const imageUrl = card ? getCardImageUrl(card.id, gender) : null;
  const isDragging = !!active;
  const isBlack = cardStyle === "black";

  const handleMobileClick = () => {
    if (isMobile && !cardRef) {
      const firstCard = ALL_CARDS[0];
      if (firstCard) {
        placeCard(pageIdx, String(slotIdx), { cardId: firstCard.id, catId: firstCard.categoryId });
      }
    }
  };

  return (
    <div
      ref={setNodeRef}
      onClick={handleMobileClick}
      className={`relative flex flex-col items-center justify-center overflow-hidden
        ${!cardRef
          ? `border-[1.5px] border-dashed transition-[border-color,background-color,transform] duration-200 ease-out
             ${isOver ? "border-accent bg-accent/10 scale-[1.03]" : isDragging ? "border-accent/30 bg-accent/[0.03]" : "border-[#CCC] bg-white"}
             ${isMobile ? "cursor-pointer" : ""}
            `
          : `border-[1.5px] border-solid border-[#E0E0E0] group ${isBlack ? "bg-ink" : "bg-white"}`
        }
        ${justDropped ? "animate-[cardLand_350ms_cubic-bezier(0.34,1.56,0.64,1)]" : ""}
      `}
    >
      {cardRef && card ? (
        <>
          <div className="absolute inset-0 flex flex-col">
            <div className={`flex-[0_0_70%] flex items-center justify-center overflow-hidden ${isBlack ? "bg-[#2A2825]" : "bg-white"}`}>
              {imageUrl ? (
                <img src={imageUrl} alt={getCardLabel(card, language)} className="w-full h-full object-contain" />
              ) : (
                <svg className={`w-10 h-10 stroke-[1.4] fill-none ${isBlack ? "stroke-[#666]" : "stroke-[#CCC]"}`} viewBox="0 0 24 24" strokeLinecap="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              )}
            </div>
            <div className={`flex-[0_0_30%] flex items-center justify-center px-1 border-t-[1.5px] ${isBlack ? "border-[#333] bg-ink" : "border-[#F0F0F0] bg-white"}`}>
              <span className={`text-[17px] text-center leading-tight font-sans ${isBlack ? "text-white" : "text-[#2C2C2C]"}`}>
                {getCardLabel(card, language)}
              </span>
            </div>
          </div>
          {/* Green token for mobile */}
          {isMobile && (
            <div className="absolute top-2 left-2 w-3 h-3 bg-green-500 rounded-full border border-green-700 z-[2]" />
          )}
          <button
            onClick={(e) => {
              e.stopPropagation();
              removeCard(pageIdx, String(slotIdx));
            }}
            className="absolute top-[5px] right-[5px] w-[18px] h-[18px] bg-white/90 border border-[#DDD] rounded-full hidden group-hover:flex items-center justify-center cursor-pointer text-[13px] text-[#666] leading-none z-[3] hover:bg-ink hover:text-white hover:border-ink transition-colors"
          >
            &times;
          </button>
        </>
      ) : (
        <div className={`flex flex-col items-center gap-[5px] transition-transform duration-200 ${isOver ? "scale-125" : ""}`}>
          <svg className={`w-[18px] h-[18px] stroke-[1.5] fill-none transition-[stroke] duration-200 ${isOver ? "stroke-accent" : isDragging ? "stroke-accent/40" : "stroke-[#CCC]"}`} viewBox="0 0 24 24" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span className={`text-xs font-medium transition-[color] duration-200 ${isOver ? "text-accent" : isDragging ? "text-accent/40" : "text-[#CCC]"}`}>
            {isOver ? "Release" : isMobile ? "Tap to add" : "Drop"}
          </span>
        </div>
      )}
    </div>
  );
}

function WeeklyColumn({ dayKey, dayName, pageIdx, justDroppedSlot }: { dayKey: string; dayName: string; pageIdx: number; justDroppedSlot: string | null }) {
  const pages = useScheduleState((s) => s.pages);
  const removeCard = useScheduleState((s) => s.removeCard);
  const placeCard = useScheduleState((s) => s.placeCard);
  const language = useScheduleState((s) => s.language);
  const gender = useScheduleState((s) => s.gender);
  const page = pages[pageIdx] as ColumnPageData;
  const cards = page?.columns?.[dayKey] || [];
  const isMobile = typeof window !== "undefined" && window.innerWidth < 768;

  const droppableId = `${pageIdx}-${dayKey}`;
  const { setNodeRef, isOver, active } = useDroppable({ id: droppableId });
  const isDragging = !!active;

  const handleMobileAddClick = () => {
    if (isMobile && cards.length < MAX_WEEKLY_CARDS) {
      const firstCard = ALL_CARDS[0];
      if (firstCard) {
        placeCard(pageIdx, dayKey, { cardId: firstCard.id, catId: firstCard.categoryId });
      }
    }
  };

  return (
    <div className="flex flex-col border-r border-r-weekly-border last:border-r-0 min-w-0 overflow-hidden">
      <div className="bg-weekly-head-bg border-b border-b-weekly-border px-2 py-3 text-center shrink-0">
        <div className="font-serif text-[18px] italic text-weekly-head-text tracking-wide">{dayName}</div>
      </div>
      <div
        ref={setNodeRef}
        onClick={handleMobileAddClick}
        className={`flex-1 flex flex-col gap-1 p-1 justify-center transition-colors duration-150
          ${isOver ? "bg-weekly-hover" : "bg-weekly-body-bg"}
          ${isMobile && cards.length < MAX_WEEKLY_CARDS ? "cursor-pointer" : ""}
        `}
      >
        {cards.map((cardRef, idx) => {
          const card = ALL_CARDS.find((c) => c.id === cardRef.cardId);
          if (!card) return null;
          const imageUrl = getCardImageUrl(card.id, gender);
          return (
            <div key={idx} className="bg-white border border-[#E0E5D5] flex flex-col relative group flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 flex items-center justify-center overflow-hidden bg-white min-h-0">
                {imageUrl ? (
                  <img src={imageUrl} alt={getCardLabel(card, language)} className="w-full h-full object-contain" />
                ) : (
                  <svg className="w-7 h-7 stroke-[#CCC] stroke-[1.4] fill-none" viewBox="0 0 24 24" strokeLinecap="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                )}
              </div>
              <div className="px-2 py-2 border-t border-[#F0F0F0] bg-white text-[14px] text-ink text-center leading-tight font-sans shrink-0">
                {getCardLabel(card, language)}
              </div>
              {/* Green token for mobile */}
              {isMobile && (
                <div className="absolute top-1.5 left-1.5 w-2.5 h-2.5 bg-green-500 rounded-full border border-green-700 z-[2]" />
              )}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeCard(pageIdx, dayKey, idx);
                }}
                className="absolute top-1 right-1 w-[15px] h-[15px] bg-white/90 border border-[#DDD] rounded-full hidden group-hover:flex items-center justify-center cursor-pointer text-[11px] text-[#888] leading-none z-[3] hover:bg-ink hover:text-white hover:border-ink"
              >
                &times;
              </button>
            </div>
          );
        })}
        {cards.length < MAX_WEEKLY_CARDS && (
          <div className={`flex items-center justify-center shrink-0 h-7 border border-dashed rounded transition-colors duration-150 ${isOver ? "border-weekly-accent bg-weekly-hover" : isDragging ? "border-weekly-border" : "border-transparent"}`}>
            {(isDragging || isOver) && (
              <svg className={`w-3 h-3 stroke-[1.8] fill-none ${isOver ? "stroke-weekly-accent" : "stroke-weekly-border"}`} viewBox="0 0 24 24" strokeLinecap="round">
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function DailyPage({ pageIdx, justDroppedSlot }: { pageIdx: number; justDroppedSlot: string | null }) {
  const gridCols = useScheduleState((s) => s.gridCols);
  const title = useScheduleState((s) => s.title);
  const language = useScheduleState((s) => s.language);
  const spec = GRID_SPECS[gridCols];

  return (
    <div
      data-a4-page
      className="shrink-0 bg-white shadow-[0_4px_32px_rgba(0,0,0,0.22)] flex flex-col overflow-hidden relative box-border"
      style={{ width: A4_PORTRAIT.width, height: A4_PORTRAIT.height, padding: "36px 48px 0" }}
    >
      <div className="shrink-0 grid grid-cols-[1fr_auto_1fr] items-end pb-2.5 border-b border-[#EEE] mb-2.5">
        <div className="col-start-2">
          <h2 className="font-serif text-[22px] italic text-ink leading-none text-center">{title}</h2>
        </div>
        <div className="col-start-3 justify-self-end">
          <span className="text-[14px] tracking-wider text-[#8A8480] border border-border px-2.5 py-1 font-medium">{LANGUAGES[language] || language}</span>
        </div>
      </div>
      <div className="shrink-0 overflow-hidden">
        <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${spec.cols}, ${spec.cellW}px)`, gridTemplateRows: `repeat(${spec.rows}, ${spec.cellH}px)` }}>
          {Array.from({ length: spec.slots }).map((_, i) => (
            <DailyDropSlot key={i} slotIdx={i} pageIdx={pageIdx} justDropped={justDroppedSlot === `${pageIdx}-${i}`} />
          ))}
        </div>
      </div>
      <div className="flex-1" />
      <div className="shrink-0 py-1.5 pb-4 border-t border-bg-muted flex justify-between items-end">
        <div className="flex items-baseline gap-1.5">
          <span className="font-serif text-[13px] italic text-[#AAA]">Grow Gently</span>
          <span className="text-[13px] text-[#C0C0C0]">in collab with <a href="https://dataorc.in" className="text-[#AAA] underline">DataOrc</a></span>
        </div>
        <span className="text-xs text-[#AAA] tracking-wider">visualschedule.app</span>
      </div>
    </div>
  );
}

function WeeklyPage({ pageIdx, justDroppedSlot }: { pageIdx: number; justDroppedSlot: string | null }) {
  const title = useScheduleState((s) => s.title);
  const language = useScheduleState((s) => s.language);
  const weekMode = useScheduleState((s) => s.weekMode);

  const days = weekMode === "weekdays" ? DAYS.slice(1, 6) : [...DAYS];
  const dayKeys = weekMode === "weekdays" ? DAY_KEYS.slice(1, 6) : [...DAY_KEYS];

  return (
    <div
      data-a4-page
      className="shrink-0 bg-white shadow-[0_4px_32px_rgba(0,0,0,0.22)] flex flex-col overflow-hidden relative box-border"
      style={{ width: A4_LANDSCAPE.width, height: A4_LANDSCAPE.height, padding: "28px 32px 24px" }}
    >
      <div className="text-center pb-3 border-b border-weekly-border mb-3 shrink-0">
        <h2 className="font-serif text-[28px] italic text-weekly-head-text leading-none">{title}</h2>
      </div>
      <div className="flex-1 min-h-0 grid border border-weekly-border rounded-sm overflow-hidden" style={{ gridTemplateColumns: `repeat(${days.length}, 1fr)` }}>
        {dayKeys.map((key, idx) => (
          <WeeklyColumn key={key} dayKey={key} dayName={days[idx]} pageIdx={pageIdx} justDroppedSlot={justDroppedSlot} />
        ))}
      </div>
      <div className="shrink-0 pt-2 flex justify-between items-end">
        <span className="font-serif text-[13px] italic text-[#AAA]">Grow Gently</span>
        <span className="text-xs text-[#AAA] tracking-wider">visualschedule.app</span>
      </div>
    </div>
  );
}

function CustomColumn({ colIdx, colName, pageIdx }: { colIdx: number; colName: string; pageIdx: number }) {
  const pages = useScheduleState((s) => s.pages);
  const removeCard = useScheduleState((s) => s.removeCard);
  const placeCard = useScheduleState((s) => s.placeCard);
  const language = useScheduleState((s) => s.language);
  const gender = useScheduleState((s) => s.gender);
  const customColNames = useScheduleState((s) => s.customColNames);
  const setCustomColNames = useScheduleState((s) => s.setCustomColNames);
  const page = pages[pageIdx] as ColumnPageData;
  const cards = page?.columns?.[String(colIdx)] || [];
  const
