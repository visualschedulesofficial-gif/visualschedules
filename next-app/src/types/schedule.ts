export type Gender = "neutral" | "boy" | "girl" | "brown" | "all";

export interface CardRef {
  cardId: string;
  catId: string;
}

export interface DailyPageData {
  slots: (CardRef | null)[];
}

export interface ColumnPageData {
  columns: Record<string, CardRef[]>;
}

export type PageData = DailyPageData | ColumnPageData;

export interface ScheduleState {
  scheduleType: "daily" | "weekly" | "custom" | "firstthen";
  gridCols: 2 | 3 | 4;
  title: string;
  language: string;
  gender: Gender;
  cardStyle: "white" | "black";
  weekMode: "fullweek" | "weekdays";
  pages: PageData[];
  customColNames: string[];
  
  setScheduleType: (type: "daily" | "weekly" | "custom" | "firstthen") => void;
  setGridCols: (cols: 2 | 3 | 4) => void;
  setTitle: (title: string) => void;
  setLanguage: (lang: string) => void;
  setGender: (gender: Gender) => void;
  setCardStyle: (style: "white" | "black") => void;
  setWeekMode: (mode: "fullweek" | "weekdays") => void;
  addPage: () => void;
  removePage: (idx: number) => void;
  addCard: (cardId: string, catId: string) => void;
  removeCard: (pageIdx: number, key: string, cardIdx?: number) => void;
  placeCard: (pageIdx: number, key: string, card: CardRef) => void;
  setCustomColNames: (names: string[]) => void;
}
