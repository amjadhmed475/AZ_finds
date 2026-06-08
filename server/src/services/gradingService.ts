import { round } from "../utils/normalize.js";
import {
  GRADE_LADDER, GRADE_LABELS, CRITERIA_LABEL, type Grade, type ProductGrade,
  type GradeCriteriaScores, type GradeCap, type DataConfidence,
} from "../types/grade.js";

const idx = (g: Grade) => GRADE_LADDER.indexOf(g);
/** "no higher than" cap: returns the worse of the two (higher index = worse). */
const capTo = (current: Grade, ceiling: Grade): Grade => GRADE_LADDER[Math.max(idx(current), idx(ceiling))];
const clamp = (n: number, max: number) => Math.max(0, Math.min(max, n));

export function scoreToGrade(score: number): Grade {
  const s = Math.max(0, Math.min(100, score));
  const i = Math.min(19, Math.floor((100 - s) / 5)); // 95-100→0(A5) … 0-4→19(D1)
  return GRADE_LADDER[i];
}

export interface GradeInput {
  product_candidate_id: string;
  estimated_monthly_sales: number;
  demand_consistency: string;
  trend_status: string;
  demand_confidence?: "low" | "medium" | "high";
  seller_count: number;
  net_profit: number;
  ad_cost_estimate: number;
  roi: number;
  margin: number;
  break_even_price: number;
  sale_price: number;
  landed_cost: number;
  landed_known?: boolean;
  best_supplier?: { match_quality_score: number; moq: number; supplier_rating: number } | null;
  supplier_count: number;
  gating_status: string;
  category_risk: string;
  generic_confidence: string;
  overall_risk: string;
  hazmat_risk: string;
  ip_risk: string;
  trademark_risk: string;
  fragile_risk?: string;
  weight_oz: number;
  restricted?: boolean;
  dominant_brand?: boolean;
  assumed_capital?: number;
  data_confidence?: DataConfidence;
}

export function computeCriteriaScores(i: GradeInput): GradeCriteriaScores {
  const s = i.estimated_monthly_sales;
  const salesPart = s >= 1500 ? 14 : s >= 600 ? 11 : s >= 300 ? 8 : s >= 100 ? 5 : s > 0 ? 2 : 0;
  const consPart = ({ "very strong": 6, strong: 4.5, moderate: 3, weak: 1.5 } as Record<string, number>)[i.demand_consistency] ?? 2;
  const demand_strength = clamp(salesPart + consPart, 20);

  const roiPart = clamp((i.roi / 100) * 10, 10);
  const marginPart = clamp((i.margin / 40) * 6, 6);
  const cushion = i.sale_price > 0 ? clamp(((i.sale_price - i.break_even_price) / i.sale_price) * 4, 4) : 0;
  const profit_strength = clamp(roiPart + marginPart + cushion, 20);

  const sellerPart = i.seller_count <= 8 ? 7 : i.seller_count <= 15 ? 5 : i.seller_count <= 25 ? 3 : 1;
  const brandPart = i.dominant_brand ? 0 : 3;
  const competition_quality = clamp(sellerPart + brandPart, 10);

  const b = i.best_supplier;
  const supplier_strength = b
    ? clamp((b.match_quality_score / 100) * 5 + (b.supplier_rating / 5) * 2 + (b.moq <= 200 ? 2 : 1) + 1, 10)
    : i.supplier_count > 0 ? 4 : 1;

  const gatePart = i.gating_status === "likely ungated" ? 5 : i.gating_status === "possibly gated" ? 3 : i.gating_status === "likely gated" ? 0.5 : 2.5;
  const catPart = i.category_risk === "low" ? 3 : i.category_risk === "medium" ? 1.5 : 0;
  const genPart = i.generic_confidence === "high" ? 2 : i.generic_confidence === "medium" ? 1 : 0;
  const seller_central_category_risk = clamp(gatePart + catPart + genPart, 10);

  const riskPart = i.overall_risk === "low" ? 4 : i.overall_risk === "medium" ? 2 : 0;
  const hazPart = i.hazmat_risk === "low" ? 2 : 0;
  const ipPart = i.ip_risk === "low" && i.trademark_risk === "low" ? 2 : 0;
  const fragPart = (i.fragile_risk ?? "low") === "low" && i.weight_oz < 80 ? 2 : 0;
  const product_risk = clamp(riskPart + hazPart + ipPart + fragPart, 10);

  const trend_strength = clamp(({ rising: 5, stable: 3.5, seasonal: 2.5, declining: 1, unknown: 2 } as Record<string, number>)[i.trend_status] ?? 2, 5);

  const netBeforeAds = i.net_profit + i.ad_cost_estimate;
  const beAcos = i.sale_price > 0 ? (netBeforeAds / i.sale_price) * 100 : 0;
  const acosPart = beAcos >= 40 ? 6 : beAcos >= 25 ? 4.5 : beAcos >= 15 ? 3 : 1.5;
  const ppc_marketing_viability = clamp(acosPart + 2.5, 10); // +2.5 differentiation/clarity (estimate baseline)

  const capital = i.assumed_capital ?? 3000;
  const invBudget = capital * 0.75 * 0.55;
  const landed = i.landed_cost || 0;
  const units = landed > 0 ? Math.floor(invBudget / landed) : 0;
  const moqCost = b ? b.moq * landed : landed * 100;
  const landedPart = landed > 0 && landed <= 5 ? 2 : landed <= 10 ? 1.5 : 0.5;
  const moqPart = moqCost <= invBudget ? 2 : 0.5;
  const testPart = units >= 50 ? 1 : 0.3;
  const capital_fit = clamp(landedPart + moqPart + testPart, 5);

  return {
    demand_strength: round(demand_strength, 1), profit_strength: round(profit_strength, 1),
    competition_quality: round(competition_quality, 1), supplier_strength: round(supplier_strength, 1),
    seller_central_category_risk: round(seller_central_category_risk, 1), product_risk: round(product_risk, 1),
    trend_strength: round(trend_strength, 1), ppc_marketing_viability: round(ppc_marketing_viability, 1),
    capital_fit: round(capital_fit, 1),
  };
}

