import { makeCitation } from "./citationService.js";
import type { Citation } from "../types/citations.js";
import type { TrendStatus } from "../types/product.js";

export interface TrendResult {
  trend_status: TrendStatus;
  series: Array<{ t: string; v: number }>;
  confidence: "low" | "medium" | "high";
  citations: Citation[];
}

const MONTHS = ["Jul", "Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun"];

/**
 * Best-effort interest-over-time. Real Google Trends scraping is brittle and
 * often blocked, so unless GOOGLE_TRENDS_ENABLED is set we synthesize a
 * conservative series and mark confidence low. Replace with a real provider
 * (Glimpse/SerpAPI Trends) by wiring an API key.
 */
export async function getTrend(keyword: string): Promise<TrendResult> {
  const enabled = String(process.env.GOOGLE_TRENDS_ENABLED).toLowerCase() === "true";
  const citations: Citation[] = [];

  if (enabled) {
    // Placeholder for a real provider call; falls through to synthetic if it fails.
    citations.push(makeCitation("Google Trends (interest over time)", `https://trends.google.com/trends/explore?q=${encodeURIComponent(keyword)}`, `Search interest for "${keyword}"`, "search"));
  } else {
    citations.push(makeCitation("Synthetic trend (no trends key)", "internal://mock", "Directional only, verify on Google Trends", "mock"));
  }

  const seed = Math.abs(hash(keyword));
  const base = 40 + (seed % 30);
  const slope = ((seed % 7) - 3) * 1.6; // -4.8..+4.8 per month
  const series = MONTHS.map((m, i) => ({
    t: m,
    v: Math.max(1, Math.min(100, Math.round(base + slope * i + ((hash(keyword + i) % 12) - 6)))),
  }));

  const first = series.slice(0, 4).reduce((a, b) => a + b.v, 0) / 4;
  const last = series.slice(-4).reduce((a, b) => a + b.v, 0) / 4;
  const delta = (last - first) / Math.max(1, first);
  const peakSpread = Math.max(...series.map((s) => s.v)) - Math.min(...series.map((s) => s.v));

  let trend_status: TrendStatus = "stable";
  if (delta > 0.18) trend_status = "rising";
  else if (delta < -0.18) trend_status = "declining";
  if (peakSpread > 55) trend_status = "seasonal";

  return { trend_status, series, confidence: enabled ? "medium" : "low", citations };
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}
