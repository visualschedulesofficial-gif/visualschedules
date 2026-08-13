"use client";

// /schedule/new — the wizard flow from the approved prototype, built for
// real: templates → step list (drag reorder, mark cover, remove) → add-step
// library (real D1 cards, paid-lock) → preview → save.
//
// This is NEW code and does not touch useScheduleState, ScheduleCanvas, or
// the desktop 3-panel builder — /schedule (the grid/slot builder) is
// completely unaffected. Saving uses the exact same POST /api/schedules your
// app already uses, as scheduleType "daily" (its slots are literally an
// ordered list — the same shape as "steps"). On save it hands off to your
// existing /schedules list.
//
// Three honest simplifications vs. the prototype, because the real schema
// doesn't have fields for them yet:
//  1. Templates are matched against your REAL card library by label search
//     (e.g. "wake up" → whichever card's English label contains that
//     phrase). If a template step's label isn't in your library yet, that
//     step is skipped rather than faked — so template step counts can be a
//     little short until the matching cards exist. Swap the TEMPLATES
//     search terms below to your actual label text any time.
//  2. There's no per-card color field in the schema, so the color-swatch
//     picker isn't here — cards use their real image instead.
//  3. "Cover tile" isn't a separate DB field. Marking a step as cover moves
//     it to position 1 in the saved order, since that's what every list
//     view (this app's and the one on your phone) already uses as the
//     thumbnail. Functionally identical to the prototype, just no new
//     column needed.

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { LANGUAGES, type Language, type Gender } from "@/lib/constants";
import {
  CATEGORIES,
  ALL_CARDS,
  getRuntimeCards,
  setRuntimeCards,
  getCardLabel,
  getCardImageUrl,
  getCardGender,
  isCharacterCard,
  setCardImages as setCardImagesGlobal,
  setLabelOverrides,
  findCard,
  type ParsedCard,
} from "@/lib/card-data";

const GREEN = "#4A5A3E";
const GREEN_DARK = "#3A4830";
const GREEN_SOFT = "#EAF1E2";
const GREEN_BORDER = "#C7D4B8";
const INK = "#1E2A24";
const SUB = "#6C7A72";
const FAINT = "#9AA69E";
const BORDER = "#E6EBE6";
const BG = "#F5F8F5";
const RED_SOFT = "#FCECEC";
const RED = "#DC4C4C";
const GOLD_SOFT = "#FCF6E4";

const MAX_STEPS = 10; // one clean A4 page

// Template step labels are matched against real card translations at
// runtime — see the note at the top of this file.
const TEMPLATES: { id: string; name: string; terms: string[] }[] = [
  { id: "school", name: "School Morning", terms: ["wake up", "toilet", "brush teeth", "get dressed", "breakfast", "shoes", "backpack", "go to school"] },
  { id: "bedtime", name: "Bedtime Routine", terms: ["bath", "pyjamas", "brush teeth", "story", "toilet", "sleep"] },
  { id: "afterschool", name: "After School", terms: ["backpack", "snack", "wash hands", "homework", "play", "dinner"] },
  { id: "bathroom", name: "Bathroom Routine", terms: ["toilet", "wash hands"] },
  { id: "weekend", name: "Weekend Routine", terms: ["wake up", "breakfast", "brush teeth", "play"] },
];

const CHARACTER_OPTIONS: { value: Gender; label: string }[] = [
  { value: "neutral", label: "Neutral" },
  { value: "boy", label: "Boy" },
  { value: "girl", label: "Girl" },
  { value: "brown", label: "Brown" },
];

interface Step { key: string; cardId: string; catId: string }

function findByTerm(cards: ParsedCard[], term: string): ParsedCard | undefined {
  const t = term.toLowerCase();
  return cards.find((c) => (c.translations?.en || "").toLowerCase().includes(t));
}

