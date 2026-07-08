"use client";

import { useState, useRef, useEffect } from "react";
import { getCardLabel } from "@/lib/card-data";
import { AddCardForm } from "./AddCardForm";
import { EditCardForm } from "./EditCardForm";

interface ParsedCard {
  id: string;
  icon: string;
  isFree: boolean;
  categoryId: string;
  sortOrder: number;
  isCharacter: boolean;
  translations: Record<string, string>;
}

function FreePaidBadge({ isFree, onToggle }: { isFree: boolean; onToggle?: () => void }) {
  if (onToggle) {
    return (
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(); }}
        title="Tap to switch Free/Paid"
        className={`text-[10px] px-2 py-1 font-semibold tracking-wider rounded-sm border ${
          isFree
            ? "bg-badge-free-bg text-badge-free-text border-transparent"
            : "bg-badge-paid-bg text-badge-paid-text border-transparent"
        }`}
      >
        {isFree ? "Free ⇄" : "Paid ⇄"}
      </button>
    );
  }
  return isFree ? (
    <span className="text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 bg-[#E6F2E6] text-[#2D6A2D] border border-[#BCE0BC] rounded-full">
      Free
    </span>
  ) : (
    <span className="text-[9px] font-bold tracking-wider uppercase px-1.5 py-0.5 bg-[#FBF0DD] text-[#9A6B12] border border-[#EBD3A0] rounded-full">
      Paid
    </span>
  );
}

