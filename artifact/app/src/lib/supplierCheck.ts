import type { Supplier, DashProduct } from "./types";

// ── shipping ──────────────────────────────────────────────────────────────
export type ShippingStatus = "pass" | "borderline" | "fail" | "unknown";

export function parseShippingDays(leadTime: string): { min: number; max: number } | null {
  if (!leadTime) return null;
  const m = leadTime.match(/(\d+)\s*[–\-to]+\s*(\d+)/);
  if (m) return { min: +m[1], max: +m[2] };
  const one = leadTime.match(/(\d+)/);
  if (one) return { min: +one[1], max: +one[1] };
  return null;
}

export function shippingStatus(maxDays: number | null): ShippingStatus {
  if (maxDays == null) return "unknown";
  if (maxDays <= 21) return "pass";
  if (maxDays <= 28) return "borderline";
  return "fail";
}

// ── direct link ───────────────────────────────────────────────────────────
export type LinkStatus = "direct" | "search" | "homepage" | "none";

export function directLinkStatus(url: string): LinkStatus {
  if (!url) return "none";
  const u = url.toLowerCase();
  if (/\/(dp|gp\/product|product|item|pd|ip|products)\/|[?&](productid|itemid|offerid)=/.test(u)) return "direct";
  if (/search|searchtext=|searchkey=|keyword|\/wholesale\?|\bq=|productsearch|selloffer/.test(u)) return "search";
  try { const p = new URL(url); return p.pathname.length > 1 ? "direct" : "homepage"; } catch { return "homepage"; }
}

// ── quality match ─────────────────────────────────────────────────────────
export type QualityStatus = "likely" | "uncertain" | "mismatch" | "sample_required";

// ── verification ──────────────────────────────────────────────────────────
export type SupplierGrade = "A" | "B" | "C" | "D";
export interface Check { label: string; state: "pass" | "fail" | "unknown" }
export interface SupplierVerdict {
  score: number;
  grade: SupplierGrade;
  status: string;            // Strong / Good / Needs review / Weak / Avoid
  shipping: { min: number | null; max: number | null; status: ShippingStatus };
  link: LinkStatus;
  quality: QualityStatus;
  qualityLabel: string;
  checks: Check[];
  riskNotes: string[];
  canBeBest: boolean;
  action: string;            // recommended action
  productMatch: number;      // 0-100
}

const KNOWN_PROTECTION = ["alibaba", "faire", "tundra", "abound", "aliexpress", "uline", "webstaurantstore", "zoro", "quill"];
const QUOTE_BASED = ["global sources", "made-in-china", "made in china", "thomasnet", "hktdc", "indiamart", "1688", "tradewheel", "ec21", "ecplaza", "exporthub"];