/* ---------- small shared bits ---------- */
function StatusHeader({ title, sub, onBack, right }: { title: string; sub?: string; onBack?: () => void; right?: React.ReactNode }) {
  return (
    <div className="px-4 pt-3 pb-3 sticky top-0 z-20" style={{ background: "#fff", borderBottom: `1px solid ${BORDER}` }}>
      <div className="flex items-center">
        <div className="w-9">
          {onBack && (
            <button onClick={onBack} className="w-9 h-9 -ml-1 flex items-center justify-center rounded-full active:opacity-60">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
            </button>
          )}
        </div>
        <div className="flex-1 text-center">
          <div className="font-bold text-[17px] leading-tight" style={{ color: INK }}>{title}</div>
          {sub && <div className="text-[12px] mt-0.5" style={{ color: SUB }}>{sub}</div>}
        </div>
        <div className="w-9 flex justify-end">{right}</div>
      </div>
    </div>
  );
}
function GreenBtn({ children, onClick, disabled, outline }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; outline?: boolean }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full py-3.5 rounded-2xl font-bold text-[15px] active:opacity-90 transition disabled:opacity-50"
      style={outline
        ? { background: "#fff", color: GREEN, border: `1.5px solid ${GREEN}` }
        : { background: GREEN, color: "#fff", boxShadow: "0 6px 16px rgba(74,90,62,0.28)" }}
    >
      {children}
    </button>
  );
}
function CheckIcon({ color = "#fff", size = 14 }: { color?: string; size?: number }) {
  return <svg style={{ width: size, height: size }} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>;
}

/* ================================================================== */
export default function NewSchedulePage() {
  const router = useRouter();
  const [screen, setScreen] = useState<"templates" | "steps" | "library" | "preview">("templates");
  const [cardsLoaded, setCardsLoaded] = useState(false);
  const [hasSubscription, setHasSubscription] = useState(false);
  const [adminCatNames, setAdminCatNames] = useState<Record<string, string>>({});

  const [title, setTitle] = useState("New Schedule");
  const [language, setLanguage] = useState<Language>("en");
  const [gender, setGender] = useState<Gender>("neutral");
  const [steps, setSteps] = useState<Step[]>([]);
  const [coverKey, setCoverKey] = useState<string | null>(null);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Same loading sequence the rest of the app uses.
  useEffect(() => {
    fetch("/api/cards")
      .then((r) => r.json())
      .then((data) => {
        if (data.cards?.length > 0) {
          const cleaned = data.cards.map((c: ParsedCard) => ({
            ...c,
            isFree: !(c.icon || "").startsWith("paid:"),
            icon: c.icon?.replace(/^(free|paid):/, "") || "s-star",
          }));
          setRuntimeCards(cleaned);
        }
        setCardsLoaded(true);
      })
      .catch(() => setCardsLoaded(true));
    fetch("/api/cards/images")
      .then((r) => r.json())
      .then((data) => { if (data.images) setCardImagesGlobal(data.images); if (data.labels) setLabelOverrides(data.labels); })
      .catch(() => {});
    fetch("/api/user/subscription")
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setHasSubscription(!!d?.subscription))
      .catch(() => {});
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
  }, [cardsLoaded]);

  const isLockedCard = (card: ParsedCard) => (card as any).isFree === false && !hasSubscription;

  const startTemplate = (tpl: typeof TEMPLATES[number]) => {
    const matched: Step[] = [];
    tpl.terms.forEach((term, i) => {
      const c = findByTerm(cards, term);
      if (c) matched.push({ key: `${c.id}-${i}-${Date.now()}`, cardId: c.id, catId: c.categoryId });
    });
    setTitle(tpl.name);
    setSteps(matched.slice(0, MAX_STEPS));
    setCoverKey(null);
    setScreen("steps");
  };
  const startBlank = () => { setTitle("Custom Routine"); setSteps([]); setCoverKey(null); setScreen("steps"); };

  const addCard = (card: ParsedCard) => {
    if (steps.length >= MAX_STEPS) { setScreen("steps"); return; }
    setSteps((s) => [...s, { key: `${card.id}-${Date.now()}`, cardId: card.id, catId: card.categoryId }]);
    setScreen("steps");
  };
  const removeStep = (key: string) => { setSteps((s) => s.filter((st) => st.key !== key)); if (coverKey === key) setCoverKey(null); setEditingKey(null); };
  const toggleCover = (key: string) => setCoverKey((c) => (c === key ? null : key));

  const save = async () => {
    setSaving(true);
    // Cover step goes first — that's what every list/thumbnail reads.
    const ordered = coverKey ? [...steps].sort((a, b) => (a.key === coverKey ? -1 : b.key === coverKey ? 1 : 0)) : steps;
    const slots = [...ordered.map((s) => ({ cardId: s.cardId, catId: s.catId })), ...Array(Math.max(0, 12 - ordered.length)).fill(null)];
    try {
      const res = await fetch("/api/schedules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title, scheduleType: "daily", language, gender,
          gridCols: 3, weekMode: "week", cardStyle: "white",
          data: { pages: [{ slots }] },
        }),
      });
      const data = await res.json();
      if (res.ok && data.id) { router.push("/schedules"); return; }
      if (!data.saved) { router.push("/login"); return; }
      alert("Couldn't save — please try again.");
    } catch {
      alert("Couldn't save — check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };

  const groupedCategories = useMemo(() => {
    const order: string[] = [];
    const seen = new Set<string>();
    CATEGORIES.forEach((c: any) => { if (!seen.has(c.id)) { seen.add(c.id); order.push(c.id); } });
    cards.forEach((c) => { if (c.categoryId && !seen.has(c.categoryId)) { seen.add(c.categoryId); order.push(c.categoryId); } });
    const byCat = new Map<string, ParsedCard[]>();
    cards.forEach((c) => { const k = c.categoryId || "other"; if (!byCat.has(k)) byCat.set(k, []); byCat.get(k)!.push(c); });
    return order.filter((id) => (byCat.get(id) || []).length > 0).map((id) => ({ id, name: adminCatNames[id] || id, cards: byCat.get(id)! }));
  }, [cards, adminCatNames]);

  const showCharacters = useMemo(() => cards.some((c) => isCharacterCard(c)), [cards]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: BG }}>
      {screen === "templates" && <TemplatesScreen onUse={startTemplate} onCustom={startBlank} onBack={() => router.back()} />}
      {screen === "steps" && (
        <StepsScreen
          title={title} steps={steps} setSteps={setSteps} coverKey={coverKey}
          onBack={() => setScreen("templates")} onEditKey={setEditingKey}
          onAdd={() => setScreen("library")} onDone={() => setScreen("preview")}
        />
      )}
      {screen === "library" && (
        <LibraryScreen
          groups={groupedCategories} language={language} gender={gender}
          showCharacters={showCharacters} setGender={setGender}
          isLockedCard={isLockedCard} placedIds={new Set(steps.map((s) => s.cardId))}
          onBack={() => setScreen("steps")} onPick={addCard}
        />
      )}
      {screen === "preview" && (
        <PreviewScreen
          title={title} steps={steps} coverKey={coverKey} language={language}
          onBack={() => setScreen("steps")} onSave={save} saving={saving}
        />
      )}

      {editingKey && (
        <EditStepSheet
          step={steps.find((s) => s.key === editingKey)!}
          language={language}
          isCover={coverKey === editingKey}
          onToggleCover={() => toggleCover(editingKey)}
          onDelete={() => removeStep(editingKey)}
          onClose={() => setEditingKey(null)}
        />
      )}
    </div>
  );
}

