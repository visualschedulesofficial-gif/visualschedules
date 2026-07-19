import { create } from "zustand";
import type {
  ScheduleType,
  Gender,
  CardStyle,
  GridCols,
  Language,
} from "@/lib/constants";
import type { CardRef, PageData, DailyPageData, ColumnPageData } from "@/types/schedule";
import { GRID_SPECS, MAX_WEEKLY_CARDS, MAX_CUSTOM_CARDS, MAX_FT_CARDS } from "@/lib/constants";

interface ScheduleState {
  /** Card search typed in the mobile app header */
  uiSearch: string;
  setUiSearch: (s: string) => void;
  /** True while a PDF/JPEG capture runs — canvas zoom snaps to 100% */
  exporting: boolean;
  setExporting: (v: boolean) => void;
  /** First/Then board style: 2 boards, 3 boards, or a 4-step sequence */
  ftStyle: "first-then" | "first-then-now" | "sequencing";
  setFtStyle: (v: "first-then" | "first-then-now" | "sequencing") => void;
  /** Card proportions: image-led, balanced, or text-led (canvas behavior TBD) */
  cardType: "visual" | "equal" | "text";
  setCardType: (t: "visual" | "equal" | "text") => void;
  /** Card text: with text (single/multi language) or images only */
  labelMode: "single" | "multi" | "none";
  setLabelMode: (m: "single" | "multi" | "none") => void;
  secondLanguage: Language;
  setSecondLanguage: (l: Language) => void;
  id: string | null;
  title: string;
  scheduleType: ScheduleType;
  language: Language;
  gender: Gender;
  gridCols: GridCols;
  cardStyle: CardStyle;
  customColNames: string[];
  weekMode: "week" | "weekdays";
  pages: PageData[];
  isDirty: boolean;

  // Actions
  setTitle: (title: string) => void;
  setScheduleType: (type: ScheduleType) => void;
  setLanguage: (lang: Language) => void;
  setGender: (gender: Gender) => void;
  setGridCols: (cols: GridCols) => void;
  setCardStyle: (style: CardStyle) => void;
  setCustomColNames: (names: string[]) => void;
  setWeekMode: (mode: "week" | "weekdays") => void;

  placeCard: (pageIdx: number, slotKey: string, card: CardRef) => void;
  removeCard: (pageIdx: number, slotKey: string, cardIdx?: number) => void;
  addPage: () => void;
  removePage: (pageIdx: number) => void;

  loadSchedule: (data: Partial<ScheduleState> & { id: string }) => void;
  reset: () => void;
  markClean: () => void;
}

function createEmptyDailyPage(slots: number): DailyPageData {
  return { slots: Array(slots).fill(null) };
}

function createEmptyColumnPage(): ColumnPageData {
  return { columns: {} };
}

