import type { Citation } from "./citations.js";
import type { ProductGrade } from "./grade.js";
import type { ProductImage } from "./image.js";

export type TrendStatus = "rising" | "stable" | "seasonal" | "declining" | "unknown";
export type DemandConsistency = "weak" | "moderate" | "strong" | "very strong" | "unknown";
export type GatingStatus =
  | "likely ungated"
  | "possibly gated"
  | "likely gated"
  | "manual check required"
  | "unknown";
export type Confidence = "low" | "medium" | "high";
export type RiskLevel = "low" | "medium" | "high";

export interface ProductCandidate {
  id: string;
  name: string;
  short_description: string;
  category: string;
  amazon_keywords: string[];
  estimated_sale_price: number;
  estimated_monthly_sales: number;
  estimated_revenue: number;
  bsr_estimate?: number | null;
  seller_count: number;
  review_count_average: number;
  review_rating_average: number;
  trend_status: TrendStatus;
  demand_consistency: DemandConsistency;
  gating_status: GatingStatus;
  gated_confidence: Confidence;
  product_type: string;
  generic_confidence: Confidence;
  opportunity_score: number;
  risk_level: RiskLevel;
  recommended_action: string;
  /** Physical hints used by the fee estimator. */
  weight_oz?: number;
  dimensions_in?: { length: number; width: number; height: number };
  grade?: ProductGrade;
  image?: ProductImage;
  citations: Citation[];
}
