"use client";

import { useState, useMemo, useEffect } from "react";
import { useScheduleState } from "@/hooks/useScheduleState";
import { ALL_CARDS, getCardLabel, isCharacterCard, getCardImageUrl, type ParsedCard } from "@/lib/card-data";
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

const PAID_CATEGORIES = ["social", "art"];

export function CardLibrarySidebar() {
  const gender = useScheduleState((s) => s.gender);
  const setGender = useScheduleState((s) => s.setGender);
  const language = useScheduleState((s) => s.language);
  const setLanguage = useScheduleState((s) => s.setLanguage);
  const placeCard = useScheduleState((s) => s.placeCard);
  const pages = useScheduleState((s) => s.pages);

  const [cards, setCards] = useState<ParsedCard[]>(ALL_CARDS);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [cardImages, setCardImages] = useState<Record<string, Record<string, string>>>({});

  // Fetch cards from API
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

  // Fetch card images
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/cards/images");
        if (res.ok) {
          const data = await res.json();
          setCardImages(data.images || {});
        }
      } catch {}
    })();
  }, [cards]);

  const categories = useMemo(() => {
    const uniqueCategories = new Set<string>();
    cards.forEach((card) => {
      uniqueCategories.add(card.categoryId);
    });
    return Array.from(uniqueCategories).sort();
  }, [cards]);

  const isCharacterCategory = (catId: string) => !NON_CHARACTER_CATEGORIES.includes(catId);
  const isPaidCategory = (catId: string) => PAID_CATEGORIES.includes(catId);

  const handleCategorySelect = (catId: string) => {
    setSelectedCategory(selectedCategory === catId ? null : catId);
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

  // Filter cards based on search and selected category
  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      const matchesSearch = getCardLabel(card, language).toLowerCase().includes(search.toLowerCase());
      const matchesCategory = !selectedCategory || card.categoryId === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [cards, search, selectedCategory, language]);

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-white border-r border-[#E0E0E0] items-center justify-center">
        <div className="w-5 h-5 border-2 border-border border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white border-r border-[#E0E0E0]">
      {/* Language Selector */}
      <div className="p-3 border-b border-[#E0E0E0] shrink-0">
        <div className="flex gap-2">
          <button
            onClick={() => setLanguage("en")}
            className={`flex-1 px-3 py-1.5 text-[12px] font-medium rounded uppercase tracking-wide transition-colors ${
              language === "en"
                ? "bg-[#2C2C2C] text-white"
                : "bg-[#E8E8E8] text-[#666] hover:bg-[#D0D0D0]"
            }`}
          >
            English
          </button>
          <button
            onClick={() => setLanguage("hi")}
            className={`flex-1 px-3 py-1.5 text-[12px] font-medium rounded uppercase tracking-wide transition-colors ${
              language === "hi"
                ? "bg-[#2C2C2C] text-white"
                : "bg-[#E8E8E8] text-[#666] hover:bg-[#D0D0D0]"
            }`}
          >
            हिंदी
          </button>
        </div>
      </div>

      {/* Character Selector */}
      <div className="p-3 border-b border-[#E0E0E0] shrink-0">
        <label className="block text-[11px] font-semibold text-[#666] uppercase tracking-wide mb-2">Character</label>
        <select
          value={gender}
          onChange={(e) => setGender(e.target.value as Gender)}
          className="w-full px-2 py-2 text-[13px] border border-[#D0D0D0] rounded bg-white text-[#2C2C2C] hover:border-[#999] focus:outline-none focus:ring-2 focus:ring-[#7A8F5E] font-sans"
        >
          {genderOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Search Box */}
      <div className="p-3 border-b border-[#E0E0E0] shrink-0">
        <input
          type="text"
          placeholder="Search cards..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 text-[13px] border border-[#D0D0D0] rounded bg-white text-[#2C2C2C] placeholder-[#999] focus:outline-none focus:ring-2 focus:ring-[#7A8F5E] font-sans"
        />
      </div>

      {/* Cards List */}
      <div className="flex-1 overflow-y-auto">
        {categories.map((catId) => {
          const cardsInCategory = filteredCards.filter((card) => card.categoryId === catId);
          if (cardsInCategory.length === 0) return null;

          const isPaid = isPaidCategory(catId);
          const displayName = CATEGORY_NAMES[catId] || catId;

          return (
            <div key={catId} className="border-b border-[#F0F0F0]">
              {/* Category Header */}
              <button
                onClick={() => handleCategorySelect(catId)}
                className="w-full text-left px-3 py-2.5 bg-[#F8F8F8] hover:bg-[#F0F0F0] text-[12px] font-semibold text-[#666] tracking-wide transition-colors flex items-center justify-between"
              >
                <span>{displayName}</span>
                {isPaid && (
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-[#FFF5EA] text-[#8B5E2A] rounded">
                    PAID
                  </span>
                )}
              </button>

              {/* Cards in Category */}
              {selectedCategory === catId && (
                <div className="px-2 py-2 space-y-1">
                  {cardsInCategory.map((card) => {
                    const imageUrl = cardImages[card.id]?.[isCharacterCard(card) ? gender : "neutral"];
                    return (
                      <button
                        key={card.id}
                        onClick={() => handleAddCard(card.id, catId)}
                        className="w-full text-left px-2 py-1.5 text-[12px] text-[#2C2C2C] rounded hover:bg-[#E8F0E3] transition-colors font-sans flex items-center gap-2"
                        title={isCharacterCard(card) ? "Character card - gender variants" : "Neutral card - single image"}
                      >
                        {/* Card Image Thumbnail */}
                        {imageUrl ? (
                          <img src={imageUrl} alt={getCardLabel(card, language)} className="w-6 h-6 object-contain flex-shrink-0" />
                        ) : (
                          <div className="w-6 h-6 bg-[#E8E8E8] rounded flex items-center justify-center flex-shrink-0">
                            <svg className="w-3 h-3 stroke-[#999] fill-none" viewBox="0 0 24 24" strokeLinecap="round">
                              <rect x="3" y="3" width="18" height="18" rx="2" />
                              <circle cx="8.5" cy="8.5" r="1.5" />
                              <path d="M21 15l-5-5L5 21" />
                            </svg>
                          </div>
                        )}
                        <span className="flex-1 truncate">{getCardLabel(card, language)}</span>
                        {!isPaid && <span className="text-[10px] font-bold px-1.5 py-0.5 bg-[#EAF5EA] text-[#2D6A2D] rounded">FREE</span>}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Gumroad Unlock Link */}
      <div className="shrink-0 p-3 border-t border-[#E0E0E0] bg-[#F8F8F8]">
        <a
          href="https://gumroad.com/growgently_co"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full block text-center px-3 py-2.5 bg-[#7A8F5E] text-white text-[12px] font-semibold rounded hover:bg-[#6A7F4E] transition-colors uppercase tracking-wide"
        >
          🔓 Unlock All Cards
        </a>
        <p className="text-[10px] text-[#999] text-center mt-2">
          Get access to 100+ cards for schedules, routines & more
        </p>
      </div>
    </div>
  );
}
