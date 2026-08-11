"use client";

import { useState, useEffect, useCallback } from "react";

type Bundle = { id: string; title: string; description: string | null; sort_order: number; enabled: number };
type Item = { id: string; bundle_id: string; title: string; description: string | null; sort_order: number; enabled: number };
type DFile = { id: string; item_id: string; variant: string; label: string | null; file_url: string; preview_url: string | null; character: string | null; language: string | null };

// Preview images from a phone camera are often 3-8MB — slow to upload and
// slow for parents to load later. Shrink to a sane max dimension and
// re-compress as JPEG before sending, right in the browser. PDFs and other
// non-image files pass through untouched.
async function compressImage(file: File, maxDim = 1000, quality = 0.82): Promise<File> {
  if (!file.type.startsWith("image/")) return file;
  try {
    const bitmap = await createImageBitmap(file);
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, w, h);
    const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob) return file;
    // Only use the compressed version if it's actually smaller
    if (blob.size >= file.size) return file;
    return new File([blob], file.name.replace(/\.\w+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file; // if compression fails for any reason, upload the original rather than block
  }
}

// The real downloadable/printable file (PDF, or sometimes a full JPEG card)
// must NEVER be compressed — full quality, exactly as uploaded, since this
// is what a parent actually prints.
async function uploadFile(file: File): Promise<string | null> {
  const fd = new FormData();
  fd.append("folder", "downloads");
  fd.append("file", file);
  const res = await fetch("/api/admin/uploads", { method: "POST", body: fd });
  const d = await res.json().catch(() => null);
  return res.ok ? d?.url || null : null;
}

// Preview THUMBNAILS only — never used for the real downloadable file.
// Small and fast is the right tradeoff here since this is just a grid icon.
async function uploadPreview(file: File): Promise<string | null> {
  const toSend = await compressImage(file);
  const fd = new FormData();
  fd.append("folder", "downloads");
  fd.append("file", toSend);
  const res = await fetch("/api/admin/uploads", { method: "POST", body: fd });
  const d = await res.json().catch(() => null);
  return res.ok ? d?.url || null : null;
}

const CHAR_SLOTS: { key: "neutral" | "boy" | "girl" | "brown"; label: string }[] = [
  { key: "neutral", label: "Neutral" },
  { key: "boy", label: "Boy" },
  { key: "girl", label: "Girl" },
  { key: "brown", label: "Brown" },
];

const LANG_OPTIONS: { key: string; label: string }[] = [
  { key: "english", label: "English" },
  { key: "hindi", label: "Hindi" },
  { key: "marathi", label: "Marathi" },
  { key: "punjabi", label: "Punjabi" },
];

