"use client";

import { useDroppable } from "@dnd-kit/core";
import { GRID_SPECS, A4_PORTRAIT, A4_LANDSCAPE, LANGUAGES, DAYS, DAY_KEYS, MAX_WEEKLY_CARDS, MAX_CUSTOM_CARDS } from "@/lib/constants";
import { findCard, getCardLabel, getCardImageUrl, isCharacterCard } from "@/lib/card-data";
import { useScheduleState } from "@/hooks/useScheduleState";
import type { DailyPageData, ColumnPageData } from "@/types/schedule";

// Local schedule type labels (avoiding import issues)
const SCHEDULE_TYPE_LABELS = {
  daily: "Daily Schedule",
  weekly: "Weekly Schedule",
  custom: "Custom Schedule",
  firstthen: "First/Then Board",
} as const;

function DailyDropSlot({ slotIdx, pageIdx, justDropped }: { slotIdx: number; pageIdx: number; justDropped: boolean }) {
  const pages = useScheduleState((s) => s.pages);
  const removeCard = useScheduleState((s) => s.removeCard);
  const cardStyle = useScheduleState((s) => s.cardStyle);
  const language = useScheduleState((s) => s.language);
  const gender = useScheduleState((s) => s.gender);
  const page = pages[pageIdx] as DailyPageData;
  const cardRef = page?.slots?.[slotIdx] ?? null;

  const { setNodeRef, isOver, active } = useDroppable({
    id: `${pageIdx}-${slotIdx}`,
  });

  const card = cardRef ? findCard(cardRef.cardId) : null;
  const imageUrl = card ? getCardImageUrl(card.id, isCharacterCard(card) ? gender : "neutral") : null;
  const isDragging = !!active;
  const isBlack = cardStyle === "black";

  return (
    <div
      ref={setNodeRef}
      className={`relative flex flex-col items-center justify-center overflow-hidden bg-white border-[1.5px] border-solid
        ${!cardRef
          ? `transition-[border-color,background-color,transform] duration-200 ease-out
             ${isOver ? "border-[#7A8F5E] bg-[#F0F8F0] scale-[1.03]" : isDragging ? "border-[#7A8F5E] bg-white" : "border-[#C7D7B8] bg-white"}`
          : `border-[#C7D7B8] group bg-white`
        }
        ${justDropped ? "animate-[cardLand_350ms_cubic-bezier(0.34,1.56,0.64,1)]" : ""}
      `}
    >
      {cardRef && card ? (
        <>
          <div className="absolute inset-0 flex flex-col">
            <div className={`flex-[0_0_70%] flex items-center justify-center overflow-hidden bg-white`}>
              {imageUrl ? (
                <img src={imageUrl} alt={getCardLabel(card, language)} crossOrigin="anonymous" className="w-full h-full object-contain" />
              ) : (
                <svg className={`w-10 h-10 stroke-[1.4] fill-none stroke-[#DDD]`} viewBox="0 0 24 24" strokeLinecap="round">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              )}
            </div>
            <div className={`flex-[0_0_30%] flex items-center justify-center px-1 border-t-[1px] border-[#F0F0F0] bg-white`}>
              <span className="text-[18px] text-center leading-tight font-serif text-[#2C2C2C]">
                {card.translations?.[language] || card.translations?.en || getCardLabel(card, language)}
              </span>
            </div>
          </div>
          <button
            onClick={() => removeCard(pageIdx, String(slotIdx))}
            className="absolute top-[5px] right-[5px] w-[18px] h-[18px] bg-white/90 border border-[#DDD] rounded-full hidden group-hover:flex items-center justify-center cursor-pointer text-[13px] text-[#666] leading-none z-[3] hover:bg-ink hover:text-white hover:border-ink transition-colors"
          >
            &times;
          </button>
        </>
      ) : (
        <div className={`dz-hint flex flex-col items-center gap-[5px] transition-transform duration-200 ${isOver ? "scale-125" : ""}`}>
          <svg className={`w-[18px] h-[18px] stroke-[1.5] fill-none transition-[stroke] duration-200 ${isOver ? "stroke-[#7A8F5E]" : isDragging ? "stroke-[#7A8F5E]" : "stroke-[#CCC]"}`} viewBox="0 0 24 24" strokeLinecap="round">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          <span className={`text-xs font-medium transition-[color] duration-200 ${isOver ? "text-[#7A8F5E]" : isDragging ? "text-[#7A8F5E]" : "text-[#999]"}`}>
            {isOver ? "Release" : "Drop"}
          </span>
        </div>
      )}
    </div>
  );
}

