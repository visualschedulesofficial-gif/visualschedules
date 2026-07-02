import { NextRequest, NextResponse } from "next/server";

function getEnv(): { DB?: any; AI?: any } {
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

// All supported language codes and their full names for the prompt
const LANG_NAMES: Record<string, string> = {
  mr: "Marathi", pa: "Punjabi", gu: "Gujarati", ta: "Tamil",
  te: "Telugu", bn: "Bengali", ur: "Urdu", kn: "Kannada",
  ml: "Malayalam", es: "Spanish", fr: "French", de: "German",
  ar: "Arabic", zh: "Chinese (Simplified)", ja: "Japanese",
  ko: "Korean", pt: "Portuguese", ind: "Indonesian", ms: "Malay",
  th: "Thai", ru: "Russian", tl: "Filipino", vi: "Vietnamese",
};

// Auto-translate using Cloudflare AI (built-in, no API key needed)
// Falls back to MyMemory if AI binding not available
async function autoTranslate(
  englishText: string,
  hindiText: string,
  env: any
): Promise<Record<string, string>> {
  const results: Record<string, string> = {
    en: englishText,
    hi: hindiText || englishText,
  };

  // Try Cloudflare AI first. We use a small LLM instead of a plain
  // translation model because it can follow instructions about REGISTER:
  // visual-schedule cards need the simple, everyday word a parent says to a
  // young child (e.g. Hindi "नहाना", not the formal "स्नान").
  if (env.AI) {
    try {
      const targetLangs = Object.entries(LANG_NAMES);
      // Translate in batches of 5
      for (let i = 0; i < targetLangs.length; i += 5) {
        const batch = targetLangs.slice(i, i + 5);
        await Promise.allSettled(
          batch.map(async ([code, langName]) => {
            try {
              // 1st choice: LLM with a child-friendly prompt
              const llm = await env.AI.run("@cf/meta/llama-3.1-8b-instruct", {
                messages: [
                  {
                    role: "system",
                    content:
                      "You translate single words or short phrases for a children's visual schedule app used by parents of young neurodiverse children. Give the simplest, most common everyday word a parent would naturally say to a small child in the target language — conversational register, NOT formal or literary. Reply with ONLY the translated word/phrase in the target language's native script. No quotes, no punctuation, no explanation, no romanization.",
                  },
                  {
                    role: "user",
                    content: `Translate to ${langName}: ${englishText}`,
                  },
                ],
                max_tokens: 40,
              });
              const llmText = (llm?.response || "")
                .trim()
                .replace(/^["'«»""]+|["'«»""]+$/g, "")
                .replace(/[.。]$/, "")
                .trim();
              // Sanity check: short, non-empty, not an explanation
              if (llmText && llmText.length <= 60 && !/translat|sorry|cannot/i.test(llmText)) {
                results[code] = llmText;
                return;
              }
              // 2nd choice: dedicated translation model
              const response = await env.AI.run(
                "@cf/meta/m2m100-1.2b",
                { text: englishText, source_lang: "english", target_lang: langName.toLowerCase() }
              );
              if (response?.translated_text) {
                results[code] = response.translated_text;
              }
            } catch {
              // Skip failed language
            }
          })
        );
      }
      return results;
    } catch {
      // Fall through to MyMemory
    }
  }

  // Fallback: MyMemory (free, no key)
  const LANG_MAP: Record<string, string> = {
    mr: "mr-IN", pa: "pa-IN", gu: "gu-IN", ta: "ta-IN", te: "te-IN",
    bn: "bn-IN", ur: "ur-PK", kn: "kn-IN", ml: "ml-IN", es: "es-ES",
    fr: "fr-FR", de: "de-DE", ar: "ar-SA", zh: "zh-CN", ja: "ja-JP",
    ko: "ko-KR", pt: "pt-BR", ind: "id-ID", ms: "ms-MY", th: "th-TH",
    ru: "ru-RU", tl: "tl-PH", vi: "vi-VN",
  };

  const targets = Object.keys(LANG_MAP);
  for (let i = 0; i < targets.length; i += 4) {
    const batch = targets.slice(i, i + 4);
    await Promise.allSettled(
      batch.map(async (lang) => {
        try {
          const params = new URLSearchParams({
            q: englishText,
            langpair: `en-US|${LANG_MAP[lang]}`,
          });
          const res = await fetch(
            `https://api.mymemory.translated.net/get?${params}`,
            { signal: AbortSignal.timeout(6000) }
          );
          const data = await res.json();
          if (data.responseStatus === 200 && data.responseData?.translatedText) {
            results[lang] = data.responseData.translatedText;
          }
        } catch {
          // Skip
        }
      })
    );
  }

  return results;
}

// GET /api/admin/cards
export async function GET() {
  try {
    const env = getEnv();
    if (!env.DB) return NextResponse.json({ cards: [], source: "fallback" });

    const result = await env.DB.prepare(
      `SELECT c.id, c.icon, c.category_id, c.sort_order,
         (SELECT GROUP_CONCAT(ct.lang || ':::' || ct.label, ';;;')
            FROM card_translations ct WHERE ct.card_id = c.id) AS labels,
         (SELECT GROUP_CONCAT(DISTINCT ci.variant)
            FROM card_images ci WHERE ci.card_id = c.id) AS variants
       FROM cards c WHERE c.status = 'live'
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
    return NextResponse.json({ cards: [], source: "error" });
  }
}

// POST /api/admin/cards — create card + auto-translate
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
    if (!env.DB) return NextResponse.json({ error: "Database not available" }, { status: 503 });

    const existing = await env.DB.prepare(`SELECT id FROM cards WHERE id = ?`).bind(id).first();
    if (existing) {
      return NextResponse.json({ error: `Card "${id}" already exists.` }, { status: 409 });
    }

    const iconField = buildIcon(icon || "s-star", !!isFree);
    await env.DB.prepare(
      `INSERT INTO cards (id, icon, category_id, status, sort_order, created_at)
       VALUES (?, ?, ?, 'live', 0, datetime('now'))`
    ).bind(id, iconField, categoryId).run();

    // Auto-translate into all languages
    // User-provided Hindi is always used as-is (more accurate than auto)
    let allTranslations: Record<string, string>;
    try {
      allTranslations = await autoTranslate(translations.en, translations.hi, env);
    } catch {
      allTranslations = { en: translations.en, hi: translations.hi || translations.en };
    }

    // Save all translations
    for (const [lang, label] of Object.entries(allTranslations)) {
      if (!label || typeof label !== "string") continue;
      await env.DB.prepare(
        `INSERT OR IGNORE INTO card_translations (card_id, lang, label) VALUES (?, ?, ?)`
      ).bind(id, lang, label).run();
    }

    return NextResponse.json({
      success: true, id,
      isFree: !!isFree,
      translatedLanguages: Object.keys(allTranslations).length,
      message: `Card created with ${Object.keys(allTranslations).length} translations!`,
    }, { status: 201 });

  } catch (err: any) {
    console.error("Card creation error:", err);
    if (err?.message?.includes("UNIQUE")) {
      return NextResponse.json({ error: "A card with this ID already exists." }, { status: 409 });
    }
    return NextResponse.json({ error: err?.message || "Failed to create card" }, { status: 500 });
  }
}
