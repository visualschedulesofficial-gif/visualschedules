"use client";

import { useState, useRef, useEffect } from "react";
import { ALL_CARDS, CATEGORIES, getCardLabel, type ParsedCard } from "@/lib/card-data";

function ImageSlot({ cardId, variant, label, colorClass, existingUrl }: { cardId: string; variant: string; label: string; colorClass: string; existingUrl: string | null }) {
  const [preview, setPreview] = useState<string | null>(existingUrl);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setPreview(existingUrl);
  }, [existingUrl]);

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
        alert(`Upload failed: ${err.error || "Unknown error"}`);
      }
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col items-center gap-1">
      <span className={`text-[10px] tracking-wider uppercase font-medium ${colorClass}`}>{label}</span>
      <div
        onClick={() => inputRef.current?.click()}
        className={`w-full aspect-square border-[1.5px] flex items-center justify-center cursor-pointer transition-colors overflow-hidden relative bg-bg
          ${preview ? "border-solid border-[#C8C4BC]" : "border-dashed"}
          ${!preview && (variant === "boy" ? "border-[#B8DCF0] hover:border-[#1A6699]" : variant === "girl" ? "border-[#F0C8DC] hover:border-[#994466]" : variant === "brown" ? "border-[#E0C8A8] hover:border-[#8A5A2C]" : "border-border hover:border-accent")}
        `}
      >
        {preview ? (
          <img src={preview} className="absolute inset-0 w-full h-full object-contain" alt={`${cardId} ${variant}`} />
        ) : uploading ? (
          <div className="w-4 h-4 border-2 border-border border-t-accent rounded-full animate-spin" />
        ) : (
          <div className="flex flex-col items-center gap-1">
            <svg className="w-5 h-5 stroke-ink-3 stroke-[1.5] fill-none" viewBox="0 0 24 24" strokeLinecap="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12" />
            </svg>
            <span className="text-[10px] text-ink-3">Upload</span>
          </div>
        )}
      </div>
      <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleUpload(f); }} />
    </div>
  );
}

