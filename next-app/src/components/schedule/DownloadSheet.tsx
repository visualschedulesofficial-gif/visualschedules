"use client";

// Download / Share sheet — opens after Save (with the "Saved" line) or from
// the Download button. Image is the default on phones: parents mostly show
// the schedule on the phone or send it on WhatsApp. PDF is for printing.
//
// The chosen format is built in the background as soon as the sheet opens
// (and again if they switch), so the Share tap can open the phone's share
// sheet straight away. iPhones only allow that during the tap itself; if
// the file were built after the tap, it would drop silently into Files.

import { useEffect, useRef, useState } from "react";
import { downloadFiles } from "@/hooks/useExport";
import { getDlFormat, setDlFormat } from "@/lib/prefs";

type Format = "image" | "pdf";

const GREEN = "#4A5A3E";
const GREEN_SOFT = "#EAF1E2";
const INK = "#1E2A24";
const SUB = "#6C7A72";
const BORDER = "#E6EBE6";

type SheetProps = {
  open: boolean;
  onClose: () => void;
  /** Show the green "Saved to My schedules" line (opened right after Save). */
  justSaved?: boolean;
  title: string;
  subtitle?: string;
  /** From useExport(). */
  prepareFiles: (kind: Format, opts?: { save?: boolean }) => Promise<File[]>;
  /** Also save the schedule while exporting (when opened without a Save). */
  saveOnExport?: boolean;
  /** Called after the file was shared or downloaded. */
  onDone?: (format: Format, how: "shared" | "downloaded") => void;
};

// The body only mounts while open, so every opening starts fresh: the
// schedule may have changed since last time.
export function DownloadSheet(props: SheetProps) {
  if (!props.open) return null;
  return <SheetBody {...props} />;
}

