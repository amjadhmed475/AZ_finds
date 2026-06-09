import type { DashProduct } from "./types";

/** Amazon link for a product. Deep-links to the ASIN if we have one, else a search. */
export const amazonSearchUrl = (name: string) => `https://www.amazon.com/s?k=${encodeURIComponent(name)}`;
export const amazonUrl = (p: DashProduct) => {
  const asin = (p as unknown as { asin?: string }).asin;
  return asin ? `https://www.amazon.com/dp/${asin}` : amazonSearchUrl(p.name);
};

/** If a product's data was validated against a live source (retailerapi/Keepa), return its name. */
export const validatedSource = (p: DashProduct): string | null => {
  const c = p.citations?.find((x) => /retailerapi|keepa/i.test(x.source_name || ""));
  return c ? c.source_name.replace(/ API$/i, "") : null;
};

const num = (n: number) => n.toLocaleString("en-US");
const money = (n: number) => `$${(Math.round(n * 100) / 100).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const dims = (d?: { length: number; width: number; height: number } | null) => (d ? `${d.length}×${d.width}×${d.height} in` : "—");

export interface HStat { label: string; value: string; tone?: "good" | "warn" | "bad"; mono?: boolean }

/** Helium-Xray-style stat block for a product (estimate-level unless a live source is connected). */
export function heliumStats(p: DashProduct): HStat[] {
  const f = p.profitability;
  const totalFees = f.fbaFee + f.referralFee;
  const tProfit = f.netProfit >= 0 ? "good" : "bad";
  return [
    { label: "Price", value: money(p.estimatedSalePrice), mono: true },
    { label: "Monthly Sales", value: `${num(p.estimatedMonthlySales)} u`, mono: true, tone: p.estimatedMonthlySales >= 500 ? "good" : "warn" },
    { label: "Monthly Revenue", value: money(p.estimatedRevenue), mono: true, tone: "good" },
    { label: "BSR", value: p.bsr != null ? `#${num(p.bsr)}` : "—", mono: true },
    { label: "Net / unit", value: money(f.netProfit), mono: true, tone: tProfit },
    { label: "Margin", value: `${Math.round(f.margin)}%`, mono: true, tone: f.margin >= 25 ? "good" : "warn" },
    { label: "ROI", value: `${Math.round(f.roi)}%`, mono: true, tone: f.roi >= 50 ? "good" : "warn" },
    { label: "Reviews", value: num(p.reviewCount), mono: true },
    { label: "Rating", value: p.reviewRating > 0 ? `${p.reviewRating.toFixed(1)}★` : "—", mono: true },
    { label: "Sellers", value: num(p.seller_count), mono: true, tone: p.seller_count <= 12 ? "good" : "warn" },
    { label: "Fulfillment", value: "FBA" },
    { label: "FBA Fee", value: money(f.fbaFee), mono: true },
    { label: "Referral Fee", value: money(f.referralFee), mono: true },
    { label: "Total Fees", value: money(totalFees), mono: true },
    { label: "Landed Cost", value: money(f.landedCost), mono: true },
    { label: "Break-even", value: money(f.breakEvenPrice), mono: true },
    { label: "Weight", value: p.weight_oz != null ? `${p.weight_oz} oz` : "—", mono: true },
    { label: "Dimensions", value: dims(p.dimensions) },
    { label: "Category", value: p.category },
    { label: "Trend", value: p.trend_status },
    { label: "Gating", value: p.gating_status },
    { label: "Capital Fit", value: `${p.capitalFit ?? 0}/5`, mono: true },
  ];
}
