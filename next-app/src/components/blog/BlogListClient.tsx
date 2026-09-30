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
  content: string;
};

// Pull the 11-char video ID out of any common YouTube URL shape, so we can
// build a real thumbnail + link without an API call.
function youtubeId(url: string | null): string | null {
  if (!url) return null;
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  return m ? m[1] : null;
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

// Plain-text opening for cards: the meta description, else the post's
// first paragraph with markdown stripped.
function excerpt(p: PostRow, max = 180): string {
  const src = p.meta_description || p.content
    .split(/\n{2,}/)
    .find((b) => b.trim() && !/^(#|!\[)/.test(b.trim())) || "";
  const text = src
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/[*_#>]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > max ? text.slice(0, max).replace(/\s+\S*$/, "") + "…" : text;
}

function readMins(p: PostRow) {
  return Math.max(1, Math.round(p.content.split(/\s+/).length / 200));
}

function fmtDate(d: string | null) {
  if (!d) return "";
  const dt = new Date(d.replace(" ", "T"));
  return isNaN(dt.getTime()) ? d.slice(0, 10) : dt.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function Cover({ p, className }: { p: PostRow; className: string }) {
  const yt = youtubeId(p.youtubeUrl);
  return (
    <div className={`relative bg-[#EEF3E8] overflow-hidden ${className}`}>
      {p.thumb ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={p.thumb} alt="" loading="lazy" className="absolute inset-0 w-full h-full object-cover" />
      ) : (
        <span className="absolute inset-0 flex items-center justify-center font-serif text-[40px] text-[#9DB887]">VS</span>
      )}
      {yt && (
        <span className="absolute left-3 bottom-3 flex items-center gap-1.5 bg-white/90 rounded-full px-2.5 py-1 text-[12px] font-semibold text-ink">
          <svg className="w-3 h-3 fill-[#C4302B]" viewBox="0 0 24 24"><path d="M8 5v14l11-7z" /></svg> Video
        </span>
      )}
    </div>
  );
}

export function BlogListClient({ posts }: { posts: PostRow[] }) {
  const [search, setSearch] = useState("");
  const q = search.trim().toLowerCase();
  const matches = useMemo(
    () => (q ? posts.filter((p) => p.title.toLowerCase().includes(q) || (p.meta_description || "").toLowerCase().includes(q) || p.content.toLowerCase().includes(q)) : posts),
    [posts, q]
  );
  const [featured, ...rest] = matches;
  const popular = useMemo(() => [...posts].sort((a, b) => b.viewCount - a.viewCount).slice(0, 4), [posts]);

  return (
    <div className="max-w-[1180px] mx-auto px-4 md:px-8 py-6 md:py-8 flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="m-0 font-serif text-[30px] text-[#4A6A32] leading-tight">Blog</h1>
          <p className="m-0 mt-1 text-[15px] text-ink-2">Practical guides on routines, visual supports and everyday life at home — from a parent who lives it.</p>
        </div>
        <label className="flex items-center gap-2 h-11 px-3 w-full md:w-[320px] rounded-xl border border-input-border bg-white focus-within:border-accent-strong shrink-0">
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="#5F6D65" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search articles" aria-label="Search articles" className="flex-1 min-w-0 bg-transparent outline-none text-[14px]" />
        </label>
      </div>

      {posts.length === 0 && <p className="text-[15px] text-ink-2">No posts yet — check back soon!</p>}
      {posts.length > 0 && matches.length === 0 && <p className="text-[14px] text-ink-3">No posts match &ldquo;{search}&rdquo;.</p>}

      {featured && (
        <article className="grid md:grid-cols-[1.1fr_1fr] bg-white border border-border rounded-3xl overflow-hidden transition-shadow hover:shadow-[0_12px_28px_rgba(30,42,36,0.1)]">
          <Link href={`/blog/${featured.slug}`} aria-hidden tabIndex={-1}>
            <Cover p={featured} className="aspect-[16/10] md:aspect-auto md:h-full min-h-[240px]" />
          </Link>
          <div className="p-6 md:p-8 flex flex-col gap-3 justify-center">
            <span className="self-start text-[11px] font-bold tracking-[.06em] uppercase bg-accent-soft text-accent-hover rounded-md px-2 py-0.5">{q ? "Top match" : "Latest"}</span>
            <h2 className="m-0 text-[24px] md:text-[27px] font-bold leading-tight">
              <Link href={`/blog/${featured.slug}`} className="no-underline text-ink hover:text-accent-strong">{featured.title}</Link>
            </h2>
            <p className="m-0 text-[15px] leading-relaxed text-ink-2">{excerpt(featured, 240)}</p>
            <span className="text-[13px] text-ink-3">{fmtDate(featured.published_at)} · {readMins(featured)} min read</span>
            <div className="flex flex-wrap items-center gap-3 mt-1">
              <Link href={`/blog/${featured.slug}`} className="h-11 px-5 rounded-xl bg-accent-strong text-white font-bold text-[14px] flex items-center no-underline hover:bg-accent-hover">
                Read the post →
              </Link>
              <ShareRow slug={featured.slug} title={featured.title} />
            </div>
          </div>
        </article>
      )}

      {rest.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {rest.map((p) => (
            <Link key={p.slug} href={`/blog/${p.slug}`} className="group bg-white border border-border rounded-2xl overflow-hidden flex flex-col no-underline text-ink transition-all duration-150 hover:-translate-y-[3px] hover:shadow-[0_10px_24px_rgba(30,42,36,0.1)]">
              <Cover p={p} className="aspect-[16/9]" />
              <div className="p-4 flex flex-col gap-2 flex-1">
                <h3 className="m-0 text-[17px] font-bold leading-snug group-hover:text-accent-strong">{p.title}</h3>
                <p className="m-0 text-[14px] leading-relaxed text-ink-2 line-clamp-3">{excerpt(p)}</p>
                <span className="mt-auto pt-1 text-[12.5px] text-ink-3">{fmtDate(p.published_at)} · {readMins(p)} min read</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {!q && popular.length > 1 && (
        <section className="bg-white border border-border rounded-2xl p-5">
          <h2 className="m-0 mb-3 text-[13px] font-bold tracking-[.06em] uppercase text-ink-2">Most read</h2>
          <ol className="m-0 p-0 list-none grid sm:grid-cols-2 gap-x-6 gap-y-2">
            {popular.map((p, i) => (
              <li key={p.slug} className="flex items-baseline gap-3">
                <span className="font-serif text-[20px] text-[#9DB887] w-5 shrink-0">{i + 1}</span>
                <Link href={`/blog/${p.slug}`} className="text-[14.5px] font-semibold text-ink no-underline hover:text-accent-strong leading-snug">{p.title}</Link>
              </li>
            ))}
          </ol>
        </section>
      )}
    </div>
  );
}
