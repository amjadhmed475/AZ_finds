import type { Grade } from "./types";

export const GRADE_LADDER: Grade[] = [
  "A5", "A4", "A3", "A2", "A1", "B5", "B4", "B3", "B2", "B1",
  "C5", "C4", "C3", "C2", "C1", "D5", "D4", "D3", "D2", "D1",
];

export const GRADE_LABELS: Record<Grade, string> = {
  A5: "Elite opportunity", A4: "Excellent opportunity", A3: "Strong opportunity", A2: "Good opportunity", A1: "Decent opportunity",
  B5: "Very promising but needs checks", B4: "Promising", B3: "Usable opportunity", B2: "Average opportunity", B1: "Weak but possible",
  C5: "Risky but has one strong upside", C4: "Risky-average", C3: "Weak opportunity", C2: "Poor opportunity", C1: "Very poor opportunity",
  D5: "High risk", D4: "Very high risk", D3: "Mostly avoid", D2: "Avoid", D1: "Hard reject / do not pursue",
};

/** Tier color for badges. A=green, B=blue, C=amber, D=red, darker as the number falls. */
export function gradeColor(grade?: Grade): string {
  if (!grade) return "#94a3b8";
  const tier = grade[0];
  return { A: "#15803d", B: "#2563eb", C: "#d97706", D: "#dc2626" }[tier] || "#64748b";
}
export function gradeBg(grade?: Grade): string {
  if (!grade) return "#f1f5f9";
  const tier = grade[0];
  return { A: "#dcfce7", B: "#dbeafe", C: "#fef3c7", D: "#fee2e2" }[tier] || "#f1f5f9";
}

export const CRITERIA_LABEL: Record<string, string> = {
  demand_strength: "Demand strength", profit_strength: "Profit strength", competition_quality: "Competition quality",
  supplier_strength: "Supplier strength", seller_central_category_risk: "Seller Central / category", product_risk: "Product risk",
  trend_strength: "Trend strength", ppc_marketing_viability: "PPC / marketing", capital_fit: "Capital fit",
};
export const CRITERIA_MAX: Record<string, number> = {
  demand_strength: 20, profit_strength: 20, competition_quality: 10, supplier_strength: 10,
  seller_central_category_risk: 10, product_risk: 10, trend_strength: 5, ppc_marketing_viability: 10, capital_fit: 5,
};
