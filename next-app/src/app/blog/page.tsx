import type { Metadata } from "next";
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
        "SELECT slug, title, meta_description, cover_url, youtube_url, content, published_at, COALESCE(view_count, 0) as view_count FROM blog_posts WHERE status = 'published' ORDER BY published_at DESC"
      ).all();
      posts = (results || []).map((p: any) => {
        // Thumbnail: the cover if set, otherwise the first image inside the post
        const firstImg = (p.content || "").match(/!\[[^\]]*\]\(([^)\s]+)\)/);
        // Plain-text excerpt: strip markdown image/heading/link syntax for a
        // clean opening paragraph under the featured post.
        const ytMatch = (p.youtube_url || "").match(
          /(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/
        );
        const ytThumb = ytMatch ? `https://img.youtube.com/vi/${ytMatch[1]}/hqdefault.jpg` : null;
        return {
          slug: p.slug,
          title: p.title,
          meta_description: p.meta_description,
          published_at: p.published_at,
          // Collapsed-card thumbnail only: cover image, else first inline
          // image, else the video's own thumbnail if there's a video.
          thumb: p.cover_url || (firstImg ? firstImg[1] : null) || ytThumb,
          youtubeUrl: p.youtube_url || null,
          viewCount: p.view_count || 0,
          content: p.content || "",
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
        <BlogListClient posts={posts as any} />
      </main>
    </div>
  );
}
