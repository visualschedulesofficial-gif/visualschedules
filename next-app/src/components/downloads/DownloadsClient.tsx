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

          {/* Results */}
          {loading && <p className="text-[13px] text-ink-3">Loading…</p>}
          {!loading && results.length === 0 && (
            <p className="text-[13px] text-ink-3">
              {bundles.length === 0
                ? "No downloads yet — check back soon!"
                : "Nothing matches these filters — try clearing one."}
            </p>
          )}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {results.map(({ bundle, item, file }) => (
              <div key={file.id} className="bg-white border border-[#C7D7B8] rounded overflow-hidden flex flex-col">
                <div className="aspect-square bg-[#FBFAF7] flex items-center justify-center overflow-hidden">
                  {file.preview_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={file.preview_url}
                      alt={`${item.title} — ${file.variant}`}
                      className="w-full h-full object-contain"
                      loading="lazy"
                    />
                  ) : (
                    <span className="text-[12px] text-ink-3 px-2 text-center">{item.title}</span>
                  )}
                </div>
                <div className="p-2 border-t border-[#F0F0F0] flex-1 flex flex-col">
                  <div className="text-[13px] font-serif text-ink leading-tight">{item.title}</div>
                  <div className="text-[10px] text-ink-3 mb-1.5">{bundle.title}</div>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {file.character && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#E8EDE0] text-[#4A5A3E] capitalize">{file.character}</span>
                    )}
                    {file.language && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#FBF0DD] text-[#9A6B12] capitalize">{file.language}</span>
                    )}
                    {file.label && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#F0F0F0] text-[#666]">{file.label}</span>
                    )}
                  </div>
                  <a
                    href={file.file_url}
                    download
                    target="_blank"
                    rel="noopener"
                    className="mt-auto block text-center text-[12px] font-semibold bg-[#4A5A3E] text-white rounded py-1.5 hover:opacity-90 no-underline"
                  >
                    Download
                  </a>
                </div>
              </div>
            ))}
          </div>

          <p className="mt-8 text-[13px] text-ink-2">
            Want to customize — different cards, your language, your child's routine?{" "}
            <a href="/schedule" className="text-[#4A5A3E] font-semibold underline">Build your own free →</a>
          </p>
        </div>
      </main>
    </div>
  );
}
