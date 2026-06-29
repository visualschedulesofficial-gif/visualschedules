export const A4_PORTRAIT = { width: 794, height: 1123 } as const;
export const A4_LANDSCAPE = { width: 1123, height: 794 } as const;

export const GRID_SPECS = {
  2: { cols: 2, cellW: 345, cellH: 282, rows: 3, slots: 6 },
  3: { cols: 3, cellW: 227, cellH: 186, rows: 4, slots: 12 },
  4: { cols: 4, cellW: 168, cellH: 137, rows: 6, slots: 24 },
} as const;

export const MAX_WEEKLY_CARDS = 5;
export const MAX_CUSTOM_CARDS = 6;
export const MAX_FT_CARDS = 1;
export const FREE_SCHEDULE_LIMIT = 3;

export const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
] as const;

export const DAY_KEYS = [
  "Sun",
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
] as const;

export const LANGUAGES = {
  en: "English",
  hi: "Hindi",
  mr: "Marathi",
  pa: "Punjabi",
  gu: "Gujarati",
  ta: "Tamil",
  te: "Telugu",
  bn: "Bengali",
  ur: "Urdu",
  kn: "Kannada",
  ml: "Malayalam",
  es: "Spanish",
  fr: "French",
  de: "German",
  ar: "Arabic",
  zh: "Chinese",
  ja: "Japanese",
  ko: "Korean",
  pt: "Portuguese",
  ind: "Indonesian",
  ms: "Malay",
  th: "Thai",
  ru: "Russian",
  tl: "Filipino",
  vi: "Vietnamese",
} as const;

export type Language = keyof typeof LANGUAGES;
export type ScheduleType = "daily" | "weekly" | "custom" | "firstthen";
export type Gender = "neutral" | "boy" | "girl" | "brown" | "all";
export type CardStyle = "white" | "black";
export type GridCols = 2 | 3 | 4;
