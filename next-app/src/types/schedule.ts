import type {
  ScheduleType,
  Gender,
  CardStyle,
  GridCols,
  Language,
} from "@/lib/constants";

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

export interface ScheduleData {
  pages: PageData[];
}

export interface Schedule {
  id: string;
  userId: string;
  title: string;
  scheduleType: ScheduleType;
  language: Language;
  gender: Gender;
  gridCols: GridCols;
  customColNames: string[] | null;
  weekMode: "week" | "weekdays";
  cardStyle: CardStyle;
  data: ScheduleData;
  createdAt: string;
  updatedAt: string;
}