function SheetBody({
  onClose,
  justSaved = false,
  title,
  subtitle,
  prepareFiles,
  saveOnExport = false,
  onDone,
}: SheetProps) {
  const [format, setFormat] = useState<Format>(() => getDlFormat() || "image");
  const [files, setFiles] = useState<Partial<Record<Format, File[]>>>({});
  const [errors, setErrors] = useState<Partial<Record<Format, string>>>({});
  const [retry, setRetry] = useState(0);
  const inflight = useRef<Format | null>(null);
  const savedOnce = useRef(false);
  const alive = useRef(true);
  useEffect(() => () => { alive.current = false; }, []);

  // Build the selected format in the background.
  useEffect(() => {
    if (files[format] || errors[format] || inflight.current) return;
    inflight.current = format;
    const save = saveOnExport && !savedOnce.current;
    savedOnce.current = true;
    prepareFiles(format, { save })
      .then((f) => { if (alive.current) setFiles((prev) => ({ ...prev, [format]: f })); })
      .catch((e) => { if (alive.current) setErrors((prev) => ({ ...prev, [format]: e?.message || "Something went wrong. Please try again." })); })
      .finally(() => { inflight.current = null; });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [format, retry]);

  const ready = files[format];
  const error = errors[format];
  const busy = !ready && !error;
  const building = busy;

  const go = async () => {
    if (!ready) return;
    setDlFormat(format);
    await downloadFiles(ready);
    onDone?.(format, "downloaded");
  };

  const label = busy ? "Preparing…" : format === "image" ? "Download image" : "Download PDF";

  const hint = format === "image"
    ? <>Saves a picture to your Downloads. We&apos;ll remember this, so next time Download saves an image straight away.</>
    : <>A4 PDF, ready to print. We&apos;ll remember this, so next time Download saves a PDF straight away.</>;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-end justify-center"
      style={{ background: "rgba(28,27,25,0.5)" }}
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="dl-sheet-title"
        className="bg-[#F5F8F5] w-full max-w-[520px] rounded-t-3xl px-5 pt-3 pb-7 flex flex-col gap-3.5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="w-10 h-1.5 rounded-full self-center" style={{ background: "#C9CCBF" }} />

        {justSaved && (
          <div className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-[14px]" style={{ background: "#DDEEDF", color: "#1E4D2A" }}>
            <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="#2E6B3A" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12l5 5 9-10" /></svg>
            <span>Saved to <b>My schedules</b></span>
          </div>
        )}

        <div>
          <p id="dl-sheet-title" className="font-bold text-[19px] leading-tight" style={{ color: INK }}>Download or share</p>
          <p className="text-[13px] mt-0.5" style={{ color: SUB }}>{subtitle ? `${title} · ${subtitle}` : title}</p>
        </div>

        <div role="radiogroup" aria-label="Format" className="flex flex-col gap-2.5">
          <FormatOption
            active={format === "image"}
            disabled={building}
            onSelect={() => setFormat("image")}
            iconBg="#DDE7EC"
            icon={<svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="#2F5566" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="3" /><circle cx="9" cy="10" r="2" /><path d="M21 16l-5-5-9 9" /></svg>}
            title="Image"
            badge="Recommended"
            desc="Best for showing on the phone or sending on WhatsApp"
          />
          <FormatOption
            active={format === "pdf"}
            disabled={building}
            onSelect={() => setFormat("pdf")}
            iconBg="#F6E6CF"
            icon={<svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="#8A5A1E" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v4h4M9 13h6M9 17h6" /></svg>}
            title="PDF · A4"
            desc="Best for printing and sticking on the wall"
          />
        </div>

        {error ? (
          <p className="text-[13px] rounded-xl px-3 py-2.5" style={{ background: "#FBECEC", color: "#A33A3A" }}>{error}</p>
        ) : (
          <p className="text-[13px] leading-snug rounded-xl px-3 py-2.5 bg-white" style={{ color: SUB }}>{hint}</p>
        )}

        <div className="flex gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="px-5 min-h-[52px] rounded-2xl text-[15px] font-bold bg-white"
            style={{ border: "1.5px solid #C9CCBF", color: INK }}
          >
            Not now
          </button>
          {error ? (
            <button
              type="button"
              onClick={() => { setErrors((p) => ({ ...p, [format]: undefined })); setRetry((r) => r + 1); }}
              className="flex-1 min-h-[52px] rounded-2xl text-white text-[15px] font-bold"
              style={{ background: GREEN }}
            >
              Try again
            </button>
          ) : (
            <button
              type="button"
              onClick={go}
              disabled={busy}
              aria-busy={busy}
              className="flex-1 min-h-[52px] rounded-2xl text-white text-[15px] font-bold flex items-center justify-center gap-2 disabled:opacity-70"
              style={{ background: GREEN, boxShadow: "0 6px 16px rgba(74,90,62,0.28)" }}
            >
              {busy ? (
                <span className="w-4 h-4 rounded-full animate-spin" style={{ border: "2px solid rgba(255,255,255,.4)", borderTopColor: "#fff" }} />
              ) : (
                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 4v11M7 10l5 5 5-5M5 20h14" />
                </svg>
              )}
              {label}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

function FormatOption({
  active, disabled, onSelect, iconBg, icon, title, badge, desc,
}: {
  active: boolean;
  disabled?: boolean;
  onSelect: () => void;
  iconBg: string;
  icon: React.ReactNode;
  title: string;
  badge?: string;
  desc: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      disabled={disabled && !active}
      onClick={onSelect}
      className="w-full flex items-center gap-3 p-3 rounded-2xl text-left bg-white disabled:opacity-60"
      style={{ border: `2px solid ${active ? GREEN : BORDER}` }}
    >
      <span className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ background: iconBg }}>{icon}</span>
      <span className="flex-1 flex flex-col">
        <span className="font-bold text-[15px]" style={{ color: INK }}>
          {title}
          {badge && (
            <span className="ml-1.5 align-[2px] text-[11px] font-semibold rounded-full px-2 py-0.5" style={{ background: GREEN_SOFT, color: "#3A4830" }}>{badge}</span>
          )}
        </span>
        <span className="text-[13px] leading-snug" style={{ color: SUB }}>{desc}</span>
      </span>
      <span
        className="w-[22px] h-[22px] rounded-full shrink-0"
        style={active ? { border: `7px solid ${GREEN}` } : { border: "2px solid #B9BDB0" }}
      />
    </button>
  );
}