function WeeklyColumn({ dayKey, dayName, pageIdx, justDroppedSlot }: { dayKey: string; dayName: string; pageIdx: number; justDroppedSlot: string | null }) {
  const pages = useScheduleState((s) => s.pages);
  const removeCard = useScheduleState((s) => s.removeCard);
  const language = useScheduleState((s) => s.language);
  const gender = useScheduleState((s) => s.gender);
  const page = pages[pageIdx] as ColumnPageData;
  const cards = page?.columns?.[dayKey] || [];

  const droppableId = `${pageIdx}-${dayKey}`;
  const { setNodeRef, isOver, active } = useDroppable({ id: droppableId });
  const isDragging = !!active;

  return (
    <div className="flex flex-col border-r border-r-[#C5D2B8] last:border-r-0 min-w-0 overflow-hidden">
      <div className="bg-[#E8EDE0] border-b border-b-[#C5D2B8] px-1.5 py-2.5 text-center shrink-0">
        <div className="font-serif text-[15px] text-[#4A5A3E]">{dayName}</div>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 flex flex-col gap-1 p-1 justify-center transition-colors duration-150
          ${isOver ? "bg-[#EFF2E8]" : "bg-[#FAFBF7]"}
        `}
      >
        {cards.map((cardRef, idx) => {
          const card = findCard(cardRef.cardId);
          if (!card) return null;
          const imageUrl = getCardImageUrl(card.id, isCharacterCard(card) ? gender : "neutral");
          return (
            <div key={idx} className="bg-white border border-[#C7D7B8] flex flex-col relative group flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 flex items-center justify-center overflow-hidden bg-white min-h-0">
                {imageUrl ? (
                  <img src={imageUrl} alt={getCardLabel(card, language)} className="w-full h-full object-contain" />
                ) : (
                  <svg className="w-7 h-7 stroke-[#CCC] stroke-[1.4] fill-none" viewBox="0 0 24 24" strokeLinecap="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                )}
              </div>
              <div className="px-1 py-1 border-t border-[#F0F0F0] bg-white text-[18px] text-ink text-center leading-tight font-serif shrink-0">
                {card.translations?.[language] || card.translations?.en || getCardLabel(card, language)}
              </div>
              <button
                onClick={() => removeCard(pageIdx, dayKey, idx)}
                className="absolute top-1 right-1 w-[15px] h-[15px] bg-white/90 border border-[#DDD] rounded-full hidden group-hover:flex items-center justify-center cursor-pointer text-[11px] text-[#888] leading-none z-[3] hover:bg-ink hover:text-white hover:border-ink"
              >
                &times;
              </button>
            </div>
          );
        })}
        {cards.length < MAX_WEEKLY_CARDS && (
          <div className={`flex items-center justify-center shrink-0 h-7 border border-solid rounded transition-colors duration-150 ${isOver ? "border-[#7A8F5E] bg-[#EFF2E8]" : isDragging ? "border-[#C5D2B8]" : "border-transparent"}`}>
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
  const scheduleType = useScheduleState((s) => s.scheduleType);
  const language = useScheduleState((s) => s.language);
  const spec = GRID_SPECS[gridCols];
  const scheduleTypeLabel = SCHEDULE_TYPE_LABELS[scheduleType] || scheduleType;

  return (
    <div
      data-a4-page
      className="shrink-0 bg-white shadow-[0_4px_32px_rgba(0,0,0,0.22)] flex flex-col overflow-hidden relative box-border"
      style={{ width: A4_PORTRAIT.width, height: A4_PORTRAIT.height, padding: "36px 48px 0" }}
    >
      <div className="shrink-0 grid grid-cols-[1fr_auto_1fr] items-end pb-2.5 border-b border-[#EEE] mb-2.5">
        <div className="col-start-2">
          {title ? (
            <h2 className="font-serif text-[30px] text-[#5A8A3C] leading-snug text-center">{title}</h2>
          ) : (
            <h2 className="font-serif text-[30px] text-[#CCC] leading-snug text-center">Untitled</h2>
          )}
        </div>
        <div className="col-start-3 justify-self-end">
          <span className="text-[11px] tracking-wider text-[#8A8480] border border-border px-2.5 py-1 font-medium">{LANGUAGES[language] || language}</span>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="grid gap-2 h-full" style={{ gridTemplateColumns: `repeat(${spec.cols}, 1fr)`, gridTemplateRows: `repeat(${spec.rows}, 1fr)` }}>
          {Array.from({ length: spec.slots }).map((_, i) => (
            <DailyDropSlot key={i} slotIdx={i} pageIdx={pageIdx} justDropped={justDroppedSlot === `${pageIdx}-${i}`} />
          ))}
        </div>
      </div>
      <div className="shrink-0 py-1.5 pb-4 border-t border-bg-muted flex justify-between items-end">
        <div className="flex items-baseline gap-1.5">
          <span className="font-serif text-[13px] text-[#AAA]">Grow Gently</span>
          <span className="text-[10px] text-[#C0C0C0]">in collab with <a href="https://dataorc.in" className="text-[#AAA] underline">DataOrc</a></span>
        </div>
        <span className="text-xs text-[#AAA] tracking-wider">visualschedule.app</span>
      </div>
    </div>
  );
}

function WeeklyPage({ pageIdx, justDroppedSlot }: { pageIdx: number; justDroppedSlot: string | null }) {
  const title = useScheduleState((s) => s.title);
  const scheduleType = useScheduleState((s) => s.scheduleType);
  const language = useScheduleState((s) => s.language);
  const weekMode = useScheduleState((s) => s.weekMode);
  const scheduleTypeLabel = SCHEDULE_TYPE_LABELS[scheduleType] || scheduleType;

  const days = weekMode === "weekdays" ? DAYS.slice(1, 6) : [...DAYS];
  const dayKeys = weekMode === "weekdays" ? DAY_KEYS.slice(1, 6) : [...DAY_KEYS];

  return (
    <div
      data-a4-page
      className="shrink-0 bg-white shadow-[0_4px_32px_rgba(0,0,0,0.22)] flex flex-col overflow-hidden relative box-border"
      style={{ width: A4_LANDSCAPE.width, height: A4_LANDSCAPE.height, padding: "28px 32px 24px" }}
    >
      <div className="text-center pb-3 border-b border-[#C5D2B8] mb-3 shrink-0">
        {title ? (
          <h2 className="font-serif text-[30px] text-[#5A8A3C] leading-snug">{title}</h2>
        ) : (
          <h2 className="font-serif text-[30px] text-[#CCC] leading-snug">Untitled</h2>
        )}
      </div>
      <div className="flex-1 min-h-0 grid border border-[#C5D2B8] rounded-sm overflow-hidden" style={{ gridTemplateColumns: `repeat(${days.length}, 1fr)` }}>
        {dayKeys.map((key, idx) => (
          <WeeklyColumn key={key} dayKey={key} dayName={days[idx]} pageIdx={pageIdx} justDroppedSlot={justDroppedSlot} />
        ))}
      </div>
      <div className="shrink-0 pt-2 flex justify-between items-end">
        <span className="font-serif text-[13px] text-[#AAA]">Grow Gently</span>
        <span className="text-xs text-[#AAA] tracking-wider">visualschedule.app</span>
      </div>
    </div>
  );
}

function CustomColumn({ colIdx, colName, pageIdx, justDroppedSlot }: { colIdx: number; colName: string; pageIdx: number; justDroppedSlot: string | null }) {
  const pages = useScheduleState((s) => s.pages);
  const removeCard = useScheduleState((s) => s.removeCard);
  const language = useScheduleState((s) => s.language);
  const gender = useScheduleState((s) => s.gender);
  const customColNames = useScheduleState((s) => s.customColNames);
  const setCustomColNames = useScheduleState((s) => s.setCustomColNames);
  const page = pages[pageIdx] as ColumnPageData;
  const cards = page?.columns?.[String(colIdx)] || [];

  const droppableId = `${pageIdx}-${colIdx}`;
  const { setNodeRef, isOver, active } = useDroppable({ id: droppableId });
  const isDragging = !!active;

  return (
    <div className="flex flex-col border-r border-r-[#C5D2B8] last:border-r-0 min-w-0 overflow-hidden">
      <div className="bg-[#E8EDE0] border-b border-b-[#C5D2B8] px-1.5 py-2.5 text-center shrink-0">
        <input
          type="text"
          value={colName}
          onChange={(e) => {
            const names = [...customColNames];
            names[colIdx] = e.target.value;
            setCustomColNames(names);
          }}
          className="w-full text-center border-none bg-transparent font-serif text-[15px] text-[#4A5A3E] outline-none hover:bg-white/60 focus:bg-white focus:shadow-[inset_0_0_0_1.5px_#7A8F5E] rounded-sm px-1 py-0.5"
        />
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 flex flex-col gap-1 p-1 justify-center transition-colors duration-150
          ${isOver ? "bg-[#EFF2E8]" : "bg-[#FAFBF7]"}
        `}
      >
        {cards.map((cardRef, idx) => {
          const card = findCard(cardRef.cardId);
          if (!card) return null;
          const imageUrl = getCardImageUrl(card.id, isCharacterCard(card) ? gender : "neutral");
          return (
            <div key={idx} className="bg-white border border-[#C7D7B8] flex flex-col relative group flex-1 min-h-0 overflow-hidden">
              <div className="flex-1 flex items-center justify-center overflow-hidden bg-white min-h-0">
                {imageUrl ? (
                  <img src={imageUrl} alt={getCardLabel(card, language)} className="w-full h-full object-contain" />
                ) : (
                  <svg className="w-7 h-7 stroke-[#CCC] stroke-[1.4] fill-none" viewBox="0 0 24 24" strokeLinecap="round">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                )}
              </div>
              <div className="px-1 py-1 border-t border-[#F0F0F0] bg-white text-[18px] text-ink text-center leading-tight font-serif shrink-0">
                {card.translations?.[language] || card.translations?.en || getCardLabel(card, language)}
              </div>
              <button
                onClick={() => removeCard(pageIdx, String(colIdx), idx)}
                className="absolute top-1 right-1 w-[15px] h-[15px] bg-white/90 border border-[#DDD] rounded-full hidden group-hover:flex items-center justify-center cursor-pointer text-[11px] text-[#888] leading-none z-[3] hover:bg-ink hover:text-white hover:border-ink"
              >
                &times;
              </button>
            </div>
          );
        })}
        {cards.length < MAX_CUSTOM_CARDS && (
          <div className={`flex items-center justify-center shrink-0 h-7 border border-solid rounded transition-colors duration-150 ${isOver ? "border-[#7A8F5E] bg-[#EFF2E8]" : isDragging ? "border-[#C5D2B8]" : "border-transparent"}`}>
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

function CustomPage({ pageIdx, justDroppedSlot }: { pageIdx: number; justDroppedSlot: string | null }) {
  const title = useScheduleState((s) => s.title);
  const scheduleType = useScheduleState((s) => s.scheduleType);
  const customColNames = useScheduleState((s) => s.customColNames);
  const scheduleTypeLabel = SCHEDULE_TYPE_LABELS[scheduleType] || scheduleType;

  const colCount = customColNames.length;

  return (
    <div
      data-a4-page
      className="shrink-0 bg-white shadow-[0_4px_32px_rgba(0,0,0,0.22)] flex flex-col overflow-hidden relative box-border"
      style={{ width: A4_LANDSCAPE.width, height: A4_LANDSCAPE.height, padding: "28px 32px 24px" }}
    >
      <div className="text-center pb-3 border-b border-[#C5D2B8] mb-3 shrink-0">
        {title ? (
          <h2 className="font-serif text-[30px] text-[#5A8A3C] leading-snug">{title}</h2>
        ) : (
          <h2 className="font-serif text-[30px] text-[#CCC] leading-snug">Untitled</h2>
        )}
      </div>
      <div className="flex-1 min-h-0 grid border border-[#C5D2B8] rounded-sm overflow-hidden" style={{ gridTemplateColumns: `repeat(${colCount}, 1fr)` }}>
        {customColNames.map((name, idx) => (
          <CustomColumn key={idx} colIdx={idx} colName={name} pageIdx={pageIdx} justDroppedSlot={justDroppedSlot} />
        ))}
      </div>
      <div className="shrink-0 pt-2 flex justify-between items-end">
        <span className="font-serif text-[13px] text-[#AAA]">Grow Gently</span>
        <span className="text-xs text-[#AAA] tracking-wider">visualschedule.app</span>
      </div>
    </div>
  );
}

function FirstThenColumn({ colIdx, colName, pageIdx, justDroppedSlot }: { colIdx: number; colName: string; pageIdx: number; justDroppedSlot: string | null }) {
  const pages = useScheduleState((s) => s.pages);
  const removeCard = useScheduleState((s) => s.removeCard);
  const language = useScheduleState((s) => s.language);
  const gender = useScheduleState((s) => s.gender);
  const page = pages[pageIdx] as ColumnPageData;
  const cards = page?.columns?.[String(colIdx)] || [];

  const droppableId = `${pageIdx}-${colIdx}`;
  const { setNodeRef, isOver, active } = useDroppable({ id: droppableId });
  const isDragging = !!active;
  const hasCard = cards.length > 0;

  return (
    <div className="flex flex-col border-2 border-[#C5D2B8] rounded-[10px] overflow-hidden bg-[#FAFBF7] min-w-0">
      <div className="bg-[#E8EDE0] border-b-2 border-b-[#C5D2B8] px-2 py-3.5 text-center shrink-0">
        <span className="font-serif text-[26px] text-[#4A5A3E]">{colName}</span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 flex items-center justify-center p-4 min-h-0 transition-colors duration-150 ${isOver ? "bg-[#EFF2E8]" : ""}`}
      >
        {hasCard ? (
          (() => {
            const card = findCard(cards[0].cardId);
            if (!card) return null;
            const imageUrl = getCardImageUrl(card.id, isCharacterCard(card) ? gender : "neutral");
            return (
              <div className="w-full h-full max-w-[460px] bg-white border-2 border-[#C7D7B8] rounded-[10px] flex flex-col overflow-hidden relative group">
                <div className="flex-1 flex items-center justify-center overflow-hidden min-h-0 bg-white">
                  {imageUrl ? (
                    <img src={imageUrl} alt={getCardLabel(card, language)} className="w-full h-full object-contain" />
                  ) : (
                    <svg className="w-[90px] h-[90px] stroke-[#CCC] stroke-[1.2] fill-none" viewBox="0 0 24 24" strokeLinecap="round">
                      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                    </svg>
                  )}
                </div>
                <div className="shrink-0 px-2.5 py-4 border-t-2 border-[#F0F0F0] bg-white text-center">
                  <span className="text-[18px] text-ink-2 font-serif leading-tight">
                    {card.translations?.[language] || card.translations?.en || getCardLabel(card, language)}
                  </span>
                </div>
                <button
                  onClick={() => removeCard(pageIdx, String(colIdx), 0)}
                  className="absolute top-2 right-2 w-[30px] h-[30px] bg-white/95 border-[1.5px] border-[#DDD] rounded-full hidden group-hover:flex items-center justify-center cursor-pointer text-[19px] text-[#888] leading-none z-[3] hover:bg-ink hover:text-white hover:border-ink"
                >
                  &times;
                </button>
              </div>
            );
          })()
        ) : (
          <div className={`w-full h-full max-w-[460px] border-[3px] border-solid rounded-[10px] flex flex-col items-center justify-center gap-3 transition-colors duration-150 opacity-65 ${isOver ? "border-[#7A8F5E] bg-[#EFF2E8]" : isDragging ? "border-[#C5D2B8]" : "border-[#C5D2B8]"}`}>
            <svg className={`w-[52px] h-[52px] stroke-[1.4] fill-none ${isOver ? "stroke-weekly-accent" : "stroke-[#CCC]"}`} viewBox="0 0 24 24" strokeLinecap="round">
              <line x1="12" y1="5" x2="12" y2="19" />
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
            <span className={`text-[19px] font-medium font-sans ${isOver ? "text-weekly-accent" : "text-[#CCC]"}`}>
              Drop card here
            </span>
          </div>
        )}
      </div>
    </div>
  );
}

function FirstThenPage({ pageIdx, justDroppedSlot }: { pageIdx: number; justDroppedSlot: string | null }) {
  const title = useScheduleState((s) => s.title);
  const scheduleType = useScheduleState((s) => s.scheduleType);
  const customColNames = useScheduleState((s) => s.customColNames);
  const scheduleTypeLabel = SCHEDULE_TYPE_LABELS[scheduleType] || scheduleType;
  const ftColCount = customColNames.length <= 3 ? Math.max(2, Math.min(3, customColNames.length)) : 2;
  const ftColNames = ftColCount === 3 ? ["First", "Then", "Now"] : ["First", "Then"];

  return (
    <div
      data-a4-page
      className="shrink-0 bg-white shadow-[0_4px_32px_rgba(0,0,0,0.22)] flex flex-col overflow-hidden relative box-border"
      style={{ width: A4_LANDSCAPE.width, height: A4_LANDSCAPE.height, padding: "28px 32px 24px" }}
    >
      <div className="text-center pb-3 border-b border-[#C5D2B8] mb-3 shrink-0">
        <h2 className="font-serif text-[30px] text-[#5A8A3C] leading-snug">{title || scheduleTypeLabel}</h2>
      </div>
      <div className="flex-1 min-h-0 grid gap-5" style={{ gridTemplateColumns: `repeat(${ftColNames.length}, 1fr)` }}>
        {ftColNames.map((name, idx) => (
          <FirstThenColumn key={idx} colIdx={idx} colName={name} pageIdx={pageIdx} justDroppedSlot={justDroppedSlot} />
        ))}
      </div>
      <div className="shrink-0 pt-2 flex justify-between items-end">
        <span className="font-serif text-[13px] text-[#AAA]">Grow Gently</span>
        <span className="text-xs text-[#AAA] tracking-wider">visualschedule.app</span>
      </div>
    </div>
  );
}

interface ScheduleCanvasProps {
  justDroppedSlot: string | null;
  cardImages?: Record<string, Record<string, string>>;
}

export function ScheduleCanvas({ justDroppedSlot }: ScheduleCanvasProps) {
  const scheduleType = useScheduleState((s) => s.scheduleType);
  const pages = useScheduleState((s) => s.pages);

  return (
    <>
      {pages.map((_, pageIdx) => (
        <div key={pageIdx} className="flex flex-col items-center w-full">
          <div className="flex flex-col items-center gap-2">
            <div
              className="text-[11px] tracking-widest uppercase text-[#B0ACA6] font-medium shrink-0"
              style={{ width: scheduleType === "daily" ? A4_PORTRAIT.width : A4_LANDSCAPE.width }}
            >
              Page {pageIdx + 1}
            </div>
            {scheduleType === "daily" && (
              <DailyPage pageIdx={pageIdx} justDroppedSlot={justDroppedSlot} />
            )}
            {scheduleType === "weekly" && (
              <WeeklyPage pageIdx={pageIdx} justDroppedSlot={justDroppedSlot} />
            )}
            {scheduleType === "custom" && (
              <CustomPage pageIdx={pageIdx} justDroppedSlot={justDroppedSlot} />
            )}
            {scheduleType === "firstthen" && (
              <FirstThenPage pageIdx={pageIdx} justDroppedSlot={justDroppedSlot} />
            )}
          </div>
          {pageIdx < pages.length - 1 && (
            <div className="w-full h-px bg-[#E0E0E0] my-6" />
          )}
        </div>
      ))}
    </>
  );
}
