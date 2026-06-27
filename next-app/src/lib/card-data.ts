import cardsJson from "./cards-parsed.json";

export interface ParsedCard {
  id: string;
  icon: string;
  categoryId: string;
  sortOrder: number;
  translations: Record<string, string>;
}

export interface ParsedCategory {
  id: string;
  name: string;
  isFree: boolean;
  sortOrder: number;
}

export const CATEGORIES: ParsedCategory[] = cardsJson.categories as ParsedCategory[];
export const ALL_CARDS: ParsedCard[] = cardsJson.cards as unknown as ParsedCard[];

export function getCardLabel(card: ParsedCard, lang: string): string {
  return card.translations[lang] || card.translations["en"] || card.id;
}

// Cards that have images uploaded to R2
const CARDS_WITH_IMAGES = new Set(["wake", "potty", "teeth", "bfast"]);

export function getCardImageUrl(cardId: string, variant: string): string | null {
  if (!CARDS_WITH_IMAGES.has(cardId)) return null;
  return `/api/images/cards/${cardId}/${variant}.jpg`;
}

export function getCardsByCategory(categoryId: string): ParsedCard[] {
  return ALL_CARDS.filter((c) => c.categoryId === categoryId);
}

// Backward compat — SAMPLE_CARDS used by builder
export const SAMPLE_CARDS = ALL_CARDS.map((c) => ({
  id: c.id,
  label: c.translations["en"] || c.id,
  icon: c.icon,
  category: c.categoryId,
}));
