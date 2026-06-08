import type { ProductCandidate, RiskLevel } from "./product.js";
import type { SupplierOption } from "./supplier.js";
import type { ProfitabilityAnalysis } from "./profitability.js";
import type { Citation } from "./citations.js";
import type { PPCStrategy, CapitalPlan, MarketingStrategy } from "./ppc.js";
import type { ProductGrade, Grade } from "./grade.js";
import type { ProductImage } from "./image.js";
import type { ApiUsageStatus } from "./api.js";
import type { RejectedProduct as RichRejectedProduct } from "./batch.js";

export interface RejectedProduct {
  name: string;
  category: string;
  reasons: string[];
}

export interface ProductCheck { label: string; state: "pass" | "fail" | "pending"; }

export interface RiskAnalysis {
  product_candidate_id: string;
  gating_status: string;
  category_risk: RiskLevel;
  IP_risk: RiskLevel;
  trademark_risk: RiskLevel;
  patent_risk: RiskLevel;
  hazmat_risk: RiskLevel;
  regulatory_risk: RiskLevel;
  fragile_risk: RiskLevel;
  return_risk: RiskLevel;
  saturation_risk: RiskLevel;
  price_war_risk: RiskLevel;
  overall_risk: RiskLevel;
  manual_verification_steps: string[];
}

export interface DashboardSummary {
  productsScanned: number;
  productsPassed: number;
  bestScore: number;
  highestRoi: number;
  averageMargin: number;
  likelyUngatedCount: number;
  manualCheckRequiredCount: number;
}

export interface DashboardJson {
  summary: DashboardSummary;
  products: Array<
    Pick<
      ProductCandidate,
      | "id"
      | "name"
      | "category"
      | "seller_count"
      | "trend_status"
      | "gating_status"
      | "risk_level"
      | "opportunity_score"
      | "recommended_action"
    > & {
      estimatedSalePrice: number;
      estimatedMonthlySales: number;
      estimatedRevenue: number;
      reviewRating: number;
      reviewCount: number;
      profitability: {
        unitCost: number;
        landedCost: number;
        fbaFee: number;
        referralFee: number;
        netProfit: number;
        roi: number;
        margin: number;
        breakEvenPrice: number;
      };
      suppliers: SupplierOption[];
      risks: RiskAnalysis[];
      citations: Citation[];
      grade?: ProductGrade;
      image?: ProductImage;
      checks?: ProductCheck[];
      capitalFit?: number;
      bucket?: "top" | "needs_check";
    }
  >;
  charts: {
    scoreChart: Array<{ name: string; value: number }>;
    roiChart: Array<{ name: string; value: number }>;
    marginChart: Array<{ name: string; value: number }>;
    salesChart: Array<{ name: string; value: number }>;
    riskChart: Array<{ name: string; value: number }>;
    supplierCostChart: Array<{ name: string; value: number }>;
    demandCompetitionScatter: Array<{ name: string; demand: number; competition: number; score: number }>;
    trendTimeline: Array<{ name: string; series: Array<{ t: string; v: number }> }>;
    categoryDistribution: Array<{ name: string; value: number }>;
  };
  citations: Citation[];
  mode?: "mock" | "real";
  /** Live data sources and whether each is connected/locked. */
  dataSources?: Array<{ name: string; connected: boolean; status: "live" | "locked" }>;
  /** Sales milestone at which the team plans to connect paid sources. */
  unlockTarget?: number;
  rejectedProducts?: RejectedProduct[];
  capitalPlanner?: CapitalPlan;
  ppcManager?: {
    selectedProductId: string;
    strategy: PPCStrategy;
  };
  marketingStrategies?: MarketingStrategy[];
  batch?: {
    batch_id: string;
    batch_date: string;
    batch_source: string;
    products_generated: number;
    products_passed: number;
    products_rejected: number;
    top_grade_count: number;
    data_source_status: string;
  };
  apiUsage?: ApiUsageStatus;
  gradeDistribution?: Array<{ grade: Grade; count: number }>;
  richRejected?: RichRejectedProduct[];
}
