/**
 * Real Amazon data via retailerapi.com (free tier: 1,000 lookups/mo).
 * Looks up a product by ASIN/UPC and returns the LIVE price, sellers, reviews
 * and referral fee. retailerapi has no keyword search, so this powers per-product
 * verification: map a product id -> ASIN in server/data/asins.json (or pass an
 * ASIN directly). With RETAILERAPI_KEY unset, everything falls back to estimates.
 */
import { readFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { recordApiCall } from "./apiUsageService.js";

const BASE = process.env.RETAILERAPI_BASE_URL || "https://api.retailerapi.com/v1";
const __dirname = dirname(fileURLToPath(import.meta.url));

export interface RealProduct {
  asin: string;
  price: number;
  title?: string;
  image?: string;
  referral_fee?: number;
  sellers?: number;
  rating?: number;
  review_count?: number;
  data_quality?: number;
  source: "retailerapi";
}

export const hasRealData = (): boolean => Boolean(process.env.RETAILERAPI_KEY);

const n = (x: any): number | undefined => {
  const v = typeof x === "string" ? parseFloat(x.replace(/[^0-9.]/g, "")) : x;
  return typeof v === "number" && isFinite(v) && v > 0 ? v : undefined;
};
const i = (x: any): number | undefined => { const v = n(x); return v ? Math.round(v) : undefined; };

/** Look up real Amazon data for an ASIN/UPC. Returns null when no key, no match, or error. */
export async function lookupByCode(identifier: string): Promise<RealProduct | null> {
  const key = process.env.RETAILERAPI_KEY;
  if (!key || !identifier) return null;
  const authHeader = process.env.RETAILERAPI_AUTH_HEADER || "Authorization";
  const authValue = authHeader.toLowerCase() === "authorization" ? `Bearer ${key}` : key;
  try {
    recordApiCall();
    const url = `${BASE}/lookup_product?identifier=${encodeURIComponent(identifier)}&include_seller_context=true`;
    const res = await fetch(url, { headers: { [authHeader]: authValue, Accept: "application/json" } as Record<string, string> });
    if (!res.ok) { console.error(`retailerapi ${res.status} for ${identifier}`); return null; }
    const d: any = await res.json();
    const p = d?.product ?? d?.data ?? d;
    const price = n(p?.current_price ?? p?.price ?? p?.buybox_price ?? p?.buy_box_price);
    if (!price) return null;
    return {
      asin: identifier,
      price,
      title: p?.title ?? p?.name,
      image: p?.image ?? p?.image_url ?? p?.main_image,
      referral_fee: n(p?.referral_fee ?? p?.fees?.referral_fee ?? p?.fees?.referral),
      sellers: i(p?.offer_count ?? p?.seller_count ?? p?.sellers_count ?? p?.num_sellers),
      rating: n(p?.rating ?? p?.review_rating ?? p?.stars),
      review_count: i(p?.review_count ?? p?.reviews_count ?? p?.ratings_total),
      data_quality: n(p?.data_quality_score),
      source: "retailerapi",
    };
  } catch (e) {
    console.error(`retailerapi lookup failed: ${(e as Error).message}`);
    return null;
  }
}

// ---- optional product-id -> ASIN map (server/data/asins.json) ----
let asinMap: Record<string, string> | null = null;
function loadAsins(): Record<string, string> {
  if (asinMap) return asinMap;
  try { asinMap = JSON.parse(readFileSync(join(__dirname, "..", "..", "data", "asins.json"), "utf8")); }
  catch { asinMap = {}; }
  return asinMap!;
}
export const getAsinFor = (id: string): string | undefined => loadAsins()[id];