/* Templates */
function TemplatesScreen({ onUse, onCustom, onBack }: { onUse: (t: typeof TEMPLATES[number]) => void; onCustom: () => void; onBack: () => void }) {
  const [sel, setSel] = useState(TEMPLATES[0].id);
  const chosen = TEMPLATES.find((t) => t.id === sel)!;
  return (
    <div className="flex flex-col min-h-screen">
      <StatusHeader title="Choose a routine" sub="Start with a template or create your own" onBack={onBack} />
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="grid grid-cols-2 gap-3">
          {TEMPLATES.map((t) => {
            const active = sel === t.id;
            return (
              <button key={t.id} onClick={() => setSel(t.id)} className="relative rounded-2xl p-4 text-left h-24 flex flex-col justify-between"
                style={{ background: GREEN_SOFT, border: active ? `2px solid ${GREEN}` : "2px solid transparent" }}>
                {active && <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: GREEN }}><CheckIcon /></div>}
                <span className="font-bold text-[13px]" style={{ color: INK }}>{t.name}</span>
                <span className="text-[11px]" style={{ color: SUB }}>{t.terms.length} steps</span>
              </button>
            );
          })}
          <button onClick={onCustom} className="rounded-2xl p-4 h-24 flex flex-col items-center justify-center gap-1.5" style={{ background: "#fff", border: `1.5px dashed ${GREEN_BORDER}` }}>
            <span className="font-bold text-[13px]" style={{ color: INK }}>+ Custom Routine</span>
          </button>
        </div>
        <div className="mt-4 p-3 rounded-xl text-[12px]" style={{ background: GREEN_SOFT, color: GREEN_DARK }}>
          <b>{chosen.name}</b> — steps are matched from your card library, so counts may vary slightly.
        </div>
      </div>
      <div className="px-5 py-4" style={{ background: "#fff", borderTop: `1px solid ${BORDER}` }}>
        <GreenBtn onClick={() => onUse(chosen)}>Use This Template</GreenBtn>
      </div>
    </div>
  );
}

