import type { DashProduct } from "./types";
import { GRADE_LADDER } from "./grade";

export interface FilterState {
  search: string;
  category: string;
  risk: string;
  gating: string;
  grade: string;     // all | A | B | C | D
  bucket: string;    // all | top | needs_check
  supplier: string;  // all | has
  minRoi: number;
  minMargin: number;
  sortKey: keyof DashProduct | "roi" | "margin" | "netProfit" | "grade";
  sortDir: "asc" | "desc";
}

export const DEFAULT_FILTERS: FilterState = {
  search: "",
  category: "all",
  risk: "all",
  gating: "all",
  grade: "all",
  bucket: "all",
  supplier: "all",
  minRoi: 0,
  minMargin: 0,
  sortKey: "grade",
  sortDir: "asc",
};

const gradeIdx = (g?: string) => (g ? GRADE_LADDER.indexOf(g as any) : 99);

function sortVal(p: DashProduct, key: FilterState["sortKey"]): number | string {
  if (key === "roi") return p.profitability.roi;
  if (key === "margin") return p.profitability.margin;
  if (key === "netProfit") return p.profitability.netProfit;
  if (key === "grade") return gradeIdx(p.grade?.grade);
  const v = (p as any)[key];
  return typeof v === "number" ? v : String(v ?? "");
}

export function applyFilters(products: DashProduct[], f: FilterState): DashProduct[] {
  const q = f.search.trim().toLowerCase();
  let out = products.filter((p) => {
    if (q && !`${p.name} ${p.category}`.toLowerCase().includes(q)) return false;
    if (f.category !== "all" && p.category !== f.category) return false;
    if (f.risk !== "all" && p.risk_level !== f.risk) return false;
    if (f.gating !== "all" && !p.gating_status.includes(f.gating)) return false;
    if (f.grade !== "all" && (p.grade?.grade?.[0] ?? "") !== f.grade) return false;
    if (f.bucket !== "all" && (p.bucket ?? "top") !== f.bucket) return false;
    if (f.supplier === "has" && !(p.suppliers?.length)) return false;
    if (p.profitability.roi < f.minRoi) return false;
    if (p.profitability.margin < f.minMargin) return false;
    return true;
  });
  out = out.sort((a, b) => {
    const va = sortVal(a, f.sortKey);
    const vb = sortVal(b, f.sortKey);
    const cmp = typeof va === "number" && typeof vb === "number" ? va - vb : String(va).localeCompare(String(vb));
    return f.sortDir === "asc" ? cmp : -cmp;
  });
  return out;
}

export function toCSV(products: DashProduct[]): string {
  const header = ["rank", "name", "category", "sale_price", "monthly_sales", "landed_cost", "net_profit", "roi", "margin", "sellers", "rating", "trend", "gating", "risk", "score", "action"];
  const rows = products.map((p, i) => [
    i + 1, csv(p.name), csv(p.category), p.estimatedSalePrice, p.estimatedMonthlySales,
    p.profitability.landedCost, p.profitability.netProfit, p.profitability.roi, p.profitability.margin,
    p.seller_count, p.reviewRating, p.trend_status, csv(p.gating_status), p.risk_level, p.opportunity_score, csv(p.recommended_action),
  ].join(","));
  return [header.join(","), ...rows].join("\n");
}

function csv(s: string): string {
  return `"${String(s).replace(/"/g, '""')}"`;
}
