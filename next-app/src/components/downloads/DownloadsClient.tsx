"use client";

import { useState, useEffect } from "react";
import { TopNav } from "@/components/layout/TopNav";

type DFile = { id: string; variant: string; label: string | null; file_url: string; preview_url: string | null };
type DItem = { id: string; title: string; description: string | null; files: DFile[] };
type DBundle = { id: string; title: string; description: string | null; items: DItem[] };

export function DownloadsClient() {
  const [bundles, setBundles] = useState<DBundle[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeBundle, setActiveBundle] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/downloads")
      .then((r) => (r.ok ? r.json() : { bundles: [] }))
      .then((d) => {
        setBundles(d.bundles || []);
        if (d.bundles?.length) setActiveBundle(d.bundles[0].id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const bundle = bundles.find((b) => b.id === activeBundle) || null;
  const item = bundle?.items.find((i) => i.id === activeItem) || null;

  return (
    <div className="h-full flex flex-col bg-bg">
      <TopNav />
      <div className="flex-1 min-h-0 flex flex-col md:flex-row overflow-hidden">
        {/* Left panel — bundles */}
        <aside className="md:w-[260px] shrink-0 bg-white border-b md:border-b-0 md:border-r border-border md:overflow-y-auto">
          <h1 className="font-serif text-[20px] text-ink px-4 pt-4 pb-2">Free Downloads</h1>
          <p className="px-4 pb-3 text-[12px] text-ink-3 font-sans">
            Ready-to-print visual schedule bundles. Pick a bundle, choose an activity, download the version that fits your child.
          </p>
          <nav className="flex md:block overflow-x-auto md:overflow-visible px-2 pb-2 md:pb-4 gap-1">
            {bundles.map((b) => (
              <button
                key={b.id}
                onClick={() => {
                  setActiveBundle(b.id);
                  setActiveItem(null);
                }}
                className={`shrink-0 md:w-full text-left px-3 py-2.5 rounded text-[14px] font-sans transition-colors ${
                  activeBundle === b.id
                    ? "bg-[#E8EDE0] text-[#4A5A3E] font-semibold"
                    : "text-ink hover:bg-surface-hover"
                }`}
              >
                {b.title}
                <span className="text-[11px] text-ink-3 font-normal"> ({b.items.length})</span>
              </button>
            ))}
            {!loading && bundles.length === 0 && (
              <p className="px-3 py-2 text-[12px] text-ink-3">No downloads yet — check back soon!</p>
            )}
          </nav>
        </aside>

        {/* Right — items and variants */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6">
          {loading && <p className="text-[13px] text-ink-3">Loading…</p>}

          {bundle && !item && (
            <>
              <h2 className="font-serif text-[24px] text-ink mb-1">{bundle.title}</h2>
              {bundle.description && (
                <p className="text-[13px] text-ink-2 mb-4 max-w-[560px]">{bundle.description}</p>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {bundle.items.map((i) => {
                  const preview = i.files.find((f) => f.preview_url)?.preview_url;
                  return (
                    <button
                      key={i.id}
                      onClick={() => setActiveItem(i.id)}
                      className="bg-white border border-[#C7D7B8] rounded text-left hover:shadow-sm transition-shadow"
                    >
                      <div className="aspect-square bg-[#FBFAF7] rounded-t overflow-hidden flex items-center justify-center">
                        {preview ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={preview} alt={i.title} className="w-full h-full object-contain" loading="lazy" />
                        ) : (
                          <span className="text-[11px] text-ink-3 px-2 text-center">{i.title}</span>
                        )}
                      </div>
                      <div className="px-2 py-2 border-t border-[#F0F0F0]">
                        <div className="text-[13px] font-serif text-ink leading-tight">{i.title}</div>
                        <div className="text-[11px] text-ink-3">{i.files.length} version{i.files.length !== 1 ? "s" : ""}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {bundle && item && (
            <>
              <button onClick={() => setActiveItem(null)} className="text-[12px] text-[#4A5A3E] mb-3 hover:underline">
                ← {bundle.title}
              </button>
              <h2 className="font-serif text-[24px] text-ink mb-1">{item.title}</h2>
              {item.description && (
                <p className="text-[13px] text-ink-2 mb-4 max-w-[560px]">{item.description}</p>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {item.files.map((f) => (
                  <div key={f.id} className="bg-white border border-[#C7D7B8] rounded overflow-hidden">
                    <div className="aspect-square bg-[#FBFAF7] flex items-center justify-center overflow-hidden">
                      {f.preview_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={f.preview_url} alt={`${item.title} — ${f.variant}`} className="w-full h-full object-contain" loading="lazy" />
                      ) : (
                        <span className="text-[12px] text-ink-3 capitalize">{f.variant}</span>
                      )}
                    </div>
                    <div className="p-2 border-t border-[#F0F0F0]">
                      <div className="text-[12px] font-sans text-ink capitalize mb-1.5">
                        {f.label || f.variant}
                      </div>
                      <a
                        href={f.file_url}
                        download
                        target="_blank"
                        rel="noopener"
                        className="block text-center text-[12px] font-semibold bg-[#4A5A3E] text-white rounded py-1.5 hover:opacity-90"
                      >
                        Download
                      </a>
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-[13px] text-ink-2">
                Want to customize this schedule — different cards, your language, your child's routine?{" "}
                <a href="/schedule" className="text-[#4A5A3E] font-semibold underline">Build your own free →</a>
              </p>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
