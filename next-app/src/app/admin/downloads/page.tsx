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

export default function AdminDownloadsPage() {
  const [bundles, setBundles] = useState<Bundle[]>([]);
  const [items, setItems] = useState<Item[]>([]);
  const [files, setFiles] = useState<DFile[]>([]);
  const [activeBundle, setActiveBundle] = useState<string | null>(null);
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
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

    let fileUrl: string | null = null;
    let previewUrl: string | null = null;

    if (driveLink.trim()) {
      // One pasted link does double duty — the server normalizes it into a
      // real download URL and a real preview-image URL from the same link.
      fileUrl = driveLink.trim();
      previewUrl = driveLink.trim();
    } else if (pdfFile) {
      // One uploaded image, one upload call for full quality — and the
      // same image, compressed, becomes the preview automatically.
      fileUrl = await uploadFile(pdfFile);
      previewUrl = fileUrl ? await uploadPreview(pdfFile) : null;
    }

    setBusy(false);
    if (!fileUrl) { alert("Upload failed — try again."); return; }
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

  // ---- New simple upload modal (Category + Name + up to 4 character
  // images + Language checkboxes, one Save) ----
  const [showUploadModal, setShowUploadModal] = useState(false);
  const CHAR_SLOTS: { key: "neutral" | "boy" | "girl" | "brown"; label: string }[] = [
    { key: "neutral", label: "Neutral" },
    { key: "boy", label: "Boy" },
    { key: "girl", label: "Girl" },
    { key: "brown", label: "Brown" },
  ];
  const [uCategory, setUCategory] = useState("");
  const [uName, setUName] = useState("");
  const [uImages, setUImages] = useState<Record<string, File | null>>({});
  const [uLangs, setULangs] = useState<{ english: boolean; hindi: boolean }>({ english: true, hindi: false });
  const [uBusy, setUBusy] = useState(false);

  const resetUploadModal = () => {
    setUCategory(""); setUName(""); setUImages({}); setULangs({ english: true, hindi: false });
  };

  const saveUploadModal = async () => {
    const chosenImages = CHAR_SLOTS.filter((c) => uImages[c.key]);
    const chosenLangs = (["english", "hindi"] as const).filter((l) => uLangs[l]);
    if (!uCategory || !uName.trim() || chosenImages.length === 0 || chosenLangs.length === 0) {
      alert("Pick a category, a name, at least one image, and at least one language.");
      return;
    }
    setUBusy(true);
    try {
      // Find or create the "item" (Name) under the chosen category
      let itemId = items.find((i) => i.bundle_id === uCategory && i.title.toLowerCase() === uName.trim().toLowerCase())?.id;
      if (!itemId) {
        const res = await fetch("/api/admin/downloads", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ kind: "item", bundleId: uCategory, title: uName.trim(), sortOrder: items.filter((i) => i.bundle_id === uCategory).length }),
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
              language: lang,
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
  const itemFiles = files.filter((f) => f.item_id === activeItem);

  return (
    <>
      <div className="h-[52px] bg-card border-b border-border flex items-center justify-between px-6 shrink-0">
        <span className="text-sm text-ink">Downloads</span>
        <div className="flex items-center gap-3">
          <span className="text-[12px] text-ink-3">{bundles.length} bundles · {items.length} items · {files.length} files</span>
          <button
            onClick={() => setShowUploadModal(true)}
            className="text-[12px] font-semibold px-3 py-1.5 bg-[#4A5A3E] text-white rounded"
          >
            + Upload Images
          </button>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid md:grid-cols-3 gap-4">
          {/* Bundles */}
          <div className="bg-card border border-border">
            <div className="px-3 py-2 border-b border-border text-[12px] uppercase tracking-wider text-ink-3">1 · Categories</div>
            <div className="p-2 space-y-1">
              {bundles.map((b) => (
                <div key={b.id} className={`flex items-center gap-1 rounded ${activeBundle === b.id ? "bg-[#E8EDE0]" : ""}`}>
                  <button onClick={() => { setActiveBundle(b.id); setActiveItem(null); }} className="flex-1 text-left px-2 py-1.5 text-[13px] text-ink">
                    {b.title} <span className="text-ink-3 text-[12px]">({items.filter((i) => i.bundle_id === b.id).length})</span>
                  </button>
                  <button onClick={() => del("bundle", b.id, `bundle "${b.title}" and everything in it`)} className="text-[12px] text-[#B05555] px-2">✕</button>
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
            <div className="px-3 py-2 border-b border-border text-[12px] uppercase tracking-wider text-ink-3">2 · Subcategories {activeBundle ? "" : "(select a category)"}</div>
            {activeBundle && (
              <div className="p-2 space-y-1">
                {bundleItems.map((i) => (
                  <div key={i.id} className={`flex items-center gap-1 rounded ${activeItem === i.id ? "bg-[#E8EDE0]" : ""}`}>
                    <button onClick={() => setActiveItem(i.id)} className="flex-1 text-left px-2 py-1.5 text-[13px] text-ink">
                      {i.title} <span className="text-ink-3 text-[12px]">({files.filter((f) => f.item_id === i.id).length})</span>
                    </button>
                    <button onClick={() => del("item", i.id, `item "${i.title}"`)} className="text-[12px] text-[#B05555] px-2">✕</button>
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
            <div className="px-3 py-2 border-b border-border text-[12px] uppercase tracking-wider text-ink-3">3 · Versions {activeItem ? "" : "(select an item)"}</div>
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
                      <a href={f.file_url} target="_blank" rel="noopener" className="text-[12px] text-[#4A5A3E] underline">view file</a>
                    </div>
                    {!f.preview_url && isImageUrl(f.file_url) && (
                      <button
                        onClick={() => useFileAsPreview(f)}
                        disabled={addingPreviewFor === f.id}
                        className="text-[11px] text-[#2D6A2D] bg-[#EAF5EA] border border-[#7A8F5E] rounded px-1.5 py-1 whitespace-nowrap disabled:opacity-50"
                      >
                        {addingPreviewFor === f.id ? "…" : "Use file as preview"}
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
                    <button onClick={() => del("file", f.id, `version "${f.variant}"`)} className="text-[12px] text-[#B05555] px-1.5">✕</button>
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

                  {/* One image, one action — it becomes both the download
                      and the preview automatically. No PDF, no second field. */}
                  <label className="block text-[12px] text-ink-3 bg-[#EAF5EA] border border-[#7A8F5E] rounded px-2 py-1.5 cursor-pointer">
                    <span className="font-semibold text-[#2D6A2D]">Upload image</span>{" "}
                    <span className="text-ink-3">— this is both the download and the preview</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => setPdfFile(e.target.files?.[0] || null)}
                      className="text-[12px] mt-1 block"
                    />
                    {pdfFile && <span className="text-[11px] text-[#2D6A2D] mt-1 block">✓ {pdfFile.name}</span>}
                  </label>

                  <p className="text-[11px] text-ink-3 text-center">— or —</p>
                  <input
                    value={driveLink}
                    onChange={(e) => setDriveLink(e.target.value)}
                    placeholder="Paste an image link instead"
                    className="w-full px-2 py-1.5 border border-border text-[12px]"
                  />

                  <button disabled={busy || (!pdfFile && !driveLink.trim())} onClick={addVariantFile} className="w-full py-1.5 bg-[#4A5A3E] text-white text-[12px] disabled:opacity-50">
                    {busy ? "Uploading…" : "Add version"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <p className="text-[12px] text-ink-3 mt-4">
          Structure: Category (Morning Schedule) → Subcategory (Brushing, Bath…) → Versions with Character + Language.
          For each version, either paste a Google Drive share link or upload a file. Everything appears on the public Downloads page immediately, filterable by all of these.
        </p>
      </div>

      {/* Simple upload modal — Category, Name, up to 4 character images
          (optional, any combination), Language checkboxes, one Save. */}
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
              <h2 className="font-serif text-[20px] text-ink">Upload Images</h2>
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
                </select>
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
                <label className="text-[11px] uppercase tracking-wide text-ink-3 font-sans block mb-1">Name</label>
                <input
                  value={uName}
                  onChange={(e) => setUName(e.target.value)}
                  placeholder="e.g. Brushing Teeth"
                  className="w-full px-2 py-2 border border-border text-[13px]"
                />
              </div>

              <div>
                <label className="text-[11px] uppercase tracking-wide text-ink-3 font-sans block mb-2">Language</label>
                <div className="flex gap-5">
                  <label className="flex items-center gap-1.5 text-[13px] text-ink cursor-pointer">
                    <input
                      type="checkbox"
                      checked={uLangs.english}
                      onChange={(e) => setULangs((l) => ({ ...l, english: e.target.checked }))}
                      className="accent-[#7A8F5E] w-4 h-4"
                    />
                    English
                  </label>
                  <label className="flex items-center gap-1.5 text-[13px] text-ink cursor-pointer">
                    <input
                      type="checkbox"
                      checked={uLangs.hindi}
                      onChange={(e) => setULangs((l) => ({ ...l, hindi: e.target.checked }))}
                      className="accent-[#7A8F5E] w-4 h-4"
                    />
                    Hindi
                  </label>
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
