"use client";

import { useDroppable } from "@dnd-kit/core";
import {
  GRID_SPECS,
  A4_PORTRAIT,
  A4_LANDSCAPE,
  LANGUAGES,
  DAYS,
  DAY_KEYS,
  MAX_WEEKLY_CARDS,
  MAX_CUSTOM_CARDS,
  MAX_FT_CARDS,
} from "@/lib/constants";
import { ALL_CARDS, getCardLabel, getCardImageUrl } from "@/lib/card-data";
import { useScheduleState } from "@/hooks/useScheduleState";
import type { DailyPageData, ColumnPageData } from "@/types/schedule";
import { DraggableCard } from "./DraggableCard";

function DailyDropSlot({ slotIdx, pageIdx, justDroppedSlot }: { slotIdx: number; pageIdx: number; justDroppedSlot: number | null }) {
  const pages = useScheduleState((s) => s.pages);
  const removeCard = useScheduleState((s) => s.removeCard);
  const language = useScheduleState((s) => s.language);
  const gender = useScheduleState((s) => s.gender);
  const cardStyle = useScheduleState((s) => s.cardStyle);

  const card = cardRef ? ALL_CARDS.find((c) => c.id === cardRef.cardId) : null;

  const droppableId = `${pageIdx}-${slotIdx}`;
  const { setNodeRef, isOver, active } = useDroppable({ id: droppableId });
  const isDragging = !!active;

  const cardRef = (pages[pageIdx] as DailyPageData)?.slots?.[slotIdx] || null;
  const imageUrl = card ? getCardImageUrl(card.id, gender) : null;
  const isBlack = cardStyle === "black";

  return (
    <div
      ref={setNodeRef}
      className={`relative aspect-square rounded-lg border-2 flex items-center justify-center cursor-move transition-all duration-150 ${
        isDragging
          ? isBlack
            ? "border-[#4a4a4a] bg-[#1a1a1a]"
            : "border-accent bg-accent/10"
          : isOver
            ? isBlack
              ? "border-[#6a6a6a] bg-[#2a2a2a]"
              : "border-accent/60 bg-white"
            : isBlack
              ? "border-[#404040] bg-black"
              : "border-[#E0E0E0] bg-white"
      }`}
    >
      {cardRef && card && imageUrl ? (
        <DraggableCard cardRef={cardRef} card={card} imageUrl={imageUrl} onRemove={() => removeCard(pageIdx, String(slotIdx))} justDropped={justDroppedSlot === slotIdx} />
      ) : (
        <span className={`text-[17px] text-center leading-tight font-sans ${isBlack ? "text-white" : "text-[#2C2C2C]"}`}>+</span>
      )}
    </div>
  );
}

