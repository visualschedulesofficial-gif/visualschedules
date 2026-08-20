"use client";

// A short, swipeable set of coach marks for first-time visitors.
//
// It spotlights real elements on the page (found via data-tour attributes)
// rather than showing a separate slideshow, so people learn where things
// actually are. Shown once, then remembered — and skippable at any point.

import { useState, useEffect, useCallback, useRef } from "react";

const SEEN_KEY = "vs_tour_seen_v1";

type Step = {
  target: string;   // data-tour value to highlight
  title: string;
  body: string;
};

const STEPS: Step[] = [
  {
    target: "name",
    title: "Name it",
    body: "Give the schedule a name — “Morning”, “Bedtime”, whatever fits your day.",
  },
  {
    target: "language",
    title: "Pick a language",
    body: "Cards can show in Hindi, English and more. Change it any time.",
  },
  {
    target: "add",
    title: "Add your steps",
    body: "Tap here to pick cards — brushing teeth, breakfast, school. Add as many as you need.",
  },
  {
    target: "save",
    title: "Save or download",
    body: "Download a printable copy free, or save it to open on any device.",
  },
];

export function BuilderTour() {
  const [active, setActive] = useState(false);
  const [step, setStep] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const touchStartX = useRef<number | null>(null);

  // Only for first-timers, and only once the page has settled.
  useEffect(() => {
    let seen = false;
    try { seen = localStorage.getItem(SEEN_KEY) === "1"; } catch {}
    if (seen) return;
    const t = setTimeout(() => setActive(true), 900);
    return () => clearTimeout(t);
  }, []);

  const measure = useCallback(() => {
    const el = document.querySelector<HTMLElement>(`[data-tour="${STEPS[step].target}"]`);
    if (!el) { setRect(null); return; }
    el.scrollIntoView({ behavior: "smooth", block: "center" });
    // Measure after the scroll settles, or the highlight lands in the wrong place.
    setTimeout(() => setRect(el.getBoundingClientRect()), 320);
  }, [step]);

  useEffect(() => {
    if (!active) return;
    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [active, step, measure]);

  const finish = () => {
    try { localStorage.setItem(SEEN_KEY, "1"); } catch {}
    setActive(false);
  };

  const next = () => (step < STEPS.length - 1 ? setStep(step + 1) : finish());
  const prev = () => step > 0 && setStep(step - 1);

  if (!active) return null;

  const s = STEPS[step];
  const pad = 8;
  // Put the card below the highlight unless that would run off the bottom.
  const below = rect ? rect.bottom + 150 < window.innerHeight : true;

  return (
    <div
      className="fixed inset-0 z-[500]"
      onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
      onTouchEnd={(e) => {
        if (touchStartX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchStartX.current;
        if (dx < -40) next();
        else if (dx > 40) prev();
        touchStartX.current = null;
      }}
    >
      {/* Dimmed backdrop with a cut-out over the highlighted element. */}
      <div
        className="absolute inset-0"
        style={{
          background: "rgba(28,27,25,0.62)",
          ...(rect
            ? {
                clipPath: `polygon(
                  0% 0%, 0% 100%, ${rect.left - pad}px 100%,
                  ${rect.left - pad}px ${rect.top - pad}px,
                  ${rect.right + pad}px ${rect.top - pad}px,
                  ${rect.right + pad}px ${rect.bottom + pad}px,
                  ${rect.left - pad}px ${rect.bottom + pad}px,
                  ${rect.left - pad}px 100%, 100% 100%, 100% 0%
                )`,
              }
            : {}),
        }}
        onClick={next}
      />

      {/* Ring around the highlighted element. */}
      {rect && (
        <div
          className="absolute rounded-2xl pointer-events-none"
          style={{
            left: rect.left - pad,
            top: rect.top - pad,
            width: rect.width + pad * 2,
            height: rect.height + pad * 2,
            border: "2px solid #fff",
            boxShadow: "0 0 0 4px rgba(255,255,255,0.25)",
          }}
        />
      )}

      {/* The card */}
      <div
        className="absolute left-4 right-4 rounded-2xl p-4"
        style={{
          background: "#fff",
          boxShadow: "0 12px 32px rgba(0,0,0,0.28)",
          ...(rect
            ? below
              ? { top: rect.bottom + pad + 14 }
              : { top: Math.max(16, rect.top - pad - 150) }
            : { top: "40%" }),
        }}
      >
        <div className="flex items-start justify-between gap-3 mb-1">
          <h3 className="font-bold text-[15px]" style={{ color: "#1E2A24" }}>{s.title}</h3>
          <button onClick={finish} className="text-[12px] font-semibold shrink-0" style={{ color: "#9AA69E" }}>
            Skip
          </button>
        </div>
        <p className="text-[13px] leading-relaxed mb-3" style={{ color: "#6C7A72" }}>{s.body}</p>

        <div className="flex items-center justify-between">
          {/* Progress dots */}
          <div className="flex gap-1.5">
            {STEPS.map((_, i) => (
              <span
                key={i}
                className="rounded-full"
                style={{
                  width: i === step ? 18 : 6,
                  height: 6,
                  background: i === step ? "#4A5A3E" : "#C7D4B8",
                  transition: "width 0.2s ease",
                }}
              />
            ))}
          </div>

          <div className="flex items-center gap-2">
            {step > 0 && (
              <button onClick={prev} className="px-3 py-2 text-[13px] font-semibold" style={{ color: "#6C7A72" }}>
                Back
              </button>
            )}
            <button
              onClick={next}
              className="px-5 py-2 rounded-xl text-[13px] font-bold text-white"
              style={{ background: "#4A5A3E" }}
            >
              {step === STEPS.length - 1 ? "Got it" : "Next"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
