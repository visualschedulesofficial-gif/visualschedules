"use client";

import { useState, useCallback, useEffect, useRef } from "react";
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
import { ScheduleCanvas } from "@/components/schedule/ScheduleCanvas";
import { useScheduleState } from "@/hooks/useScheduleState";
import { useAutoSave } from "@/hooks/useAutoSave";
import { ALL_CARDS, getCardLabel, setCardImages as setCardImagesGlobal, setLabelOverrides, type CardImageMap } from "@/lib/card-data";

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
        <div className="w-[88px] bg-white border-2 border-accent/70 rounded shadow-[0_14px_28px_rgba(0,0,0,0.16),0_4px_10px_rgba(139,94,42,0.18)] rotate-[3deg]">
          <div className="w-full aspect-square bg-white flex items-center justify-center rounded-t">
            <svg
              className="w-5 h-5 stroke-accent/60 stroke-[1.5] fill-none"
              viewBox="0 0 24 24"
              strokeLinecap="round"
            >
              <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
            </svg>
          </div>
          <div className="px-1 py-1 bg-white border-t border-accent/15 text-[10px] text-ink text-center leading-tight font-sans font-medium rounded-b truncate">
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
  const [cardImages, setLocalCardImages] = useState<CardImageMap>({});
  const placeCard = useScheduleState((s) => s.placeCard);
  const language = useScheduleState((s) => s.language);

  useAutoSave();

  // Load card images + label overrides from D1 on mount
  useEffect(() => {
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
    const card = ALL_CARDS.find((c) => c.id === cardId);
    if (!card) return;

    const { pages, scheduleType, gridCols } = useScheduleState.getState();
    const pageIdx = 0;

    if (scheduleType === "daily") {
      const page = pages[pageIdx] as import("@/types/schedule").DailyPageData;
      const emptyIdx = page.slots.findIndex((s) => s === null);
      if (emptyIdx === -1) return;
      placeCard(pageIdx, String(emptyIdx), { cardId: card.id, catId: card.categoryId });
      setJustDroppedSlot(`${pageIdx}-${emptyIdx}`);
    } else {
      const page = pages[pageIdx] as import("@/types/schedule").ColumnPageData;
      const cols = Object.keys(page.columns || {});
      // Find first column that has room
      for (const col of cols) {
        const existing = page.columns[col] || [];
        const max = scheduleType === "weekly" ? 5 : scheduleType === "custom" ? 6 : 1;
        if (existing.length < max) {
          placeCard(pageIdx, col, { cardId: card.id, catId: card.categoryId });
          setJustDroppedSlot(`${pageIdx}-${col}`);
          break;
        }
      }
    }
    setTimeout(() => setJustDroppedSlot(null), 400);
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
    const card = ALL_CARDS.find((c) => c.id === cardId);
    if (card) {
      setActiveCard({ id: card.id, label: getCardLabel(card, language) });
    }
  }, [language]);

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    const { active, over } = event;
    setActiveCard(null);

    if (!over) return;

    const cardId = active.id as string;
    const card = ALL_CARDS.find((c) => c.id === cardId);
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
      <AppShell
        sidebar={<CardLibrarySidebar onCardClick={handleClickPlace} />}
        rightPanel={<RightPanel />}
      >
        <ScheduleCanvas justDroppedSlot={justDroppedSlot} cardImages={cardImages} />
      </AppShell>

      {/* Invisible overlay for dnd-kit collision detection */}
      <DragOverlay dropAnimation={null} style={{ opacity: 0, position: "fixed", pointerEvents: "none" }}>
        {activeCard ? <div /> : null}
      </DragOverlay>

      {/* Visual overlay that follows pointer exactly */}
      {activeCard && <PointerOverlay label={activeCard.label} />}
    </DndContext>
  );
}
