// Client-side mirrors of the server PPC/capital math, for the interactive tabs.
const r = (n: number, dp = 2) => Math.round(n * Math.pow(10, dp)) / Math.pow(10, dp);

export function breakEvenAcos(netProfitBeforeAds: number, salePrice: number): number {
  if (salePrice <= 0) return 0;
  return r((netProfitBeforeAds / salePrice) * 100, 1);
}

export function targetAcos(breakEven: number, risk: "low" | "medium" | "high"): number {
  const f = risk === "low" ? 0.55 : risk === "medium" ? 0.68 : 0.85;
  return r(breakEven * f, 1);
}

export interface CapitalInputs {
  total: number;
  reservePct: number;
  inventoryPct: number;
  ppcPct: number;
  samplePct: number;
  shippingPct: number;
  landedCost: number;
  salePrice: number;
  netProfitBeforeAds: number;
  risk: "low" | "medium" | "high";
  testDays: number;
}

export function computeCapital(i: CapitalInputs) {
  const reserve = r(i.total * (i.reservePct / 100));
  const usable = i.total - reserve;
  const inventory = r(usable * (i.inventoryPct / 100));
  const ppc = r(usable * (i.ppcPct / 100));
  const sample = r(usable * (i.samplePct / 100));
  const shipping = r(usable * (i.shippingPct / 100));
  const units = i.landedCost > 0 ? Math.floor(inventory / i.landedCost) : 0;
  const maxDaily = r(ppc / Math.max(1, i.testDays));
  const be = breakEvenAcos(i.netProfitBeforeAds, i.salePrice);
  const tAcos = targetAcos(be, i.risk);
  const breakEvenUnits = i.netProfitBeforeAds > 0 ? Math.ceil((inventory + ppc) / i.netProfitBeforeAds) : 0;
  const scenarios = [25, 50, 75, 100].map((st) => {
    const sold = Math.round(units * (st / 100));
    const gross = r(sold * i.netProfitBeforeAds);
    const adSpend = r(Math.min(ppc, sold * i.salePrice * (tAcos / 100)));
    return { sell_through_percent: st, units_sold: sold, gross_profit: gross, ad_spend: adSpend, net_profit: r(gross - adSpend) };
  });
  const warnings: string[] = [];
  if (units < 50) warnings.push("Estimated order quantity is small; verify supplier MOQ.");
  if (ppc < 300) warnings.push("PPC budget may be too small to gather meaningful data.");
  if (be < 12) warnings.push("Break-even ACOS is low; high ad spend could erase margin.");
  if (i.reservePct < 15) warnings.push("Reserve under 15% increases cashflow risk.");
  return { reserve, usable, inventory, ppc, sample, shipping, units, maxDaily, be, tAcos, breakEvenUnits, scenarios, warnings };
}

// ── client-side Amazon Ads report optimizer (mirror of the server tool) ──
export interface AdsRow { [k: string]: string }

export function parseCsv(text: string): AdsRow[] {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) return [];
  const cols = lines[0].split(",").map((c) => c.trim());
  return lines.slice(1).map((line) => {
    const vals = splitCsvLine(line);
    const row: AdsRow = {};
    cols.forEach((c, i) => (row[c] = (vals[i] ?? "").trim()));
    return row;
  });
}
function splitCsvLine(line: string): string[] {
  const out: string[] = []; let cur = ""; let q = false;
  for (const ch of line) {
    if (ch === '"') q = !q;
    else if (ch === "," && !q) { out.push(cur); cur = ""; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}
function numOf(row: AdsRow, wants: string[]): number {
  for (const k of Object.keys(row)) {
    if (wants.some((w) => k.toLowerCase().replace(/[^a-z]/g, "").includes(w))) {
      const v = parseFloat(String(row[k]).replace(/[$,%]/g, ""));
      if (!isNaN(v)) return v;
    }
  }
  return 0;
}
function strOf(row: AdsRow, wants: string[]): string {
  for (const k of Object.keys(row)) if (wants.some((w) => k.toLowerCase().replace(/[^a-z]/g, "").includes(w))) return row[k];
  return "";
}

export function optimizeRows(rows: AdsRow[], targetAcos: number, breakEven: number, minClicks = 10, minSpend = 10) {
  const raise: Array<{ term: string; reason: string }> = [];
  const lower: Array<{ term: string; reason: string }> = [];
  const pause: Array<{ term: string; reason: string }> = [];
  const addExact: string[] = [];
  const addNegative: Array<{ term: string; reason: string }> = [];
  const wasted: Array<{ term: string; spend: number; clicks: number; sales: number }> = [];
  let totalWasted = 0;
  const colsOk = rows.length && Object.keys(rows[0]).some((k) => /search|target|keyword/i.test(k)) && Object.keys(rows[0]).some((k) => /spend|cost/i.test(k));

  for (const row of rows) {
    const term = strOf(row, ["customersearchterm", "searchterm", "targeting", "keyword"]) || "(unknown)";
    const clicks = numOf(row, ["clicks"]);
    const spend = numOf(row, ["spend", "cost"]);
    const sales = numOf(row, ["sales", "revenue"]);
    const orders = numOf(row, ["orders", "units"]);
    let acos = numOf(row, ["acos"]);
    if (!acos && sales > 0) acos = Math.round((spend / sales) * 1000) / 10;
    if (spend >= minSpend && orders === 0 && clicks >= minClicks) {
      pause.push({ term, reason: `${clicks} clicks, $${spend} spend, 0 orders` });
      addNegative.push({ term, reason: "Spend with no conversions" });
      wasted.push({ term, spend, clicks, sales }); totalWasted += spend;
    } else if (sales > 0 && acos > 0) {
      if (acos <= targetAcos) { raise.push({ term, reason: `ACOS ${acos}% ≤ target ${targetAcos}%` }); if (orders >= 2) addExact.push(term); }
      else lower.push({ term, reason: `ACOS ${acos}% above target` });
    }
  }
  return { raise, lower, pause, addExact, addNegative, wasted, totalWasted: Math.round(totalWasted * 100) / 100, colsOk };
}
