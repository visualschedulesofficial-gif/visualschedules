"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { DAY_KEYS, getDailySpec } from "@/lib/constants";
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  pointerWithin,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core";
import { createPortal } from "react-dom";
import { AppShell } from "@/components/layout/AppShell";
import { CardLibrarySidebar } from "@/components/schedule/CardLibrarySidebar";
import { RightPanel } from "@/components/schedule/RightPanel";
import { MobileScheduleBuilder } from "@/components/schedule/MobileScheduleBuilder";
import { ScheduleCanvas } from "@/components/schedule/ScheduleCanvas";
import { useScheduleState } from "@/hooks/useScheduleState";
import { useAutoSave } from "@/hooks/useAutoSave";
import { findCard, setRuntimeCards, getCardLabel, setCardImages as setCardImagesGlobal, setLabelOverrides, type CardImageMap, type ParsedCard } from "@/lib/card-data";

function PointerOverlay({ label }: { label: string }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onPointerMove(e: PointerEvent) {
      if (ref.current) {
        ref.current.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`;
      }
    }
    window.addEventListener("pointermove", onPointerMove);
    return () => window.removeEventListener("pointermove", onPointerMove);
  }, []);

  return createPortal(
    <div
      ref={ref}
      className="fixed top-0 left-0 z-[9999] pointer-events-none will-change-transform"
      style={{ transform: "translate3d(-9999px, -9999px, 0)" }}
    >
      <div className="-translate-x-1/2 -translate-y-1/2">
        <div className="w-[88px] bg-white border border-accent/70 rounded shadow-[0_14px_28px_rgba(0,0,0,0.16),0_4px_10px_rgba(139,94,42,0.18)] rotate-[3deg]">
          <div className="w-full aspect-square bg-white flex items-center justify-center rounded-t">
            <svg
              className="w-5 h-5 stroke-accent/60 stroke-[1.5] fill-none"
              viewBox="0 0 24 24"
              strokeLinecap="round"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <div className="px-1 py-1 bg-white border-t border-accent/15 text-[12px] text-ink text-center leading-tight font-sans font-medium rounded-b truncate">
            {label}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

export default function ScheduleBuilder() {
  const [activeCard, setActiveCard] = useState<{ id: string; label: string } | null>(null);
  const [justDroppedSlot, setJustDroppedSlot] = useState<string | null>(null);
  const [fullNotice, setFullNotice] = useState<string | null>(null);
  const [cardImages, setLocalCardImages] = useState<CardImageMap>({});
  const [cardsLoaded, setCardsLoaded] = useState(false);
  // Mobile gets its own linear layout; desktop keeps the three-panel one.
  // Only one renders at a time so the exporter always finds a single canvas.
  const [isMobile, setIsMobile] = useState(false);
  // Landscape pages (1123px) are wider than the center column — scale to fit.
  // Measure the stable #canvas-wrap main (the wrapper around children is
  // shrink-to-fit, so measuring it would collapse to zero).
  const [fitZoom, setFitZoom] = useState(1);
  const scheduleTypeForFit = useScheduleState((s) => s.scheduleType);
  const exportingNow = useScheduleState((s) => s.exporting);
  useEffect(() => {
    const el = document.getElementById("canvas-wrap");
    if (!el) return;
    const canvasW =
      scheduleTypeForFit === "weekly" || scheduleTypeForFit === "custom" ? 1123 : 794;
    const update = () => {
      const avail = el.clientWidth;
      if (avail < 200) return; // ignore bogus early measurements
      setFitZoom(Math.max(0.35, Math.min(1, (avail - 56) / canvasW)));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [scheduleTypeForFit, isMobile]);
  const placeCard = useScheduleState((s) => s.placeCard);
  const language = useScheduleState((s) => s.language);

  useAutoSave();

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 767px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // Load runtime cards + images from D1 on mount
  useEffect(() => {
    // 1. Load cards into runtime registry so canvas can find them
    fetch("/api/cards")
      .then((r) => r.json())
      .then((data) => {
        if (data.cards?.length > 0) {
          const cleaned = data.cards.map((c: ParsedCard) => ({
            ...c,
            isFree: !(c.icon || "").startsWith("paid:"),
            icon: c.icon?.replace(/^(free|paid):/, "") || "s-star",
          }));
          setRuntimeCards(cleaned);
        }
        setCardsLoaded(true);
      })
      .catch(() => {});

    // 2. Load images
    fetch("/api/cards/images")
      .then((r) => r.json())
      .then((data) => {
        if (data.images) {
          // Set the global card images (for ScheduleCanvas)
          setCardImagesGlobal(data.images);
          // Also set local state (for prop passing)
          setLocalCardImages(data.images);
        }
        if (data.labels) {
          setLabelOverrides(data.labels);
        }
      })
      .catch((err) => {
        console.error("Failed to load card images:", err);
      });
  }, []);

  const handleClickPlace = useCallback((cardId: string) => {
    const card = findCard(cardId);
    if (!card) return;

    const { pages, scheduleType, gridCols } = useScheduleState.getState();
    const pageIdx = 0;

    if (scheduleType === "daily") {
      const page = pages[pageIdx] as import("@/types/schedule").DailyPageData;
      const { cardType, gridCols } = useScheduleState.getState();
      const spec = getDailySpec(cardType, gridCols);
      let emptyIdx = -1;
      for (let i = 0; i < spec.slots; i++) {
        if (page.slots[i] == null) {
          emptyIdx = i;
          break;
        }
      }
      if (emptyIdx === -1) return;
      placeCard(pageIdx, String(emptyIdx), { cardId: card.id, catId: card.categoryId });
      setJustDroppedSlot(`${pageIdx}-${emptyIdx}`);
    } else if (scheduleType === "iwant") {
      const page = pages[pageIdx] as import("@/types/schedule").ColumnPageData;
      if ((page.columns?.["cutout"] || []).length < 9) {
        placeCard(pageIdx, "cutout", { cardId: card.id, catId: card.categoryId });
        setJustDroppedSlot(`${pageIdx}-cutout`);
      } else {
        setFullNotice("All nine card slots are full.");
        setTimeout(() => setFullNotice(null), 2600);
      }
    } else if (scheduleType === "firstthen") {
      const page = pages[pageIdx] as import("@/types/schedule").ColumnPageData;
      // Cards go to the cut-out placeholders only — the boards above stay
      // empty; the child physically places cut cards onto them after printing.
      const { ftStyle } = useScheduleState.getState();
      const ftN = ftStyle === "sequencing" ? 4 : ftStyle === "first-then-now" ? 3 : 2;
      const order: Array<{ key: string; max: number }> = [{ key: "cutout", max: ftN === 4 ? 16 : 9 }];
      let ftPlaced = false;
      for (const { key, max } of order) {
        if ((page.columns?.[key] || []).length < max) {
          placeCard(pageIdx, key, { cardId: card.id, catId: card.categoryId });
          setJustDroppedSlot(`${pageIdx}-${key}`);
          ftPlaced = true;
          break;
        }
      }
      if (!ftPlaced) {
        setFullNotice("All cut-out slots are full.");
        setTimeout(() => setFullNotice(null), 2600);
      }
    } else {
      const page = pages[pageIdx] as import("@/types/schedule").ColumnPageData;
      // Derive the full set of columns from the schedule setup — a fresh page
      // has no columns created yet, so Object.keys() alone finds nothing.
      const { weekMode, customColNames } = useScheduleState.getState();
      const cols =
        scheduleType === "weekly"
          ? (weekMode === "weekdays" ? DAY_KEYS.slice(1, 6) : [...DAY_KEYS])
          : scheduleType === "timetable"
            ? ["0", "1"]
            : customColNames.map((_, i) => String(i));
      const max = 5;
      // Fill ROW BY ROW: each click goes to the leftmost column with the
      // fewest cards (Mon→Sun across row 1, then row 2, ...). First/Then
      // naturally becomes First, then Then.
      let target: string | null = null;
      let fewest = Infinity;
      for (const col of cols) {
        const len = (page.columns[col] || []).length;
        if (len < max && len < fewest) {
          fewest = len;
          target = col;
        }
      }
      if (target) {
        placeCard(pageIdx, target, { cardId: card.id, catId: card.categoryId });
        setJustDroppedSlot(`${pageIdx}-${target}`);
      } else {
        // Every column already holds 5 cards
        setFullNotice("All columns are full — only 5 cards fit in each column.");
        setTimeout(() => setFullNotice(null), 2600);
      }
    }
    setTimeout(() => setJustDroppedSlot(null), 400);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [placeCard]);

  const mouseSensor = useSensor(MouseSensor, {
    activationConstraint: { distance: 6 },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 150, tolerance: 5 },
  });
  const sensors = useSensors(mouseSensor, touchSensor);

  const handleDragStart = useCallback((event: DragStartEvent) => {
    const cardId = event.active.id as string;
    const card = findCard(cardId);
    if (card) {
      setActiveCard({ id: card.id, label: getCardLabel(card, language) });
    }
  }, [language]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);

    if (!over) return;

    const cardId = active.id as string;
    const card = findCard(cardId);
    if (!card) return;

    // Droppable IDs are formatted as "pageIdx-slotKey"
    const overId = over.id as string;
    const dashIdx = overId.indexOf("-");
    const pageIdx = parseInt(overId.substring(0, dashIdx));
    const slotKey = overId.substring(dashIdx + 1);

    placeCard(pageIdx, slotKey, { cardId: card.id, catId: card.categoryId });

    setJustDroppedSlot(overId);
    setTimeout(() => setJustDroppedSlot(null), 400);
  }, [placeCard]);

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={pointerWithin}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
     {fullNotice && (
       <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] bg-ink text-white text-[13px] font-sans px-4 py-2.5 rounded-full shadow-lg">
         {fullNotice}
       </div>
     )}
     {isMobile ? (
       <AppShell>
         <MobileScheduleBuilder
           onAddCard={handleClickPlace}
           cardsLoaded={cardsLoaded}
           justDroppedSlot={justDroppedSlot}
           cardImages={cardImages}
         />
       </AppShell>
     ) : (
       <AppShell
         sidebar={<CardLibrarySidebar />}
         rightPanel={<RightPanel />}
       >
         <div style={{ zoom: exportingNow ? 1 : fitZoom }}>
           <ScheduleCanvas justDroppedSlot={justDroppedSlot} cardImages={cardImages} />
         </div>
       </AppShell>
     )}

      {/* Invisible overlay for dnd-kit collision detection */}
      <DragOverlay dropAnimation={null} style={{ opacity: 0, position: "fixed", pointerEvents: "none" }}>
        {activeCard ? <div /> : null}
      </DragOverlay>

      {/* Visual overlay that follows pointer exactly */}
      {activeCard && <PointerOverlay label={activeCard.label} />}
    </DndContext>
  );
}
