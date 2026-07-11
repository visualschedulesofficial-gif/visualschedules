"use client";

// Blog list with a client-side search box (filters title + description).
import { useState } from "react";
import Link from "next/link";

type PostRow = {
  slug: string;
  title: string;
  meta_description: string | null;
  thumb: string | null;
  published_at: string | null;
};

export function BlogListClient({ posts }: { posts: PostRow[] }) {
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
  const filtered = posts.filter(
    (p) =>
      !query ||
      p.title.toLowerCase().includes(query) ||
      (p.meta_description || "").toLowerCase().includes(query)
  );

  return (
    <>
      <input
        type="search"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Search posts…"
        className="w-full mb-6 py-2.5 px-3 border border-border bg-white font-sans text-[14px] text-ink rounded"
      />
      {filtered.length === 0 && (
        <p className="text-[13px] text-ink-3">
          {posts.length === 0 ? "First posts coming soon." : "No posts match your search."}
        </p>
      )}
      <div className="space-y-6">
        {filtered.map((p) => (
          <Link
            key={p.slug}
            href={`/blog/${p.slug}`}
            className="flex gap-4 bg-white border border-border rounded overflow-hidden hover:shadow-sm transition-shadow no-underline p-3"
          >
            {p.thumb && (
              <div className="w-[96px] h-[96px] shrink-0 rounded overflow-hidden bg-[#FBFAF7] border border-[#F0F0F0]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.thumb} alt="" className="w-full h-full object-cover" loading="lazy" />
              </div>
            )}
            <div className="min-w-0">
              <h2 className="font-serif text-[19px] text-ink leading-snug mb-1">{p.title}</h2>
              {p.meta_description && (
                <p className="text-[13px] text-ink-2 leading-relaxed line-clamp-2">{p.meta_description}</p>
              )}
              <p className="text-[11px] text-ink-3 mt-1.5">{(p.published_at || "").slice(0, 10)}</p>
            </div>
          </Link>
        ))}
      </div>
    </>
  );
}
