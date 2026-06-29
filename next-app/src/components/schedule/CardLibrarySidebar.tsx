"use client";

import { useMemo } from "react";
import { useScheduleState } from "@/hooks/useScheduleState";
import { ALL_CARDS, getCardLabel } from "@/lib/card-data";
import type { Gender } from "@/types/schedule";

const NON_CHARACTER_CATEGORIES = ["food", "routines", "activities", "rewards", "snacks", "meals"];

export function CardLibrarySidebar() {
  const gender = useScheduleState((s) => s.gender);
  const setGender = useScheduleState((s) => s.setGender);
  const language = useScheduleState((s) => s.language);
  const addCardToSchedule = useScheduleState((s) => s.addCard);

  const categories = useMemo(() => {
    const catMap = new Map<string, string>();
    ALL_CARDS.forEach((card) => {
      if (!catMap.has(card.categoryId)) {
        catMap.set(card.categoryId, card.category);
      }
    });
    return Array.from(catMap.entries());
  }, []);

  const filteredCards = useMemo(() => {
    return ALL_CARDS.filter((card) => {
      if (gender === "all") {
        return true;
      }
      return card.images?.[gender] || card.images?.neutral;
    });
  }, [gender]);

  const isCharacterCategory = (catId: string) => !NON_CHARACTER_CATEGORIES.includes(catId);

  const handleCategorySelect = (catId: string) => {
    const isCharacter = isCharacterCategory(catId);
    if (!isCharacter && (gender as string) !== "all") {
      setGender("all" as Gender);
    }
  };

  const genderOptions = [
    { value: "neutral" as Gender, label: "Child with Glasses" },
    { value: "boy" as Gender, label: "Boy" },
    { value: "girl" as Gender, label: "Girl" },
    { value: "brown" as Gender, label: "Child with Curly Hair" },
    { value: "all" as Gender, label: "All" },
  ];

  return (
    <div className="flex flex-col h-full bg-white border-l border-[#E0E0E0]">
      <div className="p-4 border-b border-[#E0E0E0] shrink-0">
        <h3 className="font-sans text-[14px] font-semibold text-[#2C2C2C] mb-3">Character</h3>
        <select
          value={gender}
          onChange={(e) => setGender(e.target.value as Gender)}
          disabled={categories.some((cat) => !isCharacterCategory(cat[0]))}
          className="w-full px-2 py-2 text-[14px] border border-[#D0D0D0] rounded bg-white text-[#2C2C2C] hover:border-[#999] focus:outline-none focus:ring-2 focus:ring-[#7A8F5E] disabled:opacity-50 disabled:cursor-not-allowed font-sans"
        >
          {genderOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      <div className="flex-1 overflow-y-auto">
        {categories.map(([catId, catName]) => (
          <div key={catId} className="border-b border-[#F0F0F0]">
            <button
              onClick={() => handleCategorySelect(catId)}
              className="w-full text-left px-4 py-2.5 bg-[#F8F8F8] hover:bg-[#F0F0F0] text-[13px] font-medium text-[#666] tracking-wide transition-colors"
            >
              {catName}
            </button>
            <div className="px-2 py-2 space-y-1">
              {filteredCards
                .filter((card) => card.categoryId === catId)
                .slice(0, 6)
                .map((card) => (
                  <button
                    key={card.id}
                    onClick={() => addCardToSchedule(card.id, catId)}
                    className="w-full text-left px-3 py-2 text-[14px] text-[#2C2C2C] rounded hover:bg-[#E8F0E3] transition-colors font-sans"
                  >
                    {getCardLabel(card, language)}
                  </button>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