export default function AdminDownloadsPage() {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [files, setFiles] = useState<DFile[]>([]);
  const [addingPreviewFor, setAddingPreviewFor] = useState<string | null>(null);

  // Takes the whole existing file row (not just its id) so its current
  // variant/character/language/label are preserved — the backend's SET
  // clause updates all those columns together, not just the new preview.
  const addPreviewToExisting = async (f: DFile, file: File) => {
    setAddingPreviewFor(f.id);
    const url = await uploadPreview(file);
    if (!url) { alert("Upload failed — try again."); setAddingPreviewFor(null); return; }
    await fetch("/api/admin/downloads", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "file",
        id: f.id,
        variant: f.variant,
        label: f.label,
        character: f.character,
        language: f.language,
        previewUrl: url,
      }),
    });
    setAddingPreviewFor(null);
    load();
  };

  // For entries where the FILE itself is already an image (a JPEG card, not
  // a real PDF) — no upload needed at all, just point preview at the same
  // file that's already sitting there.
  const isImageUrl = (url: string) => /\.(jpe?g|png|webp|gif)(\?|$)/i.test(url);
  const useFileAsPreview = async (f: DFile) => {
    setAddingPreviewFor(f.id);
    await fetch("/api/admin/downloads", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "file",
        id: f.id,
        variant: f.variant,
        label: f.label,
        character: f.character,
        language: f.language,
        previewUrl: f.file_url,
      }),
    });
    setAddingPreviewFor(null);
    load();
  };

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

  const del = async (kind: string, id: string, label: string) => {
    if (!confirm(`Delete ${label}? This cannot be undone.`)) return;
    await fetch("/api/admin/downloads", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ kind, id }),
    });
    load();
  };

  // ---- The one upload popup: Category, Name, up to 4 character images,
  // 4 language checkboxes, one Save. No separate "add category" workflow —
  // a brand-new category can be typed right here too. ----
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uCategory, setUCategory] = useState(""); // bundle id, or "__new__"
  const [uNewCategory, setUNewCategory] = useState("");
  const [uName, setUName] = useState("");
  const [uImages, setUImages] = useState<Record<string, File | null>>({});
  const [uLangs, setULangs] = useState<Record<string, boolean>>({ english: true, hindi: false, marathi: false, punjabi: false });
  const [uBusy, setUBusy] = useState(false);

  const resetUploadModal = () => {
    setUCategory(""); setUNewCategory(""); setUName(""); setUImages({});
    setULangs({ english: true, hindi: false, marathi: false, punjabi: false });
  };

  const saveUploadModal = async () => {
    const chosenImages = CHAR_SLOTS.filter((c) => uImages[c.key]);
    const chosenLangs = LANG_OPTIONS.filter((l) => uLangs[l.key]);
    const usingNewCategory = uCategory === "__new__";
    if ((!uCategory || (usingNewCategory && !uNewCategory.trim())) || !uName.trim() || chosenImages.length === 0 || chosenLangs.length === 0) {
      alert("Pick or type a category, a name, at least one image, and at least one language.");
      return;
    }
    setUBusy(true);
    try {
      // New category typed right here — no separate step.
      let bundleId = usingNewCategory ? undefined : uCategory;
      if (!bundleId) {
        const existing = bundles.find((b) => b.title.toLowerCase() === uNewCategory.trim().toLowerCase());
        bundleId = existing?.id;
        if (!bundleId) {
          const res = await fetch("/api/admin/downloads", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ kind: "bundle", title: uNewCategory.trim(), sortOrder: bundles.length }),
          });
          const d = await res.json().catch(() => null);
          bundleId = d?.id;
          if (!bundleId) throw new Error("Could not create the category");
        }
      }

      // Find or create the item (card name) under that category.
      let itemId = items.find((i) => i.bundle_id === bundleId && i.title.toLowerCase() === uName.trim().toLowerCase())?.id;
      if (!itemId) {
        const res = await fetch("/api/admin/downloads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind: "item", bundleId, title: uName.trim(), sortOrder: items.filter((i) => i.bundle_id === bundleId).length }),
        });
        const d = await res.json().catch(() => null);
        itemId = d?.id;
        if (!itemId) throw new Error("Could not create the item");
      }

      // One row per image × per selected language
      for (const c of chosenImages) {
        const file = uImages[c.key]!;
        const fileUrl = await uploadFile(file);
        const previewUrl = fileUrl ? await uploadPreview(file) : null;
        if (!fileUrl) continue;
        for (const lang of chosenLangs) {
          await fetch("/api/admin/downloads", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              kind: "file",
              itemId,
              character: c.key,
              language: lang.key,
              fileUrl,
              previewUrl,
            }),
          });
        }
      }
      resetUploadModal();
      setShowUploadModal(false);
      load();
    } catch {
      alert("Something went wrong saving — please try again.");
    }
    setUBusy(false);
  };

  return (
    <>
      <div className="h-[52px] bg-card border-b border-border flex items-center justify-between px-6 shrink-0">
        <span className="text-sm text-ink">Downloads</span>
        <div className="flex items-center gap-3">
          <span className="text-[12px] text-ink-3">{bundles.length} categories · {items.length} items · {files.length} files</span>
          <button
            onClick={() => setShowUploadModal(true)}
            className="text-[12px] font-semibold px-3 py-1.5 bg-[#4A5A3E] text-white rounded"
          >
            + Upload
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {bundles.length === 0 && (
          <p className="text-[13px] text-ink-3">Nothing uploaded yet — click "+ Upload" to add your first card.</p>
        )}
        {bundles.map((b) => {
          const bundleItems = items.filter((i) => i.bundle_id === b.id);
          return (
            <div key={b.id} className="bg-card border border-border">
              <div className="px-3 py-2 border-b border-border flex items-center justify-between">
                <span className="text-[13px] text-ink font-semibold">{b.title}</span>
                <button onClick={() => del("bundle", b.id, `category "${b.title}" and everything in it`)} className="text-[12px] text-[#B05555] px-2">✕</button>
              </div>
              {bundleItems.length === 0 ? (
                <p className="text-[12px] text-ink-3 px-3 py-2">No items yet.</p>
              ) : (
                <div className="divide-y divide-border">
                  {bundleItems.map((i) => {
                    const itemFiles = files.filter((f) => f.item_id === i.id);
                    return (
                      <div key={i.id} className="px-3 py-2">
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[13px] text-ink">{i.title}</span>
                          <button onClick={() => del("item", i.id, `item "${i.title}"`)} className="text-[12px] text-[#B05555] px-2">✕</button>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {itemFiles.map((f) => (
                            <div key={f.id} className="flex items-center gap-2 border border-border rounded p-1.5">
                              {f.preview_url ? (
                                // eslint-disable-next-line @next/next/no-img-element
                                <img src={f.preview_url} alt="" className="w-9 h-9 object-cover rounded" />
                              ) : (
                                <div className="w-9 h-9 bg-surface-hover rounded" />
                              )}
                              <div className="min-w-0">
                                <div className="text-[12px] text-ink capitalize">
                                  {[f.character, f.language, f.label].filter(Boolean).join(" · ") || f.variant}
                                </div>
                                <a href={f.file_url} target="_blank" rel="noopener" className="text-[12px] text-[#4A5A3E] underline">view file</a>
                              </div>
                              {!f.preview_url && isImageUrl(f.file_url) && (
                                <button
                                  onClick={() => useFileAsPreview(f)}
                                  disabled={addingPreviewFor === f.id}
                                  className="text-[11px] text-[#2D6A2D] bg-[#EAF5EA] border border-[#7A8F5E] rounded px-1.5 py-1 whitespace-nowrap disabled:opacity-50"
                                >
                                  {addingPreviewFor === f.id ? "…" : "Use as preview"}
                                </button>
                              )}
                              {!f.preview_url && !isImageUrl(f.file_url) && (
                                <label className="text-[11px] text-[#2D6A2D] bg-[#EAF5EA] border border-[#7A8F5E] rounded px-1.5 py-1 cursor-pointer whitespace-nowrap">
                                  {addingPreviewFor === f.id ? "Uploading…" : "+ Add preview"}
                                  <input
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    disabled={addingPreviewFor === f.id}
                                    onChange={(e) => { const file = e.target.files?.[0]; if (file) addPreviewToExisting(f, file); e.target.value = ""; }}
                                  />
                                </label>
                              )}
                              <button onClick={() => del("file", f.id, `version "${f.variant}"`)} className="text-[12px] text-[#B05555] px-1">✕</button>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* The one upload popup. */}
      {showUploadModal && (
        <div
          className="fixed inset-0 z-[300] bg-ink/50 flex items-center justify-center p-4"
          onClick={() => setShowUploadModal(false)}
        >
          <div
            className="bg-white rounded-lg max-w-[440px] w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 py-4 border-b border-border">
              <h2 className="font-serif text-[20px] text-ink">Upload</h2>
            </div>

            <div className="p-5 space-y-4">
              <div>
                <label className="text-[11px] uppercase tracking-wide text-ink-3 font-sans block mb-1">Category</label>
                <select
                  value={uCategory}
                  onChange={(e) => setUCategory(e.target.value)}
                  className="w-full px-2 py-2 border border-border text-[13px] bg-white"
                >
                  <option value="">Select a category…</option>
                  {bundles.map((b) => (
                    <option key={b.id} value={b.id}>{b.title}</option>
                  ))}
                  <option value="__new__">+ New category…</option>
                </select>
                {uCategory === "__new__" && (
                  <input
                    value={uNewCategory}
                    onChange={(e) => setUNewCategory(e.target.value)}
                    placeholder="e.g. Morning Schedule"
                    className="w-full mt-1.5 px-2 py-2 border border-border text-[13px]"
                  />
                )}
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wide text-ink-3 font-sans block mb-1">Name</label>
                <input
                  value={uName}
                  onChange={(e) => setUName(e.target.value)}
                  placeholder="e.g. Brushing Teeth"
                  className="w-full px-2 py-2 border border-border text-[13px]"
                />
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wide text-ink-3 font-sans block mb-1">
                  Images <span className="normal-case text-ink-3">(1–4, any combination — optional beyond one)</span>
                </label>
                <div className="grid grid-cols-4 gap-2">
                  {CHAR_SLOTS.map((c) => (
                    <label
                      key={c.key}
                      className={`aspect-square border-2 border-dashed rounded flex flex-col items-center justify-center cursor-pointer text-center px-1 ${
                        uImages[c.key] ? "border-[#7A8F5E] bg-[#EAF5EA]" : "border-input-border bg-[#FBFAF7]"
                      }`}
                    >
                      {uImages[c.key] ? (
                        <span className="text-[11px] text-[#2D6A2D] font-semibold leading-tight">✓ {c.label}</span>
                      ) : (
                        <span className="text-[11px] text-ink-3 leading-tight">{c.label}</span>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => setUImages((m) => ({ ...m, [c.key]: e.target.files?.[0] || null }))}
                      />
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wide text-ink-3 font-sans block mb-2">Language</label>
                <div className="grid grid-cols-2 gap-2">
                  {LANG_OPTIONS.map((l) => (
                    <label key={l.key} className="flex items-center gap-1.5 text-[13px] text-ink cursor-pointer">
                      <input
                        type="checkbox"
                        checked={!!uLangs[l.key]}
                        onChange={(e) => setULangs((prev) => ({ ...prev, [l.key]: e.target.checked }))}
                        className="accent-[#7A8F5E] w-4 h-4"
                      />
                      {l.label}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="px-5 py-4 border-t border-border flex gap-2">
              <button
                onClick={saveUploadModal}
                disabled={uBusy}
                className="flex-1 py-2 bg-[#4A5A3E] text-white text-[13px] font-semibold rounded disabled:opacity-50"
              >
                {uBusy ? "Saving…" : "Save"}
              </button>
              <button
                onClick={() => { setShowUploadModal(false); resetUploadModal(); }}
                className="px-4 py-2 text-[13px] text-ink-2 border border-input-border rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
