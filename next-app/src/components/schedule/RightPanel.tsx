"use client";

import { useEffect, useState } from "react";
import { useScheduleState } from "@/hooks/useScheduleState";
import { useExport } from "@/hooks/useExport";
import { LANGUAGES, type Language } from "@/lib/constants";

const sectionLabel =
  "text-[12px] tracking-[.08em] uppercase text-ink-2 font-bold m-0";
const selectCls =
  "w-full px-3 h-[42px] text-[14px] font-medium border border-input-border rounded-[10px] bg-white text-ink focus:outline-none focus:ring-2 focus:ring-weekly-accent font-sans";
const dlCls =
  "w-full h-11 rounded-xl border-[1.5px] border-input-border bg-white text-ink text-[14px] font-semibold flex items-center justify-center gap-2 hover:bg-surface-hover disabled:text-[#A4ADA0] disabled:border-[#E1E6DC] disabled:cursor-not-allowed disabled:hover:bg-white";

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

export function RightPanel({ placed, total, onClose }: { placed: number; total: number; onClose?: () => void }) {
  const title = useScheduleState((s) => s.title);
  const pages = useScheduleState((s) => s.pages);
  const addPage = useScheduleState((s) => s.addPage);
  const language = useScheduleState((s) => s.language);
  const labelMode = useScheduleState((s) => s.labelMode);
  const setLabelMode = useScheduleState((s) => s.setLabelMode);
  const secondLanguage = useScheduleState((s) => s.secondLanguage);
  const setSecondLanguage = useScheduleState((s) => s.setSecondLanguage);
  const { exportPDF, exportJPEG, exporting, saveNow } = useExport();
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "signedOut">("idle");

  const bilingual = labelMode === "multi";
  const empty = placed === 0;
  const full = total > 0 && placed >= total;
  const pct = total ? Math.min(100, Math.round((placed / total) * 100)) : 0;

  // If the main language is picked as the second one, move the second away.
  useEffect(() => {
    if (bilingual && secondLanguage === language) {
      setSecondLanguage((language === "en" ? "hi" : "en") as Language);
    }
  }, [bilingual, language, secondLanguage, setSecondLanguage]);

  // Anything edited after a save makes "Saved" untrue again.
  useEffect(() => { setSaveState((s) => (s === "saved" ? "idle" : s)); }, [pages, title]);

  const onSave = async () => {
    setSaveState("saving");
    const ok = await saveNow();
    setSaveState(ok ? "saved" : "signedOut");
  };

  return (
    <div className="flex flex-col h-full overflow-y-auto relative">
      {onClose && (
        <button type="button" onClick={onClose} aria-label="Close panel" className="absolute top-2.5 right-2.5 w-9 h-9 rounded-[10px] bg-surface-hover text-[20px] leading-none z-10">
          ×
        </button>
      )}

      <section className="px-5 py-4 border-b border-border space-y-2.5">
        <h3 className={sectionLabel}>Your schedule</h3>
        <p className="text-ink-2 text-[14px]"><b className="text-[22px] text-ink mr-1">{placed}</b>of {total} cards added</p>
        <div className="h-2 rounded-full bg-[#EDF1EA] overflow-hidden">
          <div className="h-full rounded-full bg-accent-strong transition-[width] duration-300" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex items-center justify-between pt-1">
          <span className="text-[13px] text-ink-2">Pages: <b className="text-ink">{pages.length}</b></span>
          <button type="button" onClick={addPage} className="h-8 px-3 rounded-lg border border-input-border bg-white text-accent-strong text-[12.5px] font-semibold flex items-center gap-1.5 hover:bg-surface-hover">
            <Icon.Plus /> Add page
          </button>
        </div>
      </section>

      <section className="px-5 py-4 border-b border-border space-y-3">
        <h3 className={sectionLabel}>Card language</h3>
        <div className="flex items-center justify-between rounded-[10px] bg-bg px-3 py-2.5 text-[13.5px]">
          <span className="text-ink-2">Main language</span>
          <b className="text-ink">{LANGUAGES[language as keyof typeof LANGUAGES] || language}</b>
        </div>
        <p className="text-[12px] text-ink-3 -mt-1.5">Change it at the top left.</p>
        <label className="flex items-start gap-3 cursor-pointer">
          <input
            type="checkbox"
            className="peer sr-only"
            checked={bilingual}
            onChange={(e) => setLabelMode(e.target.checked ? "multi" : "single")}
          />
          <span className="mt-0.5 w-10 h-6 shrink-0 rounded-full bg-[#CDD5C7] relative transition-colors peer-checked:bg-accent-strong peer-focus-visible:ring-2 peer-focus-visible:ring-weekly-accent after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:w-[18px] after:h-[18px] after:rounded-full after:bg-white after:shadow after:transition-all peer-checked:after:left-[19px]" />
          <span className="leading-tight">
            <b className="block text-[14px] text-ink">Bilingual cards</b>
            <span className="text-[12px] text-ink-3">Show a second language under each card</span>
          </span>
        </label>
        {bilingual && (
          <select
            value={secondLanguage}
            onChange={(e) => setSecondLanguage(e.target.value as Language)}
            aria-label="Second language"
            className={`${selectCls} animate-[vsSlideDown_250ms_ease-out]`}
          >
            {Object.entries(LANGUAGES).filter(([code]) => code !== language).map(([code, name]) => (
              <option key={code} value={code}>{name}</option>
            ))}
          </select>
        )}
      </section>

      <section className="px-5 py-4 space-y-2.5">
        <h3 className={sectionLabel}>Finish</h3>
        <button
          type="button"
          onClick={onSave}
          disabled={empty || saveState === "saving"}
          className={`w-full h-[52px] rounded-[14px] bg-accent-strong text-white font-bold text-[15px] flex items-center justify-center gap-2 hover:bg-accent-hover disabled:bg-[#C9D2C1] disabled:cursor-not-allowed ${full && saveState === "idle" ? "animate-[vsPulse_1.8s_ease-in-out_infinite]" : ""}`}
        >
          <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-10" /></svg>
          {saveState === "saving" ? "Saving…" : saveState === "saved" ? "Saved to My Schedules" : "Save schedule"}
        </button>
        {saveState === "signedOut" && (
          <p className="text-[12.5px] text-ink-2 bg-[#FFF7E8] border border-[#F1DDB6] rounded-lg px-3 py-2">
            <a href="/login?next=/schedule" className="font-semibold underline text-ink">Log in</a> to keep it in My Schedules. Downloads work without an account.
          </p>
        )}
        {empty && (
          <p className="text-[12.5px] text-ink-3 flex items-center gap-1.5">
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
            Add at least 1 card to save or download
          </p>
        )}
        <button onClick={exportJPEG} disabled={exporting || empty} className={dlCls}>
          <Icon.Image /> {exporting ? "Preparing…" : "Download image"}
        </button>
        <button onClick={exportPDF} disabled={exporting || empty} className={dlCls}>
          <Icon.Pdf /> {exporting ? "Preparing…" : "Download PDF (A4)"}
        </button>
        {/* Browsers can't attach a file to a WhatsApp link, so this saves
            the image first and then opens WhatsApp to attach it. */}
        <button
          onClick={async () => {
            try { await exportJPEG(); } catch { return; }
            window.open(
              "https://wa.me/?text=" + encodeURIComponent(`Here's our "${title}" visual schedule — made free at https://visualschedule.app`),
              "_blank",
              "noopener,noreferrer"
            );
          }}
          disabled={exporting || empty}
          className={dlCls}
        >
          <Icon.WhatsApp /> {exporting ? "Preparing…" : "Send on WhatsApp"}
        </button>
      </section>

      <section className="px-5 py-4 mt-auto border-t border-border">
        <p className="text-[12px] leading-relaxed text-ink-3 mb-3">
          Built by a parent, for parents of autistic and ADHD kids. Your feedback shapes what gets built next.
        </p>
        <a
          href="https://chat.whatsapp.com/F452loR5KUE5RzcffScGw5"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 mb-2 py-2 px-3 rounded-lg bg-accent-soft border border-accent-strong text-[12px] font-semibold text-[#2D5A2D] no-underline hover:bg-[#DFEAD3]"
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
              className="flex-1 flex items-center justify-center py-2 rounded-lg border border-border bg-white hover:bg-surface-hover no-underline"
              style={{ color: colour }}
            >
              {icon}
            </a>
          ))}
        </div>
        <p className="text-center mt-3 text-[12px] text-ink-3">
          With thanks to{" "}
          <a href="https://dataorc.in" target="_blank" rel="noopener noreferrer" className="underline text-ink-2 hover:text-ink">DataOrc</a>
        </p>
      </section>
    </div>
  );
}
