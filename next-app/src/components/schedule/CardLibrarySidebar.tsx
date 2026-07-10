"use client";

import { useState, useMemo, useEffect } from "react";
import { useDraggable } from "@dnd-kit/core";
import { useScheduleState } from "@/hooks/useScheduleState";
import { ALL_CARDS, getCardLabel, isCharacterCard, getCardImageUrl, setRuntimeCards, type ParsedCard } from "@/lib/card-data";
import { LANGUAGES, GRID_SPECS, type Language, type Gender, type ScheduleType, type GridCols } from "@/lib/constants";

const NON_CHARACTER_CATEGORIES = ["food", "routines", "activities", "rewards", "snacks", "meals", "place"];
const PAID_CATEGORIES = ["social", "art"];

// Draggable card wrapper component
function DraggableCardItem({
  card,
  catId,
  gender,
  language,
  isAdded,
  isFree,
  hasSubscription,
  onClickAdd,
}: {
  card: ParsedCard;
  catId: string;
  gender: Gender;
  language: Language;
  isAdded: boolean;
  isFree: boolean;
  hasSubscription: boolean;
  onClickAdd: (cardId: string, catId: string) => void;
}) {
  const isLocked = !isFree && !hasSubscription;
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
      {...(isLocked ? {} : listeners)}
      {...(isLocked ? {} : attributes)}
      onClick={() => {
        if (isLocked) {
          window.location.href = "/plans";
          return;
        }
        onClickAdd(card.id, catId);
      }}
      className={`flex flex-col items-center gap-1.5 p-1.5 rounded transition-all group relative ${
        isLocked
          ? "cursor-pointer"
          : isDragging
          ? "opacity-50 scale-95 cursor-grabbing"
          : "cursor-grab hover:bg-[#F5F5F5]"
      } ${isAdded ? "border border-[#7A8F5E] bg-white" : ""}`}
      title={isLocked ? "Subscribe to unlock paid cards" : isCharacter ? `Character card - ${imageGender} variant` : "Neutral card - single image"}
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

      {/* Free / Paid badge */}
      <div className={`absolute bottom-[28px] left-1 text-[9px] font-bold tracking-wide px-1 py-[1px] rounded-sm pointer-events-none leading-tight ${
        isFree
          ? "bg-[#E6F2E6] text-[#2D6A2D] border border-[#BCE0BC]"
          : "bg-[#FBF0DD] text-[#9A6B12] border border-[#EBD3A0]"
      }`}>
        {isFree ? "Free" : isLocked ? "🔒 Paid" : "Paid"}
      </div>


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

// Last-resort display fallback for built-in category ids. The live names come
// from the database (admin-defined); this is only used if that fetch fails.
const CATEGORY_NAME_FALLBACK: Record<string, string> = {
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

// Merge DB cards with the static seed cards (DB wins on id collision).
function mergeCards(dbCards: ParsedCard[]): ParsedCard[] {
  const dbIds = new Set(dbCards.map((c) => c.id));
  return [...dbCards, ...ALL_CARDS.filter((c) => !dbIds.has(c.id))];
}

export function CardLibrarySidebar() {
  const gender = useScheduleState((s) => s.gender);
  const setGender = useScheduleState((s) => s.setGender);
  const language = useScheduleState((s) => s.language);
  const setLanguage = useScheduleState((s) => s.setLanguage);
  const placeCard = useScheduleState((s) => s.placeCard);
  const pages = useScheduleState((s) => s.pages);

  const [cards, setCards] = useState<ParsedCard[]>(ALL_CARDS);
  const [hasSubscription, setHasSubscription] = useState(false);
  const scheduleType = useScheduleState((s) => s.scheduleType);
  const setScheduleType = useScheduleState((s) => s.setScheduleType);
  const gridCols = useScheduleState((s) => s.gridCols);
  const setGridCols = useScheduleState((s) => s.setGridCols);
  const weekMode = useScheduleState((s) => s.weekMode);
  const setWeekMode = useScheduleState((s) => s.setWeekMode);
  const [panelWidth, setPanelWidth] = useState(400);
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set());
  const [categoryNames, setCategoryNames] = useState<Record<string, string>>({});
  const [categoryOrder, setCategoryOrder] = useState<string[]>([]);
  const [accessFilter, setAccessFilter] = useState<"" | "free" | "paid">("");
  const [catFlags, setCatFlags] = useState<Record<string, boolean>>({});
  const [flagsLoaded, setFlagsLoaded] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchOrCategory, setSearchOrCategory] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [forceUpdate, setForceUpdate] = useState(0);

  // Resolve a category id to its display name (DB first, then fallback, then id)
  const catName = (catId: string) => categoryNames[catId] || CATEGORY_NAME_FALLBACK[catId] || catId;

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

  // Check subscription status
  useEffect(() => {
    fetch("/api/user/subscription")
      .then((r) => r.json())
      .then((data) => setHasSubscription(!!data.subscription))
      .catch(() => setHasSubscription(false));
  }, []);

  // Fetch cards from API (merge DB cards with static seed cards)
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/cards");
        if (res.ok) {
          const data = await res.json();
          const dbCards = (data.cards || []).map((c: ParsedCard) => ({
            ...c,
            // Read Free/Paid from the icon prefix BEFORE stripping it —
            // previously this was discarded, so every card showed "Free".
            isFree: !(c.icon || "").startsWith("paid:"),
            icon: c.icon?.replace(/^(free|paid):/, "") || "s-star",
          }));
          setRuntimeCards(dbCards);
          setCards(mergeCards(dbCards));
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

  // Fetch admin-defined category names so new categories display correctly
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/admin/categories");
        if (res.ok) {
          const data = await res.json();
          const map: Record<string, string> = {};
          (data.categories || []).forEach((c: { id: string; name: string }) => {
            map[c.id] = c.name;
          });
          setCategoryOrder((data.categories || []).map((c: { id: string }) => c.id));
          const flags: Record<string, boolean> = {};
          (data.categories || []).forEach((c: any) => {
            flags[c.id] = !!c.hasCharacters;
          });
          setCatFlags(flags);
          setFlagsLoaded(true);
          setCategoryNames(map);
        }
      } catch {
        // fall back to CATEGORY_NAME_FALLBACK / id
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
    const orderIndex = (id: string) => {
      const i = categoryOrder.indexOf(id);
      return i === -1 ? 999 : i;
    };
    return Array.from(uniqueCategories).sort(
      (a, b) => orderIndex(a) - orderIndex(b) || a.localeCompare(b)
    );
  }, [cards, categoryOrder]);

  // Apply the chosen width to the panel and support drag-to-resize on its edge
  useEffect(() => {
    const aside = document.getElementById("library-panel");
    if (aside) aside.style.width = `${panelWidth}px`;
  }, [panelWidth]);

  const startResize = (e: React.MouseEvent) => {
    e.preventDefault();
    const aside = document.getElementById("library-panel");
    if (!aside) return;
    const left = aside.getBoundingClientRect().left;
    const maxW = 118 * 5 + 8 * 4 + 26; // five cards + gaps + padding
    const onMove = (ev: MouseEvent) => {
      setPanelWidth(Math.min(maxW, Math.max(320, ev.clientX - left)));
    };
    const onUp = () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      document.body.style.cursor = "";
    };
    document.body.style.cursor = "col-resize";
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  };

  const faceCard = useMemo(() => cards.find((c) => isCharacterCard(c)) || null, [cards]);

  const categoryCounts = useMemo(() => {
    const m: Record<string, number> = {};
    cards.forEach((c) => {
      m[c.categoryId] = (m[c.categoryId] || 0) + 1;
    });
    return m;
  }, [cards]);

  const isCategory = (val: string): boolean => {
    return categories.includes(val);
  };

  const selectedCategory = isCategory(searchOrCategory) ? searchOrCategory : null;

  // Character picker is locked to Neutral when the chosen category has no character cards
  const charactersLocked = flagsLoaded && !!selectedCategory && !catFlags[selectedCategory];
  useEffect(() => {
    if (charactersLocked && gender !== "neutral") setGender("neutral");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [charactersLocked]);

  const searchText = !isCategory(searchOrCategory) ? searchOrCategory : "";

  const filteredCards = useMemo(() => {
    return cards.filter((card) => {
      const matchesSearch = searchText === "" || getCardLabel(card, language).toLowerCase().includes(searchText.toLowerCase());
      const matchesCategory = !selectedCategory || card.categoryId === selectedCategory;
      const matchesAccess =
        accessFilter === "" ||
        (accessFilter === "free"
          ? (card as any).isFree !== false
          : (card as any).isFree === false);
      return matchesSearch && matchesCategory && matchesAccess;
    });
  }, [cards, searchText, selectedCategory, language, accessFilter]);

  const displayCategories = useMemo(() => {
    const cats = new Set<string>();
    filteredCards.forEach((card) => cats.add(card.categoryId));
    const orderIndex = (id: string) => {
      const i = categoryOrder.indexOf(id);
      return i === -1 ? 999 : i;
    };
    return Array.from(cats).sort(
      (a, b) => orderIndex(a) - orderIndex(b) || a.localeCompare(b)
    );
  }, [filteredCards, categoryOrder]);

  if (loading) {
    return (
      <div className="flex flex-col h-full bg-white border-r border-[#E0E0E0] items-center justify-center">
        <div className="w-5 h-5 border-2 border-border border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white border-r border-[#E0E0E0] relative">
      {/* Drag the panel edge to resize (max = five cards per row) */}
      <div
        onMouseDown={startResize}
        title="Drag to resize"
        className="absolute right-0 top-0 bottom-0 w-[6px] cursor-col-resize z-20 hover:bg-[#C5D2B8]/50"
      />
      {/* TOP CONTROLS SECTION */}
      <div className="shrink-0 border-b border-[#E0E0E0] bg-white">
        <div className="p-3 space-y-3">
          {/* Row A: Schedule type + contextual options */}
          <div className={`grid gap-2 ${scheduleType === "daily" || scheduleType === "weekly" ? "grid-cols-2" : "grid-cols-1"}`}>
            <div>
              <label className="block text-[10px] font-bold text-[#1C1B19] uppercase tracking-widest mb-1">Schedule type</label>
              <select
                value={scheduleType}
                onChange={(e) => setScheduleType(e.target.value as ScheduleType)}
                className="w-full px-3 py-2 h-[38px] text-[13px] font-medium border border-[#C9C4BB] rounded bg-white text-[#1C1B19] focus:outline-none focus:ring-2 focus:ring-[#7A8F5E] font-sans"
              >
                <option value="daily">Daily Schedule</option>
                <option value="weekly">Weekly Schedule</option>
                <option value="custom">Custom Schedule</option>
                <option value="firstthen">First/Then Board</option>
              </select>
            </div>
            {scheduleType === "daily" && (
              <div>
                <label className="block text-[10px] font-bold text-[#1C1B19] uppercase tracking-widest mb-1">Grid</label>
                <div className="flex gap-1">
                  {(Object.keys(GRID_SPECS) as unknown as GridCols[]).map((colsKey) => {
                    const c = Number(colsKey) as GridCols;
                    const spec = GRID_SPECS[c as 2 | 3 | 4];
                    const active = gridCols === c;
                    return (
                      <button
                        key={c}
                        onClick={() => setGridCols(c)}
                        className={`flex-1 h-[38px] rounded border text-[12px] font-sans transition-colors ${
                          active
                            ? "border-[#7A8F5E] bg-[#E8EDE0] text-[#4A5A3E] font-semibold"
                            : "border-[#C9C4BB] bg-white text-[#1C1B19]"
                        }`}
                      >
                        {spec.cols}×{spec.rows}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            {scheduleType === "weekly" && (
              <div>
                <label className="block text-[10px] font-bold text-[#1C1B19] uppercase tracking-widest mb-1">Days</label>
                <div className="flex gap-1">
                  {[
                    { value: "week", label: "Full week" },
                    { value: "weekdays", label: "Weekdays" },
                  ].map((o) => {
                    const active = weekMode === o.value;
                    return (
                      <button
                        key={o.value}
                        onClick={() => setWeekMode(o.value as "week" | "weekdays")}
                        className={`flex-1 h-[38px] rounded border text-[12px] font-sans transition-colors ${
                          active
                            ? "border-[#7A8F5E] bg-[#E8EDE0] text-[#4A5A3E] font-semibold"
                            : "border-[#C9C4BB] bg-white text-[#1C1B19]"
                        }`}
                      >
                        {o.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Row B: Language (Category/Search sits just below) */}
          <div>
            <label className="block text-[10px] font-bold text-[#1C1B19] uppercase tracking-widest mb-1">Language</label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="w-full px-3 py-2 h-[38px] text-[13px] font-medium border border-[#C9C4BB] rounded bg-white text-[#1C1B19] focus:outline-none focus:ring-2 focus:ring-[#7A8F5E] font-sans"
            >
              {Object.entries(LANGUAGES).map(([code, name]) => (
                <option key={code} value={code}>
                  {name}
                </option>
              ))}
            </select>
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
                className="w-full pl-10 pr-10 h-[38px] text-[13px] font-medium border border-[#C9C4BB] rounded bg-white text-[#1C1B19] placeholder-[#666] focus:outline-none focus:ring-2 focus:ring-[#7A8F5E] font-sans"
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
                    {catName(catId)} <span className="text-[#B0ACA6]">({categoryCounts[catId] || 0})</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Row C: access filter + character faces */}
          <div className="flex items-end justify-between gap-2">
            <div className="w-[140px]">
              <label className="block text-[10px] font-bold text-[#1C1B19] uppercase tracking-widest mb-1">Cards</label>
              <select
                value={accessFilter}
                onChange={(e) => setAccessFilter(e.target.value as "" | "free" | "paid")}
                className="w-full px-3 py-2 h-[38px] text-[13px] font-medium border border-[#C9C4BB] rounded bg-white text-[#1C1B19] focus:outline-none focus:ring-2 focus:ring-[#7A8F5E] font-sans"
              >
                <option value="">All cards</option>
                <option value="free">Free</option>
                <option value="paid">Paid</option>
              </select>
            </div>
            {!charactersLocked && (
              <div>
                <label className="block text-[10px] font-bold text-[#1C1B19] uppercase tracking-widest mb-1 text-right">Character</label>
                <div className="flex gap-1.5 justify-end">
                  {(["neutral", "boy", "girl", "brown"] as Gender[]).map((g) => {
                    const active = gender === g;
                    const faceImg = faceCard
                      ? getCardImageUrl(faceCard.id, g) || getCardImageUrl(faceCard.id, "neutral")
                      : null;
                    return (
                      <button
                        key={g}
                        onClick={() => {
                          setGender(g);
                          setForceUpdate((prev) => prev + 1);
                        }}
                        aria-label={g}
                        title={g}
                        className={`w-9 h-9 rounded-full overflow-hidden border-2 shrink-0 transition-all ${
                          active
                            ? "border-[#4A8A4A] ring-2 ring-[#BCD9B4]"
                            : "border-[#D8D4CC] opacity-70 hover:opacity-100"
                        }`}
                      >
                        {faceImg ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={faceImg} alt={g} className="w-[200%] h-[200%] max-w-none object-cover -translate-x-1/4" />
                        ) : (
                          <span className="text-[10px] font-sans text-ink-3 uppercase">{g[0]}</span>
                        )}
                      </button>
                    );
                  })}
                </div>
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
              const categoryCards = filteredCards
                .filter((card) => card.categoryId === catId)
                .sort((a, b) => {
                  const aPaid = (a as any).isFree !== false ? 0 : 1;
                  const bPaid = (b as any).isFree !== false ? 0 : 1;
                  return (
                    aPaid - bPaid ||
                    getCardLabel(a, language).localeCompare(getCardLabel(b, language))
                  );
                });
              return (
                <div key={catId}>
                  <button
                    onClick={() => {
                      const next = new Set(collapsedCats);
                      if (next.has(catId)) next.delete(catId);
                      else next.add(catId);
                      setCollapsedCats(next);
                    }}
                    className="w-full flex items-center justify-between text-[11px] font-bold text-[#8A8480] uppercase tracking-widest mb-2.5"
                  >
                    <span>
                      {catName(catId)} <span className="text-[#B0ACA6] font-medium">({categoryCards.length})</span>
                    </span>
                    <svg
                      className={`w-3.5 h-3.5 stroke-[#B0ACA6] stroke-2 fill-none transition-transform ${collapsedCats.has(catId) ? "-rotate-90" : ""}`}
                      viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  {!collapsedCats.has(catId) && (
                  <div className="grid gap-2 grid-cols-[repeat(auto-fill,minmax(108px,1fr))]">
                    {categoryCards.map((card) => (
                      <DraggableCardItem
                        key={`${card.id}-${forceUpdate}`}
                        card={card}
                        catId={card.categoryId}
                        gender={gender}
                        language={language}
                        isAdded={addedCardIds.has(card.id)}
                        isFree={(card as any).isFree !== false}
                        hasSubscription={hasSubscription}
                        onClickAdd={handleAddCard}
                      />
                    ))}
                  </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* UNLOCK ALL CARDS SECTION — hidden once subscribed */}
      {!hasSubscription && (
      <div className="shrink-0 border-t border-[#E0E0E0] bg-white p-3">
        <button
          onClick={() => { window.location.href = "/plans"; }}
          className="w-full py-2.5 px-3 bg-[#7A8F5E] text-white border-2 border-[#7A8F5E] text-[13px] font-bold uppercase tracking-wider rounded font-sans hover:bg-[#6A7F4E] transition-all"
        >
          🔓 Unlock All Cards
        </button>
      </div>
      )}
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
