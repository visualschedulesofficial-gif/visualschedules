"use client";

import { useState, useMemo, useEffect } from "react";
import { useScheduleState } from "@/hooks/useScheduleState";
import { ALL_CARDS, getCardLabel, isCharacterCard, type ParsedCard } from "@/lib/card-data";
import { LANGUAGES, type Language, type Gender } from "@/lib/constants";

const NON_CHARACTER_CATEGORIES = ["food", "routines", "activities", "rewards", "snacks", "meals"];
const PAID_CATEGORIES = ["social", "art"];

const CATEGORY_NAMES: Record<string, string> = {
  characters: "Characters",
  food: "Food",
  routines: "Routines",
  activities: "Activities",
  rewards: "Rewards",
  snacks: "Snacks",
  meals: "Meals",
  social: "Social",
  art: "Art",
  home: "Home",
  school: "School",
  therapy: "Therapy",
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
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(["characters"]));
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

  const toggleCategory = (catId: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(catId)) {
      newExpanded.delete(catId);
    } else {
      newExpanded.add(catId);
    }
    setExpandedCategories(newExpanded);
  };

  const handleCategoryFilterChange = (catId: string | null) => {
    setSelectedCategory(catId);
    const isCharacter = catId ? isCharacterCategory(catId) : true;
    if (catId && !isCharacter && (gender as string) !== "all") {
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
      {/* Language Dropdown */}
      <div className="p-3 border-b border-[#E0E0E0] shrink-0">
        <label className="block text-[11px] font-semibold text-[#666] uppercase tracking-wide mb-1">Language</label>
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
        <label className="block text-[11px] font-semibold text-[#666] uppercase tracking-wide mb-1">Character</label>
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

      {/* Search Box */}
      <div className="p-3 border-b border-[#E0E0E0] shrink-0">
        <input
          type="text"
          placeholder="Search cards..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 text-[12px] border border-[#D0D0D0] rounded bg-white text-[#2C2C2C] placeholder-[#999] focus:outline-none focus:ring-2 focus:ring-[#7A8F5E] font-sans"
        />
      </div>

      {/* Category Filter Dropdown */}
      <div className="p-3 border-b border-[#E0E0E0] shrink-0">
        <label className="block text-[11px] font-semibold text-[#666] uppercase tracking-wide mb-1">Category</label>
        <select
          value={selectedCategory || ""}
          onChange={(e) => handleCategoryFilterChange(e.target.value || null)}
          className="w-full px-2 py-2 text-[12px] border border-[#D0D0D0] rounded bg-white text-[#2C2C2C] hover:border-[#999] focus:outline-none focus:ring-2 focus:ring-[#7A8F5E] font-sans"
        >
          <option value="">All Categories</option>
          {categories.map((catId) => (
            <option key={catId} value={catId}>
              {CATEGORY_NAMES[catId] || catId}
            </option>
          ))}
        </select>
      </div>

      {/* Cards Grid */}
      <div className="flex-1 overflow-y-auto">
        {categories.map((catId) => {
          const cardsInCategory = filteredCards.filter((card) => card.categoryId === catId);
          if (cardsInCategory.length === 0) return null;

          const isPaid = isPaidCategory(catId);
          const displayName = CATEGORY_NAMES[catId] || catId;
          const isExpanded = expandedCategories.has(catId);

          return (
            <div key={catId} className="border-b border-[#F0F0F0]">
              {/* Category Header - Collapsible */}
              <button
                onClick={() => toggleCategory(catId)}
                className="w-full text-left px-3 py-2.5 bg-[#F8F8F8] hover:bg-[#F0F0F0] text-[12px] font-semibold text-[#666] tracking-wide transition-colors flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <span className={`transition-transform ${isExpanded ? "rotate-90" : ""}`}>▶</span>
                  <span>{displayName}</span>
                  <span className="text-[10px] text-[#999]">({cardsInCategory.length})</span>
                </div>
                {isPaid && (
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-[#FFF5EA] text-[#8B5E2A] rounded">
                    PAID
                  </span>
                )}
              </button>

              {/* Cards Grid - 2 Columns */}
              {isExpanded && (
                <div className="p-2 grid grid-cols-2 gap-2">
                  {cardsInCategory.map((card) => {
                    const imageUrl = cardImages[card.id]?.[isCharacterCard(card) ? gender : "neutral"];
                    return (
                      <button
                        key={card.id}
                        onClick={() => handleAddCard(card.id, catId)}
                        className="flex flex-col items-center gap-1 p-2 rounded hover:bg-[#E8F0E3] transition-colors group cursor-pointer"
                        title={isCharacterCard(card) ? "Character card - gender variants" : "Neutral card - single image"}
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

                        {/* Free/Paid Badge */}
                        {!isPaid && <span className="text-[9px] font-bold px-1.5 py-0.5 bg-[#EAF5EA] text-[#2D6A2D] rounded">FREE</span>}
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
