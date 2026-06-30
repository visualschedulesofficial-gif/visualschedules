export const runtime = 'nodejs';

interface Env {
  DB: any;
  R2_BUCKET: any;
}

export async function POST(request: Request, context: any) {
  try {
    const env = (context as any)?.env || (globalThis as any).env || {};
    
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

    let imageUrl = '';

    // Try to upload to R2 if available
    if (env.R2_BUCKET) {
      try {
        const fileExt = image.name.split('.').pop() || 'png';
        const r2Key = `cards/${cardId}/${variant}.${fileExt}`;
        const buffer = await image.arrayBuffer();
        
        await env.R2_BUCKET.put(r2Key, buffer, {
          httpMetadata: {
            contentType: image.type,
          },
        });

        imageUrl = `https://cdn.visualschedule.app/${r2Key}`;
      } catch (r2Error) {
        console.warn('R2 upload failed, using fallback:', r2Error);
        imageUrl = `https://cdn.visualschedule.app/cards/${cardId}/${variant}`;
      }
    } else {
      console.warn('R2_BUCKET not configured');
      imageUrl = `https://cdn.visualschedule.app/cards/${cardId}/${variant}`;
    }

    // Store in D1 if available
    if (env.DB) {
      try {
        const imageId = `${cardId}-${variant}-${Date.now()}`;
        
        await env.DB.prepare(
          `INSERT INTO card_images (id, card_id, variant, r2_key, image_url, created_at)
           VALUES (?, ?, ?, ?, ?, datetime('now'))
           ON CONFLICT(card_id, variant) DO UPDATE SET
           r2_key=excluded.r2_key, image_url=excluded.image_url, updated_at=datetime('now')`
        ).bind(imageId, cardId, variant, `cards/${cardId}/${variant}`, imageUrl).run();
      } catch (dbError) {
        console.warn('DB insert failed:', dbError);
      }
    }

    return Response.json({
      success: true,
      cardId,
      variant,
      imageUrl,
    }, { status: 201 });

  } catch (err: any) {
    console.error('Upload error:', err);
    return Response.json(
      { error: err?.message || 'Failed to upload image' },
      { status: 500 }
    );
  }
}
