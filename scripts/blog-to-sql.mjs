// Turns Markdown files in content/blog/ into SQL that upserts them into the
// blog_posts table as DRAFTS. Neha reviews and publishes them in /admin/blog.
//
// File format (content/blog/<anything>.md):
//   ---
//   title: Visual schedules for autistic children: a guide for parents
//   slug: visual-schedules-guide            (optional — made from title)
//   meta_description: One-sentence summary for Google (under 160 chars)
//   keywords: visual schedule, autism, routine
//   cover_url: https://...                  (optional)
//   youtube_url: https://youtu.be/...       (optional)
//   ---
//   ## Body in Markdown...
//
// Safety: a post that is already PUBLISHED (or edited into published) is never
// overwritten — only drafts are updated when the same slug is committed again.
//
// Usage: node scripts/blog-to-sql.mjs content/blog > out.sql

import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

const dir = process.argv[2] || "content/blog";

function slugify(s) {
  return s.toLowerCase().trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80);
}

const q = (v) => (v == null || v === "" ? "NULL" : `'${String(v).replace(/'/g, "''")}'`);

function parse(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { meta: {}, body: text };
  const meta = {};
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(":");
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  }
  return { meta, body: m[2].trim() };
}

const files = readdirSync(dir).filter((f) => f.endsWith(".md") && !f.startsWith("_") && f !== "README.md");
const out = [];

for (const f of files) {
  const { meta, body } = parse(readFileSync(join(dir, f), "utf8"));
  if (!meta.title || !body) {
    console.error(`Skipping ${f}: needs a title and a body`);
    continue;
  }
  const slug = slugify(meta.slug || meta.title);
  const id = `agent-${slug}`;
  out.push(
    `INSERT INTO blog_posts (id, slug, title, meta_description, keywords, cover_url, youtube_url, content, status) ` +
    `VALUES (${q(id)}, ${q(slug)}, ${q(meta.title)}, ${q(meta.meta_description)}, ${q(meta.keywords)}, ${q(meta.cover_url)}, ${q(meta.youtube_url)}, ${q(body)}, 'draft') ` +
    `ON CONFLICT(slug) DO UPDATE SET title=excluded.title, meta_description=excluded.meta_description, keywords=excluded.keywords, ` +
    `cover_url=excluded.cover_url, youtube_url=excluded.youtube_url, content=excluded.content, updated_at=datetime('now') ` +
    `WHERE blog_posts.status = 'draft';`
  );
  console.error(`Prepared ${f} -> /blog/${slug} (draft)`);
}

process.stdout.write(out.join("\n") + "\n");
