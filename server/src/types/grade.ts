export type Grade =
  | "A5" | "A4" | "A3" | "A2" | "A1"
  | "B5" | "B4" | "B3" | "B2" | "B1"
  | "C5" | "C4" | "C3" | "C2" | "C1"
  | "D5" | "D4" | "D3" | "D2" | "D1";

// Best → worst. Index 0 = A5 (best), 19 = D1 (worst).
export const GRADE_LADDER: Grade[] = [
  "A5", "A4", "A3", "A2", "A1",
  "B5", "B4", "B3", "B2", "B1",
  "C5", "C4", "C3", "C2", "C1",
  "D5", "D4", "D3", "D2", "D1",
];

export const GRADE_LABELS: Record<Grade, string> = {
  A5: "Elite opportunity", A4: "Excellent opportunity", A3: "Strong opportunity", A2: "Good opportunity", A1: "Decent opportunity",
  B5: "Very promising but needs checks", B4: "Promising", B3: "Usable opportunity", B2: "Average opportunity", B1: "Weak but possible",
  C5: "Risky but has one strong upside", C4: "Risky-average", C3: "Weak opportunity", C2: "Poor opportunity", C1: "Very poor opportunity",
  D5: "High risk", D4: "Very high risk", D3: "Mostly avoid", D2: "Avoid", D1: "Hard reject / do not pursue",
};

export type DataConfidence = "estimate-level" | "hybrid" | "live" | "user-uploaded";

export interface GradeCriteriaScores {
  demand_strength: number;              // /20
  profit_strength: number;              // /20
  competition_quality: number;          // /10
  supplier_strength: number;            // /10
  seller_central_category_risk: number; // /10
  product_risk: number;                 // /10
  trend_strength: number;               // /5
  ppc_marketing_viability: number;      // /10
  capital_fit: number;                  // /5
}

export const CRITERIA_MAX: Record<keyof GradeCriteriaScores, number> = {
  demand_strength: 20, profit_strength: 20, competition_quality: 10, supplier_strength: 10,
  seller_central_category_risk: 10, product_risk: 10, trend_strength: 5, ppc_marketing_viability: 10, capital_fit: 5,
};

export const CRITERIA_LABEL: Record<keyof GradeCriteriaScores, string> = {
  demand_strength: "Demand strength", profit_strength: "Profit strength", competition_quality: "Competition quality",
  supplier_strength: "Supplier strength", seller_central_category_risk: "Seller Central / category risk", product_risk: "Product risk",
  trend_strength: "Trend strength", ppc_marketing_viability: "PPC / marketing viability", capital_fit: "Capital fit",
};

export interface GradeCap {
  cap_reason: string;
  original_grade: Grade;
  capped_grade: Grade;
  severity: "low" | "medium" | "high";
  explanation: string;
}

export interface ProductGrade {
  product_candidate_id: string;
  grade: Grade;
  grade_label: string;
  score_out_of_100: number;
  confidence_label: DataConfidence;
  criteria_scores: GradeCriteriaScores;
  grade_caps_applied: GradeCap[];
  reason_summary: string;
  weakness_summary: string;
  created_at: string;
}
