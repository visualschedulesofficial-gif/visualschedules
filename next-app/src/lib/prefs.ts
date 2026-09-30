import type { Gender, Language } from "@/lib/constants";
import { useScheduleState } from "@/hooks/useScheduleState";

// A parent's defaults for NEW schedules: card language, an optional second
// language, and which character appears on cards. Set in Profile (and
// after first sign-in); every new schedule starts from them. Kept on the
// device so it works without an account.
export type Prefs = {
  language: Language;
  bilingual: boolean;
  secondLanguage: Language;
  gender: Gender;
};

const KEY = "vs_prefs_v1";
const DEFAULTS: Prefs = { language: "en", bilingual: false, secondLanguage: "hi", gender: "boy" };

export function getPrefs(): Prefs {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {}
  return { ...DEFAULTS };
}

export function hasSavedPrefs(): boolean {
  try { return !!localStorage.getItem(KEY); } catch { return false; }
}

export function setPrefs(patch: Partial<Prefs>): Prefs {
  const next = { ...getPrefs(), ...patch };
  if (next.secondLanguage === next.language) next.secondLanguage = next.language === "en" ? "hi" : "en";
  try { localStorage.setItem(KEY, JSON.stringify(next)); } catch {}
  return next;
}

// Apply to the schedule being built. Only for fresh schedules — never over
// a saved one being edited.
export function applyPrefsToNewSchedule() {
  if (!hasSavedPrefs()) return;
  const p = getPrefs();
  const s = useScheduleState.getState();
  s.setLanguage(p.language);
  s.setGender(p.gender);
  s.setSecondLanguage(p.secondLanguage);
  s.setLabelMode(p.bilingual ? "multi" : "single");
  useScheduleState.getState().markClean?.();
}
