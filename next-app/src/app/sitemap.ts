import type { MetadataRoute } from "next";
import { getEnv } from "@/lib/admin-auth";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = "https://visualschedule.app";
  const staticPages: MetadataRoute.Sitemap = [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/schedule`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/downloads`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${base}/blog`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${base}/plans`, changeFrequency: "monthly", priority: 0.6 },
  ];

  const env = getEnv();
  if (!env.DB) return staticPages;
  try {
    const { results } = await env.DB.prepare(
      "SELECT slug, updated_at FROM blog_posts WHERE status = 'published'"
    ).all();
    const posts: MetadataRoute.Sitemap = (results || []).map((p: any) => ({
      url: `${base}/blog/${p.slug}`,
      lastModified: p.updated_at ? new Date(p.updated_at) : undefined,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    }));
    return [...staticPages, ...posts];
  } catch {
    return staticPages;
  }
}
