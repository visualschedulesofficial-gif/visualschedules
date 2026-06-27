"use client";

import { useEffect, useRef } from "react";
import { useScheduleState } from "./useScheduleState";

const SAVE_DELAY = 2000;

export function useAutoSave() {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDirty = useScheduleState((s) => s.isDirty);
  const id = useScheduleState((s) => s.id);

  useEffect(() => {
    if (!isDirty || !id) return;

    if (timerRef.current) clearTimeout(timerRef.current);

    timerRef.current = setTimeout(async () => {
      const state = useScheduleState.getState();
      try {
        await fetch(`/api/schedules/${state.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: state.title,
            scheduleType: state.scheduleType,
            language: state.language,
            gender: state.gender,
            gridCols: state.gridCols,
            customColNames: state.customColNames,
            weekMode: state.weekMode,
            cardStyle: state.cardStyle,
            data: { pages: state.pages },
          }),
        });
        state.markClean();
      } catch (err) {
        console.error("Auto-save failed:", err);
      }
    }, SAVE_DELAY);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [isDirty, id]);
}
