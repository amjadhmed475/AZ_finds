import { scanSafety } from "../utils/safety.js";
import { normalizeText } from "../utils/normalize.js";
import type { GatingStatus, Confidence, RiskLevel } from "../types/product.js";
import type { RiskAnalysis } from "../types/dashboard.js";

export interface GatingInput {
  product_name: string;
  category: string;
  brand_status?: "generic" | "branded" | "unknown";
  amazon_category_path?: string;
  marketplace?: string;
  product_candidate_id?: string;
}

export interface GatingResult {
  gating_status: GatingStatus;
  gating_confidence: Confidence;
  restricted_category_risk: RiskLevel;
  IP_risk: RiskLevel;
  hazmat_risk: RiskLevel;
  regulatory_risk: RiskLevel;
  safety_risk: RiskLevel;
  manual_verification_steps: string[];
  risk: RiskAnalysis;
}

// Categories Amazon frequently restricts / gates for new sellers.
const COMMONLY_GATED = [
  "grocery", "food", "supplements", "health", "beauty", "topicals", "automotive tires",
  "jewelry", "watches", "fine art", "collectible", "medical", "baby", "toys", "hazmat",
];

const MANUAL_STEPS = (name: string): string[] => [
  `Search "${name}" in Amazon Seller Central → Add a Product.`,
  'Click "Sell this product" / "Show limitations" to see if approval is required.',
  "Confirm category and any sub-category restrictions.",
  "Confirm you can list as Generic (or that brand registry is not required).",
  "Check whether invoices or compliance documents are requested.",
  "Run the product through the live Amazon Revenue Calculator.",
  "Check Keepa / price history for stability before buying.",
  "Order a supplier sample and inspect quality, packaging, and barcode.",
  "Confirm no trademark (USPTO TESS) or design-patent conflict.",
  "Place a small test order before scaling.",
];

export function analyzeGating(i: GatingInput): GatingResult {
  const safety = scanSafety(`${i.product_name} ${i.category} ${i.amazon_category_path ?? ""}`);
  const cat = normalizeText(`${i.category} ${i.amazon_category_path ?? ""}`);
  const gatedCat = COMMONLY_GATED.some((g) => cat.includes(g));

  let gating_status: GatingStatus = "manual check required";
  let gating_confidence: Confidence = "low";

  if (safety.hard_reject || gatedCat) {
    gating_status = "likely gated";
    gating_confidence = "medium";
  } else if (i.brand_status === "generic" && !gatedCat && safety.matched.length === 0) {
    gating_status = "likely ungated";
    gating_confidence = "low"; // still low — only Seller Central confirms
  } else if (i.brand_status === "branded") {
    gating_status = "possibly gated";
    gating_confidence = "low";
  }

  const restricted_category_risk: RiskLevel = gatedCat ? "high" : safety.matched.length ? "medium" : "low";
  const trademark_risk: RiskLevel = safety.ip_risk;
  const patent_risk: RiskLevel = i.brand_status === "branded" ? "medium" : "low";

  const overall: RiskLevel =
    safety.hard_reject || restricted_category_risk === "high" || safety.hazmat_risk === "high"
      ? "high"
      : safety.regulatory_risk === "medium" || restricted_category_risk === "medium" || trademark_risk !== "low"
        ? "medium"
        : "low";

  const risk: RiskAnalysis = {
    product_candidate_id: i.product_candidate_id ?? "ad-hoc",
    gating_status,
    category_risk: restricted_category_risk,
    IP_risk: safety.ip_risk,
    trademark_risk,
    patent_risk,
    hazmat_risk: safety.hazmat_risk,
    regulatory_risk: safety.regulatory_risk,
    fragile_risk: "low",
    return_risk: "low",
    saturation_risk: "medium",
    price_war_risk: "medium",
    overall_risk: overall,
    manual_verification_steps: MANUAL_STEPS(i.product_name),
  };

  return {
    gating_status,
    gating_confidence,
    restricted_category_risk,
    IP_risk: safety.ip_risk,
    hazmat_risk: safety.hazmat_risk,
    regulatory_risk: safety.regulatory_risk,
    safety_risk: safety.safety_risk,
    manual_verification_steps: risk.manual_verification_steps,
    risk,
  };
}
