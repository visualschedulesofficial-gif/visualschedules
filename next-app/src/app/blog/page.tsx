import type { Metadata } from "next";
import Link from "next/link";
import { TopNav } from "@/components/layout/TopNav";
import { getEnv } from "@/lib/admin-auth";
import { BlogListClient } from "@/components/blog/BlogListClient";

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
        "SELECT slug, title, meta_description, cover_url, content, published_at FROM blog_posts WHERE status = 'published' ORDER BY published_at DESC"
      ).all();
      posts = (results || []).map((p: any) => {
        // Thumbnail: the cover if set, otherwise the first image inside the post
        const firstImg = (p.content || "").match(/!\[[^\]]*\]\(([^)\s]+)\)/);
        return {
          slug: p.slug,
          title: p.title,
          meta_description: p.meta_description,
          published_at: p.published_at,
          thumb: p.cover_url || (firstImg ? firstImg[1] : null),
        };
      });
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
          <BlogListClient posts={posts as any} />        </div>
      </main>
    </div>
  );
}
