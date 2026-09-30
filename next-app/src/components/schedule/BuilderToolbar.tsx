"use client";

// Row above the page: schedule type + the one setting that goes with it,
// a "what to do next" hint, and (for wide page types) the button that
// slides in the Save & download panel.

import { useEffect, useState } from "react";
import { useScheduleState } from "@/hooks/useScheduleState";
import type { ScheduleType } from "@/lib/constants";

const labelCls = "flex items-center gap-2 text-[12px] font-bold tracking-[.06em] uppercase text-ink-2";
const selectCls = "h-9 px-2.5 rounded-[10px] border border-input-border bg-white text-[13.5px] font-medium normal-case tracking-normal text-ink focus:outline-none focus:ring-2 focus:ring-weekly-accent disabled:opacity-60 disabled:cursor-not-allowed";

export function BuilderToolbar({
  placed,
  total,
  landscape,
  onOpenPanel,
}: {
  placed: number;
  total: number;
  landscape: boolean;
  onOpenPanel: () => void;
}) {
  const scheduleType = useScheduleState((s) => s.scheduleType);
  const setScheduleType = useScheduleState((s) => s.setScheduleType);
  const cardType = useScheduleState((s) => s.cardType);
  const setCardType = useScheduleState((s) => s.setCardType);
  const miniCardCount = useScheduleState((s) => s.miniCardCount);
  const setMiniCardCount = useScheduleState((s) => s.setMiniCardCount);
  const weekMode = useScheduleState((s) => s.weekMode);
  const setWeekMode = useScheduleState((s) => s.setWeekMode);
  const customColNames = useScheduleState((s) => s.customColNames);
  const setCustomColNames = useScheduleState((s) => s.setCustomColNames);
  const ftStyle = useScheduleState((s) => s.ftStyle);
  const setFtStyle = useScheduleState((s) => s.setFtStyle);

  // Changing type on a saved schedule would throw away its layout.
  const [isEditingSaved, setIsEditingSaved] = useState(false);
  useEffect(() => {
    try { setIsEditingSaved(new URLSearchParams(window.location.search).has("id")); } catch {}
  }, []);

  const full = total > 0 && placed >= total;
  const hint = full
    ? landscape ? "All done. Tap Save & download" : "All done. Now save it →"
    : placed === 0 ? "Start: click any card on the left" : `Next: pick card ${placed + 1}`;

  return (
    <div className="shrink-0 flex items-center gap-4 px-6 py-3 border-b border-border bg-[#FAFBF8]">
      <label className={labelCls}>
        Type
        <select
          value={scheduleType}
          onChange={(e) => setScheduleType(e.target.value as ScheduleType)}
          disabled={isEditingSaved}
          title={isEditingSaved ? "Type can't be changed when editing a saved schedule" : undefined}
          className={selectCls}
        >
          <option value="mini">My Schedule</option>
          <option value="daily">Daily</option>
          <option value="firstthen">First / Then</option>
          <option value="iwant">I Want</option>
          <option value="weekly">Weekly</option>
          <option value="custom">Custom</option>
          <option value="timetable">Timetable</option>
        </select>
      </label>

      {scheduleType === "mini" && (
        <label className={labelCls}>
          Cards
          <select value={miniCardCount} onChange={(e) => setMiniCardCount(Number(e.target.value) as 2 | 3 | 4 | 5)} className={selectCls}>
            {[2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      )}
      {scheduleType === "daily" && (
        <label className={labelCls}>
          Card type
          <select value={cardType} onChange={(e) => setCardType(e.target.value as "visual" | "equal" | "text")} className={selectCls}>
            <option value="visual">Picture focus</option>
            <option value="equal">Equal</option>
            <option value="text">Text focus</option>
          </select>
        </label>
      )}
      {scheduleType === "weekly" && (
        <label className={labelCls}>
          Days
          <select value={weekMode} onChange={(e) => setWeekMode(e.target.value as "week" | "weekdays")} className={selectCls}>
            <option value="week">All 7</option>
            <option value="weekdays">Weekdays</option>
          </select>
        </label>
      )}
      {scheduleType === "custom" && (
        <label className={labelCls}>
          Columns
          <select
            value={customColNames.length}
            onChange={(e) => {
              const n = Number(e.target.value);
              setCustomColNames(Array.from({ length: n }, (_, i) => customColNames[i] || `Column ${i + 1}`));
            }}
            className={selectCls}
          >
            {[2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      )}
      {scheduleType === "firstthen" && (
        <label className={labelCls}>
          Board
          <select value={ftStyle} onChange={(e) => setFtStyle(e.target.value as "first-then" | "first-then-now" | "sequencing")} className={selectCls}>
            <option value="first-then">First, Then</option>
            <option value="first-then-now">First, Then, Now</option>
            <option value="sequencing">Sequencing</option>
          </select>
        </label>
      )}

      <div className="flex-1" />

      {landscape && (
        <button
          type="button"
          onClick={onOpenPanel}
          className={`h-10 px-4 rounded-[10px] bg-accent-strong text-white font-bold text-[14px] flex items-center gap-2 hover:bg-accent-hover ${full ? "animate-[vsNudge_1.6s_ease-in-out_2]" : ""}`}
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-10" /></svg>
          Save &amp; download
        </button>
      )}

      <div
        key={hint}
        role="status"
        className={`flex items-center gap-2 rounded-full pl-2 pr-3.5 py-1.5 text-[13px] font-semibold border animate-[vsFadeIn_250ms_ease-out] ${
          full ? "bg-[#E6F2E1] text-[#2E5A26] border-[#C6DDBC]" : "bg-[#FFF7E8] text-[#7A5213] border-[#F1DDB6]"
        }`}
      >
        <span className={`w-[22px] h-[22px] rounded-full flex items-center justify-center text-[12px] font-extrabold ${full ? "bg-[#7FAF6A] text-white" : "bg-[#F4C46A] text-[#5A3A08]"}`}>
          {full ? "✓" : "!"}
        </span>
        {hint}
      </div>
    </div>
  );
}