function CardItem({ card }: { card: ParsedCard }) {
  const [expanded, setExpanded] = useState(false);
  const [images, setImages] = useState<Record<string, string>>({});
  const [loadedImages, setLoadedImages] = useState(false);
  const [activeVariant, setActiveVariant] = useState("neutral");

  useEffect(() => {
    if (expanded && !loadedImages) {
      fetch(`/api/admin/cards/${card.id}/images`)
        .then((r) => r.json())
        .then((data) => {
          const map: Record<string, string> = {};
          (data.images || []).forEach((img: { variant: string; url: string }) => {
            map[img.variant] = img.url;
          });
          setImages(map);
          setLoadedImages(true);
        })
        .catch(() => setLoadedImages(true));
    }
  }, [expanded, loadedImages, card.id]);

  // Also load images on mount for the thumbnail
  useEffect(() => {
    fetch(`/api/admin/cards/${card.id}/images`)
      .then((r) => r.json())
      .then((data) => {
        const map: Record<string, string> = {};
        (data.images || []).forEach((img: { variant: string; url: string }) => {
          map[img.variant] = img.url;
        });
        if (Object.keys(map).length > 0) {
          setImages(map);
          setLoadedImages(true);
        }
      })
      .catch(() => {});
  }, [card.id]);

  const displayUrl = images[activeVariant] || images["neutral"] || null;

  return (
    <div className="bg-card border border-border overflow-hidden transition-[box-shadow,border-color] hover:shadow-md hover:border-[#C8C4BC]">
      <div className="w-full aspect-square bg-bg flex items-center justify-center overflow-hidden relative">
        {displayUrl ? (
          <img src={displayUrl} className="w-full h-full object-contain" alt={getCardLabel(card, "en")} />
        ) : (
          <svg className="w-9 h-9 stroke-[#CCC] stroke-[1.4] fill-none" viewBox="0 0 24 24" strokeLinecap="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        )}
        <div className="absolute bottom-1.5 right-1.5 flex gap-1">
          {([
            { key: "neutral", color: "bg-accent", activeRing: "ring-accent" },
            { key: "boy", color: "bg-[#4A8AC4]", activeRing: "ring-[#4A8AC4]" },
            { key: "girl", color: "bg-[#C47AAA]", activeRing: "ring-[#C47AAA]" },
            { key: "brown", color: "bg-[#A8703C]", activeRing: "ring-[#A8703C]" },
          ] as const).map((v) => (
            <button
              key={v.key}
              onClick={(e) => { e.stopPropagation(); if (images[v.key]) setActiveVariant(v.key); }}
              className={`w-3 h-3 rounded-full border border-white/90 transition-all cursor-pointer
                ${images[v.key] ? v.color : "bg-[#DDD]"}
                ${activeVariant === v.key && images[v.key] ? `ring-2 ${v.activeRing} ring-offset-1` : ""}
              `}
              title={`${v.key}${images[v.key] ? "" : " (no image)"}`}
            />
          ))}
        </div>
      </div>
      <div className="px-3 py-2">
        <p className="text-[13px] text-ink">{getCardLabel(card, "en")}</p>
        <p className="text-[11px] tracking-wider text-ink-3 uppercase">{card.categoryId}</p>
      </div>
      <div className="flex border-t border-border">
        <button onClick={() => setExpanded(!expanded)} className="flex-1 py-1.5 text-[11px] text-ink-3 border-r border-border hover:bg-bg hover:text-ink transition-colors">
          {expanded ? "Close" : "Images"}
        </button>
        <button className="flex-1 py-1.5 text-[11px] text-ink-3 hover:bg-bg hover:text-ink transition-colors">Edit</button>
        <button className="flex-1 py-1.5 text-[11px] text-ink-3 hover:bg-[#FAF0F0] hover:text-[#B83232] transition-colors">Delete</button>
      </div>
      {expanded && (
        <div className="border-t border-border p-3 grid grid-cols-4 gap-2">
          <ImageSlot cardId={card.id} variant="neutral" label="Neutral" colorClass="text-ink-3" existingUrl={images["neutral"] || null} />
          <ImageSlot cardId={card.id} variant="boy" label="Boy" colorClass="text-[#1A6699]" existingUrl={images["boy"] || null} />
          <ImageSlot cardId={card.id} variant="girl" label="Girl" colorClass="text-[#994466]" existingUrl={images["girl"] || null} />
          <ImageSlot cardId={card.id} variant="brown" label="Brown" colorClass="text-[#8A5A2C]" existingUrl={images["brown"] || null} />
        </div>
      )}
    </div>
  );
}

export default function AdminCardsPage() {
  const [selectedCat, setSelectedCat] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = ALL_CARDS.filter((card) => {
    const matchCat = selectedCat === "all" || card.categoryId === selectedCat;
    const matchSearch = getCardLabel(card, "en").toLowerCase().includes(search.toLowerCase()) || card.id.includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <>
      <div className="h-[52px] bg-card border-b border-border flex items-center justify-between px-6 shrink-0">
        <span className="text-sm text-ink">Schedule Cards</span>
        <button className="text-[11px] tracking-wider uppercase px-3 py-1.5 bg-accent text-white border border-accent font-sans font-medium hover:bg-accent-hover flex items-center gap-1.5">
          <svg className="w-[11px] h-[11px] stroke-current stroke-2 fill-none" viewBox="0 0 24 24"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          Add Card
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-6">
        {/* Toolbar */}
        <div className="flex items-center gap-3 mb-5 flex-wrap">
          <div className="flex border border-border overflow-x-auto">
            <button onClick={() => setSelectedCat("all")} className={`px-3 py-1.5 text-[11px] tracking-wider uppercase border-r border-border transition-colors whitespace-nowrap ${selectedCat === "all" ? "bg-ink text-white" : "text-ink-3 hover:bg-bg"}`}>All</button>
            {CATEGORIES.map((cat) => (
              <button key={cat.id} onClick={() => setSelectedCat(cat.id)} className={`px-3 py-1.5 text-[11px] tracking-wider uppercase border-r border-border last:border-r-0 transition-colors whitespace-nowrap ${selectedCat === cat.id ? "bg-ink text-white" : "text-ink-3 hover:bg-bg"}`}>
                {cat.name}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search cards…"
            className="flex-1 min-w-[160px] py-1.5 px-2.5 border border-border bg-white font-sans text-xs text-ink outline-none focus:border-accent"
          />
        </div>

        {/* Card grid */}
        <div className="grid grid-cols-[repeat(auto-fill,minmax(180px,1fr))] gap-4">
          {filtered.map((card) => (
            <CardItem key={card.id} card={card} />
          ))}
        </div>
      </div>
    </>
  );
}
