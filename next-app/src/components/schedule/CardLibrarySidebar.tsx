"use client";

import { useState, useMemo, useEffect } from "react";
import { useScheduleState } from "@/hooks/useScheduleState";
import { ALL_CARDS, getCardLabel, isCharacterCard, type ParsedCard } from "@/lib/card-data";
import type { Gender } from "@/lib/constants";

const NON_CHARACTER_CATEGORIES = ["food", "routines", "activities", "rewards", "snacks", "meals"];

const CATEGORY_NAMES: Record<string, string> = {
  characters: "Characters",
  food: "Food",
  routines: "Routines",
  activities: "Activities",
  rewards: "Rewards",
  snacks: "Snacks",
  meals: "Meals",
};

export function CardLibrarySidebar() {
  const gender = useScheduleState((s) => s.gender);
  const setGender = useScheduleState((s) => s.setGender);
  const language = useScheduleState((s) => s.language);
  const placeCard = useScheduleState((s) => s.placeCard);
  const pages = useScheduleState((s) => s.pages);

  const [cards, setCards] = useState<ParsedCard[]>(ALL_CARDS);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/cards");
        if (res.ok) {
          const data = await res.json();
          setCards(data.cards || ALL_CARDS);
        } else {
          setCards(ALL_CARDS);
        }
      } catch {
        setCards(ALL_CARDS);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const categories = useMemo(() => {
    const uniqueCategories = new Set<string>();
    cards.forEach((card) => {
      uniqueCategories.add(card.categoryId);
    });
    return Array.from(uniqueCategories).map((catId) => [
      catId,
      CATEGORY_NAMES[catId] || catId,
    ]);
  }, [cards]);

  const isCharacterCategory = (catId: string) => !NON_CHARACTER_CATEGORIES.includes(catId);

  const handleCategorySelect = (catId: string) => {
    const isCharacter = isCharacterCategory(catId);
    if (!isCharacter && (gender as string) !== "all") {
      setGender("all" as Gender);
    }
  };

  const genderOptions: Array<{ value: Gender; label: string }> = [
    { value: "neutral", label: "Child with Glasses" },
    { value: "boy", label: "Boy" },
    { value: "girl", label: "Girl" },
    { value: "brown", label: "Child with Curly Hair" },
    { value: "all", label: "All Variants" },
  ];

  const handleAddCard = (cardId: string, catId: string) => {
    if (pages.length === 0) return;
    const currentPageIdx = 0;
    const currentPage = pages[currentPageIdx];

    if ("slots" in currentPage) {
      const firstEmptySlot = currentPage.slots.findIndex((slot) => slot === null);
      if (firstEmptySlot !== -1) {
        placeCard(currentPageIdx, String(firstEmptySlot), { cardId, catId });
      }
    } else if ("columns" in currentPage) {
      placeCard(currentPageIdx, "0", { cardId, catId });
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-white border-l border-[#E0E0E0] items-center justify-center">
        <div className="w-5 h-5 border-2 border-border border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white border-l border-[#E0E0E0]">
      <div className="p-4 border-b border-[#E0E0E0] shrink-0">
        <h3 className="font-sans text-[14px] font-semibold text-[#2C2C2C] mb-3">Character</h3>
        <select
          value={gender}
          onChange={(e) => setGender(e.target.value as Gender)}
          className="w-full px-2 py-2 text-[14px] border border-[#D0D0D0] rounded bg-white text-[#2C2C2C] hover:border-[#999] focus:outline-none focus:ring-2 focus:ring-[#7A8F5E] font-sans"
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
              {cards
                .filter((card) => card.categoryId === catId)
                .slice(0, 6)
                .map((card) => (
                  <button
                    key={card.id}
                    onClick={() => handleAddCard(card.id, catId)}
                    className="w-full text-left px-3 py-2 text-[14px] text-[#2C2C2C] rounded hover:bg-[#E8F0E3] transition-colors font-sans"
                    title={isCharacterCard(card) ? "Character card - gender variants" : "Neutral card - single image"}
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
