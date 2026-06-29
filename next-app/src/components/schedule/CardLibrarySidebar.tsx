"use client";

import { useState, useMemo, useEffect } from "react";
import { useScheduleState } from "@/hooks/useScheduleState";
import { ALL_CARDS, getCardLabel, isCharacterCard, type ParsedCard } from "@/lib/card-data";
import { LANGUAGES, type Language, type Gender } from "@/lib/constants";

const NON_CHARACTER_CATEGORIES = ["food", "routines", "activities", "rewards", "snacks", "meals", "place"];
const PAID_CATEGORIES = ["social", "art"];

const CATEGORY_NAMES: Record<string, string> = {
  characters: "Characters",
  food: "Food",
  routines: "Routines",
  activities: "Activities",
  rewards: "Rewards",
  snacks: "Snacks",
  meals: "Meals",
  place: "Place",
  social: "Social",
  art: "Art",
  home: "Home",
  school: "School",
  therapy: "Therapy",
  all: "All (No Character)",
};

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

  const handleCategoryChange = (catId: string | null) => {
    setSelectedCategory(catId);
    setSearch(""); // Clear search when category is selected
    
    // If selecting non-character category, set gender to "all"
    if (catId && !isCharacterCategory(catId) && (gender as string) !== "all") {
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

  // Get unique categories from filtered cards
  const displayCategories = useMemo(() => {
    const cats = new Set<string>();
    filteredCards.forEach((card) => cats.add(card.categoryId));
    return Array.from(cats).sort();
  }, [filteredCards]);

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-white border-r border-[#E0E0E0] items-center justify-center">
        <div className="w-5 h-5 border-2 border-border border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white border-r border-[#E0E0E0]">
      {/* Language Dropdown */}
      <div className="p-3 border-b border-[#E0E0E0] shrink-0">
        <label className="block text-[10px] font-semibold text-[#999] uppercase tracking-wide mb-1">Language</label>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as Language)}
          className="w-full px-2 py-2 text-[12px] border border-[#D0D0D0] rounded bg-white text-[#2C2C2C] hover:border-[#999] focus:outline-none focus:ring-2 focus:ring-[#7A8F5E] font-sans"
        >
          {Object.entries(LANGUAGES).map(([code, name]) => (
            <option key={code} value={code}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {/* Character Selector */}
      <div className="p-3 border-b border-[#E0E0E0] shrink-0">
        <label className="block text-[10px] font-semibold text-[#999] uppercase tracking-wide mb-1">Character</label>
        <select
          value={gender}
          onChange={(e) => setGender(e.target.value as Gender)}
          className="w-full px-2 py-2 text-[12px] border border-[#D0D0D0] rounded bg-white text-[#2C2C2C] hover:border-[#999] focus:outline-none focus:ring-2 focus:ring-[#7A8F5E] font-sans"
        >
          {genderOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Merged Search & Category Dropdown */}
      <div className="p-3 border-b border-[#E0E0E0] shrink-0 space-y-2">
        <input
          type="text"
          placeholder="Search or select category..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            if (e.target.value) setSelectedCategory(null); // Clear category filter when searching
          }}
          className="w-full px-3 py-2 text-[12px] border border-[#D0D0D0] rounded bg-white text-[#2C2C2C] placeholder-[#999] focus:outline-none focus:ring-2 focus:ring-[#7A8F5E] font-sans"
        />
        
        <select
          value={selectedCategory || ""}
          onChange={(e) => handleCategoryChange(e.target.value || null)}
          className="w-full px-3 py-2 text-[12px] border border-[#D0D0D0] rounded bg-white text-[#2C2C2C] hover:border-[#999] focus:outline-none focus:ring-2 focus:ring-[#7A8F5E] font-sans"
        >
          <option value="">All Categories</option>
          {categories.map((catId) => (
            <option key={catId} value={catId}>
              {CATEGORY_NAMES[catId] || catId}
            </option>
          ))}
        </select>
      </div>

      {/* Cards Grid - 2 Columns (All Expanded) */}
      <div className="flex-1 overflow-y-auto">
        {displayCategories.map((catId) => {
          const cardsInCategory = filteredCards.filter((card) => card.categoryId === catId);
          if (cardsInCategory.length === 0) return null;

          const isPaid = isPaidCategory(catId);
          const displayName = CATEGORY_NAMES[catId] || catId;

          return (
            <div key={catId} className="border-b border-[#F0F0F0]">
              {/* Category Header */}
              <div className="px-3 py-2 bg-[#F8F8F8] flex items-center justify-between border-b border-[#E0E0E0]">
                <div className="flex items-center gap-2">
                  <span className="text-[12px] font-semibold text-[#666]">{displayName}</span>
                  <span className="text-[10px] text-[#999]">({cardsInCategory.length})</span>
                </div>
                <div className="flex gap-1">
                  {!isPaid && <span className="text-[9px] font-bold px-2 py-0.5 bg-[#EAF5EA] text-[#2D6A2D] rounded">FREE</span>}
                  {isPaid && <span className="text-[9px] font-bold px-2 py-0.5 bg-[#FFF5EA] text-[#8B5E2A] rounded">PAID</span>}
                </div>
              </div>

              {/* Cards Grid - 2 Columns */}
              <div className="p-2 grid grid-cols-2 gap-2">
                {cardsInCategory.map((card) => {
                  // Use current gender for character cards, neutral for others
                  const cardGender = isCharacterCard(card) ? gender : "neutral";
                  const imageUrl = cardImages[card.id]?.[cardGender];
                  
                  return (
                    <button
                      key={card.id}
                      onClick={() => handleAddCard(card.id, catId)}
                      className="flex flex-col items-center gap-1 p-2 rounded hover:bg-[#E8F0E3] transition-colors group cursor-pointer"
                      title={isCharacterCard(card) ? `Character card - ${cardGender} variant` : "Neutral card - single image"}
                    >
                      {/* Card Image */}
                      <div className="w-full aspect-square bg-[#F5F5F5] rounded border border-[#E0E0E0] flex items-center justify-center overflow-hidden group-hover:border-[#7A8F5E]">
                        {imageUrl ? (
                          <img src={imageUrl} alt={getCardLabel(card, language)} className="w-full h-full object-contain p-1" />
                        ) : (
                          <svg className="w-8 h-8 stroke-[#CCC] fill-none" viewBox="0 0 24 24" strokeLinecap="round">
                            <rect x="3" y="3" width="18" height="18" rx="2" />
                            <circle cx="8.5" cy="8.5" r="1.5" />
                            <path d="M21 15l-5-5L5 21" />
                          </svg>
                        )}
                      </div>

                      {/* Card Label */}
                      <span className="text-[11px] font-medium text-[#2C2C2C] text-center line-clamp-2">
                        {getCardLabel(card, language)}
                      </span>
                    </button>
                  );
                })}
              </div>
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
          className="w-full block text-center px-3 py-2.5 bg-[#7A8F5E] text-white text-[11px] font-semibold rounded hover:bg-[#6A7F4E] transition-colors uppercase tracking-wide"
        >
          🔓 Unlock All Cards
        </a>
        <p className="text-[9px] text-[#999] text-center mt-1.5">
          Get 100+ cards access
        </p>
      </div>
    </div>
  );
}
