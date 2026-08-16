"use client";

// Mobile-only builder — green "Grow Gently mobile" identity.
//
// Drop-in replacement for the previous mobile builder: SAME export name,
// SAME props, SAME state/hooks (useScheduleState, useExport, ScheduleCanvas),
// so ScheduleBuilder.tsx and the build are untouched. Only the look and the
// on-page flow change. Desktop is unaffected — this renders only under the
// max-width:767px switch in ScheduleBuilder.tsx.
//
// Cards, categories, character variants, paid-locking and export are all the
// real thing (D1 via getRuntimeCards, R2 images, /api/user/subscription,
// useExport). Nothing here is placeholder.

import { useState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { LANGUAGES, GRID_SPECS, type Language, type Gender, type ScheduleType } from "@/lib/constants";
import {
  CATEGORIES,
  ALL_CARDS,
  getRuntimeCards,
  getCardLabel,
  getCardImageUrl,
  getCardGender,
  findCard,
  isCharacterCard,
  type ParsedCard,
} from "@/lib/card-data";
import { useScheduleState } from "@/hooks/useScheduleState";
import { useExport } from "@/hooks/useExport";
import { ScheduleCanvas } from "@/components/schedule/ScheduleCanvas";
import { A4_PORTRAIT } from "@/lib/constants";
import type { CardImageMap } from "@/lib/card-data";

type Step = "layout" | "cards" | "final";

const CHARACTER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "neutral", label: "Neutral" },
  { value: "boy", label: "Boy" },
  { value: "girl", label: "Girl" },
  { value: "brown", label: "Brown" },
];

// Mobile-appropriate schedule types (portrait-friendly). Driven by the verified
// store setter setScheduleType — no dependency on @/lib/layouts.
const TYPES: { id: ScheduleType; label: string }[] = [
  { id: "mini", label: "My Schedule" },
  { id: "daily", label: "Daily" },
  { id: "firstthen", label: "First / Then" },
  { id: "iwant", label: "I Want" },
];

/* Green identity — arbitrary Tailwind values compile fine in the app build. */
const GREEN = "#4A5A3E";
const GREEN_DARK = "#3A4830";
const GREEN_SOFT = "#EAF1E2";
const GREEN_BORDER = "#C7D4B8";
const INK = "#1E2A24";
const SUB = "#6C7A72";
const BORDER = "#E6EBE6";
const FAINT = "#9AA69E";

// Simple drawn face per character option — teal/green like the rest of the
// app, with just enough difference (hair shape, or a warmer skin tone for
// "brown") to tell them apart at a glance. Never wrong, unlike pulling an
// image off whatever card in the library happened to be flagged "character."
function FaceIcon({ variant }: { variant: Gender }) {
  // Files now live at /faces/face-<variant>.png. The onError fallback covers
  // the older /face/ folder and the face-neutral..png double-dot name, so
  // this keeps working whichever naming is live — no more blank circles if
  // the files get tidied again.
  const primary = `/faces/face-${variant}.png`;
  const fallbacks = [
    `/face/face-${variant}.png`,
    variant === "neutral" ? "/face/face-neutral..png" : "",
  ].filter(Boolean);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={primary}
      alt=""
      className="w-full h-full object-cover"
      loading="lazy"
      onError={(e) => {
        const img = e.currentTarget;
        const tried = Number(img.dataset.try || "0");
        if (tried < fallbacks.length) {
          img.dataset.try = String(tried + 1);
          img.src = fallbacks[tried];
        }
      }}
    />
  );
}

function SectionLabel({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-end justify-between gap-2 mb-2">
      <div className="text-[13px] font-semibold" style={{ color: INK }}>{children}</div>
      {right}
    </div>
  );
}

