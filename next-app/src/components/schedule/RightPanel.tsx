"use client";

import { useScheduleState } from "@/hooks/useScheduleState";
import { useExport } from "@/hooks/useExport";
import type { GridCols } from "@/lib/constants";

export function RightPanel() {
  const scheduleType = useScheduleState((s) => s.scheduleType);
  const gridCols = useScheduleState((s) => s.gridCols);
  const title = useScheduleState((s) => s.title);
  const pages = useScheduleState((s) => s.pages);

  const setGridCols = useScheduleState((s) => s.setGridCols);
  const setTitle = useScheduleState((s) => s.setTitle);
  const addPage = useScheduleState((s) => s.addPage);
  const { exportPDF, exportJPEG, exporting } = useExport();

  return (
    <div className="flex flex-col overflow-y-auto">
      {/* Grid Size (daily only) */}
      {scheduleType === "daily" && (
        <section className="p-4 border-b border-border">
          <label className="text-[11px] tracking-widest uppercase text-[#8A8480] mb-2.5 block font-medium">
            Grid Size
          </label>
          <div className="flex gap-[3px]">
            {([2, 3, 4] as GridCols[]).map((cols) => (
              <button
                key={cols}
                onClick={() => setGridCols(cols)}
                className={`flex-1 py-[7px] text-sm border font-sans text-center transition-all ${
                  gridCols === cols
                    ? "bg-ink text-white border-ink"
                    : "border-border text-ink-3 hover:bg-ink hover:text-white hover:border-ink"
                }`}
              >
                {cols}x{cols === 2 ? 3 : cols === 3 ? 4 : 6}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Week Mode (weekly only) */}
      {scheduleType === "weekly" && (
        <section className="p-4 border-b border-border">
          <label className="text-[11px] tracking-widest uppercase text-[#8A8480] mb-2.5 block font-medium">
            Days
          </label>
          <div className="flex gap-[3px]">
            {(["week", "weekdays"] as const).map((mode) => (
              <button
                key={mode}
                onClick={() => useScheduleState.getState().setWeekMode(mode)}
                className={`flex-1 py-[7px] text-[11px] border font-sans text-center transition-all ${
                  useScheduleState.getState().weekMode === mode
                    ? "bg-ink text-white border-ink"
                    : "border-border text-ink-3 hover:bg-ink hover:text-white hover:border-ink"
                }`}
              >
                {mode === "week" ? "Full Week" : "Weekdays"}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Column count (custom only) */}
      {scheduleType === "custom" && (
        <section className="p-4 border-b border-border">
          <label className="text-[11px] tracking-widest uppercase text-[#8A8480] mb-2.5 block font-medium">
            Columns
          </label>
          <div className="flex gap-[3px]">
            {[2, 3, 4, 5].map((n) => (
              <button
                key={n}
                onClick={() => {
                  const names = useScheduleState.getState().customColNames;
                  const newNames = Array.from({ length: n }, (_, i) => names[i] || `Column ${i + 1}`);
                  useScheduleState.getState().setCustomColNames(newNames);
                }}
                className={`flex-1 py-[7px] text-sm border font-sans text-center transition-all ${
                  useScheduleState.getState().customColNames.length === n
                    ? "bg-ink text-white border-ink"
                    : "border-border text-ink-3 hover:bg-ink hover:text-white hover:border-ink"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </section>
      )}

      {/* Title */}
      <section className="p-4 border-b border-border">
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
      <section className="p-4 border-b border-border">
        <label className="text-[11px] tracking-widest uppercase text-[#8A8480] mb-2.5 block font-medium">
          Export
        </label>
        <button
          onClick={exportPDF}
          disabled={exporting}
          className="w-full text-[11px] tracking-wider uppercase py-[0.55rem] border border-border bg-transparent text-[#4A4540] cursor-pointer font-sans flex items-center justify-center gap-1 mb-1.5 font-medium hover:border-ink hover:text-ink transition-all disabled:opacity-50"
        >
          <svg className="w-3 h-3 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          {exporting ? "Exporting..." : "Download PDF"}
        </button>
        <button
          onClick={exportJPEG}
          disabled={exporting}
          className="w-full text-[11px] tracking-wider uppercase py-[0.55rem] border border-border bg-transparent text-[#4A4540] cursor-pointer font-sans flex items-center justify-center gap-1 mb-1.5 font-medium hover:border-ink hover:text-ink transition-all disabled:opacity-50"
        >
          <svg className="w-3 h-3 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          {exporting ? "Exporting..." : "Download JPEG"}
        </button>
        <button className="w-full text-[11px] tracking-wider uppercase py-[0.55rem] bg-ink text-white border border-ink cursor-pointer font-sans flex items-center justify-center gap-1 font-medium hover:bg-[#333] transition-all">
          Share on WhatsApp
        </button>
      </section>

      {/* Page Actions */}
      <section className="p-4">
        <label className="text-[11px] tracking-widest uppercase text-[#8A8480] mb-2.5 block font-medium">
          Pages
        </label>
        <div className="flex justify-between py-[5px] text-[13px] border-b border-surface-pressed">
          <span className="text-[#8A8480]">Current</span>
          <span className="text-ink font-medium">Page 1 of {pages.length}</span>
        </div>
        <button
          onClick={addPage}
          className="w-full text-[11px] tracking-wider uppercase py-[0.55rem] border border-border bg-transparent text-[#4A4540] cursor-pointer font-sans flex items-center justify-center gap-1 mt-3 font-medium hover:border-ink hover:text-ink transition-all"
        >
          <svg className="w-3 h-3 stroke-current stroke-2 fill-none" viewBox="0 0 24 24">
            <line x1="12" y1="5" x2="12" y2="19" />
            <line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Add Page
        </button>
      </section>
    </div>
  );
}
