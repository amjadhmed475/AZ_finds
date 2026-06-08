export type ImageType =
  | "supplier_image"
  | "wholesale_image"
  | "marketplace_image"
  | "user_provided_image"
  | "generated_placeholder"
  | "category_placeholder"
  | "missing";

export interface ProductImage {
  product_candidate_id: string;
  image_url: string;           // data URI (placeholder) or external URL (real, by source)
  image_source_url: string;    // page the image came from, when applicable
  image_source_name: string;   // e.g. "Pexels", "Alibaba", "Category illustration"
  image_type: ImageType;
  image_confidence: "low" | "medium" | "high";
  image_alt_text: string;
  image_last_checked: string;  // ISO date
  attribution: string;
  fallback_used: boolean;
}
