"use client";

// /schedule/[id]/do — "Use this schedule" check-off view.
//
// This is NEW code, not a reskin: your app has no step-by-step check-off
// screen today. It loads one saved schedule from D1 (same /api/schedules/:id
// your desktop already uses), flattens whatever grid it was built as (daily
// slots, or weekly/custom/timetable columns) into an ordered list of real
// cards, and lets the child tap each one off — exactly the interaction from
// the approved prototype: greyscale image, strikethrough label, filled tick,
// progress bar, "All done" banner.
//
// "Done" state is per-device (localStorage), keyed by schedule id — there's
// no done-tracking column in the schedules table, so nothing server-side
// needs to change to ship this. Say the word if you'd rather it sync across
// devices and I'll add the column + a small API route.

import { useEffect, useMemo, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  getRuntimeCards,
  setRuntimeCards,
  setCardImages as setCardImagesGlobal,
  setLabelOverrides,
  getCardLabel,
  getCardImageUrl,
  getCardGender,
  findCard,
  type ParsedCard,
} from "@/lib/card-data";
import { DAY_KEYS } from "@/lib/constants";

const GREEN = "#4A5A3E";
const GREEN_DARK = "#3A4830";
const GREEN_SOFT = "#EAF1E2";
const GREEN_BORDER = "#C7D4B8";
const INK = "#1E2A24";
const SUB = "#6C7A72";
const FAINT = "#9AA69E";
const BORDER = "#E6EBE6";
const BG = "#F5F8F5";

interface CardRef { cardId: string; catId: string }
interface ScheduleResponse {
  id: string;
  title: string;
  scheduleType: string;
  language: string;
  gender: string;
  data: { pages: any[] };
}
interface Step { key: string; card: ParsedCard | undefined; }

// Flatten every page of a saved schedule into one ordered list of card refs,
// regardless of whether it was built as daily slots or column-based
// (weekly / custom / timetable / mini / iwant).
function flattenPages(pages: any[]): CardRef[] {
  const out: CardRef[] = [];
  const colOrder = ["0", "cutout", ...DAY_KEYS, "extra"];
  pages.forEach((p) => {
    if (Array.isArray(p?.slots)) {
      p.slots.forEach((s: CardRef | null) => { if (s?.cardId) out.push(s); });
    } else if (p?.columns) {
      const keys = Object.keys(p.columns).sort(
        (a, b) => (colOrder.indexOf(a) === -1 ? 999 : colOrder.indexOf(a)) -
                  (colOrder.indexOf(b) === -1 ? 999 : colOrder.indexOf(b))
      );
      keys.forEach((k) => (p.columns[k] || []).forEach((c: CardRef) => { if (c?.cardId) out.push(c); }));
    }
  });
  return out;
}

function ChevronLeft() {
  return <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke={INK} strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>;
}
function CheckIcon({ color = "#fff", size = 18 }: { color?: string; size?: number }) {
  return <svg style={{ width: size, height: size }} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>;
}

