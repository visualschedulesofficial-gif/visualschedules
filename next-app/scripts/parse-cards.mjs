/**
 * Parse cards-data.js into structured JSON for the app.
 * Run: node scripts/parse-cards.mjs
 * Outputs: src/lib/cards-parsed.json
 */

import { readFileSync, writeFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const sourceFile = resolve(__dirname, "../../cards-data.js");

const source = readFileSync(sourceFile, "utf-8");

// Execute the JS to get the objects
const KNOWN_LANGS = [
  "en", "hi", "mr", "pa", "gu", "ta", "te", "bn", "ur", "kn", "ml",
  "or", "as", "si", "ne", "si_lk", "dz", "ar", "fa", "sw",
  "es", "fr", "de", "pt", "it", "nl", "pl", "ru", "zh", "ja", "ko",
  "ind", "ms", "th", "tl", "vi"
];

// Eval in a sandboxed way — the file just declares `const` variables
let CARDS_DATA, CAT_META, CARD_IMAGES;
const fn = new Function(`
  ${source}
  return { CARDS_DATA, CAT_META, CARD_IMAGES };
`);
const data = fn();
CARDS_DATA = data.CARDS_DATA;
CAT_META = data.CAT_META;
CARD_IMAGES = data.CARD_IMAGES;

// Build structured output
const categories = Object.entries(CAT_META).map(([id, meta], idx) => ({
  id,
  name: id.charAt(0).toUpperCase() + id.slice(1),
  isFree: meta.free,
  sortOrder: idx,
}));

const cards = [];
const translations = [];
const images = [];

for (const [catId, cardList] of Object.entries(CARDS_DATA)) {
  for (let sortIdx = 0; sortIdx < cardList.length; sortIdx++) {
    const card = cardList[sortIdx];
    cards.push({
      id: card.id,
      icon: card.icon,
      categoryId: catId,
      sortOrder: sortIdx,
    });

    // Extract translations
    for (const lang of KNOWN_LANGS) {
      if (card[lang]) {
        translations.push({
          cardId: card.id,
          lang,
          label: card[lang],
        });
      }
    }

    // Extract image URLs/data
    if (CARD_IMAGES) {
      // Check for base image and gendered variants
      const variants = ["neutral", "boy", "girl", "brown"];
      for (const variant of variants) {
        const key = variant === "neutral" ? card.id : `${card.id}_${variant}`;
        if (CARD_IMAGES[key]) {
          const val = CARD_IMAGES[key];
          // Only store URLs, skip base64 for now (too large for JSON)
          const isUrl = val.startsWith("http");
          images.push({
            cardId: card.id,
            variant,
            url: isUrl ? val : null,
            hasBase64: !isUrl,
          });
        }
      }
      // Also check plain id (no variant suffix) as neutral
      if (CARD_IMAGES[card.id] && !images.find(i => i.cardId === card.id && i.variant === "neutral")) {
        const val = CARD_IMAGES[card.id];
        const isUrl = val.startsWith("http");
        images.push({
          cardId: card.id,
          variant: "neutral",
          url: isUrl ? val : null,
          hasBase64: !isUrl,
        });
      }
    }
  }
}

const output = {
  categories,
  cards,
  translations,
  imageCount: images.length,
  imagesWithUrl: images.filter(i => i.url).length,
  imagesWithBase64: images.filter(i => i.hasBase64).length,
};

console.log(`Parsed: ${cards.length} cards, ${translations.length} translations, ${images.length} images`);
console.log(`Categories: ${categories.map(c => `${c.id}(${c.isFree ? 'free' : 'paid'})`).join(', ')}`);

// Write cards + translations (without base64 blobs)
const appData = {
  categories,
  cards: cards.map(c => {
    const trans = {};
    for (const t of translations.filter(t => t.cardId === c.id)) {
      trans[t.lang] = t.label;
    }
    return { ...c, translations: trans };
  }),
};

const outPath = resolve(__dirname, "../src/lib/cards-parsed.json");
writeFileSync(outPath, JSON.stringify(appData, null, 2));
console.log(`Written to: ${outPath}`);