/* Steps — drag reorder */
function StepsScreen({ title, steps, setSteps, coverKey, onBack, onEditKey, onAdd, onDone }: {
  title: string; steps: Step[]; setSteps: (fn: (s: Step[]) => Step[]) => void; coverKey: string | null;
  onBack: () => void; onEditKey: (k: string) => void; onAdd: () => void; onDone: () => void;
}) {
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const drag = useRef({ from: -1 });
  const [dragI, setDragI] = useState(-1);

  const onMove = useCallback((e: PointerEvent) => {
    const y = e.clientY;
    let target = drag.current.from;
    rowRefs.current.forEach((el, i) => { if (!el) return; const r = el.getBoundingClientRect(); if (y > r.top && y < r.bottom) target = i; });
    if (target !== drag.current.from && target >= 0) {
      setSteps((s) => { const arr = [...s]; const [m] = arr.splice(drag.current.from, 1); arr.splice(target, 0, m); return arr; });
      drag.current.from = target; setDragI(target);
    }
  }, [setSteps]);
  const onUp = useCallback(() => {
    drag.current.from = -1; setDragI(-1);
    window.removeEventListener("pointermove", onMove); window.removeEventListener("pointerup", onUp);
  }, [onMove]);
  const onDown = (i: number) => (e: React.PointerEvent) => {
    e.preventDefault(); drag.current.from = i; setDragI(i);
    window.addEventListener("pointermove", onMove); window.addEventListener("pointerup", onUp);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <StatusHeader title={title} sub={`${steps.length} steps`} onBack={onBack}
        right={<button onClick={onDone} className="text-[14px] font-bold" style={{ color: GREEN }}>Done</button>} />
      <div className="px-5 pt-3 text-[12px]" style={{ color: SUB }}>Tap a step to edit. Drag the handle to reorder.</div>
      <div className="flex-1 overflow-y-auto px-5 py-3 space-y-2.5">
        {steps.map((s, i) => {
          const card = findCard(s.cardId);
          const label = card ? getCardLabel(card, "en") : s.cardId;
          const isCover = coverKey === s.key;
          return (
            <div key={s.key} ref={(el) => { rowRefs.current[i] = el; }}
              className="flex items-center gap-2 p-3 rounded-2xl transition"
              style={{ background: "#fff", border: `1px solid ${dragI === i ? GREEN : BORDER}`, boxShadow: dragI === i ? "0 8px 20px rgba(0,0,0,0.10)" : "none", opacity: dragI >= 0 && dragI !== i ? 0.7 : 1 }}>
              <button onPointerDown={onDown(i)} className="touch-none p-1 shrink-0" style={{ color: FAINT }}>
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor"><circle cx="9" cy="6" r="1.4" /><circle cx="9" cy="12" r="1.4" /><circle cx="9" cy="18" r="1.4" /><circle cx="15" cy="6" r="1.4" /><circle cx="15" cy="12" r="1.4" /><circle cx="15" cy="18" r="1.4" /></svg>
              </button>
              <div className="w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0" style={{ border: `2px solid ${GREEN}`, color: GREEN }}>{i + 1}</div>
              {isCover && <span className="text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0" style={{ background: GOLD_SOFT, color: "#8A6D1F" }}>COVER</span>}
              <button onClick={() => onEditKey(s.key)} className="flex-1 text-left font-semibold text-[14px] py-1 truncate" style={{ color: INK }}>{label}</button>
            </div>
          );
        })}
        {steps.length === 0 && <div className="text-center text-[13px] py-10" style={{ color: FAINT }}>No steps yet — add one below to begin.</div>}
        {steps.length >= MAX_STEPS ? (
          <div className="w-full py-3 rounded-2xl text-center text-[13px] font-semibold" style={{ background: "#fff", color: SUB, border: `1px solid ${BORDER}` }}>Maximum {MAX_STEPS} steps — one clean A4 page.</div>
        ) : (
          <button onClick={onAdd} className="w-full py-3.5 rounded-2xl font-bold text-[15px] flex items-center justify-center gap-2" style={{ background: "#fff", color: GREEN, border: `1.5px solid ${GREEN}` }}>
            + Add Step <span className="text-[12px] font-medium" style={{ color: FAINT }}>({steps.length}/{MAX_STEPS})</span>
          </button>
        )}
      </div>
    </div>
  );
}