// Confetti — pure CSS/inline styles, no library. Deterministic-ish spread so
// it looks scattered without pulling in a dependency.
function Confetti() {
  const COLORS = ["#4A5A3E", "#7A8F5E", "#E8B23A", "#E08A6B", "#8FB3D9", "#C48BB8"];
  const pieces = Array.from({ length: 40 }, (_, i) => ({
    left: (i * 37) % 100,
    delay: (i % 10) * 0.12,
    duration: 2 + ((i % 5) * 0.35),
    color: COLORS[i % COLORS.length],
    size: 7 + (i % 4) * 2,
    rotate: (i * 53) % 360,
  }));
  return (
    <div className="fixed inset-0 pointer-events-none z-[400] overflow-hidden" aria-hidden>
      <style>{`
        @keyframes vs-fall {
          0%   { transform: translateY(-12vh) rotate(0deg);   opacity: 1; }
          100% { transform: translateY(105vh) rotate(600deg); opacity: 0.9; }
        }
        @keyframes vs-pop {
          0%   { transform: scale(0.4); opacity: 0; }
          45%  { transform: scale(1.12); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
      {pieces.map((p, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            top: 0,
            left: `${p.left}%`,
            width: p.size,
            height: p.size * 1.6,
            background: p.color,
            borderRadius: 2,
            transform: `rotate(${p.rotate}deg)`,
            animation: `vs-fall ${p.duration}s ${p.delay}s cubic-bezier(.25,.6,.4,1) forwards`,
          }}
        />
      ))}
    </div>
  );
}

export default function DoSchedulePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [sched, setSched] = useState<ScheduleResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cardsLoaded, setCardsLoaded] = useState(false);
  const [done, setDone] = useState<Record<string, boolean>>({});

  // Load runtime cards + images/labels, same sequence as the desktop builder.
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
      .then((data) => {
        if (data.images) setCardImagesGlobal(data.images);
        if (data.labels) setLabelOverrides(data.labels);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/schedules/${id}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((data) => {
        setSched(data);
      })
      .catch((status) => {
        if (status === 401) { router.push(`/login?next=/schedule/${id}/do`); return; }
        setError("This schedule couldn't be found.");
      });
  }, [id]);

  // Restore any previously ticked steps for this schedule, this device.
  useEffect(() => {
    if (!id) return;
    try {
      const raw = localStorage.getItem(`vs_done_${id}`);
      if (raw) setDone(JSON.parse(raw));
    } catch {}
  }, [id]);
  const persistDone = (next: Record<string, boolean>) => {
    setDone(next);
    try { localStorage.setItem(`vs_done_${id}`, JSON.stringify(next)); } catch {}
  };

  const steps: Step[] = useMemo(() => {
    if (!sched || !cardsLoaded) return [];
    const refs = flattenPages(sched.data?.pages || []);
    return refs.map((r, i) => ({ key: `${r.cardId}-${i}`, card: findCard(r.cardId) }));
  }, [sched, cardsLoaded]);

  const doneCount = steps.filter((s) => done[s.key]).length;
  const allDone = steps.length > 0 && doneCount === steps.length;
  const toggle = (key: string) => persistDone({ ...done, [key]: !done[key] });
  const reset = () => persistDone({});

  // Celebrate the moment the last step is ticked — fires once per completion,
  // and re-arms if they reset or untick something, so finishing again still
  // feels like an event.
  const [celebrating, setCelebrating] = useState(false);
  const celebratedRef = useRef(false);
  useEffect(() => {
    if (allDone && !celebratedRef.current) {
      celebratedRef.current = true;
      setCelebrating(true);
      const t = setTimeout(() => setCelebrating(false), 3000);
      return () => clearTimeout(t);
    }
    if (!allDone) celebratedRef.current = false;
  }, [allDone]);

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen px-6 text-center" style={{ background: BG }}>
        <p className="text-[15px] font-semibold mb-4" style={{ color: INK }}>{error}</p>
        <button onClick={() => router.push("/schedules")} className="px-5 py-2.5 rounded-xl font-bold text-[14px]" style={{ background: GREEN, color: "#fff" }}>
          Back to My Schedules
        </button>
      </div>
    );
  }

  if (!sched) {
    return (
      <div className="flex items-center justify-center min-h-screen" style={{ background: BG }}>
        <div className="w-6 h-6 rounded-full animate-spin" style={{ border: `2px solid ${BORDER}`, borderTopColor: GREEN }} />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-dvh overflow-hidden" style={{ background: BG }}>
      {/* Top bar */}
      <div className="px-4 pt-3 pb-3 shrink-0" style={{ background: "#fff", borderBottom: `1px solid ${BORDER}` }}>
        <div className="flex items-center">
          <button onClick={() => router.back()} className="w-9 h-9 -ml-1 flex items-center justify-center rounded-full active:opacity-60">
            <ChevronLeft />
          </button>
          <div className="flex-1 text-center">
            <div className="font-bold text-[17px] leading-tight" style={{ color: INK }}>{sched.title}</div>
            <div className="text-[12px] mt-0.5" style={{ color: SUB }}>{doneCount} of {steps.length} done</div>
          </div>
          <button onClick={reset} className="w-9 text-[13px] font-semibold text-right" style={{ color: SUB }}>Reset</button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-5 pt-3 shrink-0">
        <div className="h-2 rounded-full overflow-hidden" style={{ background: BORDER }}>
          <div
            className="h-full rounded-full transition-all"
            style={{ width: `${steps.length ? (doneCount / steps.length) * 100 : 0}%`, background: GREEN }}
          />
        </div>
      </div>

      {celebrating && <Confetti />}

      {allDone && (
        <div
          className="mx-5 mt-3 p-3.5 rounded-2xl flex items-center gap-2.5 shrink-0"
          style={{
            background: GREEN_SOFT,
            border: `1px solid ${GREEN_BORDER}`,
            animation: celebrating ? "vs-pop 0.5s cubic-bezier(.34,1.56,.64,1)" : undefined,
          }}
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0" style={{ background: GREEN }}>
            <CheckIcon size={18} />
          </div>
          <span className="font-bold text-[15px]" style={{ color: GREEN_DARK }}>🎉 All done. Great job!</span>
        </div>
      )}

      {/* Steps */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-3 space-y-2.5 pb-10">
        {steps.length === 0 && (
          <div className="text-center text-[13px] py-16" style={{ color: FAINT }}>This schedule has no cards yet.</div>
        )}
        {steps.map((s, i) => {
          const isDone = !!done[s.key];
          const card = s.card;
          const label = card ? getCardLabel(card, sched.language) : "Card";
          const variant = card ? getCardGender(card, sched.gender) : "neutral";
          const img = card ? (getCardImageUrl(card.id, variant) || getCardImageUrl(card.id, "neutral")) : null;

          return (
            <button
              key={s.key}
              onClick={() => toggle(s.key)}
              className="w-full flex items-center gap-3 p-3.5 rounded-2xl text-left transition"
              style={{
                background: isDone ? BG : "#fff",
                border: `1px solid ${isDone ? BORDER : GREEN_BORDER}`,
                opacity: isDone ? 0.62 : 1,
              }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                style={isDone ? { background: GREEN } : { border: `2px solid ${GREEN_BORDER}` }}
              >
                {isDone ? <CheckIcon /> : <span className="text-[13px] font-bold" style={{ color: GREEN }}>{i + 1}</span>}
              </div>

              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center overflow-hidden shrink-0"
                style={{ background: GREEN_SOFT, filter: isDone ? "grayscale(1)" : "none", opacity: isDone ? 0.7 : 1 }}
              >
                {img ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={img} alt="" className="w-full h-full object-contain" />
                ) : (
                  <div className="w-5 h-5 rounded-full" style={{ background: GREEN_BORDER }} />
                )}
              </div>

              <span
                className="flex-1 font-bold text-[16px]"
                style={{ color: isDone ? FAINT : INK, textDecoration: isDone ? "line-through" : "none" }}
              >
                {label}
              </span>

              {isDone && (
                <span className="text-[11px] font-bold px-2 py-1 rounded-full shrink-0" style={{ background: GREEN_SOFT, color: GREEN_DARK }}>
                  Done
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="px-5 py-3 text-center text-[12px] shrink-0" style={{ background: "#fff", borderTop: `1px solid ${BORDER}`, color: FAINT }}>
        Tap a step when it's finished
      </div>
    </div>
  );
}
