"use client";

import { useState, useMemo, useEffect } from "react";
import { useDraggable } from "@dnd-kit/core";
import { useScheduleState } from "@/hooks/useScheduleState";
import { ALL_CARDS, getCardLabel, isCharacterCard, getCardImageUrl, setRuntimeCards, type ParsedCard } from "@/lib/card-data";
import { LANGUAGES, languageLabel, CHARACTER_FACES, type Language, type Gender } from "@/lib/constants";

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
      className={`flex flex-col items-center gap-1.5 p-1.5 pb-2 rounded-[14px] border-[1.5px] bg-white transition-all duration-150 group relative ${
        isLocked
          ? "cursor-pointer border-border"
          : isDragging
          ? "opacity-50 scale-95 cursor-grabbing border-border"
          : "cursor-grab border-border hover:border-weekly-accent hover:-translate-y-0.5 hover:shadow-[0_6px_14px_rgba(74,90,62,0.14)]"
      } ${isAdded ? "!border-accent-strong !bg-accent-soft" : ""}`}
      title={isLocked ? "Subscribe to unlock paid cards" : `Add ${getCardLabel(card, language)}`}
      aria-label={isLocked ? `${getCardLabel(card, language)} (paid)` : `Add ${getCardLabel(card, language)}`}
    >
      <div className="w-full aspect-[5/4] bg-white rounded-[9px] flex items-center justify-center overflow-hidden pointer-events-none">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            loading="lazy"
            decoding="async"
            className="w-full h-full object-contain p-0.5"
          />
        ) : (
          <svg className="w-10 h-10 stroke-[#D0D0D0] fill-none" viewBox="0 0 24 24" strokeLinecap="round">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="M21 15l-5-5L5 21" />
          </svg>
        )}
      </div>

      <span className="text-[12.5px] font-semibold text-ink text-center line-clamp-2 leading-tight pointer-events-none">
        {getCardLabel(card, language)}
      </span>

      {/* Added: tick. Otherwise a + that appears on hover. */}
      {isAdded ? (
        <span className="absolute top-2 right-2 bg-accent-strong text-white rounded-full w-6 h-6 flex items-center justify-center text-[12px] font-bold pointer-events-none animate-[vsPop_300ms_ease-out]">✓</span>
      ) : !isLocked ? (
        <span className="absolute top-2 right-2 bg-accent-strong text-white rounded-full w-7 h-7 flex items-center justify-center pointer-events-none opacity-0 scale-75 group-hover:opacity-100 group-hover:scale-100 transition-all shadow">
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><path d="M12 5v14M5 12h14" /></svg>
        </span>
      ) : null}

      <span className={`absolute top-2 left-2 text-[10.5px] font-bold px-1.5 py-[1px] rounded-md pointer-events-none leading-tight ${
        isFree ? "bg-accent-soft text-accent-hover" : "bg-[#FFF3E6] text-[#9A5F12]"
      }`}>
        {isFree ? "Free" : "🔒 Paid"}
      </span>
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

function useIsEditingSaved() {
  // True when the builder was opened as /schedule?id=... Changing the
  // schedule type then would throw away the saved layout, so the picker is
  // locked in that case.
  const [editing, setEditing] = useState(false);
  useEffect(() => {
    try { setEditing(new URLSearchParams(window.location.search).has("id")); } catch {}
  }, []);
  return editing;
}

