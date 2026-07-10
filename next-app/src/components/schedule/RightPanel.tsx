"use client";

import { useScheduleState } from "@/hooks/useScheduleState";
import { useExport } from "@/hooks/useExport";
import { LANGUAGES, type Language } from "@/lib/constants";

const sectionLabel =
  "text-[11px] tracking-widest uppercase text-[#8A8480] mb-2.5 block font-medium";
const selectCls =
  "w-full px-3 py-2 h-[38px] text-[13px] font-medium border border-[#C9C4BB] rounded bg-white text-[#1C1B19] focus:outline-none focus:ring-2 focus:ring-[#7A8F5E] font-sans";

export function RightPanel() {
  const scheduleType = useScheduleState((s) => s.scheduleType);
  const title = useScheduleState((s) => s.title);
  const pages = useScheduleState((s) => s.pages);
  const setTitle = useScheduleState((s) => s.setTitle);
  const addPage = useScheduleState((s) => s.addPage);
  const language = useScheduleState((s) => s.language);
  const setLanguage = useScheduleState((s) => s.setLanguage);
  const labelMode = useScheduleState((s) => s.labelMode);
  const setLabelMode = useScheduleState((s) => s.setLabelMode);
  const secondLanguage = useScheduleState((s) => s.secondLanguage);
  const setSecondLanguage = useScheduleState((s) => s.setSecondLanguage);
  const { exportPDF, exportJPEG, exporting } = useExport();

  return (
    <div className="flex flex-col overflow-y-auto h-full">
      {/* Pages — on top */}
      <section className="p-4 border-b border-border shrink-0">
        <label className={sectionLabel}>Pages</label>
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

      {/* Card Text */}
      <section className="p-4 border-b border-border shrink-0">
        <label className={sectionLabel}>Card Text</label>
        <div className="space-y-2">
          <label className="flex items-center gap-2 text-[13px] font-sans text-ink cursor-pointer">
            <input
              type="radio"
              name="labelMode"
              checked={labelMode !== "none"}
              onChange={() => setLabelMode("single")}
              className="accent-[#7A8F5E]"
            />
            With text
          </label>
          {labelMode !== "none" && (
            <div className="ml-6 space-y-2">
              <label className="flex items-center gap-2 text-[13px] font-sans text-ink cursor-pointer">
                <input
                  type="radio"
                  name="langMode"
                  checked={labelMode === "single"}
                  onChange={() => setLabelMode("single")}
                  className="accent-[#7A8F5E]"
                />
                Single language
              </label>
              {labelMode === "single" && (
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as Language)}
                  className={`${selectCls} ml-6 w-[calc(100%-1.5rem)]`}
                >
                  {Object.entries(LANGUAGES).map(([code, name]) => (
                    <option key={code} value={code}>{name}</option>
                  ))}
                </select>
              )}
              <label className="flex items-center gap-2 text-[13px] font-sans text-ink cursor-pointer">
                <input
                  type="radio"
                  name="langMode"
                  checked={labelMode === "multi"}
                  onChange={() => setLabelMode("multi")}
                  className="accent-[#7A8F5E]"
                />
                Multilingual
              </label>
              {labelMode === "multi" && (
                <div className="ml-6 space-y-2">
                  <select
                    value={language}
                    onChange={(e) => setLanguage(e.target.value as Language)}
                    className={selectCls}
                  >
                    {Object.entries(LANGUAGES).map(([code, name]) => (
                      <option key={code} value={code}>{name}</option>
                    ))}
                  </select>
                  <select
                    value={secondLanguage}
                    onChange={(e) => setSecondLanguage(e.target.value as Language)}
                    className={selectCls}
                  >
                    {Object.entries(LANGUAGES).map(([code, name]) => (
                      <option key={code} value={code}>{name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}
          <label className="flex items-center gap-2 text-[13px] font-sans text-ink cursor-pointer">
            <input
              type="radio"
              name="labelMode"
              checked={labelMode === "none"}
              onChange={() => setLabelMode("none")}
              className="accent-[#7A8F5E]"
            />
            Without text
          </label>
        </div>
      </section>

      {/* Custom layout (custom schedules only) */}
      {scheduleType === "custom" && (
        <section className="p-4 border-b border-border shrink-0">
          <label className={sectionLabel}>Columns</label>
          <div className="flex gap-[3px]">
            {[2, 3, 4, 5].map((n) => (
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
            ))}
          </div>
        </section>
      )}

      {/* Schedule name */}
      <section className="p-4 border-b border-border shrink-0">
        <label className={sectionLabel}>Schedule name</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full py-2 px-2.5 h-[38px] border border-[#C9C4BB] rounded bg-white font-sans text-[13px] text-ink outline-none focus:ring-2 focus:ring-[#7A8F5E]"
        />
      </section>

      {/* Download */}
      <section className="p-4 border-b border-border shrink-0">
        <label className={sectionLabel}>Download</label>
        <button
          onClick={exportPDF}
          disabled={exporting}
          className="w-full text-[12px] tracking-wider uppercase py-2.5 px-3 border-2 border-[#9ACA84] bg-white text-[#1C1B19] cursor-pointer font-sans font-bold flex items-center justify-center gap-2 mb-2 rounded hover:bg-[#9ACA84] hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4 stroke-current fill-none" viewBox="0 0 24 24" strokeWidth="2">
            <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V10z" />
            <polyline points="14 2 14 10 22 10" />
          </svg>
          {exporting ? "Preparing…" : "Download printable PDF"}
        </button>
        <button
          onClick={exportJPEG}
          disabled={exporting}
          className="w-full text-[12px] tracking-wider uppercase py-2.5 px-3 border-2 border-[#9ACA84] bg-white text-[#1C1B19] cursor-pointer font-sans font-bold flex items-center justify-center gap-2 mb-2 rounded hover:bg-[#9ACA84] hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <svg className="w-4 h-4 stroke-current fill-none" viewBox="0 0 24 24" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" fill="currentColor" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
          {exporting ? "Preparing…" : "Download printable JPEG"}
        </button>
        <button
          disabled
          title="Coming soon"
          className="w-full text-[12px] tracking-wider uppercase py-2.5 px-3 bg-[#F0EEE9] text-[#A7A29A] border-2 border-[#E0DDD6] font-sans font-bold flex items-center justify-center gap-2 rounded cursor-not-allowed"
        >
          💬 Send on WhatsApp
        </button>
      </section>

      {/* Founder note + contact row */}
      <section className="p-4 mt-auto border-t border-border shrink-0">
        <p className="text-[12px] leading-relaxed text-ink-2 font-sans mb-3">
          Built by a parent, for parents of autistic and ADHD kids — a free,
          browser-based visual schedule creator. Print a routine in 2 minutes.
          Your feedback shapes what gets built next.
        </p>
        <a
          href="https://chat.whatsapp.com/F452loR5KUE5RzcffScGw5"
          target="_blank"
          rel="noopener noreferrer"
          className="block text-center py-2 px-3 mb-2 rounded border border-[#BFDCC4] bg-[#F0F7F1] hover:bg-[#E3F0E5] transition-all text-[12px] font-sans font-medium text-[#1C6B3C] no-underline"
        >
          📢 Join our WhatsApp community for updates
        </a>
        <div className="flex items-center justify-center gap-2">
          <a
            href="mailto:growgently.co@gmail.com"
            className="flex-1 text-center py-1.5 px-2 rounded border border-[#E5E5E5] hover:bg-[#F5F5F5] transition-all text-[11px] font-sans text-[#1C1B19] no-underline"
          >
            ✉ Email
          </a>
          <a
            href="https://wa.me/919529723925"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center py-1.5 px-2 rounded border border-[#E5E5E5] hover:bg-[#F5F5F5] transition-all text-[11px] font-sans text-[#1C1B19] no-underline"
          >
            💬 WhatsApp
          </a>
          <a
            href="https://instagram.com/growgently_co"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 text-center py-1.5 px-2 rounded border border-[#E5E5E5] hover:bg-[#F5F5F5] transition-all text-[11px] font-sans text-[#1C1B19] no-underline"
          >
            ♡ Follow
          </a>
        </div>
      </section>
    </div>
  );
}
