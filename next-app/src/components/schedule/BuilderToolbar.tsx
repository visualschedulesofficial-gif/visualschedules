"use client";

// Row above the page: schedule type + the one setting that goes with it,
// pages, bilingual cards, and a one-click Save & download on the right.

import { useEffect, useState } from "react";
import { useScheduleState } from "@/hooks/useScheduleState";
import { useExport } from "@/hooks/useExport";
import { LANGUAGES, LANGUAGE_NATIVE, type Language, type ScheduleType } from "@/lib/constants";
import type { PageData } from "@/types/schedule";

const fieldCls = "flex flex-col gap-1 shrink-0";
const labelCls = "text-[11px] font-bold tracking-[.07em] uppercase text-ink-3 leading-none";
const selectCls = "h-9 px-2.5 rounded-[10px] border border-input-border bg-white text-[13.5px] font-medium text-ink focus:outline-none focus:ring-2 focus:ring-weekly-accent disabled:opacity-60 disabled:cursor-not-allowed";
const stepBtn = "w-8 h-full flex items-center justify-center text-[18px] font-bold text-accent-strong hover:bg-surface-hover disabled:text-[#C4CBBF] disabled:hover:bg-transparent disabled:cursor-not-allowed";

function pageHasCards(p: PageData | undefined) {
  if (!p) return false;
  if ("slots" in p) return p.slots.some(Boolean);
  return Object.values(p.columns || {}).some((c) => c?.length);
}