function CardTile({
  card, language, gender, isLocked, onAdd, placed,
}: {
  card: ParsedCard;
  language: Language;
  gender: Gender;
  isLocked: boolean;
  onAdd: (cardId: string) => void;
  placed?: boolean;
}) {
  const variant = getCardGender(card, gender);
  const img = getCardImageUrl(card.id, variant) || getCardImageUrl(card.id, "neutral");
  const [justAdded, setJustAdded] = useState(false);
  const [showPaidNotice, setShowPaidNotice] = useState(false);
  return (
    <button
      onClick={() => {
        if (isLocked) {
          setShowPaidNotice(true);
          setTimeout(() => { window.location.href = "/plans"; }, 1400);
          return;
        }
        onAdd(card.id);
        setJustAdded(true);
        setTimeout(() => setJustAdded(false), 1000);
      }}
      className="relative w-full min-w-0 block bg-white rounded-2xl active:scale-95 transition-transform overflow-hidden"
      style={{ border: `1px solid ${BORDER}` }}
    >
      {isLocked && (
        <span
          className="absolute top-1 right-1 z-10 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ background: "#FFF3E6" }}
        >
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="#B5761F" strokeWidth="2.4" strokeLinecap="round">
            <rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" />
          </svg>
        </span>
      )}
      {placed && !justAdded && !isLocked && (
        <span className="absolute top-1 right-1 z-10 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: GREEN_SOFT }}>
          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
        </span>
      )}
      {justAdded && (
        <span className="absolute inset-0 z-20 flex items-center justify-center" style={{ background: "rgba(255,255,255,0.75)" }}>
          <span className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: GREEN }}>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
          </span>
        </span>
      )}
      {showPaidNotice && (
        <span className="absolute inset-0 z-20 flex flex-col items-center justify-center gap-1 text-center px-1.5" style={{ background: "rgba(255,243,230,0.97)" }}>
          <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#B5761F" strokeWidth="2.4" strokeLinecap="round"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
          <span className="text-[10px] font-bold leading-tight" style={{ color: "#B5761F" }}>Paid card — taking you to Plans…</span>
        </span>
      )}
      <div className="w-full aspect-square flex items-center justify-center overflow-hidden" style={{ opacity: isLocked ? 0.55 : 1 }}>
        {img ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} alt="" className="w-full h-full object-contain" loading="lazy" />
        ) : (
          <div className="w-full h-full" style={{ background: GREEN_SOFT }} />
        )}
      </div>
      <div className="px-1 py-1.5 text-center leading-tight truncate text-[11px] font-semibold" style={{ borderTop: `1px solid ${BORDER}`, color: isLocked ? SUB : INK }}>
        {getCardLabel(card, language)}
      </div>
    </button>
  );
}

