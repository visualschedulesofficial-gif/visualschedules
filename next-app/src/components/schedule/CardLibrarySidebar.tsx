"use client";

import { useState, useMemo, useEffect } from "react";
import { useDraggable } from "@dnd-kit/core";
import { useScheduleState } from "@/hooks/useScheduleState";
import { ALL_CARDS, getCardLabel, isCharacterCard, getCardImageUrl, type ParsedCard } from "@/lib/card-data";
import { LANGUAGES, type Language, type Gender } from "@/lib/constants";

const NON_CHARACTER_CATEGORIES = ["food", "routines", "activities", "rewards", "snacks", "meals", "place"];
const PAID_CATEGORIES = ["social", "art"];

// Draggable card wrapper component
function DraggableCardItem({
  card,
  catId,
  gender,
  language,
  isAdded,
  onClickAdd,
}: {
  card: ParsedCard;
  catId: string;
  gender: Gender;
  language: Language;
  isAdded: boolean;
  onClickAdd: (cardId: string, catId: string) => void;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: card.id,
    data: { cardId: card.id, catId },
  });

  const isCharacter = isCharacterCard(card);
  const imageGender = isCharacter ? gender : "neutral";
  const imageUrl = getCardImageUrl(card.id, imageGender);

  return (
    <button
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={() => onClickAdd(card.id, catId)}
      className={`flex flex-col items-center gap-1.5 p-1.5 rounded transition-all group cursor-grab active:cursor-grabbing relative ${
        isDragging ? "opacity-50 scale-95" : ""
      } ${
        isAdded 
          ? "border border-[#7A8F5E] bg-white" 
          : "hover:bg-[#F5F5F5]"
      }`}
      title={isCharacter ? `Character card - ${imageGender} variant (drag or click)` : "Neutral card - single image (drag or click)"}
    >
      {/* Card Image */}
      <div className="w-full aspect-square bg-white rounded border-[1.5px] border-dashed border-[#E0E0E0] flex items-center justify-center overflow-hidden group-hover:shadow-md transition-all pointer-events-none">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={getCardLabel(card, language)}
            className="w-full h-full object-contain p-1"
          />
        ) : (
          <svg className="w-10 h-10 stroke-[#D0D0D0] fill-none" viewBox="0 0 24 24" strokeLinecap="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
        )}
      </div>

      {/* Card Label */}
      <span className="text-[11px] font-semibold text-[#1C1B19] text-center line-clamp-2 leading-tight pointer-events-none">
        {getCardLabel(card, language)}
      </span>

      {/* Green Tick for Added Cards */}
      {isAdded && (
        <div className="absolute top-1 right-1 bg-[#2D6A2D] text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold pointer-events-none">
          ✓
        </div>
      )}
    </button>
  );
}

// Local labels (avoid import issues)
const GENDER_LABELS = {
  neutral: "Child with Glasses",
  boy: "Boy",
  girl: "Girl",
  brown: "Child with Curly Hair",
  all: "All Variants",
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
                {[
                  { value: "neutral", label: GENDER_LABELS.neutral },
                  { value: "boy", label: GENDER_LABELS.boy },
                  { value: "girl", label: GENDER_LABELS.girl },
                  { value: "brown", label: GENDER_LABELS.brown },
                  { value: "all", label: GENDER_LABELS.all },
                ].map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Row 2: Category/Search */}
          <div className="relative">
            <label className="block text-[10px] font-bold text-[#1C1B19] uppercase tracking-widest mb-1">Category / Search Card</label>
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
                    className="px-3 py-2.5 hover:bg-[#f9f9f9] cursor-pointer text-[12px] text-[#1C1B19] font-medium border-b border-[#E0E0E0] last:border-b-0"
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
          </div>
        </div>
      </div>

      {/* CARDS SECTION */}
      <div className="flex-1 overflow-y-auto px-3 py-4">
        {filteredCards.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <p className="text-[12px] text-[#666] font-medium">No cards found</p>
              <p className="text-[11px] text-[#999] mt-1">Try a different search or category</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {displayCategories.map((catId) => {
              const categoryCards = filteredCards.filter((card) => card.categoryId === catId);
              return (
                <div key={catId}>
                  <h3 className="text-[11px] font-bold text-[#8A8480] uppercase tracking-widest mb-2.5">
                    {CATEGORY_NAMES[catId] || catId}
                  </h3>
                  <div className="grid grid-cols-2 gap-2">
                    {categoryCards.map((card) => (
                      <DraggableCardItem
                        key={`${card.id}-${forceUpdate}`}
                        card={card}
                        catId={card.categoryId}
                        gender={gender}
                        language={language}
                        isAdded={addedCardIds.has(card.id)}
                        onClickAdd={handleAddCard}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* UNLOCK ALL CARDS SECTION */}
      <div className="shrink-0 border-t border-[#E0E0E0] bg-white p-3">
        <button className="w-full py-2.5 px-3 bg-[#7A8F5E] text-white border-2 border-[#7A8F5E] text-[13px] font-bold uppercase tracking-wider rounded font-sans hover:bg-[#6A7F4E] transition-all">
          🔓 Unlock All Cards
        </button>
      </div>
    </div>
  );

  function handleAddCard(cardId: string, catId: string) {
    if (pages.length === 0) return;
    const currentPageIdx = 0;
    const currentPage = pages[currentPageIdx];

    if ("slots" in currentPage) {
      const firstEmptySlot = currentPage.slots.findIndex((slot) => slot === null);
      if (firstEmptySlot !== -1) {
        placeCard(currentPageIdx, String(firstEmptySlot), { cardId, catId });
      }
    } else if ("columns" in currentPage) {
      const cols = currentPage.columns || {};
      const colKeys = Object.keys(cols);
      
      if (colKeys.length > 0) {
        const firstColKey = colKeys[0];
        placeCard(currentPageIdx, firstColKey, { cardId, catId });
      }
    }
  }
}
