import { NextRequest, NextResponse } from "next/server";

function getEnv(): { DB?: any } {
  const symbol = Symbol.for("__cloudflare-context__");
  const ctx = (globalThis as any)[symbol];
  return ctx?.env || {};
}

function parseIcon(raw: string): { isFree: boolean; icon: string } {
  if (raw?.startsWith("free:")) return { isFree: true, icon: raw.slice(5) };
  if (raw?.startsWith("paid:")) return { isFree: false, icon: raw.slice(5) };
  return { isFree: false, icon: raw || "s-star" };
}

function buildIcon(icon: string, isFree: boolean): string {
  const base = icon.replace(/^(free|paid):/, "");
  return `${isFree ? "free" : "paid"}:${base}`;
}

// MyMemory language code mapping
// Our app uses some codes that differ from MyMemory's expected format
const LANG_MAP: Record<string, string> = {
  en: "en-US", hi: "hi-IN", mr: "mr-IN", pa: "pa-IN",
  gu: "gu-IN", ta: "ta-IN", te: "te-IN", bn: "bn-IN",
  ur: "ur-PK", kn: "kn-IN", ml: "ml-IN", es: "es-ES",
  fr: "fr-FR", de: "de-DE", ar: "ar-SA", zh: "zh-CN",
  ja: "ja-JP", ko: "ko-KR", pt: "pt-BR", ind: "id-ID",
  ms: "ms-MY", th: "th-TH", ru: "ru-RU", tl: "tl-PH",
  vi: "vi-VN",
};

// Translate English text into all target languages via MyMemory (free, no key)
async function translateAll(
  englishText: string,
  adminEmail?: string
): Promise<Record<string, string>> {
  const results: Record<string, string> = { en: englishText };

  const targets = Object.keys(LANG_MAP).filter((l) => l !== "en");

  // Translate each language — MyMemory is one request per language pair
  // We run them in parallel (Promise.allSettled so one failure doesn't stop others)
  const translations = await Promise.allSettled(
    targets.map(async (lang) => {
      const source = "en-US";
      const target = LANG_MAP[lang];
      const params = new URLSearchParams({
        q: englishText,
        langpair: `${source}|${target}`,
      });
      if (adminEmail) params.set("de", adminEmail);

      const res = await fetch(
        `https://api.mymemory.translated.net/get?${params}`,
        { signal: AbortSignal.timeout(8000) }
      );
      const data = await res.json();

      if (data.responseStatus === 200 && data.responseData?.translatedText) {
        return { lang, text: data.responseData.translatedText };
      }
      return { lang, text: englishText }; // fallback to English
    })
  );

  for (const result of translations) {
    if (result.status === "fulfilled") {
      results[result.value.lang] = result.value.text;
    }
  }

  return results;
}

// GET /api/admin/cards — list all cards from D1
export async function GET() {
  try {
    const env = getEnv();
    if (!env.DB) {
      return NextResponse.json({ cards: [], source: "fallback" }, { status: 200 });
    }

    const result = await env.DB.prepare(
      `SELECT
         c.id, c.icon, c.category_id, c.sort_order,
         (SELECT GROUP_CONCAT(ct.lang || ':::' || ct.label, ';;;')
            FROM card_translations ct WHERE ct.card_id = c.id) AS labels,
         (SELECT GROUP_CONCAT(DISTINCT ci.variant)
            FROM card_images ci WHERE ci.card_id = c.id) AS variants
       FROM cards c
       WHERE c.status = 'live'
       ORDER BY c.sort_order ASC, c.id ASC`
    ).all();

    const cards = (result.results || []).map((row: any) => {
      const translations: Record<string, string> = {};
      if (row.labels) {
        for (const pair of String(row.labels).split(";;;")) {
          const idx = pair.indexOf(":::");
          if (idx > -1) translations[pair.slice(0, idx)] = pair.slice(idx + 3);
        }
      }
      const variantList = row.variants ? String(row.variants).split(",") : [];
      const isCharacter = variantList.some((v: string) => ["boy", "girl", "brown"].includes(v));
      const { isFree, icon } = parseIcon(row.icon);
      return {
        id: row.id, icon, isFree,
        categoryId: row.category_id,
        sortOrder: row.sort_order ?? 0,
        isCharacter,
        translations: Object.keys(translations).length ? translations : { en: row.id },
      };
    });

    return NextResponse.json({ cards, source: "database", count: cards.length });
  } catch (err: any) {
    console.error("Cards fetch error:", err);
    return NextResponse.json({ cards: [], source: "error" });
  }
}

// POST /api/admin/cards — create card + auto-translate into all 25 languages
export async function POST(request: NextRequest) {
  try {
    const { id, icon, isFree, categoryId, isCharacter, translations } = await request.json();

    if (!id || !categoryId || !translations?.en) {
      return NextResponse.json(
        { error: "id, categoryId, and translations.en are required" },
        { status: 400 }
      );
    }

    const env = getEnv();
    if (!env.DB) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 });
    }

    const existing = await env.DB.prepare(`SELECT id FROM cards WHERE id = ?`).bind(id).first();
    if (existing) {
      return NextResponse.json(
        { error: `Card "${id}" already exists.` },
        { status: 409 }
      );
    }

    const iconField = buildIcon(icon || "s-star", !!isFree);

    await env.DB.prepare(
      `INSERT INTO cards (id, icon, category_id, status, sort_order, created_at)
       VALUES (?, ?, ?, 'live', 0, datetime('now'))`
    ).bind(id, iconField, categoryId).run();

    // Auto-translate English name into all 25 languages via MyMemory
    // Use Hindi from the form if provided (usually more accurate than auto-translate)
    let allTranslations: Record<string, string>;
    try {
      allTranslations = await translateAll(translations.en);
      // If admin provided Hindi, use that (overrides auto-translate)
      if (translations.hi && translations.hi !== translations.en) {
        allTranslations.hi = translations.hi;
      }
    } catch {
      // If translation fails entirely, save with just en + hi
      allTranslations = { en: translations.en };
      if (translations.hi) allTranslations.hi = translations.hi;
    }

    // Save all translations to the database
    for (const [lang, label] of Object.entries(allTranslations)) {
      if (!label || typeof label !== "string") continue;
      await env.DB.prepare(
        `INSERT OR IGNORE INTO card_translations (card_id, lang, label) VALUES (?, ?, ?)`
      ).bind(id, lang, label).run();
    }

    return NextResponse.json(
      {
        success: true, id, isFree: !!isFree,
        translatedLanguages: Object.keys(allTranslations).length,
        message: `Card created with ${Object.keys(allTranslations).length} language translations!`,
      },
      { status: 201 }
    );
  } catch (err: any) {
    console.error("Card creation error:", err);
    if (err?.message?.includes("UNIQUE")) {
      return NextResponse.json({ error: "A card with this ID already exists." }, { status: 409 });
    }
    return NextResponse.json({ error: err?.message || "Failed to create card" }, { status: 500 });
  }
}
