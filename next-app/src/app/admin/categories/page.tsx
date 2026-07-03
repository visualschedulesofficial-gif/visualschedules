"use client";

import { useEffect, useState } from "react";

interface CategoryForm { id: string; name: string; }

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryForm[]>([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/categories");
        if (res.ok) {
          const data = await res.json();
          setCategories((data.categories || []).map((c: any) => ({ id: c.id, name: c.name })));
        }
      } catch {} finally { setLoading(false); }
    })();
  }, []);

  function flash(text: string) { setMessage(text); setTimeout(() => setMessage(""), 2500); }

  async function handleAdd() {
    if (!newName.trim()) return;
    const id = newName.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
    if (!id) { flash("Enter a valid name."); return; }
    if (categories.some(c => c.id === id)) { flash(`"${id}" already exists.`); return; }
    try {
      const res = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, name: newName.trim(), sortOrder: categories.length }),
      });
      if (res.ok) {
        setCategories([...categories, { id, name: newName.trim() }]);
        setNewName("");
        flash("✅ Category added.");
      } else {
        const err = await res.json();
        flash(`Failed: ${err.error || "Unknown"}`);
      }
    } catch { flash("Error adding category."); }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/categories", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ categories: categories.map((c, i) => ({ ...c, sortOrder: i })) }),
      });
      flash(res.ok ? "✅ Saved." : "Failed to save.");
    } catch { flash("Error saving."); }
    finally { setSaving(false); }
  }

  return (
    <>
      <div className="h-[52px] bg-card border-b border-border flex items-center justify-between px-6 shrink-0">
        <span className="text-sm text-ink">Categories</span>
        <div className="flex items-center gap-3">
          {message && <span className="text-[12px] text-ink-3">{message}</span>}
          <button onClick={handleSave} disabled={saving}
            className="text-[11px] tracking-wider uppercase px-5 py-2 bg-ink text-white border border-ink font-medium hover:bg-[#333] disabled:opacity-50">
            {saving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-6 h-6 border-2 border-border border-t-accent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <p className="text-[12px] text-ink-3 mb-4">
              Categories are just labels. Free/Paid is set on each individual card.
              Use the arrows to set the order categories appear in the card side panel, then click Save.
            </p>

            <div className="bg-surface border border-border mb-6">
              <div className="grid grid-cols-[36px_1fr_60px] gap-2 px-4 py-2 border-b border-border text-[10px] tracking-wider uppercase text-ink-3 font-medium">
                <span>Order</span>
                <span>Name</span>
                <span></span>
              </div>
              {categories.length === 0 ? (
                <div className="px-4 py-6 text-[13px] text-ink-3">No categories yet.</div>
              ) : (
                categories.map((cat, idx) => (
                  <div key={cat.id} className="grid grid-cols-[36px_1fr_60px] gap-2 px-4 py-3 border-b border-border last:border-b-0 items-center">
                    <div className="flex flex-col items-center gap-0.5">
                      <button
                        disabled={idx === 0}
                        onClick={() => {
                          const u = [...categories];
                          [u[idx - 1], u[idx]] = [u[idx], u[idx - 1]];
                          setCategories(u);
                        }}
                        className="text-[11px] leading-none px-1.5 py-0.5 border border-border rounded text-ink-3 hover:bg-surface-hover disabled:opacity-25"
                        title="Move up"
                      >▲</button>
                      <button
                        disabled={idx === categories.length - 1}
                        onClick={() => {
                          const u = [...categories];
                          [u[idx + 1], u[idx]] = [u[idx], u[idx + 1]];
                          setCategories(u);
                        }}
                        className="text-[11px] leading-none px-1.5 py-0.5 border border-border rounded text-ink-3 hover:bg-surface-hover disabled:opacity-25"
                        title="Move down"
                      >▼</button>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[11px] text-ink-3 font-mono w-20 shrink-0">{cat.id}</span>
                      <input
                        type="text" value={cat.name}
                        onChange={e => {
                          const updated = [...categories];
                          updated[idx].name = e.target.value;
                          setCategories(updated);
                        }}
                        className="flex-1 py-1 px-2 border border-border bg-surface-hover text-[13px] text-ink outline-none focus:border-accent"
                      />
                    </div>
                    <button onClick={() => setCategories(categories.filter((_, i) => i !== idx))}
                      className="text-[11px] text-[#C53030] hover:underline">
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>

            <div className="bg-surface border border-border p-4">
              <h3 className="text-[11px] tracking-widest uppercase text-[#8A8480] mb-3 font-medium">Add Category</h3>
              <div className="flex gap-2">
                <input type="text" value={newName} onChange={e => setNewName(e.target.value)}
                  onKeyDown={e => e.key === "Enter" && handleAdd()}
                  placeholder="e.g. Places"
                  className="flex-1 py-2 px-2.5 border border-border bg-surface-hover text-[13px] text-ink outline-none focus:border-accent" />
                <button onClick={handleAdd}
                  className="text-[11px] tracking-wider uppercase px-4 py-2 bg-accent text-white border border-accent font-medium hover:bg-accent-hover">
                  Add
                </button>
              </div>
              <p className="text-[11px] text-ink-3 mt-2">Add, then click Save to persist.</p>
            </div>
          </>
        )}
      </div>
    </>
  );
}
