"use client";

import { useState, useMemo, useEffect } from "react";
import { useScheduleState } from "@/hooks/useScheduleState";
import { ALL_CARDS, getCardLabel, isCharacterCard, getCardImageUrl, type ParsedCard } from "@/lib/card-data";
import { LANGUAGES, type Language, type Gender, type ScheduleType } from "@/lib/constants";

const NON_CHARACTER_CATEGORIES = ["food", "routines", "activities", "rewards", "snacks", "meals", "place"];
const PAID_CATEGORIES = ["social", "art"];

// Local labels (avoid import issues)
const GENDER_LABELS = {
  neutral: "Child with Glasses",
  boy: "Boy",
  girl: "Girl",
  brown: "Child with Curly Hair",
  all: "All Variants",
};

const SCHEDULE_TYPE_LABELS = {
  daily: "Daily Schedule",
  weekly: "Weekly Schedule",
  custom: "Custom Schedule",
  firstthen: "First/Then Board",
};

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
  daily: "Daily",
  all: "All (No Character)",
};

export function CardLibrarySidebar() {
  const gender = useScheduleState((s) => s.gender);
  const setGender = useScheduleState((s) => s.setGender);
  const language = useScheduleState((s) => s.language);
  const setLanguage = useScheduleState((s) => s.setLanguage);
  const scheduleType = useScheduleState((s) => s.scheduleType);
  const setScheduleType = useScheduleState((s) => s.setScheduleType);
  const placeCard = useScheduleState((s) => s.placeCard);
  const pages = useScheduleState((s) => s.pages);

  const [cards, setCards] = useState<ParsedCard[]>(ALL_CARDS);
  const [loading, setLoading] = useState(true);
  const [searchOrCategory, setSearchOrCategory] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);

  // Track added cards
  const addedCardIds = useMemo(() => {
    const ids = new Set<string>();
    pages.forEach((page) => {
      if ("slots" in page) {
        page.slots?.forEach((slot) => {
          if (slot) ids.add(slot.cardId);
        });
      } else if ("columns" in page) {
        Object.values(page.columns || {}).forEach((col) => {
          col?.forEach((card) => {
            if (card) ids.add(card.cardId);
          });
        });
      }
    });
    return ids;
  }, [pages]);

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

  // Force re-render when gender changes
  useEffect(() => {
    setForceUpdate((prev) => prev + 1);
  }, [gender]);

  const categories = useMemo(() => {
    const uniqueCategories = new Set<string>();
    cards.forEach((card) => {
      uniqueCategories.add(card.categoryId);
    });
    return Array.from(uniqueCategories).sort((a, b) => {
      if (a === "daily") return -1;
      if (b === "daily") return 1;
      return a.localeCompare(b);
    });
  }, [cards]);

  const isCharacterCategory = (catId: string) => !NON_CHARACTER_CATEGORIES.includes(catId);
  const isPaidCategory = (catId: string) => PAID_CATEGORIES.includes(catId);

  const genderOptions: Array<{ value: Gender; label: string }> = [
    { value: "neutral", label: GENDER_LABELS.neutral },
    { value: "boy", label: GENDER_LABELS.boy },
    { value: "girl", label: GENDER_LABELS.girl },
    { value: "brown", label: GENDER_LABELS.brown },
    { value: "all", label: GENDER_LABELS.all },
  ];

  const scheduleTypeOptions: Array<{ value: ScheduleType; label: string }> = [
    { value: "daily", label: SCHEDULE_TYPE_LABELS.daily },
    { value: "weekly", label: SCHEDULE_TYPE_LABELS.weekly },
    { value: "custom", label: SCHEDULE_TYPE_LABELS.custom },
    { value: "firstthen", label: SCHEDULE_TYPE_LABELS.firstthen },
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

  const isCategory = (val: string): boolean => {
    return categories.includes(val);
  };

  const selectedCategory = isCategory(searchOrCategory) ? searchOrCategory : null;
  const searchText = !isCategory(searchOrCategory) ? searchOrCategory : "";

  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      const matchesSearch = searchText === "" || getCardLabel(card, language).toLowerCase().includes(searchText.toLowerCase());
      const matchesCategory = !selectedCategory || card.categoryId === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [cards, searchText, selectedCategory, language]);

  const displayCategories = useMemo(() => {
    const cats = new Set<string>();
    filteredCards.forEach((card) => cats.add(card.categoryId));
    return Array.from(cats).sort((a, b) => {
      if (a === "daily") return -1;
      if (b === "daily") return 1;
      return a.localeCompare(b);
    });
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
      {/* TOP CONTROLS SECTION */}
      <div className="shrink-0 border-b border-[#E0E0E0] bg-white">
        <div className="p-3 space-y-3">
          {/* Row 1: Language & Character SIDE BY SIDE */}
          <div className="grid grid-cols-2 gap-2.5">
            {/* Language */}
            <div>
              <label className="block text-[10px] font-bold text-[#1C1B19] uppercase tracking-widest mb-1">Language</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value as Language)}
                className="w-full px-3 py-2.5 text-[13px] font-medium border-2 border-[#333] rounded bg-white text-[#1C1B19] hover:border-[#1C1B19] focus:outline-none focus:ring-2 focus:ring-[#7A8F5E] font-sans appearance-none pr-8 bg-no-repeat bg-right"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23333' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                  backgroundPosition: "right 8px center",
                  backgroundSize: "18px",
                  backgroundRepeat: "no-repeat",
                  paddingRight: "32px",
                }}
              >
                {Object.entries(LANGUAGES).map(([code, name]) => (
                  <option key={code} value={code}>
                    {name}
                  </option>
                ))}
              </select>
            </div>

            {/* Character */}
            <div>
              <label className="block text-[10px] font-bold text-[#1C1B19] uppercase tracking-widest mb-1">Character</label>
              <select
                value={gender}
                onChange={(e) => {
                  const newGender = e.target.value as Gender;
                  console.log("Character changed to:", newGender);
                  setGender(newGender);
                  setForceUpdate((prev) => prev + 1);
                }}
                className="w-full px-3 py-2.5 text-[13px] font-medium border-2 border-[#333] rounded bg-white text-[#1C1B19] hover:border-[#1C1B19] focus:outline-none focus:ring-2 focus:ring-[#7A8F5E] font-sans appearance-none pr-8 bg-no-repeat bg-right"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23333' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                  backgroundPosition: "right 8px center",
                  backgroundSize: "18px",
                  backgroundRepeat: "no-repeat",
                  paddingRight: "32px",
                }}
              >
                {genderOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Schedule Type */}
          <div>
            <label className="block text-[10px] font-bold text-[#1C1B19] uppercase tracking-widest mb-1">Schedule Type</label>
            <select
              value={scheduleType}
              onChange={(e) => setScheduleType(e.target.value as ScheduleType)}
              className="w-full px-3 py-2.5 text-[13px] font-medium border-2 border-[#333] rounded bg-white text-[#1C1B19] hover:border-[#1C1B19] focus:outline-none focus:ring-2 focus:ring-[#7A8F5E] font-sans appearance-none pr-8 bg-no-repeat bg-right"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%23333' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                backgroundPosition: "right 8px center",
                backgroundSize: "18px",
                backgroundRepeat: "no-repeat",
                paddingRight: "32px",
              }}
            >
              {scheduleTypeOptions.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          {/* Row 3: Search with Icons */}
          <div className="relative">
            <label className="block text-[10px] font-bold text-[#1C1B19] uppercase tracking-widest mb-1">Search Cards</label>
            <div className="relative flex items-center">
              {/* Search Icon */}
              <svg className="absolute left-3 w-4 h-4 stroke-[#333] fill-none pointer-events-none" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>

              {/* Input Field */}
              <input
                type="text"
                placeholder="Search or select..."
                value={searchOrCategory}
                onChange={(e) => {
                  setSearchOrCategory(e.target.value);
                  setIsDropdownOpen(true);
                }}
                onFocus={() => setIsDropdownOpen(true)}
                className="w-full pl-10 pr-10 py-2.5 text-[13px] font-medium border-2 border-[#333] rounded bg-white text-[#1C1B19] placeholder-[#666] hover:border-[#1C1B19] focus:outline-none focus:ring-2 focus:ring-[#7A8F5E] font-sans"
              />

              {/* Dropdown Icon */}
              <svg
                className="absolute right-3 w-4 h-4 stroke-[#333] fill-none pointer-events-none transition-transform"
                style={{ transform: isDropdownOpen ? "rotate(180deg)" : "rotate(0deg)" }}
                viewBox="0 0 24 24"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <polyline points="6 9 12 15 18 9" />
              </svg>
            </div>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border-2 border-[#333] rounded shadow-lg z-50 max-h-48 overflow-y-auto">
                <div
                  className="px-3 py-2.5 hover:bg-[#f9f9f9] cursor-pointer text-[12px] text-[#1C1B19] font-medium border-b border-[#E0E0E0]"
                  onClick={() => {
                    setSearchOrCategory("");
                    setIsDropdownOpen(false);
                  }}
                >
                  ✕ Clear Filter
                </div>
                {categories.map((catId) => (
                  <div
                    key={catId}
                    className={`px-3 py-2.5 hover:bg-[#f9f9f9] cursor-pointer text-[12px] font-medium transition-colors border-b border-[#E0E0E0] ${
                      selectedCategory === catId ? "bg-[#E8F0E3] text-[#2D6A2D]" : "text-[#1C1B19]"
                    }`}
                    onClick={() => {
                      setSearchOrCategory(catId);
                      setIsDropdownOpen(false);
                    }}
                  >
                    {CATEGORY_NAMES[catId] || catId}
                  </div>
                ))}
              </div>
            )}

            {/* Close dropdown when clicking outside */}
            {isDropdownOpen && (
              <div className="fixed inset-0 z-40" onClick={() => setIsDropdownOpen(false)} />
            )}
          </div>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="flex-1 overflow-y-auto" key={forceUpdate}>
        {displayCategories.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-[13px] text-[#666] font-medium">
            No cards found
          </div>
        ) : (
          displayCategories.map((catId) => {
            const cardsInCategory = filteredCards.filter((card) => card.categoryId === catId);
            if (cardsInCategory.length === 0) return null;

            const isPaid = isPaidCategory(catId);
            const displayName = CATEGORY_NAMES[catId] || catId;

            return (
              <div key={`${catId}-${forceUpdate}`} className="border-b border-[#E0E0E0]">
                {/* Category Header */}
                <div className="px-3 py-2.5 bg-[#f9f9f9] flex items-center justify-between border-b border-[#E0E0E0]">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[13px] font-bold text-[#1C1B19]">{displayName}</span>
                    <span className="text-[11px] text-[#666] font-medium">({cardsInCategory.length})</span>
                  </div>
                  <div className="flex gap-1">
                    {!isPaid && <span className="text-[8px] font-bold px-2 py-1 bg-[#EAF5EA] text-[#2D6A2D] rounded">FREE</span>}
                    {isPaid && <span className="text-[8px] font-bold px-2 py-1 bg-[#FFF5EA] text-[#8B5E2A] rounded">PAID</span>}
                  </div>
                </div>

                {/* Cards Grid - 2 Columns */}
                <div className="p-2.5 grid grid-cols-2 gap-2.5">
                  {cardsInCategory.map((card) => {
                    const isCharacter = isCharacterCard(card);
                    const imageGender = isCharacter ? gender : "neutral";
                    const imageUrl = getCardImageUrl(card.id, imageGender);
                    const isAdded = addedCardIds.has(card.id);

                    return (
                      <button
                        key={`${card.id}-${imageGender}-${forceUpdate}`}
                        onClick={() => handleAddCard(card.id, catId)}
                        className={`flex flex-col items-center gap-1.5 p-1.5 rounded transition-all group cursor-pointer relative ${
                          isAdded 
                            ? "bg-[#E8F0E3] hover:bg-[#D0E8D0]" 
                            : "hover:bg-[#F5F5F5]"
                        }`}
                        title={isCharacter ? `Character card - ${imageGender} variant` : "Neutral card - single image"}
                      >
                        {/* Card Image */}
                        <div className="w-full aspect-square bg-[#2C2C2C] rounded border-2 border-[#D0D0D0] flex items-center justify-center overflow-hidden group-hover:border-[#7A8F5E] group-hover:shadow-md transition-all">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={getCardLabel(card, language)}
                              className="w-full h-full object-contain p-1"
                            />
                          ) : (
                            <svg className="w-10 h-10 stroke-[#666] fill-none" viewBox="0 0 24 24" strokeLinecap="round">
                              <rect x="3" y="3" width="18" height="18" rx="2" />
                              <circle cx="8.5" cy="8.5" r="1.5" />
                              <path d="M21 15l-5-5L5 21" />
                            </svg>
                          )}
                        </div>

                        {/* Card Label */}
                        <span className="text-[11px] font-semibold text-[#1C1B19] text-center line-clamp-2 leading-tight">
                          {getCardLabel(card, language)}
                        </span>

                        {/* Green Tick for Added Cards */}
                        {isAdded && (
                          <div className="absolute top-1 right-1 bg-[#2D6A2D] text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold">
                            ✓
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Unlock Button */}
      <div className="shrink-0 p-3 border-t border-[#E0E0E0] bg-white">
        <a
          href="https://gumroad.com/growgently_co"
          target="_blank"
          rel="noopener noreferrer"
          className="w-full block text-center px-3 py-2.5 bg-[#7A8F5E] text-white text-[12px] font-bold rounded hover:bg-[#6A7F4E] transition-colors uppercase tracking-wide border-2 border-[#7A8F5E]"
        >
          🔓 Unlock All Cards
        </a>
      </div>
    </div>
  );
}

function getCardLabel(card: ParsedCard, language: Language): string {
  if (language === "hi" && card.translations?.hi) {
    return card.translations.hi;
  }
  return card.translations?.en || card.id;
}

type ParsedCard = {
  id: string;
  categoryId: string;
  icon?: string;
  translations?: {
    en?: string;
    hi?: string;
  };
};
