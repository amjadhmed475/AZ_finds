import { makeCitation } from "./citationService.js";
import { recordApiCall } from "./apiUsageService.js";
import type { Citation } from "../types/citations.js";
import type { Confidence, DemandConsistency, TrendStatus } from "../types/product.js";
import { round } from "../utils/normalize.js";

export interface MarketEstimate {
  estimated_monthly_sales: number;
  bsr_estimate: number | null;
  average_price: number;
  number_of_sellers: number;
  review_count_range: [number, number];
  review_rating_average: number;
  buy_box_risk: string;
  competition_level: "low" | "moderate" | "high";
  trend_status: TrendStatus;
  demand_consistency: DemandConsistency;
  confidence: Confidence;
  citations: Citation[];
}

/**
 * Convert a Best Sellers Rank into a rough monthly-sales estimate. This is a
 * heuristic power-curve, NOT exact. Different categories sell at very different
 * rates for the same BSR, so this is intentionally conservative.
 */
export function bsrToMonthlySales(bsr: number, category = "home & kitchen"): number {
  if (!bsr || bsr <= 0) return 0;
  // Category "thickness" multiplier — bigger categories move more units per rank.
  const thick: Record<string, number> = {
    "home & kitchen": 1.0, "kitchen": 1.0, "office products": 0.8,
    "pet products": 0.85, "tools & home improvement": 0.8,
    "sports & outdoors": 0.9, "beauty": 0.95, "toys & games": 0.9,
  };
  const k = thick[category.toLowerCase()] ?? 0.8;
  // ~ inverse power law calibrated to public rule-of-thumb anchors.
  const est = 100000 / Math.pow(bsr, 0.78);
  return Math.max(0, Math.round(est * k));
}

export interface EstimateInput {
  product_name: string;
  keywords: string[];
  category?: string;
  marketplace?: string;
  asin?: string;
  amazon_url?: string;
  use_keepa_if_available?: boolean;
  manual?: {
    bsr?: number;
    average_price?: number;
    number_of_sellers?: number;
    review_count?: number;
    review_rating?: number;
  };
}

/**
 * Produce a market estimate. Uses Keepa when a key + ASIN are present;
 * otherwise falls back to manual anchors or a conservative mock with explicit
 * low confidence. Never fabricates precise numbers without labeling confidence.
 */
export async function estimateMarket(input: EstimateInput): Promise<MarketEstimate> {
  const category = input.category || "home & kitchen";
  const citations: Citation[] = [];
  const keepaKey = process.env.KEEPA_API_KEY;

  // --- Real mode: Keepa ---
  if (input.use_keepa_if_available && keepaKey && input.asin) {
    try {
      recordApiCall();
      const url = `https://api.keepa.com/product?key=${keepaKey}&domain=1&asin=${encodeURIComponent(input.asin)}&stats=90`;
      const res = await fetch(url);
      if (res.ok) {
        const data: any = await res.json();
        const p = data?.products?.[0];
        const bsr = p?.stats?.current?.[3] ?? null;
        const price = (p?.stats?.current?.[1] ?? -1) / 100;
        citations.push(makeCitation("Keepa API", `https://keepa.com/#!product/1-${input.asin}`, "BSR, price history, offer count", "api"));
        const sales = bsr ? bsrToMonthlySales(bsr, category) : 0;
        return finalize({
          estimated_monthly_sales: sales,
          bsr_estimate: bsr,
          average_price: price > 0 ? round(price) : 0,
          number_of_sellers: p?.stats?.current?.[11] ?? 0,
          review_count_range: [p?.stats?.current?.[17] ?? 0, p?.stats?.current?.[17] ?? 0],
          review_rating_average: (p?.stats?.current?.[16] ?? 0) / 10,
          confidence: "high",
          citations,
        }, category);
      }
    } catch {
      /* fall through to manual/mock */
    }
  }

  // --- Manual anchors provided by the user ---
  if (input.manual && (input.manual.bsr || input.manual.average_price)) {
    const bsr = input.manual.bsr ?? null;
    const sales = bsr ? bsrToMonthlySales(bsr, category) : 0;
    citations.push(makeCitation("User-provided estimate", input.amazon_url || "manual-input", "BSR / price / seller anchors", "estimate"));
    return finalize({
      estimated_monthly_sales: sales,
      bsr_estimate: bsr,
      average_price: input.manual.average_price ?? 0,
      number_of_sellers: input.manual.number_of_sellers ?? 0,
      review_count_range: [input.manual.review_count ?? 0, input.manual.review_count ?? 0],
      review_rating_average: input.manual.review_rating ?? 0,
      confidence: "medium",
      citations,
    }, category);
  }

  // --- Mock mode: conservative, explicitly low confidence ---
  citations.push(makeCitation("Heuristic estimate (no API key)", "internal://mock", "Conservative demand estimate, verify manually", "mock"));
  const seed = Math.abs(hash(input.product_name));
  const bsr = 8000 + (seed % 90000);
  return finalize({
    estimated_monthly_sales: bsrToMonthlySales(bsr, category),
    bsr_estimate: bsr,
    average_price: round(9 + (seed % 1800) / 100),
    number_of_sellers: 4 + (seed % 30),
    review_count_range: [50 + (seed % 400), 600 + (seed % 4000)],
    review_rating_average: round(3.9 + (seed % 9) / 10, 1),
    confidence: "low",
    citations,
  }, category);
}

function finalize(
  partial: Omit<MarketEstimate, "buy_box_risk" | "competition_level" | "trend_status" | "demand_consistency"> & {
    estimated_monthly_sales: number;
  },
  _category: string
): MarketEstimate {
  const sellers = partial.number_of_sellers;
  const competition_level = sellers >= 25 ? "high" : sellers >= 10 ? "moderate" : "low";
  const sales = partial.estimated_monthly_sales;
  const demand_consistency: DemandConsistency =
    sales >= 1500 ? "very strong" : sales >= 600 ? "strong" : sales >= 200 ? "moderate" : sales > 0 ? "weak" : "unknown";
  const trend_status: TrendStatus = sales >= 600 ? "stable" : "unknown";
  const buy_box_risk = sellers >= 20 ? "high (many sellers, price competition)" : sellers >= 8 ? "moderate" : "low";
  return { ...partial, buy_box_risk, competition_level, trend_status, demand_consistency };
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}
