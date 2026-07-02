"use client";

import { useScheduleState } from "@/hooks/useScheduleState";
import { useExport } from "@/hooks/useExport";
import type { GridCols } from "@/lib/constants";

const SCHEDULE_TYPE_LABELS = {
  daily: "Daily Schedule",
  weekly: "Weekly Schedule",
  custom: "Custom Schedule",
  firstthen: "First/Then Board",
} as const;

export function RightPanel() {
  const scheduleType = useScheduleState((s) => s.scheduleType);
  const setScheduleType = useScheduleState((s) => s.setScheduleType);
  const gridCols = useScheduleState((s) => s.gridCols);
  const setGridCols = useScheduleState((s) => s.setGridCols);
  const title = useScheduleState((s) => s.title);
  const pages = useScheduleState((s) => s.pages);

  const setTitle = useScheduleState((s) => s.setTitle);
  const addPage = useScheduleState((s) => s.addPage);
  const { exportPDF, exportJPEG, exporting } = useExport();

  return (
    <div className="flex flex-col overflow-y-auto h-full">
      {/* Schedule Type Selector */}
      <section className="p-4 border-b border-border shrink-0">
        <label className="text-[11px] tracking-widest uppercase text-[#8A8480] mb-2.5 block font-medium">
          Schedule Type
        </label>
        <div className="flex flex-col gap-2">
          {(["daily", "weekly", "custom", "firstthen"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setScheduleType(type)}
              className={`py-2.5 px-3 text-[13px] font-bold border-2 rounded transition-all font-sans text-center ${
                scheduleType === type
                  ? "bg-[#7A8F5E] text-white border-[#7A8F5E]"
                  : "border-[#D0D0D0] text-[#1C1B19] hover:border-[#7A8F5E] hover:bg-[#F5F5F5]"
              }`}
            >
              {SCHEDULE_TYPE_LABELS[type]}
            </button>
          ))}
        </div>
      </section>

      {/* Grid Size (daily only) */}
      {scheduleType === "daily" && (
        <section className="p-4 border-b border-border shrink-0">
          <label className="text-[11px] tracking-widest uppercase text-[#8A8480] mb-2.5 block font-medium">
            Grid
          </label>
          <div className="flex gap-2">
            {([2, 3, 4] as GridCols[]).map((cols) => (
              <button
                key={cols}
                onClick={() => setGridCols(cols)}
                className={`flex-1 py-2.5 text-[13px] font-bold border-2 text-center rounded transition-all font-sans ${
                  gridCols === cols
                    ? "bg-[#7A8F5E] text-white border-[#7A8F5E]"
                    : "border-[#D0D0D0] text-[#1C1B19] hover:border-[#7A8F5E] hover:bg-[#F5F5F5]"
                }`}
              >
                {cols}×{cols === 2 ? 3 : cols === 3 ? 4 : 6}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Week Mode (weekly only) */}
      {scheduleType === "weekly" && (
        <section className="p-4 border-b border-border shrink-0">
          <label className="text-[11px] tracking-widest uppercase text-[#8A8480] mb-2.5 block font-medium">
            Days
          </label>
          <div className="flex gap-2">
            {(["week", "weekdays"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => useScheduleState.getState().setWeekMode(mode)}
                className={`flex-1 py-2.5 text-[13px] font-bold border-2 rounded font-sans text-center transition-all ${
                  useScheduleState.getState().weekMode === mode
                    ? "bg-[#7A8F5E] text-white border-[#7A8F5E]"
                    : "border-[#D0D0D0] text-[#1C1B19] hover:border-[#7A8F5E] hover:bg-[#F5F5F5]"
                }`}
              >
                {mode === "week" ? "Full Week" : "Weekdays"}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Column config (custom/firstthen only) */}
      {(scheduleType === "custom" || scheduleType === "firstthen") && (
        <section className="p-4 border-b border-border shrink-0">
          <label className="text-[11px] tracking-widest uppercase text-[#8A8480] mb-2.5 block font-medium">
            Layout
          </label>
          <div className="flex gap-[3px]">
            {scheduleType === "custom"
              ? [2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => {
                      const names = useScheduleState.getState().customColNames;
                      const newNames = Array.from(
                        { length: n },
                        (_, i) => names[i] || `Column ${i + 1}`
                      );
                      useScheduleState.getState().setCustomColNames(newNames);
                    }}
                    className={`flex-1 py-[7px] text-[12px] border font-sans text-center transition-all ${
                      useScheduleState.getState().customColNames.length === n
                        ? "bg-ink text-white border-ink"
                        : "border-border text-ink-3 hover:bg-ink hover:text-white hover:border-ink"
                    }`}
                  >
                    {n}
                  </button>
                ))
              : [2, 3].map((n) => (
                  <button
                    key={n}
                    onClick={() => {
                      const newNames =
                        n === 3 ? ["First", "Then", "Now"] : ["First", "Then"];
                      useScheduleState.getState().setCustomColNames(newNames);
                    }}
                    className={`flex-1 py-[7px] text-[12px] border font-sans text-center transition-all ${
                      useScheduleState.getState().customColNames.length === n
                        ? "bg-ink text-white border-ink"
                        : "border-border text-ink-3 hover:bg-ink hover:text-white hover:border-ink"
                    }`}
                  >
                    {n === 2 ? "First · Then" : "First · Then · Now"}
                  </button>
                ))}
          </div>
        </section>
      )}

      {/* Title */}
      <section className="p-4 border-b border-border shrink-0">
        <label className="text-[11px] tracking-widest uppercase text-[#8A8480] mb-2.5 block font-medium">
          Title
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full py-2 px-2.5 border border-border bg-surface-hover font-sans text-[13px] text-ink outline-none focus:border-accent"
        />
      </section>

      {/* Export Actions */}
      <section className="p-4 border-b border-border shrink-0">
        <label className="text-[11px] tracking-widest uppercase text-[#8A8480] mb-2.5 block font-medium">
          Export
        </label>
        <button
          onClick={exportPDF}
          disabled={exporting}
          className="w-full text-[13px] tracking-wider uppercase py-2.5 px-3 border-2 border-[#9ACA84] bg-white text-[#1C1B19] cursor-pointer font-sans font-bold flex items-center justify-center gap-2 mb-2 rounded hover:bg-[#9ACA84] hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg
            className="w-4 h-4 stroke-[#9ACA84] fill-none"
            viewBox="0 0 24 24"
            strokeWidth="2"
          >
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10z" />
            <polyline points="14 2 14 10 22 10" />
          </svg>
          {exporting ? "Exporting..." : "PDF"}
        </button>
        <button
          onClick={exportJPEG}
          disabled={exporting}
          className="w-full text-[13px] tracking-wider uppercase py-2.5 px-3 border-2 border-[#9ACA84] bg-white text-[#1C1B19] cursor-pointer font-sans font-bold flex items-center justify-center gap-2 mb-2 rounded hover:bg-[#9ACA84] hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg
            className="w-4 h-4 stroke-[#9ACA84] fill-none"
            viewBox="0 0 24 24"
            strokeWidth="2"
          >
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
          {exporting ? "Exporting..." : "JPEG"}
        </button>
        <button className="w-full text-[13px] tracking-wider uppercase py-2.5 px-3 bg-[#1C1B19] text-white border-2 border-[#1C1B19] cursor-pointer font-sans font-bold flex items-center justify-center gap-2 rounded hover:bg-[#333] transition-all">
          💬 WhatsApp
        </button>
      </section>

      {/* Page Actions */}
      <section className="p-4 border-b border-border shrink-0">
        <label className="text-[11px] tracking-widest uppercase text-[#8A8480] mb-2.5 block font-medium">
          Pages
        </label>
        <div className="flex justify-between py-[5px] text-[13px] border-b border-surface-pressed">
          <span className="text-[#8A8480]">Current</span>
          <span className="text-ink font-medium">Page 1 of {pages.length}</span>
        </div>
        <button
          onClick={addPage}
          className="w-full text-[13px] tracking-wider uppercase py-2.5 px-3 border-2 border-[#7A8F5E] bg-white text-[#1C1B19] cursor-pointer font-sans font-bold flex items-center justify-center gap-2 mt-3 rounded hover:bg-[#7A8F5E] hover:text-white transition-all"
        >
          <svg className="w-4 h-4 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Page
        </button>
      </section>

      {/* Footer - Social & Contact */}
      <section className="p-4 mt-auto border-t border-border shrink-0">
        <div className="text-center space-y-3">
          <a
            href="https://www.instagram.com/visual_schedule_official/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 py-2 px-3 rounded border border-[#E5E5E5] hover:bg-[#F5F5F5] transition-all text-[13px] font-sans text-[#1C1B19]"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1 1 12.324 0 6.162 6.162 0 0 1-12.324 0zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm4.965-10.322a1.44 1.44 0 1 1 2.881.001 1.44 1.44 0 0 1-2.881-.001z" />
            </svg>
            Follow Us
          </a>

          <a
            href="mailto:visualschedulesofficial@gmail.com"
            className="flex items-center justify-center gap-2 py-2 px-3 rounded border border-[#E5E5E5] hover:bg-[#F5F5F5] transition-all text-[13px] font-sans text-[#1C1B19]"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
            Email
          </a>

          <a
            href="tel:+919529723925"
            className="flex items-center justify-center gap-2 py-2 px-3 rounded border border-[#E5E5E5] hover:bg-[#F5F5F5] transition-all text-[13px] font-sans text-[#1C1B19]"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
            </svg>
            Contact
          </a>
        </div>
      </section>
    </div>
  );
}
