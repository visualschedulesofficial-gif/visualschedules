export const runtime = 'nodejs';

interface Env {
  DB: D1Database;
  R2_BUCKET: R2Bucket;
}

export async function POST(request: Request, context: any) {
  try {
    const env = context.params?.env || (globalThis as any).env;
    
    if (!env?.R2_BUCKET || !env?.DB) {
      return Response.json(
        { error: 'R2 or DB not configured' },
        { status: 500 }
      );
    }

    const formData = await request.formData();
    const cardId = formData.get('cardId') as string;
    const variant = formData.get('variant') as string;
    const image = formData.get('image') as File;

    if (!cardId || !variant || !image) {
      return Response.json(
        { error: 'Missing cardId, variant, or image' },
        { status: 400 }
      );
    }

    const fileExt = image.name.split('.').pop() || 'png';
    const r2Key = `cards/${cardId}/${variant}.${fileExt}`;
    
    const buffer = await image.arrayBuffer();
    await env.R2_BUCKET.put(r2Key, buffer, {
      httpMetadata: {
        contentType: image.type,
      },
    });

    const imageId = `${cardId}-${variant}-${Date.now()}`;
    const imageUrl = `https://cdn.visualschedule.app/${r2Key}`;

    await env.DB.prepare(
      `INSERT INTO card_images (id, card_id, variant, r2_key, image_url, created_at)
       VALUES (?, ?, ?, ?, ?, datetime('now'))
       ON CONFLICT(card_id, variant) DO UPDATE SET
       r2_key = excluded.r2_key,
       image_url = excluded.image_url,
       created_at = datetime('now')`
    )
      .bind(imageId, cardId, variant, r2Key, imageUrl)
      .run();

    return Response.json({
      success: true,
      imageId,
      imageUrl,
      r2Key,
    });
  } catch (error) {
    console.error('Upload error:', error);
    return Response.json(
      { error: error instanceof Error ? error.message : 'Upload failed' },
      { status: 500 }
    );
  }
}