export function BuilderToolbar({
  placed,
  total,
}: {
  placed: number;
  total: number;
}) {
  // One click: download the page as a JPEG (and save it to My Schedules
  // when signed in). No panel, no format question.
  const { exportJPEG, exporting } = useExport();
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
  const pages = useScheduleState((s) => s.pages);
  const addPage = useScheduleState((s) => s.addPage);
  const removePage = useScheduleState((s) => s.removePage);
  const language = useScheduleState((s) => s.language);
  const labelMode = useScheduleState((s) => s.labelMode);
  const setLabelMode = useScheduleState((s) => s.setLabelMode);
  const secondLanguage = useScheduleState((s) => s.secondLanguage);
  const setSecondLanguage = useScheduleState((s) => s.setSecondLanguage);
  const bilingual = labelMode === "multi";

  // Changing type on a saved schedule would throw away its layout.
  const [isEditingSaved, setIsEditingSaved] = useState(false);
  useEffect(() => {
    try { setIsEditingSaved(new URLSearchParams(window.location.search).has("id")); } catch {}
  }, []);

  // The second language can't be the same as the main one.
  useEffect(() => {
    if (bilingual && secondLanguage === language) {
      setSecondLanguage((language === "en" ? "hi" : "en") as Language);
    }
  }, [bilingual, language, secondLanguage, setSecondLanguage]);

  const removeLastPage = () => {
    if (pages.length <= 1) return;
    if (pageHasCards(pages[pages.length - 1]) && !window.confirm(`Remove page ${pages.length} and its cards?`)) return;
    removePage(pages.length - 1);
  };

  const full = total > 0 && placed >= total;
  const langName = (c: string) => (LANGUAGE_NATIVE[c] && LANGUAGE_NATIVE[c] !== LANGUAGES[c as keyof typeof LANGUAGES] ? `${LANGUAGE_NATIVE[c]} · ` : "") + (LANGUAGES[c as keyof typeof LANGUAGES] || c);

  return (
    <div className="shrink-0 flex items-end gap-4 px-6 py-2.5 border-b border-border bg-[#FAFBF8]">
      <label className={fieldCls}>
        <span className={labelCls}>Type</span>
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
        <label className={fieldCls}>
          <span className={labelCls}>Cards</span>
          <select value={miniCardCount} onChange={(e) => setMiniCardCount(Number(e.target.value) as 2 | 3 | 4 | 5)} className={selectCls}>
            {[2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
      )}
      {scheduleType === "daily" && (
        <label className={fieldCls}>
          <span className={labelCls}>Card type</span>
          <select value={cardType} onChange={(e) => setCardType(e.target.value as "visual" | "equal" | "text")} className={selectCls}>
            <option value="visual">Picture focus</option>
            <option value="equal">Equal</option>
            <option value="text">Text focus</option>
          </select>
        </label>
      )}
      {scheduleType === "weekly" && (
        <label className={fieldCls}>
          <span className={labelCls}>Days</span>
          <select value={weekMode} onChange={(e) => setWeekMode(e.target.value as "week" | "weekdays")} className={selectCls}>
            <option value="week">All 7</option>
            <option value="weekdays">Weekdays</option>
          </select>
        </label>
      )}
      {scheduleType === "custom" && (
        <label className={fieldCls}>
          <span className={labelCls}>Columns</span>
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
        <label className={fieldCls}>
          <span className={labelCls}>Board</span>
          <select value={ftStyle} onChange={(e) => setFtStyle(e.target.value as "first-then" | "first-then-now" | "sequencing")} className={selectCls}>
            <option value="first-then">First, Then</option>
            <option value="first-then-now">First, Then, Now</option>
            <option value="sequencing">Sequencing</option>
          </select>
        </label>
      )}

      {/* Timetable's pages are fixed by its layout. */}
      {scheduleType !== "timetable" && (
        <div className={fieldCls} role="group" aria-label="Pages">
          <span className={labelCls}>Pages</span>
          <div className="h-9 flex items-stretch rounded-[10px] border border-input-border bg-white overflow-hidden">
            <button type="button" onClick={removeLastPage} disabled={pages.length <= 1} aria-label="Remove last page" className={stepBtn}>−</button>
            <span key={pages.length} className="min-w-[30px] px-1 flex items-center justify-center text-[14px] font-bold text-ink border-x border-border animate-[vsPop_300ms_ease-out]" aria-live="polite">
              {pages.length}
            </span>
            <button type="button" onClick={addPage} disabled={pages.length >= 20} aria-label="Add a page" className={stepBtn}>+</button>
          </div>
        </div>
      )}

      <div className={fieldCls}>
        <span className={labelCls}>Bilingual</span>
        <div className="h-9 flex items-center gap-2.5">
          {/* Real knob element: the old ::after knob got pushed to the
              middle by global styles. */}
          <button
            type="button"
            role="switch"
            aria-checked={bilingual}
            aria-label="Bilingual cards"
            title="Show a second language under each card"
            onClick={() => setLabelMode(bilingual ? "single" : "multi")}
            className={`relative w-11 h-6 shrink-0 rounded-full p-0 border-0 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-weekly-accent ${bilingual ? "bg-accent-strong" : "bg-[#CDD5C7]"}`}
          >
            <span
              aria-hidden
              className={`absolute top-[3px] left-[3px] w-[18px] h-[18px] rounded-full bg-white shadow-[0_1px_3px_rgba(0,0,0,0.25)] transition-transform duration-200 ${bilingual ? "translate-x-5" : "translate-x-0"}`}
            />
          </button>
          {bilingual && (
            <select
              value={secondLanguage}
              onChange={(e) => setSecondLanguage(e.target.value as Language)}
              aria-label="Second language"
              className={`${selectCls} max-w-[190px] animate-[vsSlideIn_250ms_ease-out]`}
            >
              {Object.keys(LANGUAGES).filter((c) => c !== language).map((c) => (
                <option key={c} value={c}>{langName(c)}</option>
              ))}
            </select>
          )}
        </div>
      </div>

      <div className="flex-1" />

      <div className="flex items-center gap-3 self-center">
        {!full && placed > 0 ? (
          <span className="text-[13px] font-semibold text-ink-3 whitespace-nowrap" aria-live="polite">{placed} of {total} cards</span>
        ) : null}
        <button
          type="button"
          onClick={() => { void exportJPEG(); }}
          disabled={placed === 0 || exporting}
          title={placed === 0 ? "Add at least one card first" : "Download as an image (JPEG)"}
          className={`h-10 px-4 disabled:bg-[#C9D2C1] disabled:cursor-not-allowed rounded-[10px] bg-accent-strong text-white font-bold text-[14px] flex items-center gap-2 hover:bg-accent-hover whitespace-nowrap ${full ? "ring-2 ring-[#7FAF6A]/50 ring-offset-1" : ""}`}
        >
          {/* Schedule full: the download arrow turns into a tick, once —
              replaces the old moving "All done!" pill. */}
          {full && !exporting ? (
            <span key="done" role="status" aria-label="All slots filled" className="w-[18px] h-[18px] rounded-full bg-[#7FAF6A] flex items-center justify-center animate-[vsPop_400ms_ease-out]">
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
            </span>
          ) : (
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></svg>
          )}
          {exporting ? "Preparing…" : "Save & download"}
        </button>
      </div>
    </div>
  );
}
