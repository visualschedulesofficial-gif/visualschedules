"use client";

// Blog homepage: latest post shown big and "open" (cover, excerpt, share),
// older posts in a simple list, and a right sidebar (search, recent,
// popular-with-counts, view all) that scrolls on its own once it's tall.
import { useState, useMemo } from "react";
import Link from "next/link";

type PostRow = {
  slug: string;
  title: string;
  meta_description: string | null;
  thumb: string | null;
  youtubeUrl: string | null;
  published_at: string | null;
  viewCount: number;
  excerpt: string;
};

// Pull the 11-char video ID out of any common YouTube URL shape, so we can
// build a real thumbnail + link without an API call.
function youtubeId(url: string | null): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  return m ? m[1] : null;
}

function VideoPreview({ url }: { url: string }) {
  const id = youtubeId(url);
  if (!id) return null;
  return (
    <a
      href={`https://www.youtube.com/watch?v=${id}`}
      target="_blank"
      rel="noopener noreferrer"
      className="relative block w-full max-h-[360px] overflow-hidden rounded mb-4 group"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://img.youtube.com/vi/${id}/hqdefault.jpg`}
        alt="Watch the video"
        className="w-full object-cover"
      />
      <div className="absolute inset-0 bg-ink/20 group-hover:bg-ink/30 transition-colors flex items-center justify-center">
        <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
          <svg className="w-6 h-6 ml-1 fill-[#C4302B]" viewBox="0 0 24 24">
            <path d="M8 5v14l11-7z" />
          </svg>
        </div>
      </div>
    </a>
  );
}

function ShareRow({ slug, title }: { slug: string; title: string }) {
  const [copied, setCopied] = useState(false);
  const url = `https://visualschedule.app/blog/${slug}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  return (
    <div className="flex items-center gap-2">
      <a
        href={`https://wa.me/?text=${encodeURIComponent(title + " " + url)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-input-border text-[12px] font-sans text-ink-2 no-underline hover:bg-accent-soft transition-colors"
      >
        <svg className="w-3.5 h-3.5 stroke-current fill-none" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
        Share
      </a>
      <button
        onClick={copyLink}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded border border-input-border text-[12px] font-sans text-ink-2 hover:bg-accent-soft transition-colors"
      >
        <svg className="w-3.5 h-3.5 stroke-current fill-none" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
        {copied ? "Copied!" : "Copy link"}
      </button>
    </div>
  );
}

export function BlogListClient({ posts }: { posts: PostRow[] }) {
  const [search, setSearch] = useState("");

  const [featured, ...rest] = posts;

  const filtered = useMemo(() => {
    if (!search.trim()) return rest;
    const q = search.trim().toLowerCase();
    return rest.filter(
      (p) => p.title.toLowerCase().includes(q) || (p.meta_description || "").toLowerCase().includes(q)
    );
  }, [rest, search]);

  const recent = rest.slice(0, 5);
  const popular = useMemo(() => [...posts].sort((a, b) => b.viewCount - a.viewCount).slice(0, 5), [posts]);

  if (!featured) {
    return (
      <div className="max-w-[760px] mx-auto px-4 py-8">
        <h1 className="font-serif text-[30px] text-ink mb-1">Blog</h1>
        <p className="text-[14px] text-ink-2">No posts yet — check back soon!</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1080px] mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 items-start">
      {/* Main column */}
      <div className="min-w-0">
        <h1 className="font-serif text-[28px] text-ink mb-6">Blog</h1>

        {/* Featured — the latest post, shown open */}
        <Link
          href={`/blog/${featured.slug}`}
          className="block no-underline group mb-10 border-b border-border pb-8"
        >
          {featured.youtubeUrl ? (
            <VideoPreview url={featured.youtubeUrl} />
          ) : (
            featured.thumb && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={featured.thumb}
                alt=""
                className="w-full max-h-[360px] object-cover rounded mb-4"
                loading="eager"
              />
            )
          )}
          <p className="text-[11px] tracking-wide uppercase text-weekly-accent font-sans font-semibold mb-1.5">
            Latest post
          </p>
          <h2 className="font-serif text-[24px] text-ink leading-snug mb-2 group-hover:text-weekly-accent transition-colors">
            {featured.title}
          </h2>
          <p className="text-[14px] text-ink-2 leading-relaxed mb-3">
            {featured.excerpt}
            {featured.excerpt.length >= 320 ? "…" : ""}
          </p>
          <p className="text-[11px] text-ink-3 mb-3">{(featured.published_at || "").slice(0, 10)}</p>
        </Link>
        <div className="-mt-6 mb-10">
          <ShareRow slug={featured.slug} title={featured.title} />
        </div>

        {/* Older posts */}
        {filtered.length > 0 && (
          <div className="space-y-3">
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
                  <h3 className="font-serif text-[17px] text-ink leading-snug mb-1">{p.title}</h3>
                  {p.meta_description && (
                    <p className="text-[13px] text-ink-2 leading-relaxed line-clamp-2">{p.meta_description}</p>
                  )}
                  <p className="text-[11px] text-ink-3 mt-1.5">{(p.published_at || "").slice(0, 10)}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
        {search.trim() && filtered.length === 0 && (
          <p className="text-[13px] text-ink-3">No posts match "{search}".</p>
        )}
      </div>

      {/* Sidebar */}
      <aside className="lg:sticky lg:top-4 lg:max-h-[calc(100vh-2rem)] lg:overflow-y-auto pb-4 space-y-6">
        <div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search posts…"
            className="w-full px-3 py-2 border border-input-border rounded text-[13px] font-sans outline-none focus:ring-2 focus:ring-weekly-accent"
          />
        </div>

        <div>
          <h3 className="text-[11px] tracking-wide uppercase text-ink-3 font-sans font-semibold mb-2">
            Recent posts
          </h3>
          <ul className="space-y-2">
            {recent.map((p) => (
              <li key={p.slug}>
                <Link href={`/blog/${p.slug}`} className="text-[13px] text-ink-2 no-underline hover:text-weekly-accent leading-snug block">
                  {p.title}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="text-[11px] tracking-wide uppercase text-ink-3 font-sans font-semibold mb-2">
            Popular
          </h3>
          <ul className="space-y-2">
            {popular.map((p) => (
              <li key={p.slug} className="flex items-start justify-between gap-2">
                <Link href={`/blog/${p.slug}`} className="text-[13px] text-ink-2 no-underline hover:text-weekly-accent leading-snug">
                  {p.title}
                </Link>
                <span className="text-[11px] text-ink-3 shrink-0 font-sans">{p.viewCount}</span>
              </li>
            ))}
          </ul>
        </div>

        <Link
          href="/blog"
          onClick={() => setSearch("")}
          className="block text-center text-[12px] font-sans font-semibold text-weekly-accent border border-weekly-accent rounded py-2 no-underline hover:bg-accent-soft transition-colors"
        >
          View all posts
        </Link>
      </aside>
    </div>
  );
}