export function applyGradeCaps(base: Grade, i: GradeInput): { grade: Grade; caps: GradeCap[] } {
  const caps: GradeCap[] = [];
  let grade = base;
  const apply = (ceiling: Grade, reason: string, severity: GradeCap["severity"], explanation: string) => {
    const next = capTo(grade, ceiling);
    if (next !== grade) {
      caps.push({ cap_reason: reason, original_grade: grade, capped_grade: next, severity, explanation });
      grade = next;
    }
  };
  const oversizeKillsMargin = i.weight_oz >= 80 && i.margin < 25;

  if (i.restricted) apply("D1", "Restricted category", "high", "Hard-rejected restricted category — not pursuable as a generic FBA item.");
  if (i.hazmat_risk === "high") apply("D5", "Likely hazmat", "high", "Hazmat handling/SDS likely required; capped at D5.");
  if ((i.ip_risk === "high" || i.trademark_risk === "high")) apply("D4", "Strong IP / trademark risk", "high", "Brand/IP conflict risk; capped at D4.");
  if (i.gating_status === "manual check required" && i.category_risk === "high") apply("C5", "Seller Central check + high category risk", "medium", "Approval likely and category is risky; capped at C5 until confirmed.");
  if (i.roi < 30) apply("C5", "ROI under 30%", "medium", "Return on investment below the 30% floor; capped at C5.");
  if (i.margin < 20) apply("C4", "Margin under 20%", "medium", "Net margin below the 20% floor; capped at C4.");
  if (i.supplier_count === 0 && !i.best_supplier) apply("C4", "No supplier match", "medium", "No supplier match or route found; capped at C4.");
  if (oversizeKillsMargin) apply("C2", "Oversized/heavy erodes margin", "medium", "Large/heavy item where shipping erodes margin; capped at C2.");
  if (i.dominant_brand) apply("C3", "Amazon / dominant brand controls niche", "medium", "A dominant brand or Amazon controls the niche; capped at C3.");
  if (!i.landed_known) apply("B2", "Landed cost unknown", "low", "Landed cost not confirmed; capped at B2 until verified.");
  if ((i.demand_confidence ?? "low") === "low") apply("B3", "Low demand confidence", "low", "Demand is an estimate only; capped at B3 until validated with live data.");

  return { grade, caps };
}

export function gradeProduct(i: GradeInput): ProductGrade {
  const criteria = computeCriteriaScores(i);
  const score = round(Object.values(criteria).reduce((a, b) => a + b, 0), 1);
  const base = scoreToGrade(score);
  const { grade, caps } = applyGradeCaps(base, i);

  const entries = Object.entries(criteria) as Array<[keyof GradeCriteriaScores, number]>;
  const ranked = entries.map(([k, v]) => ({ k, ratio: v / maxOf(k) })).sort((a, b) => b.ratio - a.ratio);
  const strengths = ranked.slice(0, 2).map((r) => CRITERIA_LABEL[r.k]);
  const weaknesses = ranked.slice(-2).map((r) => CRITERIA_LABEL[r.k]);

  return {
    product_candidate_id: i.product_candidate_id,
    grade,
    grade_label: GRADE_LABELS[grade],
    score_out_of_100: score,
    confidence_label: i.data_confidence ?? "estimate-level",
    criteria_scores: criteria,
    grade_caps_applied: caps,
    reason_summary: caps.length
      ? `Base grade ${base} (${GRADE_LABELS[base]}); strongest on ${strengths.join(" and ")}. Capped to ${grade} by: ${caps.map((c) => c.cap_reason).join(", ")}.`
      : `${GRADE_LABELS[grade]}. Strongest on ${strengths.join(" and ")}.`,
    weakness_summary: `Weakest on ${weaknesses.join(" and ")}.`,
    created_at: new Date().toISOString(),
  };
}

function maxOf(k: keyof GradeCriteriaScores): number {
  return { demand_strength: 20, profit_strength: 20, competition_quality: 10, supplier_strength: 10, seller_central_category_risk: 10, product_risk: 10, trend_strength: 5, ppc_marketing_viability: 10, capital_fit: 5 }[k];
}
