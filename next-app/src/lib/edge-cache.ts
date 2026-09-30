// Cloudflare's edge cache for Worker responses. Responses from our own
// route handlers aren't cached by the CDN on their own, so without this
// every image and every card list goes back to R2 / D1 on every request.

type Ctx = { waitUntil?: (p: Promise<unknown>) => void };

function cfCtx(): Ctx | undefined {
  const c = (globalThis as any)[Symbol.for("__cloudflare-context__")];
  return c?.ctx;
}

function edgeCache(): Cache | null {
  try {
    return (globalThis as any).caches?.default ?? null;
  } catch {
    return null;
  }
}

export async function withEdgeCache(
  request: Request,
  make: () => Promise<Response>
): Promise<Response> {
  const cache = edgeCache();
  // Only plain GETs are cacheable.
  if (!cache || request.method !== "GET") return make();
  const key = new Request(request.url, { method: "GET" });
  try {
    const hit = await cache.match(key);
    if (hit) return hit;
  } catch {}
  const res = await make();
  if (res.ok) {
    const copy = res.clone();
    const put = cache.put(key, copy).catch(() => {});
    const ctx = cfCtx();
    if (ctx?.waitUntil) ctx.waitUntil(put);
    else await put;
  }
  return res;
}
