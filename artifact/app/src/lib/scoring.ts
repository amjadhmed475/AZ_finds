// Client-side mirror of the scoring weights, for the score-breakdown UI.
export const WEIGHTS: Record<string, number> = {
  "Demand strength": 20,
  "Sales consistency": 15,
  "Profit / ROI": 20,
  "Competition": 10,
  "Supplier quality": 10,
  "Ungating likelihood": 10,
  "Low risk": 10,
  "Trend growth": 5,
};

export function recommendationFor(score: number): string {
  if (score >= 90) return "Excellent opportunity — verify immediately.";
  if (score >= 80) return "Strong opportunity — worth deeper validation.";
  if (score >= 70) return "Possible opportunity — needs deeper validation.";
  if (score >= 60) return "Risky / average — only with niche knowledge.";
  return "Avoid unless a strategic reason exists.";
}

export interface ProfitInputs {
  salePrice: number;
  unitCost: number;
  shippingPerUnit: number;
  fbaFee: number;
  referralPct: number;
  prepCost: number;
  packagingCost: number;
  storage: number;
  returnPct: number;
  adPct: number;
  inbound: number;
}

export function computeProfit(i: ProfitInputs) {
  const landed = i.unitCost + i.inbound + i.packagingCost + i.prepCost;
  const referral = Math.max(0.3, (i.salePrice * i.referralPct) / 100);
  const ad = (i.salePrice * i.adPct) / 100;
  const ret = (i.salePrice * i.returnPct) / 100;
  const total = landed + i.shippingPerUnit + referral + i.fbaFee + i.storage + ad + ret;
  const net = i.salePrice - total;
  const margin = i.salePrice > 0 ? (net / i.salePrice) * 100 : 0;
  const roi = landed > 0 ? (net / landed) * 100 : 0;
  const denom = 1 - (i.referralPct + i.adPct + i.returnPct) / 100;
  const breakEven = denom > 0 ? (landed + i.shippingPerUnit + i.fbaFee + i.storage) / denom : 0;
  const maxBuy = i.salePrice - (referral + i.fbaFee + i.storage + ad + ret + i.shippingPerUnit);
  return {
    landed: round(landed), referral: round(referral), ad: round(ad), ret: round(ret),
    total: round(total), net: round(net), margin: round(margin, 1), roi: round(roi, 1),
    breakEven: round(breakEven), maxBuy: round(maxBuy),
  };
}

function round(n: number, dp = 2) {
  const f = Math.pow(10, dp);
  return Math.round(n * f) / f;
}
