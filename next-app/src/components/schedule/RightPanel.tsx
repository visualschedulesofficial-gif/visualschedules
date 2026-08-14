"use client";

import { useScheduleState } from "@/hooks/useScheduleState";
import { useExport } from "@/hooks/useExport";
import { LANGUAGES, type Language } from "@/lib/constants";

const sectionLabel =
  "text-[12px] tracking-widest uppercase text-ink-2 block font-medium";
const selectCls =
  "w-full px-3 py-2 h-[38px] text-[13px] font-medium border border-input-border rounded bg-white text-ink focus:outline-none focus:ring-2 focus:ring-weekly-accent font-sans";

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
  YouTube: () => (
    <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="currentColor">
      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
    </svg>
  ),
  Pinterest: () => (
    <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345c-.091.379-.293 1.194-.333 1.361-.052.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146A12 12 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z" />
    </svg>
  ),
  WhatsAppBrand: () => (
    <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="currentColor">
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.872.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.83 9.83 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.82 11.82 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.88 11.88 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.82 11.82 0 0 0 20.465 3.488" />
    </svg>
  ),
  InstagramBrand: () => (
    <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.88 1.44 1.44 0 0 0 0-2.88z" />
    </svg>
  ),
  MailBrand: () => (
    <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z" />
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
            className="h-[34px] px-3 rounded border border-weekly-accent bg-white text-accent-strong text-[12px] font-sans font-semibold flex items-center gap-1.5 hover:bg-weekly-accent hover:text-white transition-all"
          >
            <Icon.Plus /> Add
          </button>
        </div>
      </section>

      {/* Language */}
      <section className="p-4 border-b border-border shrink-0 space-y-3">
        <label className={sectionLabel}>Language</label>
        <div className="flex items-center gap-2">
          {([["single", "Text"], ["none", "No Text"]] as const).map(([mode, label]) => {
            const active = (labelMode || "single") === mode
              || (mode === "single" && (labelMode || "single") !== "none");
            return (
              <button
                key={mode}
                type="button"
                onClick={() => setLabelMode(mode)}
                aria-pressed={active}
                className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded text-[13px] font-sans font-semibold transition-all"
                style={active
                  ? { background: "var(--accent-strong)", color: "#fff", border: "1px solid var(--accent-strong)" }
                  : { background: "#fff", color: "var(--ink-2)", border: "1px solid var(--input-border)" }}
              >
                <span
                  className="w-3.5 h-3.5 rounded-full flex items-center justify-center shrink-0"
                  style={{ border: `2px solid ${active ? "#fff" : "var(--input-border)"}` }}
                >
                  {active && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                </span>
                {label}
              </button>
            );
          })}
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
          className="w-full py-2 px-2.5 h-[38px] border border-input-border rounded bg-white font-sans text-[13px] text-ink outline-none focus:ring-2 focus:ring-weekly-accent"
        />
      </section>

      {/* Download */}
      <section className="p-4 shrink-0">
        <label className={`${sectionLabel} mb-2.5`}>Download</label>
        <button
          onClick={exportJPEG}
          disabled={exporting}
          className="w-full text-[12px] py-2.5 px-3 bg-weekly-accent border border-weekly-accent text-white cursor-pointer font-sans font-semibold flex items-center justify-center gap-2 mb-2 rounded hover:bg-accent-strong-hover hover:border-accent-strong-hover transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Icon.Image />
          {exporting ? "Preparing…" : "Save Image (A4)"}
        </button>
        <button
          onClick={exportPDF}
          disabled={exporting}
          className="w-full text-[12px] py-2.5 px-3 bg-[#F4F7EE] border border-weekly-accent text-accent-strong cursor-pointer font-sans font-semibold flex items-center justify-center gap-2 mb-2 rounded hover:bg-[#E8EDE0] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Icon.Pdf />
          {exporting ? "Preparing…" : "Save PDF"}
        </button>
        {/* Was permanently disabled. Browsers can't attach a file to a
            WhatsApp link, so this saves the image first (so it's in their
            gallery) and then opens WhatsApp for them to attach and send. */}
        <button
          onClick={async () => {
            try { await exportJPEG(); } catch { return; }
            window.open(
              "https://wa.me/?text=" +
                encodeURIComponent(
                  `Here's our "${title}" visual schedule — made free at https://visualschedule.app`
                ),
              "_blank",
              "noopener,noreferrer"
            );
          }}
          disabled={exporting}
          className="w-full text-[12px] py-2.5 px-3 bg-[#F4F7EE] border border-weekly-accent text-accent-strong cursor-pointer font-sans font-semibold flex items-center justify-center gap-2 rounded hover:bg-[#E8EDE0] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Icon.WhatsApp />
          {exporting ? "Preparing…" : "Send on WhatsApp"}
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
          className="flex items-center justify-center gap-2 mb-2 py-2 px-3 rounded bg-accent-soft border border-accent-strong text-[12px] font-sans font-semibold text-[#2D5A2D] no-underline hover:bg-[#DFEAD3] transition-all"
        >
          <Icon.WhatsApp /> Join our WhatsApp community
        </a>
        <div className="flex items-center justify-center gap-1.5">
          {([
            ["mailto:growgently.co@gmail.com", "Email", "#EA4335", <Icon.MailBrand key="m" />],
            ["https://wa.me/919529723925?text=Hi!%20I%20have%20a%20question%20about%20Visual%20Schedules", "WhatsApp", "#25D366", <Icon.WhatsAppBrand key="w" />],
            ["https://www.instagram.com/visual_schedule_official/", "Instagram", "#E1306C", <Icon.InstagramBrand key="i" />],
            ["https://in.pinterest.com/visualschedulesofficial/_profile/", "Pinterest", "#BD081C", <Icon.Pinterest key="p" />],
            ["https://www.youtube.com/@VisualSchedulesOfficial", "YouTube", "#FF0000", <Icon.YouTube key="y" />],
          ] as const).map(([href, label, colour, icon]) => (
            <a
              key={label}
              href={href}
              target={href.startsWith("mailto:") ? undefined : "_blank"}
              rel={href.startsWith("mailto:") ? undefined : "noopener noreferrer"}
              aria-label={label}
              title={label}
              className="flex-1 flex items-center justify-center py-2 rounded border border-border bg-white hover:bg-surface-hover transition-all no-underline"
              style={{ color: colour }}
            >
              {icon}
            </a>
          ))}
        </div>
        <p className="text-center mt-3 text-[12px] font-sans text-ink-2">
          With thanks to{" "}
          <a
            href="https://dataorc.in"
            target="_blank"
            rel="noopener noreferrer"
            className="underline text-ink-2 hover:text-ink"
          >
            DataOrc
          </a>
        </p>
      </section>
    </div>
  );
}