function WeeklyColumn({ dayKey, dayName, pageIdx, justDroppedSlot }: { dayKey: string; dayName: string; pageIdx: number; justDroppedSlot: number | null }) {
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
    <div className="flex flex-col border-r border-r-weekly-border last:border-r-0 min-w-0 overflow-hidden">
      <div className="bg-weekly-head-bg border-b border-b-weekly-border px-1.5 py-2.5 text-center shrink-0">
        <div className="text-sm text-weekly-head-text font-serif italic tracking-wide">{dayName}</div>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 flex flex-col gap-1 p-1 justify-center transition-colors duration-150
          ${isOver ? "bg-weekly-hover" : "bg-weekly-body-bg"}
        `}
      >
        {cards.map((cardRef, idx) => {
          const card = ALL_CARDS.find((c) => c.id === cardRef.cardId);
          if (!card) return null;
          const imageUrl = getCardImageUrl(card.id, gender);
          return imageUrl ? (
            <DraggableCard key={`${cardRef.cardId}-${idx}`} cardRef={cardRef} card={card} imageUrl={imageUrl} onRemove={() => removeCard(pageIdx, dayKey, idx)} justDropped={false} />
          ) : null;
        })}
        {cards.length < MAX_WEEKLY_CARDS && <div className="flex-1 min-h-[20px]" />}
      </div>
    </div>
  );
}

function WeeklyPage({ pageIdx, justDroppedSlot }: { pageIdx: number; justDroppedSlot: number | null }) {
  const title = useScheduleState((s) => s.title);
  const language = useScheduleState((s) => s.language);
  const weekMode = useScheduleState((s) => s.weekMode);

  const days = weekMode === "fullweek" ? DAYS : DAYS.slice(1, 6);
  const dayKeys = weekMode === "fullweek" ? DAY_KEYS : DAY_KEYS.slice(1, 6);

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
  const language = useScheduleState((s) => s.language);
  const gender = useScheduleState((s) => s.gender);
  const customColNames = useScheduleState((s) => s.customColNames);
  const setCustomColNames = useScheduleState((s) => s.setCustomColNames);
  const page = pages[pageIdx] as ColumnPageData;
  const colKey = `col${colIdx}`;
  const cards = page?.columns?.[colKey] || [];
  const hasCard = cards.length > 0;

  const droppableId = `${pageIdx}-${colKey}`;
  const { setNodeRef, isOver, active } = useDroppable({ id: droppableId });
  const isDragging = !!active;

  return (
    <div className="flex flex-col border-2 border-weekly-border rounded-[10px] overflow-hidden bg-weekly-body-bg min-w-0">
      <div className="bg-weekly-head-bg border-b-2 border-b-weekly-border px-2 py-3.5 text-center shrink-0">
        <span className="text-[30px] font-semibold text-weekly-head-text font-serif italic tracking-tight">{colName}</span>
      </div>
      <div
        ref={setNodeRef}
        className={`flex-1 flex items-center justify-center p-4 min-h-0 transition-colors duration-150 ${isOver ? "bg-weekly-hover" : ""}`}
      >
        {hasCard ? (
          (() => {
            const cardRef = cards[0];
            const card = ALL_CARDS.find((c) => c.id === cardRef.cardId);
            const imageUrl = card ? getCardImageUrl(card.id, gender) : null;
            return card && imageUrl ? (
              <DraggableCard cardRef={cardRef} card={card} imageUrl={imageUrl} onRemove={() => removeCard(pageIdx, colKey, 0)} justDropped={false} />
            ) : null;
          })()
        ) : (
          <span className="text-[60px] text-[#CCC] font-light">+</span>
        )}
      </div>
    </div>
  );
}

function CustomPage({ pageIdx }: { pageIdx: number }) {
  const title = useScheduleState((s) => s.title);
  const customColNames = useScheduleState((s) => s.customColNames) || [];

  return (
    <div
      data-a4-page
      className="shrink-0 bg-white shadow-[0_4px_32px_rgba(0,0,0,0.22)] flex flex-col overflow-hidden relative box-border"
      style={{ width: A4_LANDSCAPE.width, height: A4_LANDSCAPE.height, padding: "28px 32px 24px" }}
    >
      <div className="text-center pb-4 border-b border-weekly-border mb-4 shrink-0">
        <h2 className="font-serif text-[28px] italic text-weekly-head-text leading-none">{title}</h2>
      </div>
      <div className="flex-1 min-h-0 grid gap-4 overflow-hidden" style={{ gridTemplateColumns: `repeat(${Math.min(customColNames.length, 2)}, 1fr)` }}>
        {customColNames.map((colName, colIdx) => (
          <CustomColumn key={colIdx} colIdx={colIdx} colName={colName} pageIdx={pageIdx} />
        ))}
      </div>
      <div className="shrink-0 pt-2 flex justify-between items-end">
        <span className="font-serif text-[13px] italic text-[#AAA]">Grow Gently</span>
        <span className="text-xs text-[#AAA] tracking-wider">visualschedule.app</span>
      </div>
    </div>
  );
}

function FirstThenColumn({ idx, isFirst, cardRef, pageIdx }: { idx: number; isFirst: boolean; cardRef: any; pageIdx: number }) {
  const removeCard = useScheduleState((s) => s.removeCard);
  const gender = useScheduleState((s) => s.gender);

  const card = cardRef ? ALL_CARDS.find((c) => c.id === cardRef.cardId) : null;
  const imageUrl = card ? getCardImageUrl(card.id, gender) : null;

  const droppableId = `${pageIdx}-${isFirst ? "first" : "then"}-${idx}`;
  const { setNodeRef, isOver, active } = useDroppable({ id: droppableId });
  const isDragging = !!active;

  return (
    <div
      ref={setNodeRef}
      className={`flex-1 flex items-center justify-center rounded-lg border-2 p-3 transition-colors ${
        isDragging || isOver ? "border-accent bg-accent/5" : "border-[#E0E0E0] bg-white"
      }`}
    >
      {cardRef && card && imageUrl ? (
        <DraggableCard cardRef={cardRef} card={card} imageUrl={imageUrl} onRemove={() => removeCard(pageIdx, isFirst ? "first" : "then", idx)} justDropped={false} />
      ) : (
        <span className="text-[48px] text-[#CCC]">+</span>
      )}
    </div>
  );
}

function FirstThenPage({ pageIdx }: { pageIdx: number }) {
  const title = useScheduleState((s) => s.title);
  const pages = useScheduleState((s) => s.pages);
  const page = pages[pageIdx] as ColumnPageData;

  const firstCards = page?.columns?.first || [];
  const thenCards = page?.columns?.then || [];

  return (
    <div
      data-a4-page
      className="shrink-0 bg-white shadow-[0_4px_32px_rgba(0,0,0,0.22)] flex flex-col overflow-hidden relative box-border"
      style={{ width: A4_PORTRAIT.width, height: A4_PORTRAIT.height, padding: "28px 32px 24px" }}
    >
      <div className="text-center pb-3 border-b border-weekly-border mb-4 shrink-0">
        <h2 className="font-serif text-[28px] italic text-weekly-head-text leading-none">{title}</h2>
      </div>

      <div className="flex-1 min-h-0 grid grid-cols-2 gap-6">
        <div className="flex flex-col gap-4">
          <h3 className="font-serif text-[24px] italic text-weekly-head-text text-center">First</h3>
          <div className="flex-1 flex flex-col gap-3">
            {Array.from({ length: MAX_FT_CARDS }).map((_, idx) => (
              <FirstThenColumn key={`first-${idx}`} idx={idx} isFirst={true} cardRef={firstCards[idx] || null} pageIdx={pageIdx} />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <h3 className="font-serif text-[24px] italic text-weekly-head-text text-center">Then</h3>
          <div className="flex-1 flex flex-col gap-3">
            {Array.from({ length: MAX_FT_CARDS }).map((_, idx) => (
              <FirstThenColumn key={`then-${idx}`} idx={idx} isFirst={false} cardRef={thenCards[idx] || null} pageIdx={pageIdx} />
            ))}
          </div>
        </div>
      </div>

      <div className="shrink-0 pt-2 flex justify-between items-end">
        <span className="font-serif text-[13px] italic text-[#AAA]">Grow Gently</span>
        <span className="text-xs text-[#AAA] tracking-wider">visualschedule.app</span>
      </div>
    </div>
  );
}

export function ScheduleCanvas() {
  const scheduleType = useScheduleState((s) => s.scheduleType);
  const gridCols = useScheduleState((s) => s.gridCols);
  const pages = useScheduleState((s) => s.pages);

  const justDroppedSlot = useScheduleState((s) => s.justDroppedSlot);

  return (
    <div className="flex flex-col items-center gap-2">
      {pages.map((_, pageIdx) => (
        <div key={pageIdx} className="flex flex-col items-center gap-2">
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
            <CustomPage pageIdx={pageIdx} />
          )}
          {scheduleType === "firstthen" && (
            <FirstThenPage pageIdx={pageIdx} />
          )}
        </div>
      ))}
    </div>
  );
}

function DailyPage({ pageIdx, justDroppedSlot }: { pageIdx: number; justDroppedSlot: number | null }) {
  const title = useScheduleState((s) => s.title);
  const gridCols = useScheduleState((s) => s.gridCols);
  const page = pages[pageIdx] as DailyPageData;
  const pages = useScheduleState((s) => s.pages);

  const spec = GRID_SPECS[gridCols];

  return (
    <div
      data-a4-page
      className="shrink-0 bg-white shadow-[0_4px_32px_rgba(0,0,0,0.22)] flex flex-col overflow-hidden relative box-border"
      style={{ width: A4_PORTRAIT.width, height: A4_PORTRAIT.height, padding: "28px 32px 24px" }}
    >
      <div className="text-center pb-3 border-b border-[#F0F0F0] mb-3 shrink-0">
        <h2 className="font-serif text-[22px] italic text-ink leading-none text-center">{title}</h2>
        <span className="text-[11px] tracking-wider text-[#8A8480] border border-border px-2.5 py-1 font-medium">{LANGUAGES[useScheduleState((s) => s.language)] || useScheduleState((s) => s.language)}</span>
      </div>
      <div className="flex-1 min-h-0 grid gap-3 overflow-hidden" style={{ gridTemplateColumns: `repeat(${gridCols}, 1fr)` }}>
        {Array.from({ length: spec.slots }).map((_, idx) => (
          <DailyDropSlot key={idx} slotIdx={idx} pageIdx={pageIdx} justDroppedSlot={justDroppedSlot} />
        ))}
      </div>
      <div className="shrink-0 pt-2 flex justify-between items-end">
        <span className="font-serif text-[13px] italic text-[#AAA]">Grow Gently</span>
        <span className="text-xs text-[#AAA] tracking-wider">visualschedule.app</span>
      </div>
    </div>
  );
}
