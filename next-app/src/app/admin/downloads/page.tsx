"use client";

import { useState, useEffect, useCallback } from "react";

type Bundle = { id: string; title: string; description: string | null; sort_order: number; enabled: number };
type Item = { id: string; bundle_id: string; title: string; description: string | null; sort_order: number; enabled: number };
type DFile = { id: string; item_id: string; variant: string; label: string | null; file_url: string; preview_url: string | null; character: string | null; language: string | null };

async function uploadFile(file: File): Promise<string | null> {
  const fd = new FormData();
  fd.append("folder", "downloads");
  fd.append("file", file);
  const res = await fetch("/api/admin/uploads", { method: "POST", body: fd });
  const d = await res.json().catch(() => null);
  return res.ok ? d?.url || null : null;
}

export default function AdminDownloadsPage() {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [files, setFiles] = useState<DFile[]>([]);
  const [activeBundle, setActiveBundle] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [newBundle, setNewBundle] = useState("");
  const [newItem, setNewItem] = useState("");
  const [newVariant, setNewVariant] = useState("");
  const [newCharacter, setNewCharacter] = useState("");
  const [newLanguage, setNewLanguage] = useState("");
  const [driveLink, setDriveLink] = useState("");
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);

  const load = useCallback(() => {
    fetch("/api/admin/downloads")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d) return;
        setBundles(d.bundles || []);
        setItems(d.items || []);
        setFiles(d.files || []);
      })
      .catch(() => {});
  }, []);
  useEffect(() => { load(); }, [load]);

  const post = async (body: any) => {
    setBusy(true);
    await fetch("/api/admin/downloads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    load();
  };
  const del = async (kind: string, id: string, label: string) => {
    if (!confirm(`Delete ${label}? This cannot be undone.`)) return;
    await fetch("/api/admin/downloads", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, id }),
    });
    load();
  };

  const addVariantFile = async () => {
    if (!activeItem || (!pdfFile && !driveLink.trim())) return;
    setBusy(true);
    // Either upload a file OR use a pasted link (e.g. Google Drive)
    let fileUrl: string | null = driveLink.trim() || null;
    if (!fileUrl && pdfFile) fileUrl = await uploadFile(pdfFile);
    const previewUrl = previewFile ? await uploadFile(previewFile) : null;
    setBusy(false);
    if (!fileUrl) { alert("File upload failed"); return; }
    await post({
      kind: "file",
      itemId: activeItem,
      variant: newVariant.trim().toLowerCase() || undefined,
      character: newCharacter || undefined,
      language: newLanguage.trim().toLowerCase() || undefined,
      fileUrl,
      previewUrl,
    });
    setNewVariant(""); setNewCharacter(""); setNewLanguage(""); setDriveLink("");
    setPdfFile(null); setPreviewFile(null);
  };

  const bundleItems = items.filter((i) => i.bundle_id === activeBundle);
  const itemFiles = files.filter((f) => f.item_id === activeItem);

  return (
    <>
      <div className="h-[52px] bg-card border-b border-border flex items-center justify-between px-6 shrink-0">
        <span className="text-sm text-ink">Downloads</span>
        <span className="text-[11px] text-ink-3">{bundles.length} bundles · {items.length} items · {files.length} files</span>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid md:grid-cols-3 gap-4">
          {/* Bundles */}
          <div className="bg-card border border-border">
            <div className="px-3 py-2 border-b border-border text-[10px] uppercase tracking-wider text-ink-3">1 · Categories</div>
            <div className="p-2 space-y-1">
              {bundles.map((b) => (
                <div key={b.id} className={`flex items-center gap-1 rounded ${activeBundle === b.id ? "bg-[#E8EDE0]" : ""}`}>
                  <button onClick={() => { setActiveBundle(b.id); setActiveItem(null); }} className="flex-1 text-left px-2 py-1.5 text-[13px] text-ink">
                    {b.title} <span className="text-ink-3 text-[11px]">({items.filter((i) => i.bundle_id === b.id).length})</span>
                  </button>
                  <button onClick={() => del("bundle", b.id, `bundle "${b.title}" and everything in it`)} className="text-[11px] text-[#B05555] px-2">✕</button>
                </div>
              ))}
              <div className="flex gap-1 pt-2">
                <input value={newBundle} onChange={(e) => setNewBundle(e.target.value)} placeholder="New category e.g. Morning Schedule" className="flex-1 px-2 py-1.5 border border-border text-[12px]" />
                <button disabled={busy || !newBundle.trim()} onClick={async () => { await post({ kind: "bundle", title: newBundle.trim(), sortOrder: bundles.length }); setNewBundle(""); }} className="px-2 py-1.5 bg-[#4A5A3E] text-white text-[12px] disabled:opacity-50">Add</button>
              </div>
            </div>
          </div>

          {/* Items */}
          <div className="bg-card border border-border">
            <div className="px-3 py-2 border-b border-border text-[10px] uppercase tracking-wider text-ink-3">2 · Subcategories {activeBundle ? "" : "(select a category)"}</div>
            {activeBundle && (
              <div className="p-2 space-y-1">
                {bundleItems.map((i) => (
                  <div key={i.id} className={`flex items-center gap-1 rounded ${activeItem === i.id ? "bg-[#E8EDE0]" : ""}`}>
                    <button onClick={() => setActiveItem(i.id)} className="flex-1 text-left px-2 py-1.5 text-[13px] text-ink">
                      {i.title} <span className="text-ink-3 text-[11px]">({files.filter((f) => f.item_id === i.id).length})</span>
                    </button>
                    <button onClick={() => del("item", i.id, `item "${i.title}"`)} className="text-[11px] text-[#B05555] px-2">✕</button>
                  </div>
                ))}
                <div className="flex gap-1 pt-2">
                  <input value={newItem} onChange={(e) => setNewItem(e.target.value)} placeholder="New subcategory e.g. Brushing Teeth" className="flex-1 px-2 py-1.5 border border-border text-[12px]" />
                  <button disabled={busy || !newItem.trim()} onClick={async () => { await post({ kind: "item", bundleId: activeBundle, title: newItem.trim(), sortOrder: bundleItems.length }); setNewItem(""); }} className="px-2 py-1.5 bg-[#4A5A3E] text-white text-[12px] disabled:opacity-50">Add</button>
                </div>
              </div>
            )}
          </div>

          {/* Files */}
          <div className="bg-card border border-border">
            <div className="px-3 py-2 border-b border-border text-[10px] uppercase tracking-wider text-ink-3">3 · Versions {activeItem ? "" : "(select an item)"}</div>
            {activeItem && (
              <div className="p-2 space-y-2">
                {itemFiles.map((f) => (
                  <div key={f.id} className="flex items-center gap-2 border border-border rounded p-1.5">
                    {f.preview_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={f.preview_url} alt="" className="w-9 h-9 object-cover rounded" />
                    ) : (
                      <div className="w-9 h-9 bg-surface-hover rounded" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-[12px] text-ink capitalize">
                        {[f.character, f.language, f.label].filter(Boolean).join(" · ") || f.variant}
                      </div>
                      <a href={f.file_url} target="_blank" rel="noopener" className="text-[10px] text-[#4A5A3E] underline">view file</a>
                    </div>
                    <button onClick={() => del("file", f.id, `version "${f.variant}"`)} className="text-[11px] text-[#B05555] px-1.5">✕</button>
                  </div>
                ))}
                <div className="border-t border-border pt-2 space-y-1.5">
                  <div className="grid grid-cols-2 gap-1.5">
                    <select value={newCharacter} onChange={(e) => setNewCharacter(e.target.value)} className="px-2 py-1.5 border border-border text-[12px] bg-white">
                      <option value="">Character: none</option>
                      <option value="neutral">Neutral</option>
                      <option value="boy">Boy</option>
                      <option value="girl">Girl</option>
                      <option value="brown">Brown</option>
                    </select>
                    <input value={newLanguage} onChange={(e) => setNewLanguage(e.target.value)} placeholder="Language e.g. english / hindi" className="px-2 py-1.5 border border-border text-[12px]" />
                  </div>
                  <input value={newVariant} onChange={(e) => setNewVariant(e.target.value)} placeholder="Label (optional) e.g. mini" className="w-full px-2 py-1.5 border border-border text-[12px]" />
                  <input value={driveLink} onChange={(e) => setDriveLink(e.target.value)} placeholder="Paste Google Drive link (or upload a file below)" className="w-full px-2 py-1.5 border border-border text-[12px]" />
                  <label className="block text-[11px] text-ink-3">
                    File (PDF):{" "}
                    <input type="file" accept="application/pdf,image/*" onChange={(e) => setPdfFile(e.target.files?.[0] || null)} className="text-[11px]" />
                  </label>
                  <label className="block text-[11px] text-ink-3">
                    Preview image (optional):{" "}
                    <input type="file" accept="image/*" onChange={(e) => setPreviewFile(e.target.files?.[0] || null)} className="text-[11px]" />
                  </label>
                  <button disabled={busy || (!pdfFile && !driveLink.trim())} onClick={addVariantFile} className="w-full py-1.5 bg-[#4A5A3E] text-white text-[12px] disabled:opacity-50">
                    {busy ? "Uploading…" : "Upload version"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <p className="text-[11px] text-ink-3 mt-4">
          Structure: Category (Morning Schedule) → Subcategory (Brushing, Bath…) → Versions with Character + Language.
          For each version, either paste a Google Drive share link or upload a file. Everything appears on the public Downloads page immediately, filterable by all of these.
        </p>
      </div>
    </>
  );
}
