"use client";

// Free downloads with top-level filters: Category (bundle), Subcategory (item),
// Character, and Language. Files can live on our CDN or Google Drive.
import { useState, useEffect, useMemo } from "react";
import { SiteTopBar } from "@/components/schedule/BuilderTopBar";

type DFile = {
  id: string;
  variant: string;
  label: string | null;
  file_url: string;
  preview_url: string | null;
  character: string | null;
  language: string | null;
  view_count: number;
  download_count: number;
};
type DItem = { id: string; title: string; description: string | null; files: DFile[] };
type DBundle = { id: string; title: string; description: string | null; items: DItem[] };

const CHARACTERS: { value: string; label: string }[] = [
  { value: "neutral", label: "Glasses" },
  { value: "boy", label: "Boy" },
  { value: "girl", label: "Girl" },
  { value: "brown", label: "Curly hair" },
];

function track(fileId: string, kind: "view" | "download") {
  fetch("/api/downloads/track", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ fileId, kind }),
  }).catch(() => {});
}

export function DownloadsClient() {
  const [bundles, setBundles] = useState<DBundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [character, setCharacter] = useState("");
  const [languageFilter, setLanguageFilter] = useState("");
  const [q, setQ] = useState("");
  const [preview, setPreview] = useState<{ bundle: DBundle; item: DItem; file: DFile } | null>(null);

  useEffect(() => {
    fetch("/api/downloads")
      .then((r) => (r.ok ? r.json() : { bundles: [] }))
      .then((d) => setBundles(d.bundles || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!preview) return;
    const k = (e: KeyboardEvent) => { if (e.key === "Escape") setPreview(null); };
    window.addEventListener("keydown", k);
    return () => window.removeEventListener("keydown", k);
  }, [preview]);

  const activeBundle = bundles.find((b) => b.id === category) || null;
  const languages = useMemo(() => {
    const set = new Set<string>();
    bundles.forEach((b) => b.items.forEach((i) => i.files.forEach((f) => f.language && set.add(f.language))));
    return Array.from(set).sort();
  }, [bundles]);

  const countIn = (b: DBundle) => b.items.reduce((n, i) => n + i.files.length, 0);
  const total = useMemo(() => bundles.reduce((n, b) => n + countIn(b), 0), [bundles]);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const rows: { bundle: DBundle; item: DItem; file: DFile }[] = [];
    bundles.forEach((bundle) => {
      if (category && bundle.id !== category) return;
      bundle.items.forEach((item) => {
        if (subcategory && item.id !== subcategory) return;
        item.files.forEach((file) => {
          if (character && (file.character || "") !== character) return;
          if (languageFilter && (file.language || "") !== languageFilter) return;
          if (needle && !`${item.title} ${bundle.title} ${file.label || ""}`.toLowerCase().includes(needle)) return;
          rows.push({ bundle, item, file });
        });
      });
    });
    return rows;
  }, [bundles, category, subcategory, character, languageFilter, q]);

  const listBtn = (on: boolean) =>
    `w-full flex justify-between items-center h-10 px-3 rounded-[10px] text-left text-[14px] ${on ? "bg-accent-soft text-[#2E4A22] font-bold" : "font-medium hover:bg-surface-hover"}`;

  return (
    <div className="h-dvh flex flex-col bg-bg">
      <SiteTopBar />
      <div className="flex-1 min-h-0 flex flex-col md:flex-row">
        {/* Filters */}
        <aside className="md:w-[300px] shrink-0 bg-white md:border-r border-b md:border-b-0 border-border md:overflow-y-auto">
          <div className="p-4 flex flex-col gap-3 border-b border-border">
            <label className="flex items-center gap-2.5 h-[46px] px-3 rounded-xl border-[1.5px] border-accent-strong bg-accent-soft">
              <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></svg>
              <select value={languageFilter} onChange={(e) => setLanguageFilter(e.target.value)} aria-label="Language"
                className="flex-1 min-w-0 appearance-none bg-transparent border-0 outline-none font-bold text-[15px] capitalize cursor-pointer">
                <option value="">All languages</option>
                {languages.map((l) => <option key={l} value={l}>{l}</option>)}
              </select>
              <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 9l6 6 6-6" /></svg>
            </label>
            <label className="flex items-center gap-2 h-11 px-3 rounded-xl border border-input-border bg-white focus-within:border-accent-strong">
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="#5F6D65" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
              <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search schedules" aria-label="Search schedules" className="flex-1 min-w-0 bg-transparent outline-none text-[14px]" />
            </label>
            <div className="flex items-center gap-1.5 flex-wrap" role="group" aria-label="Character">
              {[{ value: "", label: "All" }, ...CHARACTERS].map((c) => (
                <button key={c.value || "all"} type="button" onClick={() => setCharacter(c.value)} aria-pressed={character === c.value}
                  className={`h-8 px-3 rounded-full border text-[12.5px] font-semibold ${character === c.value ? "bg-accent-strong border-accent-strong text-white" : "bg-white border-input-border text-ink-2"}`}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <nav className="p-4 hidden md:block" aria-label="Categories">
            <p className="m-0 mb-1.5 px-1 text-[12px] font-bold tracking-[.06em] uppercase text-ink-3">Category</p>
            <button type="button" onClick={() => { setCategory(""); setSubcategory(""); }} className={listBtn(!category)}>
              All <small className="text-ink-3 font-medium">{total}</small>
            </button>
            {bundles.map((b) => (
              <div key={b.id}>
                <button type="button" onClick={() => { setCategory(b.id); setSubcategory(""); }} className={listBtn(category === b.id && !subcategory)}>
                  {b.title} <small className="text-ink-3 font-medium">{countIn(b)}</small>
                </button>
                {category === b.id && b.items.length > 1 && (
                  <div className="ml-3 pl-2 border-l border-border my-1 animate-[vsSlideDown_180ms_ease-out]">
                    {b.items.map((i) => (
                      <button key={i.id} type="button" onClick={() => setSubcategory(i.id)} className={listBtn(subcategory === i.id)}>
                        <span className="truncate">{i.title}</span> <small className="text-ink-3 font-medium">{i.files.length}</small>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </nav>
          {/* Phones: categories as a scrolling chip row */}
          <div className="md:hidden flex gap-2 overflow-x-auto px-4 pb-3 [scrollbar-width:none]">
            {[{ id: "", title: "All" }, ...bundles].map((b) => (
              <button key={b.id || "all"} type="button" onClick={() => { setCategory(b.id); setSubcategory(""); }} aria-pressed={category === b.id}
                className={`h-9 px-3.5 rounded-full border text-[14px] font-medium whitespace-nowrap ${category === b.id ? "bg-accent-strong border-accent-strong text-white" : "bg-white border-border"}`}>
                {b.title}
              </button>
            ))}
          </div>
        </aside>

        {/* Results */}
        <main className="flex-1 min-w-0 overflow-y-auto px-4 md:px-8 py-6 flex flex-col gap-5">
          <div className="flex items-end justify-between gap-4">
            <div>
              <h1 className="m-0 font-serif text-[28px] text-[#4A6A32] leading-tight">Free schedules</h1>
              <p className="m-0 mt-1 text-[14px] text-ink-2">Ready-to-print boards. Download, print, or build your own.</p>
            </div>
            {!loading && <span className="text-[13px] font-semibold text-ink-3 whitespace-nowrap">{results.length} schedules</span>}
          </div>

          {loading && <div className="flex justify-center py-16"><div className="w-6 h-6 rounded-full border-2 border-border border-t-accent-strong animate-spin" /></div>}
          {!loading && results.length === 0 && (
            <p className="text-[14px] text-ink-3 py-10 text-center">
              {bundles.length === 0 ? "No downloads yet — check back soon!" : "Nothing matches these filters — try clearing one."}
            </p>
          )}

          <div className="columns-2 sm:columns-3 lg:columns-4 2xl:columns-5 gap-4">
            {results.map(({ bundle, item, file }) => (
              <button
                key={file.id}
                type="button"
                onClick={() => { setPreview({ bundle, item, file }); track(file.id, "view"); }}
                className="w-full mb-4 break-inside-avoid block text-left bg-white border border-border rounded-2xl p-2 pb-2.5 transition-all duration-150 hover:-translate-y-[3px] hover:shadow-[0_10px_24px_rgba(30,42,36,0.12)] hover:border-[#CBD7BE]"
              >
                {file.preview_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={file.preview_url} alt="" loading="lazy" className="w-full h-auto block rounded-[10px] bg-[#FAFBF8]" />
                ) : (
                  <span className="block rounded-[10px] bg-[#EEF2EA] py-12 text-center text-[12px] text-ink-3">{item.title}</span>
                )}
                <span className="flex justify-between items-start gap-2 px-1 pt-2.5">
                  <span className="min-w-0">
                    <b className="block text-[14px] leading-tight">{item.title}</b>
                    <small className="text-[12px] text-ink-3 capitalize">{[file.language, bundle.title].filter(Boolean).join(" · ")}</small>
                  </span>
                  <span className="shrink-0 text-[10.5px] font-bold rounded-md px-1.5 py-0.5 bg-accent-soft text-accent-hover">Free</span>
                </span>
              </button>
            ))}
          </div>

          <p className="text-[14px] text-ink-2 pb-4">
            Want different cards, your language or your child&apos;s own routine?{" "}
            <a href="/schedule" className="text-accent-strong font-semibold underline">Build your own free →</a>
          </p>
        </main>
      </div>

      {preview && (
        <div className="fixed inset-0 z-[200] bg-[rgba(28,27,25,0.5)] flex items-end md:items-center justify-center md:p-6 animate-[vsFadeIn_150ms_ease-out]" onClick={() => setPreview(null)}>
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="dl-preview-title"
            className="bg-white w-full md:w-auto md:max-w-[960px] max-h-[92dvh] rounded-t-3xl md:rounded-3xl overflow-hidden flex flex-col md:flex-row shadow-[0_20px_60px_rgba(0,0,0,0.25)]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="bg-[#EEF2EA] md:w-[520px] flex-1 min-h-0 overflow-y-auto flex items-start md:items-center justify-center p-4 md:p-6">
              {preview.file.preview_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={preview.file.preview_url} alt={preview.item.title} className="w-full h-auto block rounded-xl shadow" />
              ) : <div className="py-16 text-center text-[13px] text-ink-3">{preview.item.title}</div>}
            </div>
            <div className="md:w-[300px] shrink-0 p-5 md:p-6 flex flex-col gap-2.5 relative">
              <button type="button" onClick={() => setPreview(null)} aria-label="Close" className="hidden md:flex absolute top-3 right-3 w-9 h-9 rounded-[10px] bg-surface-hover items-center justify-center text-[20px] leading-none">×</button>
              <span className="self-start text-[11px] font-bold tracking-[.05em] uppercase bg-accent-soft text-accent-hover rounded-md px-2 py-0.5">{preview.bundle.title}</span>
              <h2 id="dl-preview-title" className="m-0 text-[20px] font-bold pr-8">{preview.item.title}</h2>
              <p className="m-0 mb-2 text-[14px] text-ink-2 capitalize">
                {[preview.file.language, preview.file.character && (CHARACTERS.find((c) => c.value === preview.file.character)?.label || preview.file.character), preview.file.label || preview.file.variant].filter(Boolean).join(" · ")}
              </p>
              <a
                href={preview.file.file_url}
                download
                target="_blank"
                rel="noopener"
                onClick={() => track(preview.file.id, "download")}
                className="min-h-[52px] rounded-[14px] bg-accent-strong text-white font-bold text-[15px] flex items-center justify-center gap-2 no-underline hover:bg-accent-hover"
              >
                <svg className="w-[18px] h-[18px]" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 4v11M7 10l5 5 5-5M5 20h14" /></svg>
                Download
              </a>
              <a href="/schedule" className="min-h-[46px] rounded-xl border-[1.5px] border-input-border font-semibold text-[14px] text-ink flex items-center justify-center no-underline hover:bg-surface-hover">
                Make my own version
              </a>
              <button type="button" onClick={() => setPreview(null)} className="min-h-[46px] rounded-xl border-[1.5px] border-input-border font-semibold text-[14px] hover:bg-surface-hover">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
