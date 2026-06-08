import { resolveProductImage } from "../services/imageService.js";
import type { ProductImage } from "../types/image.js";

export interface EnrichImagesInput {
  products: Array<{ id?: string; name: string; product_type?: string; category?: string; image_url?: string }>;
  allow_supplier_images?: boolean;
  allow_marketplace_images?: boolean;
  use_placeholders?: boolean;
  max_images?: number;
}

/** Resolve real photos (top-N only) with graceful fallback to premium placeholders. */
export async function enrichProductImages(input: EnrichImagesInput) {
  const max = input.max_images ?? 50;
  const list = (input.products || []).slice(0, max);
  const images: ProductImage[] = [];
  const missing: string[] = [];

  const products_with_images = await Promise.all(
    list.map(async (p) => {
      const id = p.id || p.name;
      const img = await resolveProductImage(id, p.name, p.product_type || "", p.category || "", {
        user_image_url: p.image_url,
        allow_supplier_images: input.allow_supplier_images,
        allow_marketplace_images: input.allow_marketplace_images,
        use_placeholders: input.use_placeholders ?? true,
      });
      images.push(img);
      if (img.image_type === "missing") missing.push(p.name);
      return { ...p, image: img };
    })
  );

  const real = images.filter((i) => !i.fallback_used).length;
  return {
    products_with_images,
    missing_images: missing,
    image_sources: images.map((i) => ({ id: i.product_candidate_id, type: i.image_type, source: i.image_source_name, confidence: i.image_confidence, attribution: i.attribution })),
    real_images: real,
    placeholders: images.length - real,
    warnings: real === 0
      ? ["No live image source connected — using premium category illustrations. Add PEXELS_API_KEY (representative photos) or KEEPA/PA-API (exact Amazon images), or provide image URLs, then re-run images:enrich."]
      : [`${real} real photo(s) attached by source URL with attribution. Representative photos are not the exact SKU — verify before listing.`],
  };
}
