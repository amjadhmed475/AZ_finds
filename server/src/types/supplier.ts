import type { Citation } from "./citations.js";

export type SupplierRisk = "low" | "medium" | "high";

export interface SupplierOption {
  id: string;
  product_candidate_id: string;
  supplier_name: string;
  supplier_site: string;
  supplier_url: string;
  /** Direct product page when one was found, else the search/listing URL. */
  direct_product_url: string;
  region: string;
  unit_cost_min: number;
  unit_cost_max: number;
  moq: number;
  sample_available: boolean;
  estimated_shipping: number;
  estimated_landed_cost: number;
  supplier_rating: number;
  years_active: number | null;
  lead_time: string;
  customization_available: boolean;
  match_quality_score: number;
  supplier_risk: SupplierRisk;
  notes: string;
  citations: Citation[];
}