export const useScheduleState = create<ScheduleState>((set, get) => ({
  uiSearch: "",
  setUiSearch: (s: string) => set({ uiSearch: s }),
  exporting: false,
  setExporting: (exporting) => set({ exporting }),
  ftStyle: "first-then",
  setFtStyle: (ftStyle) => set({ ftStyle, isDirty: true }),
  cardType: "visual",
  setCardType: (cardType) => set({ cardType, isDirty: true }),
  labelMode: "single",
  setLabelMode: (labelMode) => set({ labelMode, isDirty: true }),
  secondLanguage: "hi",
  setSecondLanguage: (secondLanguage) => set({ secondLanguage, isDirty: true }),
  id: null,
  title: "Daily Schedule",
  scheduleType: "daily",
  language: "en",
  gender: "boy",
  gridCols: 3,
  cardStyle: "white",
  customColNames: ["Column 1", "Column 2", "Column 3", "Column 4"],
  weekMode: "week",
  pages: [createEmptyDailyPage(GRID_SPECS[3].slots)],
  isDirty: false,

  setTitle: (title) => set({ title, isDirty: true }),
  setScheduleType: (scheduleType) => {
    const TYPE_TITLES: Record<string, string> = {
      daily: "Daily Schedule",
      weekly: "Weekly Schedule",
      custom: "Custom Schedule",
      firstthen: "First/Then Board",
      iwant: "I want",
    };
    const pages =
      scheduleType === "daily"
        ? [createEmptyDailyPage(GRID_SPECS[get().gridCols].slots)]
        : [createEmptyColumnPage()];
    set({ scheduleType, pages, title: TYPE_TITLES[scheduleType] || "My Schedule", isDirty: true });
  },
  setLanguage: (language) => set({ language, isDirty: true }),
  setGender: (gender) => set({ gender, isDirty: true }),
  setGridCols: (gridCols) => {
    const pages = [createEmptyDailyPage(GRID_SPECS[gridCols].slots)];
    set({ gridCols, pages, isDirty: true });
  },
  setCardStyle: (cardStyle) => set({ cardStyle, isDirty: true }),
  setCustomColNames: (customColNames) => set({ customColNames, isDirty: true }),
  setWeekMode: (weekMode) => set({ weekMode, isDirty: true }),

  placeCard: (pageIdx, slotKey, card) => {
    const { pages, scheduleType, gridCols } = get();
    const newPages = [...pages];

    if (scheduleType === "daily") {
      const page = { ...(newPages[pageIdx] as DailyPageData) };
      const slotIdx = parseInt(slotKey);
      const newSlots = [...page.slots];
      newSlots[slotIdx] = card;
      page.slots = newSlots;
      newPages[pageIdx] = page;
    } else {
      const page = { ...(newPages[pageIdx] as ColumnPageData) };
      const columns = { ...page.columns };
      const existing = columns[slotKey] || [];
      // Cut-out capacity: I-want board holds 9; First/Then holds N×N where
      // N is the number of boards (2→4, 3→9, 4→16).
      const ftBoards =
        get().ftStyle === "sequencing" ? 4 : get().ftStyle === "first-then-now" ? 3 : 2;
      const maxCards =
        scheduleType === "weekly"
          ? MAX_WEEKLY_CARDS
          : scheduleType === "custom"
            ? MAX_CUSTOM_CARDS
            : slotKey === "cutout"
              ? scheduleType === "iwant"
                ? 9
                : ftBoards === 4
                  ? 16
                  : 9
              : scheduleType === "iwant"
                ? 1
                : MAX_FT_CARDS;
      if (existing.length < maxCards) {
        columns[slotKey] = [...existing, card];
      }
      page.columns = columns;
      newPages[pageIdx] = page;
    }

    set({ pages: newPages, isDirty: true });
  },

  removeCard: (pageIdx, slotKey, cardIdx) => {
    const { pages, scheduleType } = get();
    const newPages = [...pages];

    if (scheduleType === "daily") {
      const page = { ...(newPages[pageIdx] as DailyPageData) };
      const slotIdx = parseInt(slotKey);
      const newSlots = [...page.slots];
      newSlots[slotIdx] = null;
      page.slots = newSlots;
      newPages[pageIdx] = page;
    } else {
      const page = { ...(newPages[pageIdx] as ColumnPageData) };
      const columns = { ...page.columns };
      const existing = [...(columns[slotKey] || [])];
      if (cardIdx !== undefined) {
        existing.splice(cardIdx, 1);
      }
      columns[slotKey] = existing;
      page.columns = columns;
      newPages[pageIdx] = page;
    }

    set({ pages: newPages, isDirty: true });
  },

  addPage: () => {
    const { pages, scheduleType, gridCols } = get();
    const newPage =
      scheduleType === "daily"
        ? createEmptyDailyPage(GRID_SPECS[gridCols].slots)
        : createEmptyColumnPage();
    set({ pages: [...pages, newPage], isDirty: true });
  },

  removePage: (pageIdx) => {
    const { pages } = get();
    if (pages.length <= 1) return;
    set({ pages: pages.filter((_, i) => i !== pageIdx), isDirty: true });
  },

  loadSchedule: (data) => {
    set({
      ...data,
      isDirty: false,
    });
  },

  reset: () =>
    set({
      id: null,
      title: "Daily Schedule",
      scheduleType: "daily",
      language: "en",
      gender: "neutral",
      gridCols: 3,
      cardStyle: "white",
      customColNames: ["Column 1", "Column 2", "Column 3", "Column 4"],
      weekMode: "week",
      pages: [createEmptyDailyPage(GRID_SPECS[3].slots)],
      isDirty: false,
    }),

  markClean: () => set({ isDirty: false }),
}));
