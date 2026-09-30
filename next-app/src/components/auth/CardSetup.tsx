"use client";

// Shown once after first sign-in: pick the card language, an optional
// second language and the character. Saves to the same defaults Profile
// edits, so every new schedule starts this way.

import { useEffect, useMemo, useState } from "react";
import { LANGUAGES, LANGUAGE_NATIVE, CHARACTER_FACES, type Gender, type Language } from "@/lib/constants";
import {
  setRuntimeCards,
  setCardImages as setCardImagesGlobal,
  setLabelOverrides,
  getRuntimeCards,
  getCardImageUrl,
  getCardLabel,
  isCharacterCard,
  type ParsedCard,
} from "@/lib/card-data";
import { getPrefs, setPrefs, type Prefs } from "@/lib/prefs";

const QUICK: Language[] = ["en", "hi", "mr"] as Language[];
const CHARACTERS: { value: Gender; label: string }[] = [
  { value: "neutral", label: "Glasses" },
  { value: "boy", label: "Boy" },
  { value: "girl", label: "Girl" },
  { value: "brown", label: "Curly hair" },
];

export function CardSetup({ onDone }: { onDone: () => void }) {
  const [p, setP] = useState<Prefs>(() => getPrefs());
  const [ready, setReady] = useState(0);

  useEffect(() => {
    fetch("/api/cards")
      .then((r) => r.json())
      .then((data) => {
        if (data.cards?.length > 0) {
          setRuntimeCards(data.cards.map((c: ParsedCard) => ({ ...c, icon: c.icon?.replace(/^(free|paid):/, "") || "s-star" })));
        }
      })
      .catch(() => {})
      .finally(() => setReady((v) => v + 1));
    fetch("/api/cards/images")
      .then((r) => r.json())
      .then((data) => {
        if (data.images) setCardImagesGlobal(data.images);
        if (data.labels) setLabelOverrides(data.labels);
      })
      .catch(() => {})
      .finally(() => setReady((v) => v + 1));
  }, []);

  const sample = useMemo(() => getRuntimeCards().find((c) => isCharacterCard(c)) || getRuntimeCards()[0] || null, [ready]); // eslint-disable-line react-hooks/exhaustive-deps
  const img = sample ? getCardImageUrl(sample.id, isCharacterCard(sample) ? p.gender : "neutral") : null;

  const set = (patch: Partial<Prefs>) =>
    setP((prev) => {
      const next = { ...prev, ...patch };
      if (next.secondLanguage === next.language) next.secondLanguage = (next.language === "en" ? "hi" : "en") as Language;
      return next;
    });

  const tiles = (value: Language, onPick: (l: Language) => void, exclude?: Language) => {
    const quick = QUICK.filter((l) => l !== exclude);
    const other = !quick.includes(value);
    return (
      <div className="flex flex-col gap-2">
        <div className="grid grid-cols-3 gap-2" role="radiogroup">
          {quick.map((l) => (
            <button key={l} type="button" role="radio" aria-checked={value === l} onClick={() => onPick(l)}
              className={`h-[54px] rounded-xl border-2 flex flex-col items-center justify-center leading-tight font-bold text-[15px] transition-colors ${value === l ? "border-accent-strong bg-accent-soft" : "border-border bg-white"}`}>
              {LANGUAGE_NATIVE[l] || LANGUAGES[l as keyof typeof LANGUAGES]}
              <small className="font-medium text-[11px] text-ink-3">{LANGUAGES[l as keyof typeof LANGUAGES]}</small>
            </button>
          ))}
        </div>
        <select value={other ? value : ""} onChange={(e) => e.target.value && onPick(e.target.value as Language)} aria-label="Other language"
          className={`h-11 px-3 rounded-xl border-2 bg-white text-[14px] font-semibold ${other ? "border-accent-strong" : "border-border text-ink-2"}`}>
          <option value="">Other language…</option>
          {Object.keys(LANGUAGES).filter((c) => !QUICK.includes(c as Language) && c !== exclude).map((c) => (
            <option key={c} value={c}>{LANGUAGE_NATIVE[c] ? `${LANGUAGE_NATIVE[c]} · ` : ""}{LANGUAGES[c as keyof typeof LANGUAGES]}</option>
          ))}
        </select>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-4 animate-[vsFadeIn_250ms_ease-out]">
      <div>
        <h1 className="m-0 text-[24px] font-bold text-ink">Set up your cards</h1>
        <p className="m-0 mt-1 text-[14px] text-ink-2">You can change these any time in Profile.</p>
      </div>

      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-semibold text-ink-2">Main language</span>
        {tiles(p.language, (l) => set({ language: l }))}
      </div>

      <label className="flex items-start gap-3 cursor-pointer">
        <input type="checkbox" className="peer sr-only" checked={p.bilingual} onChange={(e) => set({ bilingual: e.target.checked })} />
        <span className="mt-0.5 w-10 h-6 shrink-0 rounded-full bg-[#CDD5C7] relative transition-colors peer-checked:bg-accent-strong peer-focus-visible:ring-2 peer-focus-visible:ring-weekly-accent after:content-[''] after:absolute after:top-[3px] after:left-[3px] after:w-[18px] after:h-[18px] after:rounded-full after:bg-white after:shadow after:transition-all peer-checked:after:left-[19px]" />
        <span className="leading-tight"><b className="block text-[15px] text-ink">Bilingual cards</b><span className="text-[13px] text-ink-3">Add a second language under each card</span></span>
      </label>
      {p.bilingual && (
        <div className="animate-[vsSlideDown_220ms_ease-out]">
          {tiles(p.secondLanguage, (l) => set({ secondLanguage: l }), p.language)}
        </div>
      )}

      <div className="flex flex-col gap-2">
        <span className="text-[13px] font-semibold text-ink-2">Character</span>
        <div className="grid grid-cols-4 gap-2" role="radiogroup" aria-label="Character">
          {CHARACTERS.map((c) => {
            const on = p.gender === c.value;
            const face = CHARACTER_FACES[c.value];
            return (
              <button key={c.value} type="button" role="radio" aria-checked={on} onClick={() => set({ gender: c.value })}
                className={`rounded-2xl border-2 p-1.5 flex flex-col items-center gap-1 text-[12px] font-semibold text-ink transition-colors ${on ? "border-accent-strong bg-accent-soft" : "border-border bg-white"}`}>
                <span className="w-full aspect-square rounded-xl overflow-hidden bg-[#F1EFE8] flex items-center justify-center">
                  {face ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={face} alt="" className="w-full h-full object-cover object-top" />
                  ) : <span className="text-ink-3 text-[18px]">{c.label[0]}</span>}
                </span>
                {c.label}
              </button>
            );
          })}
        </div>
      </div>

      {sample && (
        <div className="relative flex items-center gap-3.5 rounded-2xl border-[1.5px] border-dashed border-input-border p-2.5 pr-4" aria-live="polite">
          <span className="w-[84px] h-[68px] rounded-xl overflow-hidden bg-white shrink-0 flex items-center justify-center">
            {img ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={img} alt="" className="w-full h-full object-contain" />
            ) : null}
          </span>
          <span className="min-w-0">
            <b className="block text-[18px] text-ink leading-tight">{getCardLabel(sample, p.language)}</b>
            {p.bilingual && <span className="text-[14px] text-ink-2">{getCardLabel(sample, p.secondLanguage)}</span>}
          </span>
          <small className="absolute top-2 right-3 text-[10.5px] font-bold tracking-[.06em] uppercase text-ink-3">Preview</small>
        </div>
      )}

      <button type="button" onClick={() => { setPrefs(p); onDone(); }}
        className="min-h-[52px] rounded-[14px] bg-accent-strong text-white font-bold text-[15px] hover:bg-accent-hover">
        Start making schedules
      </button>
      <button type="button" onClick={() => { setPrefs({}); onDone(); }} className="text-[13px] font-semibold text-ink-3 hover:text-ink py-1">
        Skip for now
      </button>
    </div>
  );
}