/* Edit step — bottom sheet: cover toggle, remove. No color/title fields — see note at top of file. */
function EditStepSheet({ step, language, isCover, onToggleCover, onDelete, onClose }: {
  step: Step; language: Language; isCover: boolean; onToggleCover: () => void; onDelete: () => void; onClose: () => void;
}) {
  const card = findCard(step.cardId);
  const label = card ? getCardLabel(card, language) : step.cardId;
  const img = card ? (getCardImageUrl(card.id, "neutral")) : null;
  return (
    <div className="fixed inset-0 z-30 flex flex-col justify-end" style={{ background: "rgba(28,27,25,0.5)" }} onClick={onClose}>
      <div className="rounded-t-3xl p-5 pb-7" style={{ background: "#fff" }} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <span className="font-bold text-[16px]" style={{ color: INK }}>Edit Step</span>
          <button onClick={onClose}><svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke={SUB} strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg></button>
        </div>
        <div className="flex items-center gap-4 mb-5">
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden shrink-0" style={{ background: GREEN_SOFT }}>
            {img ? <img src={img} alt="" className="w-full h-full object-contain" /> : <div className="w-8 h-8 rounded-full" style={{ background: GREEN_BORDER }} />}
          </div>
          <span className="font-bold text-[16px]" style={{ color: INK }}>{label}</span>
        </div>
        <button onClick={onToggleCover} className="w-full flex items-center justify-between p-3.5 rounded-2xl mb-3" style={{ background: isCover ? GOLD_SOFT : BG, border: `1px solid ${BORDER}` }}>
          <span className="font-bold text-[14px]" style={{ color: INK }}>{isCover ? "★ Cover of this schedule" : "Set as cover"}</span>
          <span className="text-[12px]" style={{ color: SUB }}>{isCover ? "Tap to unset" : "Shown in My Schedules"}</span>
        </button>
        <button onClick={onDelete} className="w-full py-3 rounded-2xl font-bold text-[14px]" style={{ background: RED_SOFT, color: RED }}>Delete Step</button>
      </div>
    </div>
  );
}