export function CardLibrarySidebar({ onAddCard }: { onAddCard?: (cardId: string) => void } = {}) {
  const isEditingSaved = useIsEditingSaved();
  const gender = useScheduleState((s) => s.gender);
  const setGender = useScheduleState((s) => s.setGender);
  const language = useScheduleState((s) => s.language);
  const setLanguage = useScheduleState((s) => s.setLanguage);
  const placeCard = useScheduleState((s) => s.placeCard);
  const pages = useScheduleState((s) => s.pages);

  const [cards, setCards] = useState<ParsedCard[]>(ALL_CARDS);
  const [hasSubscription, setHasSubscription] = useState(false);
  const cardType = useScheduleState((s) => s.cardType);
  const setCardType = useScheduleState((s) => s.setCardType);
  const ftStyle = useScheduleState((s) => s.ftStyle);
  const setFtStyle = useScheduleState((s) => s.setFtStyle);
  const miniCardCount = useScheduleState((s) => s.miniCardCount);
  const setMiniCardCount = useScheduleState((s) => s.setMiniCardCount);
  const customColNames = useScheduleState((s) => s.customColNames);
  const setCustomColNames = useScheduleState((s) => s.setCustomColNames);
  const scheduleType = useScheduleState((s) => s.scheduleType);
  const setScheduleType = useScheduleState((s) => s.setScheduleType);
  const gridCols = useScheduleState((s) => s.gridCols);
  const setGridCols = useScheduleState((s) => s.setGridCols);
  const weekMode = useScheduleState((s) => s.weekMode);
  const setWeekMode = useScheduleState((s) => s.setWeekMode);
  const [panelWidth, setPanelWidth] = useState(360);
  const [collapsedCats, setCollapsedCats] = useState<Set<string>>(new Set());
  const [categoryNames, setCategoryNames] = useState<Record<string, string>>({});
  const [categoryOrder, setCategoryOrder] = useState<string[]>([]);
  const [accessFilter, setAccessFilter] = useState<"" | "free" | "paid">("");
  const cycleAccess = () => setAccessFilter((v) => (v === "" ? "free" : v === "free" ? "paid" : ""));
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
      }
      if ("columns" in page) {
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
  // Locked when: admin explicitly marked the category as no-characters, OR the
  // category is unknown to admin AND its cards contain no character variants.
  const categoryHasCharacterCards = useMemo(() => {
    const m: Record<string, boolean> = {};
    cards.forEach((c) => {
      if (isCharacterCard(c)) m[c.categoryId] = true;
    });
    return m;
  }, [cards]);
  const charactersLocked =
    !!selectedCategory &&
    !categoryHasCharacterCards[selectedCategory] &&
    !catFlags[selectedCategory];
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
      <div className="flex flex-col h-full bg-white border-r border-border items-center justify-center">
        <div className="w-5 h-5 border border-border border-t-accent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white border-r border-border relative">
      {/* Drag the panel edge to resize (max = five cards per row) */}
      <div
        onMouseDown={startResize}
        title="Drag to resize"
        className="absolute right-0 top-0 bottom-0 w-[6px] cursor-col-resize z-20 hover:bg-[#C5D2B8]/50"
      />
      {/* Everything scrolls; the toggle row below sticks to the top */}
      <div className="flex-1 min-h-0 overflow-y-auto">
      <div className="border-b border-border bg-white">
        <div className="p-4 pb-3 space-y-3">
          {/* Language first: card names follow it, so a parent who reads
              Marathi can pick cards without reading English. */}
          <label className="flex items-center gap-2.5 h-[46px] px-3 rounded-xl border-[1.5px] border-accent-strong bg-accent-soft cursor-pointer">
            <svg className="w-[18px] h-[18px] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9"><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18" /></svg>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              aria-label="Card language"
              className="flex-1 min-w-0 appearance-none bg-transparent border-0 outline-none font-bold text-[15px] text-ink cursor-pointer"
            >
              {Object.keys(LANGUAGES).map((code) => (
                <option key={code} value={code}>{languageLabel(code)}</option>
              ))}
            </select>
            <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M6 9l6 6 6-6" /></svg>
          </label>

          {/* One box: type to search, or pick a category from the list */}
          <div className="flex items-center gap-2">
            <div className="relative flex-1 min-w-0">
              <div className="flex items-center gap-1.5 min-h-[44px] px-2.5 rounded-xl border border-input-border bg-white focus-within:border-accent-strong focus-within:ring-2 focus-within:ring-weekly-accent/30">
                <svg className="w-4 h-4 shrink-0 stroke-ink-2 fill-none" viewBox="0 0 24 24" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
                {selectedCategory && (
                  <span className="inline-flex items-center gap-1 rounded-lg bg-accent-soft text-accent-hover pl-2 pr-0.5 py-0.5 text-[12.5px] font-semibold whitespace-nowrap max-w-[55%]">
                    <span className="truncate">{catName(selectedCategory)}</span>
                    <button type="button" onClick={() => setSearchOrCategory("")} aria-label="Clear category" className="w-5 h-5 rounded-md hover:bg-[#D7E3C9] leading-none text-[15px]">×</button>
                  </span>
                )}
                <input
                  type="search"
                  placeholder={selectedCategory ? "" : "Search or pick category"}
                  value={selectedCategory ? "" : searchOrCategory}
                  onChange={(e) => {
                    setSearchOrCategory(e.target.value);
                    setIsDropdownOpen(e.target.value === "");
                  }}
                  onFocus={() => { if (!searchOrCategory || selectedCategory) setIsDropdownOpen(true); }}
                  onBlur={() => setTimeout(() => setIsDropdownOpen(false), 150)}
                  aria-label="Search cards or pick a category"
                  aria-expanded={isDropdownOpen}
                  className="flex-1 min-w-0 h-10 bg-transparent border-0 outline-none text-[14px] text-ink placeholder:text-ink-3"
                />
                <button type="button" onMouseDown={(e) => { e.preventDefault(); setIsDropdownOpen((v) => !v); }} aria-label="Show categories" className="w-6 h-6 shrink-0 flex items-center justify-center">
                  <svg className={`w-3.5 h-3.5 stroke-ink-2 fill-none transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} viewBox="0 0 24 24" strokeWidth="2.2" strokeLinecap="round"><path d="M6 9l6 6 6-6" /></svg>
                </button>
              </div>
              {isDropdownOpen && (
                <ul role="listbox" className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-border rounded-xl shadow-[0_12px_28px_rgba(30,42,36,0.14)] z-50 max-h-72 overflow-y-auto p-1.5 m-0 list-none animate-[vsSlideDown_180ms_ease-out]">
                  <li className="px-2.5 pt-1.5 pb-1 text-[11px] font-bold tracking-wider uppercase text-ink-3">Categories</li>
                  {categories.map((catId) => (
                    <li
                      key={catId}
                      role="option"
                      aria-selected={selectedCategory === catId}
                      onMouseDown={(e) => { e.preventDefault(); setSearchOrCategory(catId); setIsDropdownOpen(false); }}
                      className={`flex justify-between items-center px-2.5 py-2.5 rounded-lg cursor-pointer text-[14px] font-medium ${selectedCategory === catId ? "bg-accent-soft" : "hover:bg-accent-soft"}`}
                    >
                      {catName(catId)} <span className="text-ink-3 text-[12px]">{categoryCounts[catId] || 0}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {/* One tag: tap to cycle All → Free → Paid */}
            <button
              type="button"
              onClick={cycleAccess}
              aria-label={`Showing ${accessFilter || "all"} cards. Tap to change`}
              className={`h-11 min-w-[78px] px-3.5 rounded-xl border flex items-center justify-center gap-2 font-semibold text-[14px] transition-colors ${
                accessFilter === "free" ? "bg-accent-soft border-[#9DB887] text-[#2E4A22]"
                : accessFilter === "paid" ? "bg-[#FFF3E6] border-[#EBC993] text-[#7A4E12]"
                : "bg-white border-input-border text-ink"
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${accessFilter === "free" ? "bg-[#5E8F48]" : accessFilter === "paid" ? "bg-[#D9922E]" : "bg-[conic-gradient(#7FAF6A_0_50%,#E0A246_50%_100%)]"}`} />
              {accessFilter === "free" ? "Free" : accessFilter === "paid" ? "Paid" : "All"}
            </button>
          </div>
        </div>
      </div>

      {/* STICKY: free/paid + characters stay visible while browsing */}
      <div className="sticky top-0 z-20 bg-white border-b border-border px-4 py-2.5 flex items-center gap-3 min-h-[54px]">
        <span className="text-[13px] font-semibold text-ink-2">Character</span>
        {!charactersLocked && (
          <div className="flex gap-1.5">
            {(["neutral", "boy", "girl", "brown"] as Gender[]).map((g) => {
              const active = gender === g;
              const faceImg = CHARACTER_FACES[g];
              return (
                <button
                  key={g}
                  type="button"
                  aria-pressed={active}
                  onClick={() => {
                    setGender(g);
                    setForceUpdate((prev) => prev + 1);
                  }}
                  aria-label={GENDER_LABELS[g]}
                  title={GENDER_LABELS[g]}
                  className={`w-9 h-9 rounded-full overflow-hidden border-2 shrink-0 transition-all ${
                    active
                      ? "border-accent-strong ring-2 ring-accent-soft"
                      : "border-transparent opacity-75 hover:opacity-100"
                  }`}
                >
                  {faceImg ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={faceImg} alt={GENDER_LABELS[g]} className="w-full h-full object-cover object-top bg-white" />
                  ) : (
                    <span className="text-[12px] font-sans text-ink-3 uppercase">{g[0]}</span>
                  )}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* CARDS SECTION */}
      <div className="px-4 py-4">
        {filteredCards.length === 0 ? (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <p className="text-[12px] text-[#666] font-medium">No cards found</p>
              <p className="text-[12px] text-[#999] mt-1">Try a different search or category</p>
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
                    className="w-full flex items-center justify-between text-[14px] font-semibold text-ink-2 mb-2.5"
                  >
                    <span>
                      {catName(catId)} <span className="text-ink-3 font-medium">({categoryCards.length})</span>
                    </span>
                    <svg
                      className={`w-3.5 h-3.5 stroke-[#B0ACA6] stroke-2 fill-none transition-transform ${collapsedCats.has(catId) ? "-rotate-90" : ""}`}
                      viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"
                    >
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </button>
                  {!collapsedCats.has(catId) && (
                  <div className="grid gap-2.5 grid-cols-[repeat(auto-fill,minmax(98px,1fr))]">
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

      </div>

      {/* Floating unlock button — hidden once subscribed */}
      {!hasSubscription && (
        <button
          onClick={() => { window.location.href = "/plans"; }}
          title="Unlock all cards"
          className="absolute bottom-4 right-4 z-30 w-12 h-12 rounded-full bg-weekly-accent text-white text-[18px] shadow-lg hover:bg-accent-strong-hover transition-all flex items-center justify-center"
        >
          🔓
        </button>
      )}
    </div>
  );

  function handleAddCard(cardId: string, catId: string) {
    if (onAddCard) { onAddCard(cardId); return; }
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
