import cardsJson from "./cards-parsed.json";

export interface ParsedCard {
  id: string;
  icon: string;
  categoryId: string;
  sortOrder: number;
  isCharacter?: boolean;
  isFree?: boolean;
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

export function isCharacterCard(card: ParsedCard): boolean {
  return card.isCharacter === true;
}

export function getCardGender(card: ParsedCard, selectedGender: string): string {
  if (isCharacterCard(card)) {
    return selectedGender;
  }
  return "neutral";
}

let _labelOverrides: Record<string, Record<string, string>> = {};

export function setLabelOverrides(overrides: Record<string, Record<string, string>>) {
  _labelOverrides = overrides;
}

export function getCardLabel(card: ParsedCard, lang: string): string {
  const override = _labelOverrides[card.id];
  if (override) {
    return override[lang] || override["en"] || card.translations[lang] || card.translations["en"] || card.id;
  }
  return card.translations[lang] || card.translations["en"] || card.id;
}

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

export const SAMPLE_CARDS = ALL_CARDS.map((c) => ({
  id: c.id,
  label: c.translations["en"] || c.id,
  icon: c.icon,
  category: c.categoryId,
}));

// Runtime card registry — populated from /api/cards at startup.
// Allows DB-only cards to work when cards-parsed.json is empty.
let _runtimeCards: ParsedCard[] = [];

export function setRuntimeCards(cards: ParsedCard[]) {
  _runtimeCards = cards;
}

export function getRuntimeCards(): ParsedCard[] {
  return _runtimeCards.length > 0 ? _runtimeCards : ALL_CARDS;
}

export function findCard(id: string): ParsedCard | undefined {
  return _runtimeCards.find((c) => c.id === id) ?? ALL_CARDS.find((c) => c.id === id);
}