function ImageSlot({ cardId, variant, label, colorClass, existingUrl }: {
  cardId: string; variant: string; label: string; colorClass: string; existingUrl: string | null;
}) {
  const [preview, setPreview] = useState<string | null>(existingUrl);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setPreview(existingUrl); }, [existingUrl]);

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("variant", variant);
      const res = await fetch(`/api/admin/cards/${cardId}/images`, { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        setPreview(data.url);
      } else {
        const err = await res.json();
        alert(`Upload failed: ${err.error || "Unknown"}`);
      }
    } finally { setUploading(false); }
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <span className={`text-[9px] tracking-wider uppercase font-medium ${colorClass}`}>{label}</span>
      <div onClick={() => inputRef.current?.click()}
        className={`w-full aspect-square border-[1.5px] flex items-center justify-center cursor-pointer overflow-hidden relative bg-bg
          ${preview ? "border-solid border-[#C8C4BC]" : "border-dashed border-border hover:border-accent"}`}>
        {preview ? (
          <img src={preview} className="absolute inset-0 w-full h-full object-contain" alt={`${cardId} ${variant}`} />
        ) : uploading ? (
          <div className="w-4 h-4 border-2 border-border border-t-accent rounded-full animate-spin" />
        ) : (
          <svg className="w-5 h-5 stroke-ink-3 fill-none" viewBox="0 0 24 24" strokeLinecap="round" strokeWidth="1.5">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
          </svg>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden"
        onChange={e => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
    </div>
  );
}

function CardItem({ card, onEdit, onDelete, onToggleAccess }: {
  card: ParsedCard;
  onEdit: (card: ParsedCard) => void;
  onDelete: (cardId: string) => void;
  onToggleAccess: (card: ParsedCard & { isFree: boolean }) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [images, setImages] = useState<Record<string, string>>({});
  const [activeVariant, setActiveVariant] = useState("neutral");

  useEffect(() => {
    fetch(`/api/admin/cards/${card.id}/images`)
      .then(r => r.json())
      .then(data => {
        const map: Record<string, string> = {};
        (data.images || []).forEach((img: { variant: string; url: string }) => { map[img.variant] = img.url; });
        setImages(map);
      }).catch(() => {});
  }, [card.id]);

  const displayUrl = images[activeVariant] || images["neutral"] || null;
  const variantList = card.isCharacter
    ? [{ key: "neutral", color: "bg-accent" }, { key: "boy", color: "bg-[#4A8AC4]" }, { key: "girl", color: "bg-[#C47AAA]" }, { key: "brown", color: "bg-[#A8703C]" }]
    : [{ key: "neutral", color: "bg-accent" }];

  return (
    <div className="bg-card border border-border overflow-hidden hover:shadow-md transition-all">
      <div className="w-full aspect-square bg-bg flex items-center justify-center overflow-hidden relative">
        {displayUrl ? (
          <img src={displayUrl} className="w-full h-full object-contain" alt={card.translations?.en || card.id} />
        ) : (
          <svg className="w-9 h-9 stroke-[#CCC] fill-none" viewBox="0 0 24 24" strokeLinecap="round" strokeWidth="1.4">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        )}
        {/* Variant dots */}
        <div className="absolute bottom-1.5 right-1.5 flex gap-1">
          {variantList.map(v => (
            <button key={v.key} onClick={e => { e.stopPropagation(); if (images[v.key]) setActiveVariant(v.key); }}
              className={`w-3 h-3 rounded-full border border-white/90 ${images[v.key] ? v.color : "bg-[#DDD]"} ${activeVariant === v.key && images[v.key] ? "ring-2 ring-white ring-offset-1" : ""}`}
              title={v.key} />
          ))}
        </div>
        {/* Free/Paid badge overlay */}
        <div className="absolute top-1.5 left-1.5">
          <FreePaidBadge isFree={card.isFree} onToggle={() => onToggleAccess(card)} />
        </div>
      </div>
      <div className="px-3 py-2">
        <p className="text-[13px] text-ink font-medium">{card.translations?.en || card.id}</p>
        <p className="text-[10px] tracking-wider text-ink-3 uppercase">{card.categoryId}</p>
      </div>
      <div className="flex border-t border-border">
        <button onClick={() => setExpanded(!expanded)}
          className="flex-1 py-1.5 text-[11px] text-ink-3 border-r border-border hover:bg-bg hover:text-ink transition-colors">
          {expanded ? "Close" : "Images"}
        </button>
        <button onClick={() => onEdit(card)}
          className="flex-1 py-1.5 text-[11px] text-ink-3 border-r border-border hover:bg-bg hover:text-ink transition-colors">
          Edit
        </button>
        <button onClick={() => { if (confirm(`Delete "${card.translations?.en || card.id}"?`)) onDelete(card.id); }}
          className="flex-1 py-1.5 text-[11px] text-ink-3 hover:bg-[#FAF0F0] hover:text-[#B83232] transition-colors">
          Delete
        </button>
      </div>
      {expanded && (
        <div className="border-t border-border p-3">
          {card.isCharacter ? (
            <div className="grid grid-cols-4 gap-2">
              <ImageSlot cardId={card.id} variant="neutral" label="Neutral" colorClass="text-ink-3" existingUrl={images["neutral"] || null} />
              <ImageSlot cardId={card.id} variant="boy" label="Boy" colorClass="text-[#1A6699]" existingUrl={images["boy"] || null} />
              <ImageSlot cardId={card.id} variant="girl" label="Girl" colorClass="text-[#994466]" existingUrl={images["girl"] || null} />
              <ImageSlot cardId={card.id} variant="brown" label="Brown" colorClass="text-[#8A5A2C]" existingUrl={images["brown"] || null} />
            </div>
          ) : (
            <div className="max-w-[100px]">
              <ImageSlot cardId={card.id} variant="neutral" label="Image" colorClass="text-ink-3" existingUrl={images["neutral"] || null} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function AdminCardsPage() {
  const [cards, setCards] = useState<ParsedCard[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [filterAccess, setFilterAccess] = useState<"all" | "free" | "paid">("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCard, setEditingCard] = useState<ParsedCard | null>(null);

  async function loadCards() {
    try {
      const res = await fetch("/api/admin/cards");
      if (res.ok) {
        const data = await res.json();
        setCards(data.cards || []);
      }
    } catch (err) { console.error("Error loading cards:", err); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    loadCards();
    (async () => {
      try {
        const res = await fetch("/api/admin/categories");
        if (res.ok) { const data = await res.json(); setCategories(data.categories || []); }
      } catch {}
    })();
  }, []);

  const filtered = cards.filter(c => {
    const matchSearch = (c.translations?.en || c.id).toLowerCase().includes(search.toLowerCase());
    const matchCat = selectedCategory === "all" || c.categoryId === selectedCategory;
    const matchAccess = filterAccess === "all" || (filterAccess === "free" ? c.isFree : !c.isFree);
    return matchSearch && matchCat && matchAccess;
  });

  const freeCount = cards.filter(c => c.isFree).length;
  const paidCount = cards.filter(c => !c.isFree).length;

  return (
    <div className="flex flex-col h-screen bg-bg">
      <div className="shrink-0 p-4 border-b border-border bg-white">
        <div className="flex justify-between items-center mb-3">
          <div>
            <h1 className="text-[22px] font-medium text-ink">Cards</h1>
            <p className="text-[11px] text-ink-3 mt-0.5">
              {cards.length} total ·{" "}
              <span className="text-[#2D6A2D]">{freeCount} free</span>{" "}·{" "}
              <span className="text-[#9A6B12]">{paidCount} paid</span>
            </p>
          </div>
          <button onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-[#7A8F5E] text-white text-[13px] font-medium hover:bg-[#6A7F4E] transition-colors">
            + Add Card
          </button>
        </div>

        <div className="flex gap-2 flex-wrap">
          <input type="text" placeholder="Search cards..." value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 min-w-[140px] px-3 py-1.5 text-[13px] border border-border bg-white outline-none focus:border-accent" />
          <select value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 text-[12px] border border-border bg-white outline-none focus:border-accent">
            <option value="all">All Categories</option>
            {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
          </select>
          <div className="flex border border-border">
            {(["all", "free", "paid"] as const).map(v => (
              <button key={v} onClick={() => setFilterAccess(v)}
                className={`px-3 py-1.5 text-[11px] tracking-wider uppercase font-medium transition-colors
                  ${filterAccess === v
                    ? v === "free" ? "bg-[#2D6A2D] text-white" : v === "paid" ? "bg-[#8B5E2A] text-white" : "bg-ink text-white"
                    : "text-ink-3 hover:text-ink"}`}>
                {v}
              </button>
            ))}
          </div>
        </div>
        <p className="text-[11px] text-ink-3 mt-2">{filtered.length} card{filtered.length !== 1 ? "s" : ""} shown</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <div className="w-8 h-8 border-4 border-border border-t-accent rounded-full animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-ink-3">
            <p className="text-[14px]">No cards found</p>
          </div>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-3">
            {filtered.map(card => (
              <CardItem key={card.id} card={card}
                onToggleAccess={async (c) => {
                  const next = !c.isFree;
                  // Optimistic flip, revert on failure
                  setCards((prev: any[]) => prev.map((x) => (x.id === c.id ? { ...x, isFree: next } : x)));
                  const res = await fetch("/api/admin/cards", {
                    method: "PATCH",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ id: c.id, isFree: next }),
                  });
                  if (!res.ok) {
                    setCards((prev: any[]) => prev.map((x) => (x.id === c.id ? { ...x, isFree: !next } : x)));
                  }
                }}
                onEdit={c => setEditingCard(c)}
                onDelete={async id => {
                  try {
                    await fetch(`/api/admin/cards/${id}`, { method: "DELETE" });
                    await loadCards();
                  } catch { alert("Failed to delete card"); }
                }} />
            ))}
          </div>
        )}
      </div>

      {showAddForm && <AddCardForm onClose={() => setShowAddForm(false)} onCardAdded={loadCards} />}
      {editingCard && (
        <EditCardForm card={editingCard} onClose={() => setEditingCard(null)}
          onCardUpdated={() => { setEditingCard(null); loadCards(); }} />
      )}
    </div>
  );
}
