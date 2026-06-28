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

// Cards that have images uploaded to R2 (with their available variants)
const CARD_IMAGE_MAP: Record<string, string[]> = {
  wake: ["neutral", "boy", "girl", "brown"],
  potty: ["neutral", "boy", "girl"],
  teeth: ["neutral"],
  bfast: ["neutral"],
};

export function getCardImageUrl(cardId: string, variant: string): string | null {
  const variants = CARD_IMAGE_MAP[cardId];
  if (!variants) return null;
  // Use the requested variant if available, fall back to neutral
  const useVariant = variants.includes(variant) ? variant : "neutral";
  return `/api/images/cards/${cardId}/${useVariant}.jpg`;
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
