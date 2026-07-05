import type { Metadata } from "next";
import Link from "next/link";
import { TopNav } from "@/components/layout/TopNav";
import { getEnv } from "@/lib/admin-auth";

export const metadata: Metadata = {
  title: "Blog — Visual Schedules for Neurodiverse Children | Visual Schedules",
  description:
    "Practical guides on visual schedules, routines and communication for parents of autistic, ADHD and neurodiverse children — from a parent who lives it.",
  alternates: { canonical: "https://visualschedule.app/blog" },
};

export const dynamic = "force-dynamic";

export default async function BlogIndexPage() {
  const env = getEnv();
  let posts: any[] = [];
  if (env.DB) {
    try {
      const { results } = await env.DB.prepare(
        "SELECT slug, title, meta_description, cover_url, published_at FROM blog_posts WHERE status = 'published' ORDER BY published_at DESC"
      ).all();
      posts = results || [];
    } catch {
      posts = [];
    }
  }

  return (
    <div className="h-full flex flex-col bg-bg">
      <TopNav />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-[760px] mx-auto px-4 py-8">
          <h1 className="font-serif text-[30px] text-ink mb-1">Blog</h1>
          <p className="text-[14px] text-ink-2 mb-8">
            Guides and honest notes on visual schedules, routines and everyday life with neurodiverse children.
          </p>
          {posts.length === 0 && (
            <p className="text-[13px] text-ink-3">First posts coming soon.</p>
          )}
          <div className="space-y-6">
            {posts.map((p) => (
              <Link
                key={p.slug}
                href={`/blog/${p.slug}`}
                className="block bg-white border border-border rounded overflow-hidden hover:shadow-sm transition-shadow no-underline"
              >
                {p.cover_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.cover_url} alt="" className="w-full max-h-[260px] object-cover" loading="lazy" />
                )}
                <div className="p-4">
                  <h2 className="font-serif text-[20px] text-ink leading-snug mb-1">{p.title}</h2>
                  {p.meta_description && (
                    <p className="text-[13px] text-ink-2 leading-relaxed">{p.meta_description}</p>
                  )}
                  <p className="text-[11px] text-ink-3 mt-2">
                    {(p.published_at || "").slice(0, 10)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
