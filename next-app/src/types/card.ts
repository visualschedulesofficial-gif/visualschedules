export interface Card {
  id: string;
  icon: string;
  categoryId: string;
  status: "live" | "draft";
  sortOrder: number;
  label: string;
  imageUrl: string | null;
}

export interface Category {
  id: string;
  name: string;
  isFree: boolean;
  enabled: boolean;
  sortOrder: number;
}

export interface CardWithTranslations {
  id: string;
  icon: string;
  categoryId: string;
  translations: Record<string, string>;
  images: Record<string, string>;
}
