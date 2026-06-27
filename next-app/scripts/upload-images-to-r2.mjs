/**
 * Upload card images to R2 and register in D1.
 * Sources: base64 from cards-data.js + PNG files from /images/daily/
 * Run: node scripts/upload-images-to-r2.mjs
 */

import { readFileSync, readdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

const CF_API_TOKEN = process.env.CLOUDFLARE_API_TOKEN || "";
const CF_ACCOUNT_ID = "dc02bae6c57f5ac25d870cab7cdf2b0b";
const R2_BUCKET = "visual-schedules-assets";
const D1_DB_ID = "da0981b9-0fe4-40cb-b47e-9795e2871867";
const R2_PUBLIC_URL = "https://assets.visualschedule.app";

async function uploadToR2(key, buffer, contentType) {
  const url = `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/r2/buckets/${R2_BUCKET}/objects/${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${CF_API_TOKEN}`,
      "Content-Type": contentType,
    },
    body: buffer,
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`R2 upload failed for ${key}: ${res.status} ${text}`);
  }
  console.log(`  ✓ R2: ${key} (${Math.round(buffer.length / 1024)}KB)`);
  return `${R2_PUBLIC_URL}/${key}`;
}

async function insertD1(cardId, variant, r2Key, url) {
  const sql = `INSERT OR REPLACE INTO card_images (card_id, variant, r2_key, url) VALUES ('${cardId}', '${variant}', '${r2Key}', '${url}')`;
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${CF_ACCOUNT_ID}/d1/database/${D1_DB_ID}/query`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CF_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ sql }),
    }
  );
  if (!res.ok) {
    const text = await res.text();
    console.error(`  ✗ D1 insert failed: ${text}`);
  }
}

async function main() {
  console.log("=== Uploading card images to R2 ===\n");

  // 1. Extract base64 images from cards-data.js
  console.log("--- Source: cards-data.js (base64) ---");
  const cardsDataPath = resolve(__dirname, "../../cards-data.js");
  const src = readFileSync(cardsDataPath, "utf-8");
  const fn = new Function(src + "; return { CARD_IMAGES };");
  const { CARD_IMAGES } = fn();

  for (const [key, dataUrl] of Object.entries(CARD_IMAGES)) {
    // Parse key: "wake" → neutral, "wake_boy" → boy variant
    let cardId, variant;
    if (key.includes("_")) {
      const parts = key.split("_");
      cardId = parts.slice(0, -1).join("_");
      variant = parts[parts.length - 1];
    } else {
      cardId = key;
      variant = "neutral";
    }

    // Decode base64
    const base64Match = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/);
    if (!base64Match) {
      console.log(`  ⚠ Skipping ${key}: not base64`);
      continue;
    }

    const ext = base64Match[1] === "jpeg" ? "jpg" : base64Match[1];
    const buffer = Buffer.from(base64Match[2], "base64");
    const contentType = `image/${base64Match[1]}`;
    const r2Key = `cards/${cardId}/${variant}.${ext}`;

    const publicUrl = await uploadToR2(r2Key, buffer, contentType);
    await insertD1(cardId, variant, r2Key, publicUrl);
  }

  // 2. Upload PNG files from /images/daily/
  console.log("\n--- Source: /images/daily/ (PNG files) ---");
  const imagesDir = resolve(__dirname, "../../images/daily");
  let files;
  try {
    files = readdirSync(imagesDir).filter((f) => f.endsWith(".png"));
  } catch {
    console.log("  No /images/daily/ directory found, skipping.");
    files = [];
  }

  for (const file of files) {
    // Parse filename: "wakeup:boy.png" → cardId="wake", variant="boy"
    const match = file.match(/^(.+):(.+)\.png$/);
    if (!match) continue;

    let cardId = match[1];
    const variant = match[2];

    // Normalize card IDs (file uses "wakeup" but card ID is "wake")
    if (cardId === "wakeup") cardId = "wake";

    const buffer = readFileSync(resolve(imagesDir, file));
    const r2Key = `cards/${cardId}/${variant}.png`;

    const publicUrl = await uploadToR2(r2Key, buffer, "image/png");
    await insertD1(cardId, variant, r2Key, publicUrl);
  }

  console.log("\n=== Done! ===");
}

main().catch(console.error);
