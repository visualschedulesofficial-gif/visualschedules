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
  id: null,
  title: "Morning Routine",
  scheduleType: "daily",
  language: "en",
  gender: "neutral",
  gridCols: 3,
  cardStyle: "white",
  customColNames: ["Column 1", "Column 2", "Column 3", "Column 4"],
  weekMode: "week",
  pages: [createEmptyDailyPage(GRID_SPECS[3].slots)],
  isDirty: false,

  setTitle: (title) => set({ title, isDirty: true }),
  setScheduleType: (scheduleType) => {
    const pages =
      scheduleType === "daily"
        ? [createEmptyDailyPage(GRID_SPECS[get().gridCols].slots)]
        : [createEmptyColumnPage()];
    set({ scheduleType, pages, isDirty: true });
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
      const maxCards =
        scheduleType === "weekly"
          ? MAX_WEEKLY_CARDS
          : scheduleType === "custom"
            ? MAX_CUSTOM_CARDS
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
      title: "Morning Routine",
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