export function verifySupplier(s: Supplier, _product?: DashProduct): SupplierVerdict {
  const site = (s.supplier_site || s.supplier_name || "").toLowerCase();
  const ship = parseShippingDays(s.lead_time);
  const shipSt = shippingStatus(ship?.max ?? null);
  const link = directLinkStatus(s.direct_product_url);
  const match = s.match_quality_score ?? 0;
  const priceVisible = s.unit_cost_min > 0;
  const moqVisible = s.moq > 0;
  const ratingVisible = s.supplier_rating > 0;
  const hasProtection = KNOWN_PROTECTION.some((k) => site.includes(k)) || /us|usa/i.test(s.region);
  const quoteBased = QUOTE_BASED.some((k) => site.includes(k));

  // ── score (out of 100) per the published criteria ──
  let score = 0;
  score += link === "direct" ? 20 : link === "search" ? 9 : 0;          // direct product match
  score += Math.round((match / 100) * 15);                               // image/title match (proxy)
  score += priceVisible ? 10 : 0;                                        // unit price clarity
  score += moqVisible ? 10 : 0;                                          // MOQ clarity
  score += shipSt === "pass" ? 15 : shipSt === "borderline" ? 8 : 0;     // 2–3 week shipping
  score += ratingVisible ? Math.round((Math.min(5, s.supplier_rating) / 5) * 10) : 0; // rating
  score += s.years_active != null ? Math.min(5, Math.round((s.years_active / 6) * 5)) : 0; // years active
  score += hasProtection ? 5 : 0;                                        // protection policy
  score += s.direct_product_url ? 5 : 0;                                 // contact clarity (reachable)
  score += s.supplier_risk === "low" ? 5 : s.supplier_risk === "medium" ? 3 : 0; // risk
  score = Math.max(0, Math.min(100, score));

  const grade: SupplierGrade = score >= 80 ? "A" : score >= 65 ? "B" : score >= 45 ? "C" : "D";
  const status = score >= 80 ? "Strong match" : score >= 65 ? "Good match" : score >= 45 ? "Needs review" : score >= 30 ? "Weak match" : "Avoid";

  // ── quality match (honest heuristic; defaults to "sample" since we can't verify) ──
  let quality: QualityStatus, qualityLabel: string;
  if (link === "direct" && match >= 75) { quality = "likely"; qualityLabel = "Quality likely matches"; }
  else if (match >= 60) { quality = "uncertain"; qualityLabel = "Quality uncertain — sample advised"; }
  else if (match < 45) { quality = "mismatch"; qualityLabel = "Quality mismatch risk"; }
  else { quality = "sample_required"; qualityLabel = "Order sample before ordering"; }

  const checks: Check[] = [
    { label: "Direct product link found", state: link === "direct" ? "pass" : link === "search" ? "unknown" : "fail" },
    { label: "Product image/title matches", state: match >= 75 ? "pass" : match >= 50 ? "unknown" : "fail" },
    { label: "Unit price visible", state: priceVisible ? "pass" : "unknown" },
    { label: "MOQ visible", state: moqVisible ? "pass" : "unknown" },
    { label: "Shipping estimate visible", state: ship ? "pass" : "unknown" },
    { label: "2–3 week shipping possible", state: shipSt === "pass" ? "pass" : shipSt === "borderline" ? "unknown" : shipSt === "fail" ? "fail" : "unknown" },
    { label: "Supplier rating visible", state: ratingVisible ? "pass" : "unknown" },
    { label: "Buyer protection", state: hasProtection ? "pass" : "unknown" },
    { label: "Quote required", state: quoteBased ? "fail" : "pass" },
    { label: "Direct ordering (no manual contact)", state: link === "direct" ? "pass" : "unknown" },
  ];

  const riskNotes: string[] = [];
  if (link !== "direct") riskNotes.push("No direct product link — needs manual search/contact.");
  if (shipSt === "fail") riskNotes.push("Shipping likely exceeds 28 days.");
  if (shipSt === "unknown") riskNotes.push("Shipping time unknown — confirm with supplier.");
  if (s.supplier_risk === "high") riskNotes.push("High supplier risk.");
  if (quoteBased) riskNotes.push("Quote-based supplier — price/lead-time need a message.");
  if (match < 50) riskNotes.push("Weak product match — verify the listing is the same item.");

  // ── "can be best supplier" rule ──
  const canBeBest =
    link === "direct" && match >= 75 && (shipSt === "pass" || shipSt === "borderline") &&
    (grade === "A" || grade === "B") && quality !== "mismatch" && s.supplier_risk !== "high";

  let action: string;
  if (grade === "D" || s.supplier_risk === "high") action = "Avoid";
  else if (shipSt === "fail") action = "Avoid — shipping too slow";
  else if (link !== "direct") action = "Needs manual search / contact";
  else if (quoteBased) action = "Request quote";
  else if (quality === "likely" && grade === "A") action = "Contact now";
  else action = "Order sample first";

  return {
    score, grade, status,
    shipping: { min: ship?.min ?? null, max: ship?.max ?? null, status: shipSt },
    link, quality, qualityLabel, checks, riskNotes, canBeBest, action,
    productMatch: match,
  };
}

/** Verify + rank a product's suppliers; returns them best-first with verdicts. */
export function verifyAndRank(product: DashProduct): Array<{ s: Supplier; v: SupplierVerdict }> {
  const list = (product.suppliers ?? []).map((s) => ({ s, v: verifySupplier(s, product) }));
  return list.sort((a, b) => Number(b.v.canBeBest) - Number(a.v.canBeBest) || b.v.score - a.v.score);
}

export const shipColor = (st: ShippingStatus) => (st === "pass" ? "#34d399" : st === "borderline" ? "#fbbf24" : st === "fail" ? "#fb7185" : "#8a99b0");
export const gradeColorS = (g: SupplierGrade) => (g === "A" ? "#34d399" : g === "B" ? "#5b8cf5" : g === "C" ? "#fbbf24" : "#fb7185");
