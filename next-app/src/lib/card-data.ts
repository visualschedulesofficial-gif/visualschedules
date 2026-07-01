
// ── Runtime card registry ─────────────────────────────────────────────────
// Populated from /api/cards at startup. Replaces ALL_CARDS lookups so that
// DB-only cards (when cards-parsed.json is empty) work on the canvas.
let _runtimeCards: ParsedCard[] = [];

export function setRuntimeCards(cards: ParsedCard[]) {
  _runtimeCards = cards;
}

export function getRuntimeCards(): ParsedCard[] {
  // Fall back to static ALL_CARDS if runtime hasn't loaded yet
  return _runtimeCards.length > 0 ? _runtimeCards : ALL_CARDS;
}

export function findCard(id: string): ParsedCard | undefined {
  return _runtimeCards.find((c) => c.id === id) ?? ALL_CARDS.find((c) => c.id === id);
}
