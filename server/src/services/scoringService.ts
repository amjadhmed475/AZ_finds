import { round } from "../utils/normalize.js";

export interface ScoreInputs {
  demand_score: number;      // 0..100
  competition_score: number; // 0..100 (higher = less competition / better)
  profit_score: number;      // 0..100
  supplier_score: number;    // 0..100
  gating_score: number;      // 0..100 (higher = more likely ungated)
  risk_score: number;        // 0..100 (higher = lower risk)
  trend_score: number;       // 0..100
  review_score: number;      // 0..100
}

// Weights per spec (sum = 100). review folds into demand consistency bucket.
const WEIGHTS = {
  demand: 20,
  consistency: 15,
  profit: 20,
  competition: 10,
  supplier: 10,
  gating: 10,
  risk: 10,
  trend: 5,
};

export interface ScoreResult {
  total_score_out_of_100: number;
  grade: string;
  recommendation: string;
  reason_summary: string;
  weakness_summary: string;
  breakdown: Record<string, number>;
}

function clamp(n: number): number {
  return Math.max(0, Math.min(100, n || 0));
}

export function scoreProduct(i: ScoreInputs): ScoreResult {
  const parts = {
    demand: (clamp(i.demand_score) / 100) * WEIGHTS.demand,
    consistency: (clamp(i.review_score) / 100) * WEIGHTS.consistency,
    profit: (clamp(i.profit_score) / 100) * WEIGHTS.profit,
    competition: (clamp(i.competition_score) / 100) * WEIGHTS.competition,
    supplier: (clamp(i.supplier_score) / 100) * WEIGHTS.supplier,
    gating: (clamp(i.gating_score) / 100) * WEIGHTS.gating,
    risk: (clamp(i.risk_score) / 100) * WEIGHTS.risk,
    trend: (clamp(i.trend_score) / 100) * WEIGHTS.trend,
  };
  const total = round(Object.values(parts).reduce((a, b) => a + b, 0), 1);

  let grade = "F";
  let recommendation = "Avoid unless a strategic reason exists.";
  if (total >= 90) { grade = "A+"; recommendation = "Excellent opportunity, verify immediately."; }
  else if (total >= 80) { grade = "A"; recommendation = "Strong opportunity, worth deeper validation."; }
  else if (total >= 70) { grade = "B"; recommendation = "Possible opportunity, needs deeper validation."; }
  else if (total >= 60) { grade = "C"; recommendation = "Risky/average, only continue with niche knowledge."; }

  // Build human reasons from the strongest and weakest weighted parts.
  const ranked = Object.entries(parts)
    .map(([k, v]) => ({ k, v, max: (WEIGHTS as Record<string, number>)[k], ratio: v / (WEIGHTS as Record<string, number>)[k] }))
    .sort((a, b) => b.ratio - a.ratio);
  const strengths = ranked.slice(0, 2).map((r) => labelFor(r.k));
  const weaknesses = ranked.slice(-2).map((r) => labelFor(r.k));

  return {
    total_score_out_of_100: total,
    grade,
    recommendation,
    reason_summary: `Strongest signals: ${strengths.join(" and ")}.`,
    weakness_summary: `Weakest signals: ${weaknesses.join(" and ")}.`,
    breakdown: Object.fromEntries(Object.entries(parts).map(([k, v]) => [k, round(v, 1)])),
  };
}

function labelFor(key: string): string {
  return {
    demand: "demand strength",
    consistency: "sales consistency",
    profit: "profit/ROI",
    competition: "low competition",
    supplier: "supplier quality",
    gating: "ungating likelihood",
    risk: "low risk",
    trend: "trend growth",
  }[key] || key;
}