function CategoryRow({
  name, cards, language, gender, placedIds, isLockedCard, onAddCard,
}: {
  name: string;
  cards: ParsedCard[];
  language: Language;
  gender: Gender;
  placedIds: Set<string>;
  isLockedCard: (c: ParsedCard) => boolean;
  onAddCard: (cardId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const COLLAPSED = 9;
  const tooMany = cards.length > COLLAPSED;
  const shown = expanded || !tooMany ? cards : cards.slice(0, COLLAPSED);

  return (
    <div className="pt-1">
      <div className="mb-2">
        <span className="text-[13px] font-bold" style={{ color: INK }}>
          {name} <span className="font-medium" style={{ color: SUB }}>({cards.length})</span>
        </span>
      </div>
      <div className="grid grid-cols-3 gap-2.5">
        {shown.map((card) => (
          <CardTile
            key={card.id}
            card={card}
            language={language}
            gender={gender}
            isLocked={isLockedCard(card)}
            placed={placedIds.has(card.id)}
            onAdd={onAddCard}
          />
        ))}
      </div>
      {/* Below the cards and centred: while scrolling through a long
          category you reach this naturally, instead of having to scroll
          back up to the heading to expand it. */}
      {tooMany && (
        <div className="flex justify-center mt-3">
          <button
            onClick={() => setExpanded((v) => !v)}
            className="px-4 py-2 rounded-full text-[12px] font-bold"
            style={{ background: "#fff", color: GREEN, border: `1.5px solid ${GREEN}` }}
          >
            {expanded ? "Show less" : `See all ${cards.length}`}
          </button>
        </div>
      )}
    </div>
  );
}

export function MobileScheduleBuilder({
  onAddCard,
  cardsLoaded,
  justDroppedSlot,
  cardImages,
  loading = false,
  initialStep,
}: {
  onAddCard: (cardId: string) => void;
  cardsLoaded: boolean;
  justDroppedSlot: string | null;
  cardImages: CardImageMap;
  loading?: boolean;
  initialStep?: Step;
}) {
  const router = useRouter();
  const title = useScheduleState((s) => s.title);
  const setTitle = useScheduleState((s) => s.setTitle);
  const placeCard = useScheduleState((s) => s.placeCard);
  const removeCard = useScheduleState((s) => s.removeCard);
  const language = useScheduleState((s) => s.language);
  const setLanguage = useScheduleState((s) => s.setLanguage);
  const scheduleType = useScheduleState((s) => s.scheduleType);
  const setScheduleType = useScheduleState((s) => s.setScheduleType);
  const miniCardCount = useScheduleState((s) => s.miniCardCount);
  const setMiniCardCount = useScheduleState((s) => s.setMiniCardCount);
  const gridCols = useScheduleState((s) => s.gridCols);
  const setGridCols = useScheduleState((s) => s.setGridCols);
  const gender = useScheduleState((s) => s.gender);
  const setGender = useScheduleState((s) => s.setGender);
  const pages = useScheduleState((s) => s.pages);

  const { exportPDF, exportJPEG, exporting } = useExport();

  // Landscape types don't suit phones — fall back to Daily if one was opened.
  useEffect(() => {
    if (scheduleType === "weekly" || scheduleType === "custom" || scheduleType === "timetable") {
      setScheduleType("daily");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scheduleType]);

  const [orgBanner, setOrgBanner] = useState<{ name: string; code: string } | null>(null);
  const [bannerDismissed, setBannerDismissed] = useState(false);
  useEffect(() => {
    fetch("/api/me/org")
      .then((r) => r.json())
      .then((d) => setOrgBanner(d.via === "code" ? { name: d.org.name, code: d.code } : null))
      .catch(() => setOrgBanner(null));
  }, []);
  const leaveOrgCode = async () => {
    await fetch("/api/me/org", { method: "DELETE" });
    window.location.reload();
  };

  const [adminCatNames, setAdminCatNames] = useState<Record<string, string>>({});
  const [hasSubscription, setHasSubscription] = useState(false);

  useEffect(() => {
    fetch("/api/user/subscription")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setHasSubscription(!!d?.subscription))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/admin/categories")
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        const map: Record<string, string> = {};
        (data?.categories || []).forEach((c: any) => { map[c.id] = c.name; });
        setAdminCatNames(map);
      })
      .catch(() => {});
  }, []);

  const cards: ParsedCard[] = useMemo(() => {
    const db = getRuntimeCards();
    const ids = new Set(db.map((c) => c.id));
    return [...db, ...ALL_CARDS.filter((c) => !ids.has(c.id))];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardsLoaded]);

  const catName = (id: string) => adminCatNames[id] || id;

  const groupedCategories = useMemo(() => {
    const order: string[] = [];
    const seen = new Set<string>();
    CATEGORIES.forEach((c: any) => { if (!seen.has(c.id)) { seen.add(c.id); order.push(c.id); } });
    cards.forEach((c) => { if (c.categoryId && !seen.has(c.categoryId)) { seen.add(c.categoryId); order.push(c.categoryId); } });

    const byCat = new Map<string, ParsedCard[]>();
    cards.forEach((card) => {
      const key = card.categoryId || "other";
      if (!byCat.has(key)) byCat.set(key, []);
      byCat.get(key)!.push(card);
    });

    const groups = order
      .filter((id) => (byCat.get(id) || []).length > 0)
      .map((id) => ({ id, name: catName(id), cards: byCat.get(id)! }));

    const orphans = byCat.get("other");
    if (orphans?.length) groups.push({ id: "other", name: "Other", cards: orphans });
    return groups;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cards, adminCatNames]);

  // Default the Add Step filter to Daily Routine (the first category), so it
  // opens on the most-used cards rather than the whole library — matching
  // desktop. Only applied once, and only while still on "all", so it never
  // overrides a category the user picked themselves.
  const catDefaultedRef = useRef(false);
  useEffect(() => {
    if (catDefaultedRef.current || groupedCategories.length === 0) return;
    const daily =
      groupedCategories.find((g) => /daily/i.test(g.name)) || groupedCategories[0];
    if (daily) {
      catDefaultedRef.current = true;
      setAddStepCat((cur) => (cur === "all" ? daily.id : cur));
    }
  }, [groupedCategories]);

  const showCharacters = useMemo(() => cards.some((c) => isCharacterCard(c)), [cards]);
  useEffect(() => {
    if (!showCharacters && gender !== "neutral") setGender("neutral");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCharacters]);

  const isLockedCard = (card: ParsedCard) => (card as any).isFree === false && !hasSubscription;

  const placedIds = useMemo(() => {
    const ids = new Set<string>();
    pages.forEach((p: any) => {
      (p.slots || []).forEach((s: any) => s?.cardId && ids.add(s.cardId));
      Object.values(p.columns || {}).forEach((col: any) => (col || []).forEach((e: any) => e?.cardId && ids.add(e.cardId)));
    });
    return ids;
  }, [pages]);

  const { placedCount, totalSlots } = useMemo(() => {
    const p = pages[0] as any;
    if (scheduleType === "daily") {
      const placed = (p?.slots || []).filter((s: any) => !!s).length;
      return { placedCount: placed, totalSlots: p?.slots?.length || 0 };
    }
    if (scheduleType === "mini") return { placedCount: (p?.columns?.["0"] || []).length, totalSlots: miniCardCount };
    // Both of these render CutoutStrip with 9 cards — First/Then reported 0
    // (so no count showed at all) and I Want reported 6, neither matching
    // what's actually on the page.
    if (scheduleType === "iwant" || scheduleType === "firstthen") {
      return { placedCount: (p?.columns?.["cutout"] || []).length, totalSlots: 9 };
    }
    return { placedCount: 0, totalSlots: 0 };
  }, [pages, scheduleType, miniCardCount]);

  // Fit the A4 page to the screen — constrained by height as well as width,
  // so the whole schedule is visible at once instead of running off the
  // bottom and needing a scroll. ~330px accounts for the controls above the
  // canvas (header, name, type, count) and the sticky Save bar below.
  const [zoom, setZoom] = useState(0.5);
  useEffect(() => {
    const update = () => {
      const byWidth = (window.innerWidth - 26) / A4_PORTRAIT.width;
      const byHeight = (window.innerHeight - 330) / A4_PORTRAIT.height;
      setZoom(Math.max(0.2, Math.min(1, byWidth, byHeight)));
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => { window.removeEventListener("resize", update); window.removeEventListener("orientationchange", update); };
  }, []);

  useEffect(() => {
    if (initialStep === "cards") {
      setTimeout(() => setShowAddStep(true), 300);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [showDownload, setShowDownload] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  // Downloads land silently on a phone — the file just appears in Files/
  // Photos with no visible feedback in the browser. Tell them where it went.
  const runExport = async (fn: () => Promise<void> | void, what: string) => {
    try {
      await fn();
      setShowDownload(false);
      setToast(`${what} downloaded — check your Files or Photos.`);
      // Long enough to read the toast, then back to the home page where the
      // schedule is now sitting at the top of Recently Added.
      setTimeout(() => router.push("/schedules"), 2200);
    } catch {
      /* useExport already surfaces its own error */
    }
  };
  const [showAddStep, setShowAddStep] = useState(false);
  const [addStepCat, setAddStepCat] = useState<string>("all");
  const [accessFilter, setAccessFilter] = useState<"all" | "free" | "paid">("all");

  // Save / Download — Save posts/updates this schedule; once it succeeds the
  // sticky button becomes Download. Editing anything after that reverts it
  // to Save, so Download never offers a stale export.
  const DRAFT_KEY = "vs_draft_mobile_schedule";
  const ACTIVE_ID_KEY = "vs_active_schedule_id";
  // The id of the row being edited. Kept in its own sessionStorage key so a
  // remount reuses it — previously the id lived only in the draft, which is
  // deleted on a successful save, so remounting minted a fresh id and the
  // next Save inserted a SECOND row (the duplicate in Recently Added).
  // Cleared by the home page's "Create Schedule" button to start fresh.
  const isNewScheduleRef = useRef(false);
  const [scheduleId] = useState<string>(() => {
    try {
      const active = sessionStorage.getItem(ACTIVE_ID_KEY);
      if (active) return active;
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (raw) { const d = JSON.parse(raw); if (d.id) return d.id; }
    } catch {}
    // Nothing stored -> this is a brand-new schedule (Create Schedule clears
    // both keys). Flag it so the store gets wiped below; the store survives
    // client-side navigation, so without this the new schedule opened
    // pre-filled with the previous one's steps.
    isNewScheduleRef.current = true;
    const fresh = crypto.randomUUID();
    try { sessionStorage.setItem(ACTIVE_ID_KEY, fresh); } catch {}
    return fresh;
  });
  const [saved, setSaved] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [saveAsTemplate, setSaveAsTemplate] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [authed, setAuthed] = useState(false);
  useEffect(() => {
    fetch("/api/auth/session", { cache: "no-store" })
      .then((r) => r.json())
      .then((d) => {
        setIsAdmin(d?.user?.role === "admin");
        if (d?.user) {
          setAuthed(true);
        } else {
          // Not signed in — send straight to login before any of the
          // create UI renders, rather than letting them build and only
          // discovering they need an account at Save.
          router.push("/login?next=/schedule");
        }
        setAuthChecked(true);
      })
      .catch(() => setAuthChecked(true));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const mountedRef = useRef(false);

  // Share this id with the global store. The export hook also saves on
  // download; without this the store id would be null there, the server would
  // mint a different id, and the schedule would appear twice.
  useEffect(() => {
    if (isNewScheduleRef.current) {
      // Blank slate: clears title, pages, type, language and character.
      useScheduleState.getState().reset();
      isNewScheduleRef.current = false;
    }
    useScheduleState.setState({ id: scheduleId });
    // Persist on every path (fresh id, restored draft, or edit), so the
    // export hook's sessionStorage fallback always finds it.
    try { sessionStorage.setItem(ACTIVE_ID_KEY, scheduleId); } catch {}
  }, [scheduleId]);

  // Restore a draft if Save had to send us to sign in — rebuilds the pages
  // via the store's own placeCard so no new store method is needed.
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d.title) setTitle(d.title);
      if (d.scheduleType) setScheduleType(d.scheduleType);
      if (d.language) setLanguage(d.language);
      if (d.gender) setGender(d.gender);
      if (d.gridCols) setGridCols(d.gridCols);
      if (d.miniCardCount) setMiniCardCount(d.miniCardCount);
      (d.pages || []).forEach((p: any, pageIdx: number) => {
        (p.slots || []).forEach((c: any, i: number) => { if (c) placeCard(pageIdx, String(i), c); });
        Object.entries(p.columns || {}).forEach(([key, arr]: [string, any]) => {
          (arr || []).forEach((c: any) => placeCard(pageIdx, key, c));
        });
      });
      sessionStorage.removeItem(DRAFT_KEY);
    } catch {}
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Any change after a successful save means Download would be stale —
  // fall back to Save. Skips the very first render (the mount itself, and
  // the draft-restore above, both touch pages/title).
  useEffect(() => {
    if (!mountedRef.current) { mountedRef.current = true; return; }
    setSaved(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pages, title]);

  // Once the schedule is full there's nothing left to add — go straight
  // back to the canvas rather than leaving them on a dead-end picker.
  useEffect(() => {
    if (showAddStep && totalSlots > 0 && placedCount >= totalSlots) {
      setShowAddStep(false);
    }
  }, [showAddStep, placedCount, totalSlots]);

  // Flatten the store's pages into a plain ordered list for the mobile UI.
  // Keeps the store as the single source of truth (so the off-screen canvas,
  // export and desktop all stay in sync) while showing a simple list.
  const stepList = useMemo(() => {
    const out: { pageIdx: number; slotKey: string; cardIdx?: number; label: string; img: string | null }[] = [];
    const resolve = (cardId: string) => {
      const card = findCard(cardId);
      return {
        label: card ? getCardLabel(card, language) : cardId,
        img: card ? (getCardImageUrl(card.id, getCardGender(card, gender)) || getCardImageUrl(card.id, "neutral")) : null,
      };
    };
    (pages as any[]).forEach((p, pageIdx) => {
      (p?.slots || []).forEach((s: any, i: number) => {
        if (s?.cardId) out.push({ pageIdx, slotKey: String(i), ...resolve(s.cardId) });
      });
      Object.entries(p?.columns || {}).forEach(([slotKey, arr]: [string, any]) => {
        (arr || []).forEach((c: any, cardIdx: number) => {
          if (c?.cardId) out.push({ pageIdx, slotKey, cardIdx, ...resolve(c.cardId) });
        });
      });
    });
    return out;
  }, [pages, language, gender, cardsLoaded]);

  const save = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const res = await fetch(`/api/schedules/${scheduleId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title, scheduleType, language, gender, gridCols,
          weekMode: "week", cardStyle: "white",
          data: { pages },
          isTemplate: isAdmin && saveAsTemplate,
        }),
      });
      const data = await res.json();
      if (res.ok && data.saved) {
        setSaved(true);
        try {
          sessionStorage.removeItem(DRAFT_KEY);
          sessionStorage.setItem(ACTIVE_ID_KEY, scheduleId);
        } catch {}
        return;
      }
      // Not signed in — keep the draft (including this id, so the same
      // schedule keeps building on return) and send them to sign in.
      try {
        sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ id: scheduleId, title, scheduleType, language, gender, gridCols, miniCardCount, pages }));
      } catch {}
      router.push("/login?next=/schedule");
    } catch {
      setSaveError("Couldn't save — check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading || !authChecked || !authed) {
    return (
      <div className="flex items-center justify-center min-h-full py-24" style={{ background: "#F5F8F5" }}>
        <div className="w-6 h-6 rounded-full animate-spin" style={{ border: `2px solid ${BORDER}`, borderTopColor: GREEN }} />
      </div>
    );
  }

  return (
    <div className="px-4 pb-24 pt-3 min-h-full" style={{ background: "#F5F8F5" }}>
      {orgBanner && !bannerDismissed && (
        <div className="flex items-center justify-between gap-2 rounded-2xl px-3 py-2 mb-3" style={{ background: GREEN_SOFT, border: `1px solid ${GREEN_BORDER}` }}>
          <span className="text-[12px]" style={{ color: GREEN_DARK }}>
            Branding: <span className="font-semibold">{orgBanner.name}</span> (code {orgBanner.code})
          </span>
          <div className="flex items-center gap-3 shrink-0">
            <button onClick={leaveOrgCode} className="text-[12px] font-semibold underline" style={{ color: "#C53030" }}>
              Not you? Leave
            </button>
            <button onClick={() => setBannerDismissed(true)} aria-label="Dismiss">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke={GREEN_DARK} strokeWidth="2.2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0" style={{ background: GREEN_SOFT }}>
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="5" width="16" height="15" rx="2" /><path d="M8 3v4M16 3v4M4 10h16" /></svg>
          </div>
          <h1 className="font-bold text-[17px]" style={{ color: INK }}>Visual Schedule</h1>
        </div>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value as Language)}
          className="py-1.5 px-2.5 bg-white text-[13px] rounded-lg shrink-0"
          style={{ border: `1px solid ${BORDER}`, color: INK }}
          aria-label="Language"
        >
          {Object.entries(LANGUAGES).map(([code, name]) => (
            <option key={code} value={code}>{name}</option>
          ))}
        </select>
      </div>

      {/* Name — inline, no separate screen */}
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        maxLength={40}
        placeholder="Name this schedule"
        className="w-full px-3.5 py-2.5 rounded-xl text-[15px] font-bold outline-none mb-4"
        style={{ border: `1.5px solid ${GREEN_BORDER}`, color: INK, background: "#fff" }}
        aria-label="Schedule name"
      />

      {/* 1 · Type + card count — one compact row */}
      <section className="flex gap-2.5">
        <select
          value={scheduleType}
          onChange={(e) => {
            const next = e.target.value as ScheduleType;
            if (next !== scheduleType && placedIds.size > 0 &&
                !window.confirm("Changing type clears the cards you've added. Continue?")) return;
            setScheduleType(next);
          }}
          className="flex-1 min-w-0 py-1.5 px-2.5 bg-white text-[13px] font-semibold rounded-lg"
          style={{ border: `1px solid ${BORDER}`, color: INK }}
          aria-label="Schedule type"
        >
          {TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
        </select>

        {(scheduleType === "mini" || scheduleType === "daily") && (
          scheduleType === "mini" ? (
            <select
              value={miniCardCount}
              onChange={(e) => setMiniCardCount(Number(e.target.value) as 2 | 3 | 4 | 5)}
              className="flex-1 min-w-0 py-1.5 px-2.5 bg-white text-[13px] font-semibold rounded-lg"
              style={{ border: `1px solid ${BORDER}`, color: INK }}
              aria-label="Number of cards"
            >
              {[2, 3, 4, 5].map((n) => <option key={n} value={n}>{n} cards</option>)}
            </select>
          ) : (
            <select
              value={gridCols}
              onChange={(e) => setGridCols(Number(e.target.value) as 2 | 3 | 4)}
              className="flex-1 min-w-0 py-1.5 px-2.5 bg-white text-[13px] font-semibold rounded-lg"
              style={{ border: `1px solid ${BORDER}`, color: INK }}
              aria-label="Number of cards"
            >
              {([2, 3, 4] as const).map((c) => <option key={c} value={c}>{GRID_SPECS[c].slots} cards</option>)}
            </select>
          )
        )}
      </section>

      {/* Your schedule — a plain to-do list. The A4 canvas is no longer
          shown on mobile (it never scaled well on a phone), but it stays
          mounted off-screen below so Download still produces the same
          printable page. */}
      <section className="mt-3">
        <SectionLabel right={totalSlots > 0 ? <span className="text-[12px]" style={{ color: SUB }}>{placedCount}/{totalSlots} added</span> : undefined}>
          Your schedule
        </SectionLabel>

        <div className="space-y-2.5">
          {stepList.map((s, i) => (
            <div key={`${s.pageIdx}-${s.slotKey}-${s.cardIdx}-${i}`}
              className="flex items-center gap-3 p-3 rounded-2xl"
              style={{ background: "#fff", border: `1px solid ${BORDER}` }}>
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-[13px] font-bold shrink-0"
                style={{ border: `2px solid ${GREEN}`, color: GREEN }}>{i + 1}</div>
              <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center shrink-0" style={{ background: GREEN_SOFT }}>
                {s.img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={s.img} alt="" className="w-full h-full object-contain" />
                ) : null}
              </div>
              <span className="flex-1 font-bold text-[15px]" style={{ color: INK }}>{s.label}</span>
              <button
                onClick={() => removeCard(s.pageIdx, s.slotKey, s.cardIdx)}
                aria-label="Remove step"
                className="w-8 h-8 flex items-center justify-center shrink-0"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="#C0463F" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>
          ))}

          {stepList.length === 0 && (
            <p className="text-center text-[13px] py-6" style={{ color: FAINT }}>No steps yet — add your first one below.</p>
          )}

          {(totalSlots === 0 || placedCount < totalSlots) && (
            <button
              onClick={() => setShowAddStep(true)}
              className="w-full py-3.5 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2"
              style={{ background: "#fff", color: GREEN, border: `1.5px solid ${GREEN}` }}
            >
              + Add Step
              {totalSlots > 0 && <span className="text-[12px] font-medium" style={{ color: FAINT }}>({placedCount}/{totalSlots})</span>}
            </button>
          )}
        </div>

        {/* Off-screen printable page — only what Download/Print reads. */}
        <div
          aria-hidden
          style={exporting
            ? undefined
            : { position: "absolute", left: -99999, top: 0, width: A4_PORTRAIT.width, pointerEvents: "none" }}
        >
          <ScheduleCanvas justDroppedSlot={justDroppedSlot} cardImages={cardImages} />
        </div>
      </section>

      {isAdmin && !saved && (
        <label className="flex items-center gap-2.5 mt-4 p-3 rounded-2xl" style={{ background: GREEN_SOFT, border: `1px solid ${GREEN_BORDER}` }}>
          <input
            type="checkbox"
            checked={saveAsTemplate}
            onChange={(e) => setSaveAsTemplate(e.target.checked)}
            className="w-[18px] h-[18px] shrink-0"
            style={{ accentColor: GREEN }}
          />
          <span className="text-[13px] font-semibold" style={{ color: GREEN_DARK }}>Save as a template for everyone (Admin)</span>
        </label>
      )}

      {/* 5 · Save, then Download once it's actually saved */}
      <div className="fixed bottom-0 left-0 right-0 px-4 pb-4 pt-3" style={{ background: "linear-gradient(to top, #F5F8F5 60%, transparent)" }}>
        {saveError && <p className="text-[12px] text-center mb-2" style={{ color: "#DC4C4C" }}>{saveError}</p>}
        <button
          onClick={() => (saved ? setShowDownload(true) : save())}
          disabled={saving}
          className="w-full py-3.5 rounded-2xl text-white text-[15px] font-bold disabled:opacity-60"
          style={{ background: GREEN, boxShadow: "0 6px 16px rgba(74,90,62,0.28)" }}
        >
          {saving ? "Saving…" : saved ? "Download" : (isAdmin && saveAsTemplate ? "Save as Template" : "Save")}
        </button>
      </div>

      {/* Download confirmation */}
      {toast && (
        <div className="fixed left-0 right-0 bottom-24 z-[400] flex justify-center px-6 pointer-events-none">
          <div
            className="flex items-center gap-2.5 px-4 py-3 rounded-2xl shadow-lg max-w-sm"
            style={{ background: INK, color: "#fff" }}
          >
            <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="#9FD6B4" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            <span className="text-[13px] font-semibold leading-snug">{toast}</span>
          </div>
        </div>
      )}

      {/* Download sheet */}
      {showDownload && (
        <div className="fixed inset-0 z-[300] flex items-end justify-center" style={{ background: "rgba(28,27,25,0.5)" }} onClick={() => setShowDownload(false)}>
          <div className="bg-white w-full rounded-t-3xl p-5 pb-7 space-y-2.5" onClick={(e) => e.stopPropagation()}>
            <p className="font-bold text-[16px] mb-1" style={{ color: INK }}>Print / Download</p>

            <button
              onClick={() => runExport(exportJPEG, "Image")}
              disabled={exporting}
              className="w-full flex items-center gap-3 p-4 rounded-2xl text-left disabled:opacity-60"
              style={{ border: `1px solid ${BORDER}` }}
            >
              <span className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "#E9F1FA" }}>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#3E7CB1" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><polyline points="21 15 16 10 5 21" /></svg>
              </span>
              <span className="flex-1 font-bold text-[14px]" style={{ color: INK }}>{exporting ? "Preparing…" : "Download Image"}</span>
            </button>

            <button
              onClick={() => runExport(exportPDF, "PDF")}
              disabled={exporting}
              className="w-full flex items-center gap-3 p-4 rounded-2xl text-left disabled:opacity-60"
              style={{ border: `1px solid ${BORDER}` }}
            >
              <span className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: "#FBECEC" }}>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="#D9534F" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg>
              </span>
              <span className="flex-1 font-bold text-[14px]" style={{ color: INK }}>{exporting ? "Preparing…" : "Download PDF"}</span>
            </button>

            <button
              onClick={() => window.print()}
              className="w-full flex items-center gap-3 p-4 rounded-2xl text-left"
              style={{ border: `1px solid ${BORDER}` }}
            >
              <span className="w-11 h-11 rounded-xl flex items-center justify-center" style={{ background: GREEN_SOFT }}>
                <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={GREEN} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>
              </span>
              <span className="flex-1 font-bold text-[14px]" style={{ color: INK }}>Print</span>
            </button>

            <button onClick={() => setShowDownload(false)} className="w-full py-2.5 text-[13px] font-semibold" style={{ color: SUB }}>Close</button>
          </div>
        </div>
      )}

      {/* Add Step — opened by the + on the canvas. Category as a dropdown
          and the 4 character faces up top, per your note. */}
      {showAddStep && (
        <div className="fixed inset-0 z-[300] flex flex-col" style={{ background: "#F5F8F5" }}>
          <div className="flex items-center justify-between px-4 pt-4 pb-3" style={{ background: "#fff", borderBottom: `1px solid ${BORDER}` }}>
            <div>
              <span className="font-bold text-[16px]" style={{ color: INK }}>Add Step</span>
              {totalSlots > 0 && (
                <span className="block text-[12px] mt-0.5" style={{ color: placedCount >= totalSlots ? GREEN_DARK : SUB }}>
                  {placedCount} of {totalSlots} added
                  {placedCount < totalSlots ? ` · ${totalSlots - placedCount} more to go` : " · all done"}
                </span>
              )}
            </div>
            <button onClick={() => setShowAddStep(false)} aria-label="Close" className="w-8 h-8 flex items-center justify-center">
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={SUB} strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
            </button>
          </div>

          <div className="px-4 pt-3">
            <div className="flex items-center gap-2 mb-3">
              {showCharacters && (
                <div className="flex gap-2">
                  {CHARACTER_OPTIONS.map((o) => {
                    const active = gender === o.value;
                    return (
                      <button
                        key={o.value}
                        onClick={() => setGender(o.value)}
                        aria-label={o.label}
                        className="w-11 h-11 rounded-full overflow-hidden flex items-center justify-center shrink-0"
                        style={active
                          ? { background: GREEN_SOFT, border: `2.5px solid ${GREEN}` }
                          : { background: GREEN_SOFT, border: `1.5px solid ${BORDER}`, opacity: 0.7 }}
                      >
                        <FaceIcon variant={o.value} />
                      </button>
                    );
                  })}
                </div>
              )}

              {/* Free / Paid filter — sits beside the character faces */}
              <div className="flex ml-auto rounded-xl overflow-hidden shrink-0" style={{ border: `1px solid ${BORDER}` }}>
                {([
                  { id: "all", label: "All" },
                  { id: "free", label: "Free" },
                  { id: "paid", label: "Paid" },
                ] as const).map((o) => {
                  const active = accessFilter === o.id;
                  return (
                    <button
                      key={o.id}
                      onClick={() => setAccessFilter(o.id)}
                      className="px-3 py-2 text-[12px] font-bold"
                      style={active
                        ? { background: GREEN, color: "#fff" }
                        : { background: "#fff", color: SUB }}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <select
              value={addStepCat}
              onChange={(e) => setAddStepCat(e.target.value)}
              className="w-full py-2.5 px-3 bg-white text-[14px] font-semibold rounded-xl mb-3"
              style={{ border: `1px solid ${BORDER}`, color: INK }}
            >
              <option value="all">All categories</option>
              {groupedCategories.map((g) => (
                <option key={g.id} value={g.id}>{g.name} ({g.cards.length})</option>
              ))}
            </select>
          </div>

          <div className="flex-1 overflow-y-auto px-4 pb-4">
            {(() => {
              const byCat = addStepCat === "all" ? groupedCategories : groupedCategories.filter((g) => g.id === addStepCat);
              // Free/paid uses the same isFree flag the padlock reads, so the
              // filter and the lock icons can never disagree.
              const groups = byCat
                .map((g) => ({
                  ...g,
                  cards: accessFilter === "all"
                    ? g.cards
                    : g.cards.filter((c) => ((c as any).isFree !== false) === (accessFilter === "free")),
                }))
                .filter((g) => g.cards.length > 0);
              if (groups.length === 0) return <p className="text-[12px] py-3" style={{ color: SUB }}>No cards match this filter.</p>;
              return (
                <div className="space-y-4">
                  {groups.map((g) => (
                    <CategoryRow
                      key={g.id}
                      name={g.name}
                      cards={g.cards}
                      language={language}
                      gender={gender}
                      placedIds={placedIds}
                      isLockedCard={isLockedCard}
                      onAddCard={onAddCard}
                    />
                  ))}
                </div>
              );
            })()}
          </div>

          {/* Done — tap cards to add them, then come back to the canvas. */}
          <div className="px-4 pb-4 pt-3 shrink-0" style={{ background: "#fff", borderTop: `1px solid ${BORDER}` }}>
            <button
              onClick={() => setShowAddStep(false)}
              className="w-full py-3.5 rounded-2xl text-white text-[15px] font-bold"
              style={{ background: GREEN, boxShadow: "0 6px 16px rgba(74,90,62,0.28)" }}
            >
              {totalSlots > 0 && placedCount < totalSlots
                ? `Done · ${placedCount}/${totalSlots} added`
                : "Done"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
