"use client";

// Free downloads with top-level filters: Category (bundle), Subcategory (item),
// Character, and Language. Files can live on our CDN or Google Drive.
import { useState, useEffect, useMemo } from "react";
import { TopNav } from "@/components/layout/TopNav";

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

const CHARACTERS = ["neutral", "boy", "girl", "brown"] as const;

const selectCls =
  "px-3 py-2 h-[38px] text-[13px] font-medium border border-[#C9C4BB] rounded bg-white text-[#1C1B19] focus:outline-none focus:ring-2 focus:ring-[#7A8F5E] font-sans";

export function DownloadsClient() {
  const [bundles, setBundles] = useState<DBundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("");
  const [subcategory, setSubcategory] = useState("");
  const [character, setCharacter] = useState("");
  const [languageFilter, setLanguageFilter] = useState("");
  const [preview, setPreview] = useState<{ bundle: DBundle; item: DItem; file: DFile } | null>(null);

  useEffect(() => {
    fetch("/api/downloads")
      .then((r) => (r.ok ? r.json() : { bundles: [] }))
      .then((d) => setBundles(d.bundles || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const activeBundle = bundles.find((b) => b.id === category) || null;
  const languages = useMemo(() => {
    const set = new Set<string>();
    bundles.forEach((b) =>
      b.items.forEach((i) => i.files.forEach((f) => f.language && set.add(f.language)))
    );
    return Array.from(set).sort();
  }, [bundles]);

  // Flatten to file rows carrying their item + bundle, then filter
  const results = useMemo(() => {
    const rows: { bundle: DBundle; item: DItem; file: DFile }[] = [];
    bundles.forEach((bundle) => {
      if (category && bundle.id !== category) return;
      bundle.items.forEach((item) => {
        if (subcategory && item.id !== subcategory) return;
        item.files.forEach((file) => {
          if (character && (file.character || "") !== character) return;
          if (languageFilter && (file.language || "") !== languageFilter) return;
          rows.push({ bundle, item, file });
        });
      });
    });
    return rows;
  }, [bundles, category, subcategory, character, languageFilter]);

  return (
    <div className="h-full flex flex-col bg-bg">
      <TopNav />
      <main className="flex-1 min-h-0 overflow-y-auto">
        <div className="max-w-[1100px] mx-auto px-4 py-6">
          <h1 className="font-serif text-[26px] text-ink mb-1">Free Downloads</h1>
          <p className="text-[13px] text-ink-3 font-sans mb-4 max-w-[640px]">
            Ready-to-print visual schedules. Filter by category, character and language,
            then download the version that fits your child.
          </p>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-2 mb-5">
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setSubcategory("");
              }}
              className={selectCls}
            >
              <option value="">All categories</option>
              {bundles.map((b) => (
                <option key={b.id} value={b.id}>{b.title}</option>
              ))}
            </select>
            <select
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              disabled={!activeBundle}
              className={`${selectCls} disabled:opacity-50`}
            >
              <option value="">All subcategories</option>
              {(activeBundle?.items || []).map((i) => (
                <option key={i.id} value={i.id}>{i.title}</option>
              ))}
            </select>
            {languages.length > 0 && (
              <select
                value={languageFilter}
                onChange={(e) => setLanguageFilter(e.target.value)}
                className={selectCls}
              >
                <option value="">All languages</option>
                {languages.map((l) => (
                  <option key={l} value={l} className="capitalize">{l}</option>
                ))}
              </select>
            )}
            <div className="flex gap-1.5">
              <button
                onClick={() => setCharacter("")}
                className={`h-[38px] px-3 rounded-full border text-[12px] font-sans capitalize transition-colors ${
                  character === ""
                    ? "border-[#7A8F5E] bg-[#E8EDE0] text-[#4A5A3E] font-semibold"
                    : "border-[#C9C4BB] bg-white text-[#666]"
                }`}
              >
                All
              </button>
              {CHARACTERS.map((c) => (
                <button
                  key={c}
                  onClick={() => setCharacter(character === c ? "" : c)}
                  className={`h-[38px] px-3 rounded-full border text-[12px] font-sans capitalize transition-colors ${
                    character === c
                      ? "border-[#7A8F5E] bg-[#E8EDE0] text-[#4A5A3E] font-semibold"
                      : "border-[#C9C4BB] bg-white text-[#666]"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {/* Results — Pinterest-style: just the images. Tap one to preview
              and download; no button competing with the artwork for space. */}
          {loading && <p className="text-[13px] text-ink-3">Loading…</p>}
          {!loading && results.length === 0 && (
            <p className="text-[13px] text-ink-3">
              {bundles.length === 0
                ? "No downloads yet — check back soon!"
                : "Nothing matches these filters — try clearing one."}
            </p>
          )}
          <div className="columns-2 sm:columns-3 lg:columns-4 gap-3 [column-fill:balance]">
            {results.map(({ bundle, item, file }) => (
              <div key={file.id} className="w-full mb-3 break-inside-avoid bg-white border border-[#C7D7B8] rounded overflow-hidden">
                <button
                  onClick={() => {
                    setPreview({ bundle, item, file });
                    fetch("/api/downloads/track", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({ fileId: file.id, kind: "view" }),
                    }).catch(() => {});
                  }}
                  className="block w-full text-left group"
                >
                  <div className="bg-[#FBFAF7] flex items-center justify-center overflow-hidden relative">
                    {file.preview_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={file.preview_url}
                        alt={`${item.title} — ${file.variant}`}
                        className="w-full h-auto block group-hover:opacity-90 transition-opacity"
                        loading="lazy"
                      />
                    ) : (
                      <span className="text-[12px] text-ink-3 px-2 py-8 text-center block">{item.title}</span>
                    )}
                    <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/10 transition-colors flex items-center justify-center">
                      <span className="opacity-0 group-hover:opacity-100 transition-opacity text-[11px] font-sans font-semibold text-white bg-ink/70 px-2.5 py-1 rounded-full">
                        Preview
                      </span>
                    </div>
                  </div>
                </button>
                <div className="px-2 py-1.5">
                  <p className="text-[12px] font-serif text-ink truncate mb-1.5">{item.title}</p>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5 text-[11px] text-ink-3 font-sans">
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3 stroke-current fill-none" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        {file.view_count || 0}
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-3 h-3 stroke-current fill-none" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        {file.download_count || 0}
                      </span>
                    </div>
                    <a
                      href={file.file_url}
                      download
                      target="_blank"
                      rel="noopener"
                      onClick={() => {
                        fetch("/api/downloads/track", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ fileId: file.id, kind: "download" }),
                        }).catch(() => {});
                      }}
                      className="shrink-0 flex items-center gap-1 text-[11px] font-semibold bg-accent-strong text-white rounded px-2 py-1 no-underline hover:opacity-90"
                    >
                      <svg className="w-3 h-3 stroke-current fill-none" viewBox="0 0 24 24" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <polyline points="7 10 12 15 17 10" />
                        <line x1="12" y1="15" x2="12" y2="3" />
                      </svg>
                      Download
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Lightbox: full preview + download, tags, no clutter on the grid itself */}
          {preview && (
            <div
              className="fixed inset-0 z-[200] bg-ink/60 flex items-center justify-center p-4"
              onClick={() => setPreview(null)}
            >
              <div
                className="bg-white rounded-lg max-w-[520px] w-full max-h-[90vh] flex flex-col overflow-hidden"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Scrolls on its own — the image can be any height without
                    ever pushing the Download button out of view */}
                <div className="flex-1 min-h-0 overflow-y-auto">
                  <div className="bg-[#FBFAF7] flex items-center justify-center">
                    {preview.file.preview_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={preview.file.preview_url}
                        alt={preview.item.title}
                        className="w-full h-auto block"
                      />
                    ) : (
                      <div className="py-16 text-center text-[13px] text-ink-3">{preview.item.title}</div>
                    )}
                  </div>
                  <div className="px-4 pt-4">
                    <p className="text-[16px] font-serif text-ink mb-0.5">{preview.item.title}</p>
                    <p className="text-[12px] text-ink-3 mb-2">{preview.bundle.title}</p>
                    <div className="flex flex-wrap gap-1">
                      {preview.file.character && (
                        <span className="text-[12px] px-1.5 py-0.5 rounded-full bg-[#E8EDE0] text-[#4A5A3E] capitalize">{preview.file.character}</span>
                      )}
                      {preview.file.language && (
                        <span className="text-[12px] px-1.5 py-0.5 rounded-full bg-[#FBF0DD] text-[#9A6B12] capitalize">{preview.file.language}</span>
                      )}
                      {preview.file.label && (
                        <span className="text-[12px] px-1.5 py-0.5 rounded-full bg-[#F0F0F0] text-[#666]">{preview.file.label}</span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Pinned footer — always visible, never scrolls away */}
                <div className="shrink-0 flex gap-2 p-4 border-t border-border bg-white">
                    <a
                      href={preview.file.file_url}
                      download
                      target="_blank"
                      rel="noopener"
                      onClick={() => {
                        fetch("/api/downloads/track", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ fileId: preview.file.id, kind: "download" }),
                        }).catch(() => {});
                      }}
                      className="flex-1 text-center text-[13px] font-semibold bg-accent-strong text-white rounded py-2 hover:opacity-90 no-underline"
                    >
                      Download
                    </a>
                    <button
                      onClick={() => setPreview(null)}
                      className="px-4 py-2 text-[13px] font-sans text-ink-2 border border-input-border rounded"
                    >
                      Close
                    </button>
                </div>
              </div>
            </div>
          )}

          <p className="mt-8 text-[13px] text-ink-2">
            Want to customize — different cards, your language, your child's routine?{" "}
            <a href="/schedule" className="text-[#4A5A3E] font-semibold underline">Build your own free →</a>
          </p>
        </div>
      </main>
    </div>
  );
}