/* Add-step library — real cards */
function LibraryScreen({ groups, language, gender, showCharacters, setGender, isLockedCard, placedIds, onBack, onPick }: {
  groups: { id: string; name: string; cards: ParsedCard[] }[]; language: Language; gender: Gender; showCharacters: boolean;
  setGender: (g: Gender) => void; isLockedCard: (c: ParsedCard) => boolean; placedIds: Set<string>;
  onBack: () => void; onPick: (c: ParsedCard) => void;
}) {
  const router = useRouter();
  const [activeCat, setActiveCat] = useState("all");
  const visible = activeCat === "all" ? groups : groups.filter((g) => g.id === activeCat);
  return (
    <div className="flex flex-col min-h-screen">
      <StatusHeader title="Add Step" onBack={onBack} />
      <div className="px-5 pt-3">
        {showCharacters && (
          <>
            <div className="text-[12px] font-semibold mb-2" style={{ color: SUB }}>Character</div>
            <div className="flex gap-2 mb-3">
              {CHARACTER_OPTIONS.map((o) => {
                const active = gender === o.value;
                return (
                  <button key={o.value} onClick={() => setGender(o.value)} className="flex-1 py-2 rounded-xl text-[11px] font-semibold"
                    style={active ? { background: GREEN_SOFT, border: `1.5px solid ${GREEN}`, color: GREEN_DARK } : { background: "#fff", border: `1px solid ${BORDER}`, color: SUB }}>
                    {o.label}
                  </button>
                );
              })}
            </div>
          </>
        )}
        <div className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5">
          <button onClick={() => setActiveCat("all")} className="px-3.5 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap"
            style={activeCat === "all" ? { background: GREEN, color: "#fff" } : { background: "#fff", color: SUB, border: `1px solid ${BORDER}` }}>All</button>
          {groups.map((g) => (
            <button key={g.id} onClick={() => setActiveCat(g.id)} className="px-3.5 py-1.5 rounded-full text-[12px] font-semibold whitespace-nowrap"
              style={activeCat === g.id ? { background: GREEN, color: "#fff" } : { background: "#fff", color: SUB, border: `1px solid ${BORDER}` }}>{g.name}</button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto px-5 py-3 space-y-4">
        {visible.length === 0 && <p className="text-[12px] py-3" style={{ color: SUB }}>No cards available yet.</p>}
        {visible.map((g) => (
          <div key={g.id}>
            <div className="text-[13px] font-bold mb-2" style={{ color: INK }}>{g.name} <span className="font-medium" style={{ color: SUB }}>({g.cards.length})</span></div>
            <div className="grid grid-cols-3 gap-2.5">
              {g.cards.map((card) => {
                const locked = isLockedCard(card);
                const variant = getCardGender(card, gender);
                const img = getCardImageUrl(card.id, variant) || getCardImageUrl(card.id, "neutral");
                const placed = placedIds.has(card.id);
                return (
                  <button key={card.id} onClick={() => (locked ? router.push("/plans") : onPick(card))}
                    className="relative rounded-2xl p-2 flex flex-col items-center gap-1 active:scale-95 transition-transform" style={{ background: "#fff", border: `1px solid ${BORDER}` }}>
                    {locked && (
                      <span className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: "#FFF3E6" }}>
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="#B5761F" strokeWidth="2.4" strokeLinecap="round"><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></svg>
                      </span>
                    )}
                    {placed && !locked && (
                      <span className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: GREEN_SOFT }}><CheckIcon color={GREEN} /></span>
                    )}
                    <div className="w-full aspect-square flex items-center justify-center overflow-hidden rounded-lg" style={{ background: GREEN_SOFT, opacity: locked ? 0.55 : 1 }}>
                      {img ? <img src={img} alt="" className="w-full h-full object-contain" /> : <div className="w-6 h-6 rounded-full" style={{ background: GREEN_BORDER }} />}
                    </div>
                    <span className="text-[11px] font-semibold text-center leading-tight truncate w-full" style={{ color: locked ? SUB : INK }}>{getCardLabel(card, language)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* Preview */
function PreviewScreen({ title, steps, coverKey, language, onBack, onSave, saving }: {
  title: string; steps: Step[]; coverKey: string | null; language: Language; onBack: () => void; onSave: () => void; saving: boolean;
}) {
  const ordered = coverKey ? [...steps].sort((a, b) => (a.key === coverKey ? -1 : b.key === coverKey ? 1 : 0)) : steps;
  return (
    <div className="flex flex-col min-h-screen">
      <StatusHeader title="Preview" sub="This is how your schedule will look." onBack={onBack} />
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="rounded-2xl p-5" style={{ background: "#fff", border: `1px solid ${BORDER}`, boxShadow: "0 4px 16px rgba(0,0,0,0.05)" }}>
          <div className="text-center font-extrabold text-[18px] mb-4" style={{ color: INK }}>{title}</div>
          <div className="space-y-3">
            {ordered.map((s, i) => {
              const card = findCard(s.cardId);
              const label = card ? getCardLabel(card, language) : s.cardId;
              const img = card ? getCardImageUrl(card.id, "neutral") : null;
              return (
                <div key={s.key} className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center text-[12px] font-bold shrink-0" style={{ border: `2px solid ${GREEN}`, color: GREEN }}>{i + 1}</div>
                  <div className="w-9 h-9 rounded-lg flex items-center justify-center overflow-hidden shrink-0" style={{ background: GREEN_SOFT }}>
                    {img ? <img src={img} alt="" className="w-full h-full object-contain" /> : null}
                  </div>
                  <span className="font-semibold text-[15px]" style={{ color: INK }}>{label}</span>
                </div>
              );
            })}
            {ordered.length === 0 && <p className="text-[13px] text-center py-4" style={{ color: FAINT }}>No steps added yet.</p>}
          </div>
        </div>
      </div>
      <div className="px-5 py-4 flex gap-3" style={{ background: "#fff", borderTop: `1px solid ${BORDER}` }}>
        <button onClick={onBack} className="flex-1 py-3.5 rounded-2xl font-bold text-[15px]" style={{ background: "#fff", color: GREEN, border: `1.5px solid ${GREEN}` }}>Edit Steps</button>
        <div className="flex-1"><GreenBtn onClick={onSave} disabled={saving || ordered.length === 0}>{saving ? "Saving…" : "Save Schedule"}</GreenBtn></div>
      </div>
    </div>
  );
}
