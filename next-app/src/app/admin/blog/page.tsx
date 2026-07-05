"use client";

import { useState, useEffect, useCallback } from "react";

type Post = {
  id: string; slug: string; title: string; meta_description: string | null;
  keywords: string | null; cover_url: string | null; content: string;
  status: string; published_at: string | null; updated_at: string;
};

const EMPTY = { id: "", title: "", slug: "", metaDescription: "", keywords: "", coverUrl: "", content: "", status: "draft" };

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [editing, setEditing] = useState<typeof EMPTY | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  const load = useCallback(() => {
    fetch("/api/admin/blog")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setPosts(d?.posts || []))
      .catch(() => {});
  }, []);
  useEffect(() => { load(); }, [load]);

  const startNew = () => { setEditing({ ...EMPTY }); setMessage(""); };
  const startEdit = (p: Post) => {
    setEditing({
      id: p.id, title: p.title, slug: p.slug,
      metaDescription: p.meta_description || "", keywords: p.keywords || "",
      coverUrl: p.cover_url || "", content: p.content || "", status: p.status,
    });
    setMessage("");
  };

  const save = async (publish: boolean) => {
    if (!editing?.title.trim()) return;
    setBusy(true);
    const res = await fetch("/api/admin/blog", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...editing, status: publish ? "published" : "draft" }),
    });
    const d = await res.json().catch(() => null);
    setBusy(false);
    if (res.ok) {
      setMessage(publish ? `Published at /blog/${d.slug}` : "Draft saved.");
      setEditing(null);
      load();
    } else {
      setMessage(d?.error || "Save failed.");
    }
  };

  const remove = async (p: Post) => {
    if (!confirm(`Delete post "${p.title}"?`)) return;
    await fetch("/api/admin/blog", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: p.id }),
    });
    load();
  };

  const uploadCover = async (file: File) => {
    const fd = new FormData();
    fd.append("folder", "blog");
    fd.append("file", file);
    setBusy(true);
    const res = await fetch("/api/admin/uploads", { method: "POST", body: fd });
    const d = await res.json().catch(() => null);
    setBusy(false);
    if (res.ok && d?.url && editing) setEditing({ ...editing, coverUrl: d.url });
  };

  const titleLen = editing?.title.length || 0;
  const descLen = editing?.metaDescription.length || 0;

  return (
    <>
      <div className="h-[52px] bg-card border-b border-border flex items-center justify-between px-6 shrink-0">
        <span className="text-sm text-ink">Blog Posts</span>
        <button onClick={startNew} className="px-3 py-1.5 bg-[#4A5A3E] text-white text-[12px]">+ New post</button>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {message && <p className="text-[12px] text-ink-2">{message}</p>}

        {editing && (
          <div className="bg-card border border-border p-4 space-y-3">
            <div>
              <label className="text-[11px] text-ink-3 block mb-1">
                Title — this is your Google headline. Aim under 60 characters.{" "}
                <span className={titleLen > 60 ? "text-[#B05555]" : ""}>({titleLen}/60)</span>
              </label>
              <input value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })}
                placeholder="How to Introduce a Visual Schedule to a Child Who Resists It"
                className="w-full px-3 py-2 border border-border text-[14px]" />
            </div>
            <div>
              <label className="text-[11px] text-ink-3 block mb-1">
                URL slug — short, lowercase, keywords-first. Leave blank to auto-generate from title.
              </label>
              <div className="flex items-center gap-1 text-[13px]">
                <span className="text-ink-3">visualschedule.app/blog/</span>
                <input value={editing.slug} onChange={(e) => setEditing({ ...editing, slug: e.target.value })}
                  placeholder="visual-schedule-child-resists" className="flex-1 px-2 py-1.5 border border-border text-[13px]" />
              </div>
            </div>
            <div>
              <label className="text-[11px] text-ink-3 block mb-1">
                Meta description — the grey text under your link on Google. Aim 140–160 characters, include your main keyword, end with a reason to click.{" "}
                <span className={descLen > 160 ? "text-[#B05555]" : ""}>({descLen}/160)</span>
              </label>
              <textarea value={editing.metaDescription} onChange={(e) => setEditing({ ...editing, metaDescription: e.target.value })}
                rows={2} className="w-full px-3 py-2 border border-border text-[13px]" />
            </div>
            <div>
              <label className="text-[11px] text-ink-3 block mb-1">
                Keywords — comma separated phrases people would search (e.g. visual schedule autism, morning routine chart).
              </label>
              <input value={editing.keywords} onChange={(e) => setEditing({ ...editing, keywords: e.target.value })}
                className="w-full px-3 py-2 border border-border text-[13px]" />
            </div>
            <div>
              <label className="text-[11px] text-ink-3 block mb-1">Cover image (shows on the blog list, Google preview, and social shares)</label>
              <div className="flex items-center gap-2">
                {editing.coverUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={editing.coverUrl} alt="" className="w-16 h-10 object-cover rounded" />
                )}
                <input type="file" accept="image/*" onChange={(e) => e.target.files?.[0] && uploadCover(e.target.files[0])} className="text-[11px]" />
              </div>
            </div>
            <div>
              <label className="text-[11px] text-ink-3 block mb-1">
                Content — Markdown: ## Heading, **bold**, *italic*, - bullet, [link text](https://url), ![image](https://url)
              </label>
              <textarea value={editing.content} onChange={(e) => setEditing({ ...editing, content: e.target.value })}
                rows={16} className="w-full px-3 py-2 border border-border text-[13px] font-mono" />
            </div>
            <div className="flex gap-2">
              <button disabled={busy} onClick={() => save(false)} className="px-4 py-2 border border-border text-[13px] disabled:opacity-50">Save draft</button>
              <button disabled={busy} onClick={() => save(true)} className="px-4 py-2 bg-[#4A5A3E] text-white text-[13px] disabled:opacity-50">Publish</button>
              <button disabled={busy} onClick={() => setEditing(null)} className="px-4 py-2 text-[13px] text-ink-3">Cancel</button>
            </div>
          </div>
        )}

        <div className="bg-card border border-border overflow-hidden">
          <div className="grid grid-cols-[1fr_90px_100px_130px] gap-2 px-4 py-2 border-b border-border text-[10px] tracking-wider uppercase text-ink-3 font-medium">
            <span>Title</span><span>Status</span><span>Updated</span><span></span>
          </div>
          {posts.length === 0 && <div className="px-4 py-6 text-[12px] text-ink-3">No posts yet — click "+ New post".</div>}
          {posts.map((p) => (
            <div key={p.id} className="grid grid-cols-[1fr_90px_100px_130px] gap-2 px-4 py-3 border-b border-border last:border-b-0 items-center text-[13px]">
              <div>
                <div className="text-ink">{p.title}</div>
                <div className="text-[11px] text-ink-3">/blog/{p.slug}</div>
              </div>
              <span className={`text-[10px] px-1.5 py-0.5 font-medium tracking-wider w-fit ${p.status === "published" ? "bg-badge-free-bg text-badge-free-text" : "bg-surface-hover text-ink-3"}`}>
                {p.status.toUpperCase()}
              </span>
              <span className="text-ink-3 text-[12px]">{(p.updated_at || "").slice(0, 10)}</span>
              <div className="flex gap-2">
                <button onClick={() => startEdit(p)} className="text-[11px] px-2 py-1 border border-border text-ink-2 hover:bg-surface-hover">Edit</button>
                {p.status === "published" && (
                  <a href={`/blog/${p.slug}`} target="_blank" className="text-[11px] px-2 py-1 border border-border text-ink-2 hover:bg-surface-hover no-underline">View</a>
                )}
                <button onClick={() => remove(p)} className="text-[11px] px-2 py-1 border border-border text-[#B05555] hover:bg-surface-hover">Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
