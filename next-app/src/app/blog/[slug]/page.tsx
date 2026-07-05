import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { TopNav } from "@/components/layout/TopNav";
import { getEnv } from "@/lib/admin-auth";
import { renderMarkdown } from "@/lib/markdown";

export const dynamic = "force-dynamic";

async function getPost(slug: string) {
  const env = getEnv();
  if (!env.DB) return null;
  try {
    return await env.DB.prepare(
      "SELECT * FROM blog_posts WHERE slug = ? AND status = 'published'"
    ).bind(slug).first();
  } catch {
    return null;
  }
}

export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) return { title: "Post not found | Visual Schedules" };
  return {
    title: `${post.title} | Visual Schedules Blog`,
    description: post.meta_description || undefined,
    keywords: post.keywords || undefined,
    alternates: { canonical: `https://visualschedule.app/blog/${post.slug}` },
    openGraph: {
      title: post.title,
      description: post.meta_description || undefined,
      url: `https://visualschedule.app/blog/${post.slug}`,
      type: "article",
      images: post.cover_url ? [{ url: post.cover_url }] : undefined,
    },
  };
}

export default async function BlogPostPage(
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const post = await getPost(slug);
  if (!post) notFound();

  return (
    <div className="h-full flex flex-col bg-bg">
      <TopNav />
      <main className="flex-1 overflow-y-auto">
        <article className="max-w-[720px] mx-auto px-4 py-8">
          <Link href="/blog" className="text-[12px] text-[#4A5A3E] hover:underline">← All posts</Link>
          <h1 className="font-serif text-[30px] text-ink leading-tight mt-3 mb-2">{post.title}</h1>
          <p className="text-[12px] text-ink-3 mb-5">{(post.published_at || "").slice(0, 10)}</p>
          {post.cover_url && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.cover_url} alt="" className="w-full rounded mb-6" />
          )}
          <div
            className="blog-content text-[15px] text-ink-2 leading-relaxed"
            dangerouslySetInnerHTML={{ __html: renderMarkdown(post.content || "") }}
          />
          <div className="mt-10 p-4 bg-[#E8EDE0] rounded text-[14px] text-[#4A5A3E]">
            Build a free visual schedule for your child in minutes —{" "}
            <Link href="/schedule" className="font-semibold underline">try the schedule builder</Link>{" "}
            or browse our <Link href="/downloads" className="font-semibold underline">free printables</Link>.
          </div>
        </article>
      </main>
    </div>
  );
}
