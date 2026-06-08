import type { ProductCandidate } from "./product.js";
import type { SupplierOption } from "./supplier.js";
import type { ProfitabilityAnalysis } from "./profitability.js";
import type { RiskAnalysis } from "./dashboard.js";
import type { Grade } from "./grade.js";
import type { Citation } from "./citations.js";
import type { ApiUsageStatus, DataMode } from "./api.js";

export interface RejectedProduct {
  id: string;
  name: string;
  category: string;
  rejection_reason: string;
  rejected_by_rule: string;
  risk_level: string;
  would_have_grade: Grade | null;
  citations: Citation[];
}

export interface BatchProduct {
  candidate: ProductCandidate;
  profitability: ProfitabilityAnalysis;
  suppliers: SupplierOption[];
  risk: RiskAnalysis;
  bucket: "top" | "needs_check";
}

export interface CacheStats {
  cache_hits: number;
  cache_misses: number;
  reused: number;
}

export interface DailyProductBatch {
  batch_id: string;
  batch_date: string;
  batch_source: string;
  data_mode: DataMode;
  products_generated: number;
  products_passed: number;
  products_rejected: number;
  products: BatchProduct[];
  rejected_products: RejectedProduct[];
  grade_distribution: Array<{ grade: Grade; count: number }>;
  top_grade_count: number;
  data_source_status: string;
  api_usage: ApiUsageStatus;
  cache_stats: CacheStats;
  created_at: string;
}
