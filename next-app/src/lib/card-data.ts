import cardsJson from "./cards-parsed.json";

export interface ParsedCard {
  id: string;
  icon: string;
  categoryId: string;
  sortOrder: number;
  isCharacter?: boolean; // NEW: true for character cards, false/undefined for neutral
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

// Helper function to check if card is character type
export function isCharacterCard(card: ParsedCard): boolean {
  return card.isCharacter === true;
}

// Helper function to get appropriate gender for card
export function getCardGender(card: ParsedCard, selectedGender: string): string {
  if (isCharacterCard(card)) {
    return selectedGender; // Use selected gender for character cards
  }
  return "neutral"; // Always use "neutral" for neutral cards
}

// Label overrides from D1 (set at runtime by ScheduleBuilder)
let _labelOverrides: Record<string, Record<string, string>> = {};

export function setLabelOverrides(overrides: Record<string, Record<string, string>>) {
  _labelOverrides = overrides;
}

export function getCardLabel(card: ParsedCard, lang: string): string {
  // D1 overrides take priority over static JSON
  const override = _labelOverrides[card.id];
  if (override) {
    return override[lang] || override["en"] || card.translations[lang] || card.translations["en"] || card.id;
  }
  return card.translations[lang] || card.translations["en"] || card.id;
}

// Dynamic image map — populated from /api/cards/images at runtime
export type CardImageMap = Record<string, Record<string, string>>;

let _cardImages: CardImageMap = {};

export function setCardImages(images: CardImageMap) {
  _cardImages = images;
}

export function getCardImageUrl(cardId: string, variant: string): string | null {
  const variants = _cardImages[cardId];
  if (!variants) return null;
  return variants[variant] || variants["neutral"] || null;
}

export function getCardImageUrlFromMap(
  imageMap: CardImageMap,
  cardId: string,
  variant: string
): string | null {
  const variants = imageMap[cardId];
  if (!variants) return null;
  return variants[variant] || variants["neutral"] || null;
}

export function getCardsByCategory(categoryId: string): ParsedCard[] {
  return ALL_CARDS.filter((c) => c.categoryId === categoryId);
}

// Backward compat
export const SAMPLE_CARDS = ALL_CARDS.map((c) => ({
  id: c.id,
  label: c.translations["en"] || c.id,
  icon: c.icon,
  category: c.categoryId,
}));
