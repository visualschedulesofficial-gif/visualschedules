"use client";

import { useState } from "react";
import { CATEGORIES } from "@/lib/card-data";

interface CategoryForm {
  id: string;
  name: string;
  isFree: boolean;
  price: number;
  currency: string;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryForm[]>(
    CATEGORIES.map((c) => ({ id: c.id, name: c.name, isFree: c.isFree, price: 0, currency: "INR" }))
  );
  const [newCat, setNewCat] = useState({ name: "", isFree: false, price: 99 });
  const [saving, setSaving] = useState(false);

  async function handleAddCategory() {
    if (!newCat.name.trim()) return;
    const id = newCat.name.toLowerCase().replace(/[^a-z0-9]/g, "");
    setCategories([...categories, { id, name: newCat.name, isFree: newCat.isFree, price: newCat.price, currency: "INR" }]);
    setNewCat({ name: "", isFree: false, price: 99 });
    // TODO: POST to /api/admin/categories
  }

  async function handleSave() {
    setSaving(true);
    // TODO: PUT to /api/admin/categories with full list
    await new Promise((r) => setTimeout(r, 500));
    setSaving(false);
  }

  return (
    <>
      <div className="h-[52px] bg-card border-b border-border flex items-center justify-between px-6 shrink-0">
        <span className="text-sm text-ink">Categories</span>
        <button
            onClick={handleSave}
            disabled={saving}
            className="text-[11px] tracking-wider uppercase px-5 py-2 bg-ink text-white border border-ink font-sans font-medium hover:bg-[#333] disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save"}
          </button>
      </div>
      <div className="flex-1 overflow-y-auto p-6">

        {/* Existing categories */}
        <div className="bg-surface border border-border mb-6">
          <div className="grid grid-cols-[1fr_80px_100px_60px] gap-2 px-4 py-2 border-b border-border text-[10px] tracking-wider uppercase text-ink-3 font-medium">
            <span>Name</span>
            <span>Access</span>
            <span>Price</span>
            <span></span>
          </div>
          {categories.map((cat, idx) => (
            <div key={cat.id} className="grid grid-cols-[1fr_80px_100px_60px] gap-2 px-4 py-3 border-b border-border last:border-b-0 items-center">
              <input
                type="text"
                value={cat.name}
                onChange={(e) => {
                  const updated = [...categories];
                  updated[idx].name = e.target.value;
                  setCategories(updated);
                }}
                className="py-1 px-2 border border-border bg-surface-hover font-sans text-[13px] text-ink outline-none focus:border-accent"
              />
              <select
                value={cat.isFree ? "free" : "paid"}
                onChange={(e) => {
                  const updated = [...categories];
                  updated[idx].isFree = e.target.value === "free";
                  setCategories(updated);
                }}
                className="py-1 px-1.5 border border-border bg-surface font-sans text-[11px] text-ink-2 outline-none"
              >
                <option value="free">Free</option>
                <option value="paid">Paid</option>
              </select>
              {!cat.isFree ? (
                <div className="flex items-center gap-1">
                  <span className="text-[11px] text-ink-3">₹</span>
                  <input
                    type="number"
                    value={cat.price}
                    onChange={(e) => {
                      const updated = [...categories];
                      updated[idx].price = parseInt(e.target.value) || 0;
                      setCategories(updated);
                    }}
                    className="w-full py-1 px-2 border border-border bg-surface-hover font-sans text-[13px] text-ink outline-none focus:border-accent"
                  />
                </div>
              ) : (
                <span className="text-[11px] text-ink-3">—</span>
              )}
              <button
                onClick={() => setCategories(categories.filter((_, i) => i !== idx))}
                className="text-[11px] text-[#C53030] hover:underline"
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        {/* Add new category */}
        <div className="bg-surface border border-border p-4">
          <h3 className="text-[11px] tracking-widest uppercase text-[#8A8480] mb-3 font-medium">Add New Category</h3>
          <div className="flex gap-2 flex-wrap items-end">
            <div className="flex-1 min-w-[150px]">
              <label className="text-[10px] text-ink-3 block mb-1">Name</label>
              <input
                type="text"
                value={newCat.name}
                onChange={(e) => setNewCat({ ...newCat, name: e.target.value })}
                placeholder="e.g. Emotions"
                className="w-full py-2 px-2.5 border border-border bg-surface-hover font-sans text-[13px] text-ink outline-none focus:border-accent"
              />
            </div>
            <div className="w-[80px]">
              <label className="text-[10px] text-ink-3 block mb-1">Access</label>
              <select
                value={newCat.isFree ? "free" : "paid"}
                onChange={(e) => setNewCat({ ...newCat, isFree: e.target.value === "free" })}
                className="w-full py-2 px-1.5 border border-border bg-surface font-sans text-[11px] text-ink-2 outline-none"
              >
                <option value="free">Free</option>
                <option value="paid">Paid</option>
              </select>
            </div>
            <div className="w-[80px]">
              <label className="text-[10px] text-ink-3 block mb-1">Price (₹)</label>
              <input
                type="number"
                value={newCat.price}
                onChange={(e) => setNewCat({ ...newCat, price: parseInt(e.target.value) || 0 })}
                className="w-full py-2 px-2.5 border border-border bg-surface-hover font-sans text-[13px] text-ink outline-none focus:border-accent"
              />
            </div>
            <button
              onClick={handleAddCategory}
              className="text-[11px] tracking-wider uppercase px-4 py-2 bg-accent text-white border border-accent font-sans font-medium hover:bg-accent-hover"
            >
              Add
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
