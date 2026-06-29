"use client";

import { useState } from "react";

interface AddCardFormProps {
  onClose: () => void;
  onCardAdded: () => void;
}

export function AddCardForm({ onClose, onCardAdded }: AddCardFormProps) {
  const [cardId, setCardId] = useState("");
  const [nameEn, setNameEn] = useState("");
  const [nameHi, setNameHi] = useState("");
  const [category, setCategory] = useState("characters");
  const [icon, setIcon] = useState("star");
  const [isCharacter, setIsCharacter] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!cardId || !nameEn) {
      setError("Card ID and Name are required");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/admin/cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: cardId.toLowerCase().replace(/\s+/g, "-"),
          icon,
          categoryId: category,
          isCharacter,
          translations: {
            en: nameEn,
            hi: nameHi || nameEn,
          },
        }),
      });

      if (res.ok) {
        setSuccess("✅ Card added successfully!");
        setTimeout(() => {
          onCardAdded();
          onClose();
        }, 1000);
      } else {
        const data = await res.json();
        setError(data.error || "Failed to add card");
      }
    } catch (err) {
      setError(`Error: ${err instanceof Error ? err.message : "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg w-full max-w-md mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[20px] font-semibold text-[#2C2C2C]">Add New Card</h2>
            <button onClick={onClose} className="text-[#999] hover:text-[#2C2C2C] text-[24px] leading-none">×</button>
          </div>

          {error && <div className="mb-4 p-3 bg-[#FEE] border border-[#FCC] rounded text-[#C33] text-[14px]">{error}</div>}
          {success && <div className="mb-4 p-3 bg-[#EFE] border border-[#CFC] rounded text-[#3C3] text-[14px]">{success}</div>}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[12px] font-semibold text-[#666] uppercase tracking-wide mb-1">Card ID</label>
              <input type="text" value={cardId} onChange={(e) => setCardId(e.target.value)} placeholder="e.g. wake-up" className="w-full px-3 py-2 border border-[#D0D0D0] rounded text-[14px] outline-none focus:border-[#7A8F5E] focus:ring-2 focus:ring-[#7A8F5E]/30" />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#666] uppercase tracking-wide mb-1">Name (English)</label>
              <input type="text" value={nameEn} onChange={(e) => setNameEn(e.target.value)} placeholder="e.g. Wake Up" className="w-full px-3 py-2 border border-[#D0D0D0] rounded text-[14px] outline-none focus:border-[#7A8F5E] focus:ring-2 focus:ring-[#7A8F5E]/30" />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#666] uppercase tracking-wide mb-1">Name (Hindi)</label>
              <input type="text" value={nameHi} onChange={(e) => setNameHi(e.target.value)} placeholder="e.g. जागो" className="w-full px-3 py-2 border border-[#D0D0D0] rounded text-[14px] outline-none focus:border-[#7A8F5E] focus:ring-2 focus:ring-[#7A8F5E]/30" />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#666] uppercase tracking-wide mb-1">Category</label>
              <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full px-3 py-2 border border-[#D0D0D0] rounded text-[14px] outline-none focus:border-[#7A8F5E] focus:ring-2 focus:ring-[#7A8F5E]/30">
                <option value="characters">Characters</option>
                <option value="food">Food</option>
                <option value="routines">Routines</option>
                <option value="activities">Activities</option>
                <option value="rewards">Rewards</option>
                <option value="snacks">Snacks</option>
                <option value="meals">Meals</option>
                <option value="all">All Categories</option>
              </select>
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#666] uppercase tracking-wide mb-1">Icon</label>
              <input type="text" value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="e.g. star" className="w-full px-3 py-2 border border-[#D0D0D0] rounded text-[14px] outline-none focus:border-[#7A8F5E] focus:ring-2 focus:ring-[#7A8F5E]/30" />
            </div>

            <div>
              <label className="block text-[12px] font-semibold text-[#666] uppercase tracking-wide mb-2">Card Type</label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="cardType" checked={isCharacter} onChange={() => setIsCharacter(true)} className="w-4 h-4 accent-[#7A8F5E]" />
                  <span className="text-[14px] text-[#2C2C2C]">Character (4 variants)</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="cardType" checked={!isCharacter} onChange={() => setIsCharacter(false)} className="w-4 h-4 accent-[#7A8F5E]" />
                  <span className="text-[14px] text-[#2C2C2C]">Neutral (1 image)</span>
                </label>
              </div>
            </div>

            <div className="p-3 bg-[#F5F5F5] rounded border border-[#E0E0E0]">
              <p className="text-[12px] text-[#666]">{isCharacter ? "✅ Character card: Upload 4 images (neutral, boy, girl, brown)" : "✅ Neutral card: Upload 1 image"}</p>
            </div>

            <div className="flex gap-2 pt-4">
              <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-[#D0D0D0] rounded text-[14px] text-[#2C2C2C] font-medium hover:bg-[#F5F5F5] transition-colors">Cancel</button>
              <button type="submit" disabled={loading} className="flex-1 px-4 py-2 bg-[#7A8F5E] text-white rounded text-[14px] font-medium hover:bg-[#6A7F4E] disabled:opacity-50 transition-colors">{loading ? "Adding..." : "Add Card"}</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
