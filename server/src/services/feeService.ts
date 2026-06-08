import { normalizeText, round } from "../utils/normalize.js";

/**
 * Amazon US fee estimates. These approximate the 2024–2025 US fee schedule and
 * WILL drift over time. Always re-check the live Amazon Revenue Calculator and
 * the current fee schedule before committing capital. Estimates only.
 */

// Referral fee percent by category (US). Default 15%. Minimum referral $0.30.
const REFERRAL_TABLE: Record<string, number> = {
  "amazon device accessories": 0.45,
  "automotive": 0.12,
  "automotive & powersports": 0.12,
  "baby products": 0.15,
  "beauty": 0.15,
  "books": 0.15,
  "camera & photo": 0.08,
  "cell phone accessories": 0.15,
  "consumer electronics": 0.08,
  "electronics accessories": 0.15,
  "furniture": 0.15,
  "grocery": 0.08,
  "health & household": 0.15,
  "home": 0.15,
  "home & kitchen": 0.15,
  "industrial & scientific": 0.12,
  "jewelry": 0.20,
  "kitchen": 0.15,
  "lawn & garden": 0.15,
  "luggage & travel accessories": 0.15,
  "office products": 0.15,
  "pet products": 0.15,
  "shoes, handbags & sunglasses": 0.15,
  "sports & outdoors": 0.15,
  "tools & home improvement": 0.15,
  "toys & games": 0.15,
  "watches": 0.16,
  "clothing & accessories": 0.17,
};

export function getReferralFeePercent(category: string): number {
  const key = normalizeText(category);
  for (const [cat, pct] of Object.entries(REFERRAL_TABLE)) {
    if (key.includes(normalizeText(cat))) return pct;
  }
  return 0.15;
}

export function referralFee(salePrice: number, category: string): number {
  const pct = getReferralFeePercent(category);
  return round(Math.max(0.3, salePrice * pct));
}

export type SizeTier = "small standard" | "large standard" | "large bulky" | "oversize";

export function classifySize(weightOz = 8, dims = { length: 9, width: 6, height: 1 }): SizeTier {
  const longest = Math.max(dims.length, dims.width, dims.height);
  const median = [dims.length, dims.width, dims.height].sort((a, b) => a - b)[1];
  const shortest = Math.min(dims.length, dims.width, dims.height);
  const lbs = weightOz / 16;
  if (lbs <= 1 && longest <= 15 && median <= 12 && shortest <= 0.75) return "small standard";
  if (lbs <= 20 && longest <= 18 && median <= 14 && shortest <= 8) return "large standard";
  if (lbs <= 50 && longest <= 59) return "large bulky";
  return "oversize";
}

/** Approximate US FBA fulfillment fee (per unit). */
export function estimateFbaFee(weightOz = 8, dims = { length: 9, width: 6, height: 1 }): number {
  const tier = classifySize(weightOz, dims);
  const oz = Math.max(1, weightOz);
  if (tier === "small standard") {
    const bands: Array<[number, number]> = [
      [2, 3.06], [4, 3.15], [6, 3.24], [8, 3.33],
      [10, 3.43], [12, 3.53], [14, 3.6], [16, 3.65],
    ];
    for (const [maxOz, fee] of bands) if (oz <= maxOz) return fee;
    return 3.65;
  }
  if (tier === "large standard") {
    const lbs = oz / 16;
    const bands: Array<[number, number]> = [
      [0.25, 3.68], [0.5, 3.9], [0.75, 4.15], [1, 4.55],
      [1.5, 4.99], [2, 5.37], [2.5, 5.52], [3, 5.77],
    ];
    for (const [maxLb, fee] of bands) if (lbs <= maxLb) return fee;
    const over = Math.ceil((lbs - 3) / 0.5);
    return round(6.4 + over * 0.32);
  }
  if (tier === "large bulky") {
    const lbs = oz / 16;
    return round(9.61 + Math.max(0, lbs - 1) * 0.38);
  }
  const lbs = oz / 16;
  return round(26.33 + Math.max(0, lbs - 1) * 0.38);
}

/** Rough monthly storage cost per unit (Jan–Sep standard-size). */
export function estimateMonthlyStorage(dims = { length: 9, width: 6, height: 1 }): number {
  const cubicFeet = (dims.length * dims.width * dims.height) / 1728;
  return round(cubicFeet * 0.87); // ~$0.87/cu ft standard, off-peak
}
