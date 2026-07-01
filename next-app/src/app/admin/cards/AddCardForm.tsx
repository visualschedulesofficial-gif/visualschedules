"use client";

import { useState, useRef, useEffect } from "react";

interface Category { id: string; name: string; }

interface AddCardFormProps {
  onClose: () => void;
  onCardAdded: () => void;
}

export function AddCardForm({ onClose, onCardAdded }: AddCardFormProps) {
  const [nameEn, setNameEn] = useState("");
  const [nameHi, setNameHi] = useState("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [category, setCategory] = useState("");
  const [icon, setIcon] = useState("s-star");
  const [isFree, setIsFree] = useState(false);
  const [isCharacter, setIsCharacter] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [images, setImages] = useState<Record<string, File | null>>({
    neutral: null, boy: null, girl: null, brown: null, single: null,
  });
  const [previews, setPreviews] = useState<Record<string, string>>({
    neutral: "", boy: "", girl: "", brown: "", single: "",
  });
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/categories");
        if (res.ok) {
          const data = await res.json();
          const cats: Category[] = data.categories || [];
          setCategories(cats);
          if (cats.length > 0) setCategory(cats[0].id);
        }
      } catch {}
    })();
  }, []);

  const cardId = nameEn.toLowerCase().trim().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>, variant: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { setError("Please select a valid image file"); return; }
    if (file.size > 5 * 1024 * 1024) { setError("Image must be less than 5MB"); return; }
    const reader = new FileReader();
    reader.onload = (e) => setPreviews(prev => ({ ...prev, [variant]: e.target?.result as string }));
    reader.readAsDataURL(file);
    setImages(prev => ({ ...prev, [variant]: file }));
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!nameEn) { setError("Name is required"); return; }
    if (!category) { setError("Please select a category"); return; }
    if (isCharacter && (!images.neutral || !images.boy || !images.girl || !images.brown)) {
      setError("All 4 character variant images are required"); return;
    }
    if (!isCharacter && !images.single) { setError("Image is required"); return; }
    setLoading(true);
    try {
      const cardRes = await fetch("/api/admin/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: cardId, icon, isFree, categoryId: category, isCharacter,
          translations: { en: nameEn, hi: nameHi || nameEn },
        }),
      });
      if (!cardRes.ok) {
        const data = await cardRes.json();
        setError(data.error || "Failed to create card");
        setLoading(false); return;
      }
      const imagesToUpload = isCharacter
        ? { neutral: images.neutral, boy: images.boy, girl: images.girl, brown: images.brown }
        : { neutral: images.single };
      for (const [variant, file] of Object.entries(imagesToUpload)) {
        if (!file) continue;
        const formData = new FormData();
        formData.append("file", file);
        formData.append("variant", variant);
        const uploadRes = await fetch(`/api/admin/cards/${cardId}/images`, { method: "POST", body: formData });
        if (!uploadRes.ok) {
          const data = await uploadRes.json();
          setError(`Error uploading ${variant}: ${data.error}`);
          setLoading(false); return;
        }
      }
      setSuccess("✅ Card added!");
      setTimeout(() => { onCardAdded(); onClose(); }, 1200);
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally { setLoading(false); }
  };

  const variants = isCharacter
    ? [{ key: "neutral", label: "Child with Glasses" }, { key: "boy", label: "Boy" }, { key: "girl", label: "Girl" }, { key: "brown", label: "Curly Hair" }]
    : [{ key: "single", label: "Image" }];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-5">
            <h2 className="font-serif text-[22px] italic text-[#2C2C2C]">Add New Card</h2>
            <button onClick={onClose} className="text-[#999] hover:text-[#2C2C2C] text-[24px] leading-none">&times;</button>
          </div>

          {error && <div className="mb-4 p-3 bg-[#FEE] border border-[#FCC] text-[#C33] text-[13px]">{error}</div>}
          {success && <div className="mb-4 p-3 bg-[#EFE] border border-[#CFC] text-[#3C3] text-[13px]">{success}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Card ID */}
            <div>
              <label className="text-[10px] tracking-widest uppercase text-[#8A8480] mb-1 block font-medium">Card ID (auto)</label>
              <input type="text" value={cardId} disabled className="w-full px-3 py-2 border border-[#D0D0D0] text-[13px] bg-[#F5F5F5] text-[#999]" />
            </div>

            {/* Names */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] tracking-widest uppercase text-[#8A8480] mb-1 block font-medium">Name (English) *</label>
                <input type="text" value={nameEn} onChange={e => setNameEn(e.target.value)} placeholder="e.g. Wake Up" className="w-full px-3 py-2 border border-[#D0D0D0] text-[13px] outline-none focus:border-[#7A8F5E]" />
              </div>
              <div>
                <label className="text-[10px] tracking-widest uppercase text-[#8A8480] mb-1 block font-medium">Name (Hindi)</label>
                <input type="text" value={nameHi} onChange={e => setNameHi(e.target.value)} placeholder="e.g. उठना" className="w-full px-3 py-2 border border-[#D0D0D0] text-[13px] outline-none focus:border-[#7A8F5E]" />
              </div>
            </div>

            {/* Category + Icon */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] tracking-widest uppercase text-[#8A8480] mb-1 block font-medium">Category *</label>
                <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-3 py-2 border border-[#D0D0D0] text-[13px] outline-none focus:border-[#7A8F5E]">
                  {categories.length === 0
                    ? <option value="">No categories yet</option>
                    : categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)
                  }
                </select>
              </div>
              <div>
                <label className="text-[10px] tracking-widest uppercase text-[#8A8480] mb-1 block font-medium">Icon</label>
                <input type="text" value={icon} onChange={e => setIcon(e.target.value)} placeholder="s-star" className="w-full px-3 py-2 border border-[#D0D0D0] text-[13px] outline-none focus:border-[#7A8F5E]" />
              </div>
            </div>

            {/* FREE / PAID toggle — card-level */}
            <div>
              <label className="text-[10px] tracking-widest uppercase text-[#8A8480] mb-2 block font-medium">Access</label>
              <div className="flex gap-0 border border-[#D0D0D0] w-fit">
                <button
                  type="button"
                  onClick={() => setIsFree(true)}
                  className={`px-5 py-2 text-[11px] tracking-wider uppercase font-medium transition-colors ${isFree ? "bg-[#2D6A2D] text-white" : "text-[#666] hover:text-[#333]"}`}
                >
                  ✓ Free
                </button>
                <button
                  type="button"
                  onClick={() => setIsFree(false)}
                  className={`px-5 py-2 text-[11px] tracking-wider uppercase font-medium transition-colors ${!isFree ? "bg-[#8B5E2A] text-white" : "text-[#666] hover:text-[#333]"}`}
                >
                  ★ Paid
                </button>
              </div>
              <p className="text-[11px] text-[#999] mt-1.5">
                {isFree ? "Visible and usable by all users." : "Visible to all but drag-and-drop requires a subscription."}
              </p>
            </div>

            {/* Card Type */}
            <div>
              <label className="text-[10px] tracking-widest uppercase text-[#8A8480] mb-2 block font-medium">Card Type</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="cardType" checked={isCharacter} onChange={() => setIsCharacter(true)} className="accent-[#7A8F5E]" />
                  <span className="text-[13px]">Character (4 variants)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="cardType" checked={!isCharacter} onChange={() => setIsCharacter(false)} className="accent-[#7A8F5E]" />
                  <span className="text-[13px]">Neutral (1 image)</span>
                </label>
              </div>
            </div>

            {/* Image upload */}
            <div className="border-t border-[#E0E0E0] pt-4">
              <h3 className="text-[13px] font-semibold text-[#2C2C2C] mb-3">
                {isCharacter ? "Upload 4 Character Variants" : "Upload Image"}
              </h3>
              <div className={`grid gap-3 ${isCharacter ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-1 max-w-[160px]"}`}>
                {variants.map(({ key, label }) => (
                  <div key={key} className="border border-dashed border-[#D0D0D0] p-3">
                    <label className="block cursor-pointer">
                      <div className="flex flex-col items-center gap-2">
                        {previews[key] ? (
                          <img src={previews[key]} alt={label} className="w-20 h-20 object-contain border border-[#E0E0E0]" />
                        ) : (
                          <div className="w-20 h-20 bg-[#F5F5F5] border border-[#E0E0E0] flex items-center justify-center">
                            <svg className="w-7 h-7 stroke-[#CCC] fill-none" viewBox="0 0 24 24" strokeLinecap="round">
                              <rect x="3" y="3" width="18" height="18" rx="2" />
                              <circle cx="8.5" cy="8.5" r="1.5" />
                              <path d="M21 15l-5-5L5 21" />
                            </svg>
                          </div>
                        )}
                        <span className="text-[10px] text-[#666] font-medium text-center">{label}</span>
                        <span className="text-[10px] text-[#999]">{images[key] ? "✓ Ready" : "Click to upload"}</span>
                      </div>
                      <input
                        ref={el => { if (el) fileInputRefs.current[key] = el; }}
                        type="file" accept="image/*" onChange={e => handleImageChange(e, key)} className="hidden"
                      />
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-2 pt-2">
              <button type="button" onClick={onClose} className="flex-1 px-4 py-2.5 border border-[#D0D0D0] text-[13px] text-[#2C2C2C] hover:bg-[#F5F5F5]">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="flex-1 px-4 py-2.5 bg-[#7A8F5E] text-white text-[13px] font-medium hover:bg-[#6A7F4E] disabled:opacity-50">
                {loading ? "Adding..." : `Add ${isFree ? "Free" : "Paid"} Card`}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
