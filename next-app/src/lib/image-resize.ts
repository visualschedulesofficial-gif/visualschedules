// Shrinks a card picture in the browser before upload. Cards are shown at
// ~100–250px (and ~300px on the A4 page), so 800px WebP is plenty sharp for
// screen and print while being a fraction of a full-size PNG.

export async function shrinkImage(input: Blob, maxSize = 800, quality = 0.86): Promise<Blob> {
  if (typeof document === "undefined" || !input.type.startsWith("image/") || input.type === "image/svg+xml") return input;
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(input);
  } catch {
    return input;
  }
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const g = canvas.getContext("2d");
  if (!g) return input;
  g.imageSmoothingQuality = "high";
  g.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  const out = await new Promise<Blob | null>((res) => canvas.toBlob(res, "image/webp", quality));
  // Browsers without WebP encoding hand back PNG; keep whichever is smaller.
  if (!out || out.size >= input.size) return input;
  return out;
}

export async function shrinkFile(file: File, maxSize = 800): Promise<File> {
  const out = await shrinkImage(file, maxSize);
  if (out === file) return file;
  const ext = out.type === "image/webp" ? "webp" : out.type === "image/png" ? "png" : "jpg";
  return new File([out], file.name.replace(/\.[^.]+$/, "") + "." + ext, { type: out.type });
}
