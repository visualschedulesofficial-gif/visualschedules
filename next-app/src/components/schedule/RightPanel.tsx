"use client";

import { useScheduleState } from "@/hooks/useScheduleState";
import { useExport } from "@/hooks/useExport";
import { LANGUAGES, type Language } from "@/lib/constants";

const sectionLabel =
  "text-[12px] tracking-widest uppercase text-[#5C5855] block font-medium";
const selectCls =
  "w-full px-3 py-2 h-[38px] text-[13px] font-medium border border-[#C9C4BB] rounded bg-white text-[#1C1B19] focus:outline-none focus:ring-2 focus:ring-[#7A8F5E] font-sans";

/* Professional line icons (Feather-style) */
const Icon = {
  Pdf: () => (
    <svg className="w-4 h-4 stroke-current fill-none shrink-0" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
      <line x1="8" y1="13" x2="16" y2="13" />
      <line x1="8" y1="17" x2="16" y2="17" />
    </svg>
  ),
  Image: () => (
    <svg className="w-4 h-4 stroke-current fill-none shrink-0" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <path d="M21 15l-5-5L5 21" />
    </svg>
  ),
  WhatsApp: () => (
    <svg className="w-4 h-4 stroke-current fill-none shrink-0" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </svg>
  ),
  Mail: () => (
    <svg className="w-4 h-4 stroke-current fill-none shrink-0" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  ),
  Instagram: () => (
    <svg className="w-4 h-4 stroke-current fill-none shrink-0" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
    </svg>
  ),
  Plus: () => (
    <svg className="w-4 h-4 stroke-current stroke-2 fill-none shrink-0" viewBox="0 0 24 24" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
};

export function RightPanel() {
  const title = useScheduleState((s) => s.title);
  const pages = useScheduleState((s) => s.pages);
  const setTitle = useScheduleState((s) => s.setTitle);
  const addPage = useScheduleState((s) => s.addPage);
  const language = useScheduleState((s) => s.language);
  const setLanguage = useScheduleState((s) => s.setLanguage);
  const labelMode = useScheduleState((s) => s.labelMode);
  const setLabelMode = useScheduleState((s) => s.setLabelMode);
  const { exportPDF, exportJPEG, exporting } = useExport();


  return (
    <div className="flex flex-col overflow-y-auto h-full">
      {/* Pages — compact single row */}
      <section className="p-4 border-b border-border shrink-0">
        <div className="flex items-center justify-between gap-2">
          <label className={sectionLabel}>Pages</label>
          <span className="text-[13px] text-ink font-sans font-medium">1 / {pages.length}</span>
          <button
            onClick={addPage}
            className="h-[34px] px-3 rounded border border-[#7A8F5E] bg-white text-[#4A5A3E] text-[12px] font-sans font-semibold flex items-center gap-1.5 hover:bg-[#7A8F5E] hover:text-white transition-all"
          >
            <Icon.Plus /> Add
          </button>
        </div>
      </section>

      {/* Language */}
      <section className="p-4 border-b border-border shrink-0 space-y-3">
        <label className={sectionLabel}>Language</label>
        <div className="flex items-center gap-6">
          <label className="flex items-center gap-2 text-[13px] font-sans text-ink cursor-pointer">
            <input
              type="radio"
              name="labelMode"
              value="text"
              checked={(labelMode || "single") !== "none"}
              onChange={() => setLabelMode("single")}
              className="accent-[#7A8F5E] w-4 h-4"
            />
            Text
          </label>
          <label className="flex items-center gap-2 text-[13px] font-sans text-ink cursor-pointer">
            <input
              type="radio"
              name="labelMode"
              value="none"
              checked={(labelMode || "single") === "none"}
              onChange={() => setLabelMode("none")}
              className="accent-[#7A8F5E] w-4 h-4"
            />
            No Text
          </label>
        </div>
        {(labelMode || "single") !== "none" && (
          <select
            value={language}
            onChange={(e) => setLanguage(e.target.value as Language)}
            className={selectCls}
          >
            {Object.entries(LANGUAGES).map(([code, name]) => (
              <option key={code} value={code}>{name}</option>
            ))}
          </select>
        )}
      </section>

      {/* Schedule name */}
      <section className="p-4 border-b border-border shrink-0">
        <label className={`${sectionLabel} mb-2.5`}>Schedule name</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full py-2 px-2.5 h-[38px] border border-[#C9C4BB] rounded bg-white font-sans text-[13px] text-ink outline-none focus:ring-2 focus:ring-[#7A8F5E]"
        />
      </section>

      {/* Download */}
      <section className="p-4 shrink-0">
        <label className={`${sectionLabel} mb-2.5`}>Download</label>
        <button
          onClick={exportPDF}
          disabled={exporting}
          className="w-full text-[12px] py-2.5 px-3 bg-[#7A8F5E] border border-[#7A8F5E] text-white cursor-pointer font-sans font-semibold flex items-center justify-center gap-2 mb-2 rounded hover:bg-[#6A7F4E] hover:border-[#6A7F4E] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Icon.Pdf />
          {exporting ? "Preparing…" : "Download printable PDF"}
        </button>
        <button
          onClick={exportJPEG}
          disabled={exporting}
          className="w-full text-[12px] py-2.5 px-3 bg-[#F4F7EE] border border-[#7A8F5E] text-[#4A5A3E] cursor-pointer font-sans font-semibold flex items-center justify-center gap-2 mb-2 rounded hover:bg-[#E8EDE0] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Icon.Image />
          {exporting ? "Preparing…" : "Download printable JPEG"}
        </button>
        <button
          disabled
          title="Coming soon"
          className="w-full text-[12px] py-2.5 px-3 bg-[#F0EEE9] text-[#A7A29A] border border-[#E0DDD6] font-sans font-semibold flex items-center justify-center gap-2 rounded cursor-not-allowed"
        >
          <Icon.WhatsApp />
          Send on WhatsApp
        </button>
      </section>

      {/* Founder note + contact */}
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
          className="flex items-center justify-center gap-2 mb-2 py-2 px-3 rounded bg-[#EAF1E2] border border-[#4A5A3E] text-[12px] font-sans font-semibold text-[#2D5A2D] no-underline hover:bg-[#DFEAD3] transition-all"
        >
          <Icon.WhatsApp /> Join our WhatsApp community
        </a>
        <div className="flex items-center justify-center gap-2">
          <a
            href="mailto:growgently.co@gmail.com"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded bg-[#EAF1E2] border border-[#4A5A3E] hover:bg-[#DFEAD3] transition-all text-[12px] font-sans font-medium text-[#2D5A2D] no-underline"
          >
            <Icon.Mail /> Email
          </a>
          <a
            href="https://wa.me/919529723925?text=Hi!%20I%20have%20a%20question%20about%20Visual%20Schedules"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded bg-[#EAF1E2] border border-[#4A5A3E] hover:bg-[#DFEAD3] transition-all text-[12px] font-sans font-medium text-[#2D5A2D] no-underline"
          >
            <Icon.WhatsApp /> WhatsApp
          </a>
          <a
            href="https://www.instagram.com/visual_schedule_official/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-2 rounded bg-[#EAF1E2] border border-[#4A5A3E] hover:bg-[#DFEAD3] transition-all text-[12px] font-sans font-medium text-[#2D5A2D] no-underline"
          >
            <Icon.Instagram /> Follow
          </a>
        </div>
        <p className="text-center mt-3 text-[12px] font-sans text-[#5C5855]">
          With thanks to{" "}
          <a
            href="https://dataorc.in"
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-[#5C5855] hover:text-ink"
          >
            DataOrc
          </a>
        </p>
      </section>
    </div>
  );
}
