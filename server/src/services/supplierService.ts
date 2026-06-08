import { makeCitation } from "./citationService.js";
import { webSearch } from "./searchService.js";
import { matchQuality } from "../utils/fuzzyMatch.js";
import { round, slugify } from "../utils/normalize.js";
import type { SupplierOption, SupplierRisk } from "../types/supplier.js";

interface SupplierProfile {
  name: string;
  site: string;
  region: string;
  base_url: (kw: string) => string;
  rating: number;
  years: number | null;
  lead_time: string;
  moq_factor: number;     // multiplier on a base MOQ
  cost_factor: [number, number]; // min/max multiplier on target unit cost
  ship_per_unit: number;
  customization: boolean;
  risk: SupplierRisk;
}

const PROFILES: SupplierProfile[] = [
  { name: "Alibaba", site: "alibaba.com", region: "China", base_url: (k) => `https://www.alibaba.com/trade/search?SearchText=${encodeURIComponent(k)}`, rating: 4.4, years: 8, lead_time: "20–35 days", moq_factor: 100, cost_factor: [0.7, 1.0], ship_per_unit: 1.1, customization: true, risk: "medium" },
  { name: "AliExpress", site: "aliexpress.com", region: "China", base_url: (k) => `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(k)}`, rating: 4.3, years: 6, lead_time: "12–25 days", moq_factor: 1, cost_factor: [0.95, 1.4], ship_per_unit: 0.0, customization: false, risk: "medium" },
  { name: "Global Sources", site: "globalsources.com", region: "China/HK", base_url: (k) => `https://www.globalsources.com/searchList/products?keyWord=${encodeURIComponent(k)}`, rating: 4.5, years: 12, lead_time: "25–40 days", moq_factor: 200, cost_factor: [0.65, 0.95], ship_per_unit: 1.2, customization: true, risk: "low" },
  { name: "Made-in-China", site: "made-in-china.com", region: "China", base_url: (k) => `https://www.made-in-china.com/productsearch/${slugify(k)}.html`, rating: 4.3, years: 10, lead_time: "25–40 days", moq_factor: 150, cost_factor: [0.68, 1.0], ship_per_unit: 1.15, customization: true, risk: "medium" },
  { name: "DHgate", site: "dhgate.com", region: "China", base_url: (k) => `https://www.dhgate.com/wholesale/search.do?searchkey=${encodeURIComponent(k)}`, rating: 4.1, years: 7, lead_time: "15–30 days", moq_factor: 10, cost_factor: [0.9, 1.3], ship_per_unit: 0.6, customization: false, risk: "medium" },
  { name: "Faire", site: "faire.com", region: "USA", base_url: (k) => `https://www.faire.com/search?q=${encodeURIComponent(k)}`, rating: 4.6, years: 6, lead_time: "3–10 days (US)", moq_factor: 6, cost_factor: [1.4, 2.2], ship_per_unit: 0.4, customization: false, risk: "low" },
  { name: "Tundra", site: "tundra.com", region: "USA", base_url: (k) => `https://www.tundra.com/search?q=${encodeURIComponent(k)}`, rating: 4.4, years: 5, lead_time: "3–10 days (US)", moq_factor: 6, cost_factor: [1.4, 2.1], ship_per_unit: 0.35, customization: false, risk: "low" },
  { name: "CJdropshipping", site: "cjdropshipping.com", region: "China/US WH", base_url: (k) => `https://cjdropshipping.com/list/wholesale?search=${encodeURIComponent(k)}`, rating: 4.2, years: 5, lead_time: "8–20 days", moq_factor: 1, cost_factor: [1.0, 1.5], ship_per_unit: 0.5, customization: false, risk: "medium" },
];

export interface SupplierSearchParams {
  product_candidate_id: string;
  product_name: string;
  product_keywords: string[];
  target_unit_cost: number;
  include_alibaba?: boolean;
  include_aliexpress?: boolean;
  include_wholesale_us?: boolean;
  supplier_sites?: string[];
  max_moq?: number;
  minimum_supplier_rating?: number;
}

export async function findSuppliers(p: SupplierSearchParams): Promise<SupplierOption[]> {
  const kw = p.product_keywords[0] || p.product_name;
  const usSites = new Set(["Faire", "Tundra"]);
  const profiles = PROFILES.filter((pr) => {
    if (pr.name === "Alibaba" && p.include_alibaba === false) return false;
    if (pr.name === "AliExpress" && p.include_aliexpress === false) return false;
    if (usSites.has(pr.name) && p.include_wholesale_us === false) return false;
    if (p.supplier_sites?.length && !p.supplier_sites.some((s) => pr.name.toLowerCase().includes(s.toLowerCase()) || pr.site.includes(s.toLowerCase()))) return false;
    if (p.minimum_supplier_rating && pr.rating < p.minimum_supplier_rating) return false;
    return true;
  });

  const realResults = (process.env.SERPAPI_KEY || process.env.BING_SEARCH_API_KEY)
    ? await webSearch(`${p.product_name} wholesale supplier MOQ`, 8)
    : [];

  const out: SupplierOption[] = profiles.map((pr, idx) => {
    const [cmin, cmax] = pr.cost_factor;
    const unit_min = round(p.target_unit_cost * cmin);
    const unit_max = round(p.target_unit_cost * cmax);
    const moq = Math.round(pr.moq_factor);
    const landed = round((unit_min + unit_max) / 2 + pr.ship_per_unit);

    // Prefer a real, directly-matching public result when available.
    const real = realResults.find((r) => r.link.includes(pr.site));
    const directUrl = real?.link || pr.base_url(kw);
    const { score, label } = matchQuality(p.product_name, p.product_keywords, real?.title || `${p.product_name} ${pr.name}`);

    const overMoq = p.max_moq != null && moq > p.max_moq;
    const citations = [
      makeCitation(pr.name, directUrl, real ? "Direct supplier listing" : "Supplier search page (verify exact product)", real ? "marketplace" : "search"),
    ];

    return {
      id: `${p.product_candidate_id}-sup-${idx}`,
      product_candidate_id: p.product_candidate_id,
      supplier_name: pr.name,
      supplier_site: pr.site,
      supplier_url: `https://${pr.site}`,
      direct_product_url: directUrl,
      region: pr.region,
      unit_cost_min: unit_min,
      unit_cost_max: unit_max,
      moq,
      sample_available: pr.name !== "AliExpress" ? true : true,
      estimated_shipping: pr.ship_per_unit,
      estimated_landed_cost: landed,
      supplier_rating: pr.rating,
      years_active: pr.years,
      lead_time: pr.lead_time,
      customization_available: pr.customization,
      match_quality_score: real ? score : Math.max(58, score - 8), // search-page links are less certain
      supplier_risk: overMoq ? "high" : pr.risk,
      notes: [
        real ? "Matched to a public listing." : "Link is a search page; open and confirm the exact product.",
        overMoq ? `MOQ ${moq} exceeds your max of ${p.max_moq}.` : "",
        pr.customization ? "Private-label / customization available." : "",
      ].filter(Boolean).join(" "),
      citations,
    };
  });

  return out
    .filter((s) => (p.max_moq == null ? true : s.moq <= p.max_moq * 4)) // keep but flagged; hard-drop only extreme
    .sort((a, b) => b.match_quality_score - a.match_quality_score || a.estimated_landed_cost - b.estimated_landed_cost);
}
