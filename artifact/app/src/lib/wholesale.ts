import type { DashProduct, Supplier } from "./types";

const enc = encodeURIComponent;
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const r2 = (n: number) => Math.round(n * 100) / 100;

export type SourcingType = "china" | "us-wholesale" | "business";

export interface WholesaleSource {
  name: string;
  site: string;
  region: string;
  url: string;             // direct marketplace search for the exact query
  moq: string;
  moq_num: number;
  lead_time: string;
  fast: boolean;
  rating: number;
  customization: boolean;
  risk: "low" | "medium" | "high";
  sourcing_type: SourcingType;
  unit_cost?: [number, number];
  landed?: number;
  note: string;
}

interface Profile {
  name: string; site: string; region: string; build: (q: string) => string;
  moqBase: number; cost: [number, number]; ship: number; rating: number;
  lead: string; custom: boolean; risk: "low" | "medium" | "high"; type: SourcingType; fast?: boolean;
}

// Mirrors the server supplierService profiles so client + server stay consistent.
const PROFILES: Profile[] = [
  // ── China / global marketplaces ──
  { name: "Alibaba", site: "alibaba.com", region: "China", build: (q) => `https://www.alibaba.com/trade/search?SearchText=${enc(q)}`, moqBase: 100, cost: [0.7, 1.0], ship: 1.1, rating: 4.4, lead: "20–35 days", custom: true, risk: "medium", type: "china" },
  { name: "AliExpress", site: "aliexpress.com", region: "China", build: (q) => `https://www.aliexpress.com/wholesale?SearchText=${enc(q)}`, moqBase: 1, cost: [0.95, 1.4], ship: 0, rating: 4.3, lead: "12–25 days", custom: false, risk: "medium", type: "china" },
  { name: "Global Sources", site: "globalsources.com", region: "China/HK", build: (q) => `https://www.globalsources.com/searchList/products?keyWord=${enc(q)}`, moqBase: 200, cost: [0.65, 0.95], ship: 1.2, rating: 4.5, lead: "25–40 days", custom: true, risk: "low", type: "china" },
  { name: "Made-in-China", site: "made-in-china.com", region: "China", build: (q) => `https://www.made-in-china.com/productsearch/${slug(q)}.html`, moqBase: 150, cost: [0.68, 1.0], ship: 1.15, rating: 4.3, lead: "25–40 days", custom: true, risk: "medium", type: "china" },
  { name: "DHgate", site: "dhgate.com", region: "China", build: (q) => `https://www.dhgate.com/wholesale/search.do?searchkey=${enc(q)}`, moqBase: 10, cost: [0.9, 1.3], ship: 0.6, rating: 4.1, lead: "15–30 days", custom: false, risk: "medium", type: "china" },
  { name: "1688", site: "1688.com", region: "China (CN)", build: (q) => `https://s.1688.com/selloffer/offer_search.htm?keywords=${enc(q)}`, moqBase: 50, cost: [0.55, 0.85], ship: 1.3, rating: 4.2, lead: "25–45 days", custom: true, risk: "medium", type: "china" },
  { name: "HKTDC", site: "hktdc.com", region: "Hong Kong", build: (q) => `https://sourcing.hktdc.com/en/Search?q=${enc(q)}`, moqBase: 100, cost: [0.7, 1.05], ship: 1.2, rating: 4.4, lead: "20–40 days", custom: true, risk: "low", type: "china" },
  { name: "IndiaMART", site: "indiamart.com", region: "India", build: (q) => `https://dir.indiamart.com/search.mp?ss=${enc(q)}`, moqBase: 50, cost: [0.7, 1.1], ship: 1.0, rating: 4.1, lead: "20–35 days", custom: true, risk: "medium", type: "china" },
  { name: "CJdropshipping", site: "cjdropshipping.com", region: "China/US WH", build: (q) => `https://cjdropshipping.com/list/wholesale?search=${enc(q)}`, moqBase: 1, cost: [1.0, 1.5], ship: 0.5, rating: 4.2, lead: "8–20 days", custom: false, risk: "medium", type: "china" },
  // ── US / wholesale directories ──
  { name: "Faire", site: "faire.com", region: "USA", build: (q) => `https://www.faire.com/search?q=${enc(q)}`, moqBase: 6, cost: [1.4, 2.2], ship: 0.4, rating: 4.6, lead: "3–10 days", custom: false, risk: "low", type: "us-wholesale", fast: true },
  { name: "Tundra", site: "tundra.com", region: "USA", build: (q) => `https://www.tundra.com/search?q=${enc(q)}`, moqBase: 6, cost: [1.4, 2.1], ship: 0.35, rating: 4.4, lead: "3–10 days", custom: false, risk: "low", type: "us-wholesale", fast: true },
  { name: "Abound", site: "helloabound.com", region: "USA", build: (q) => `https://www.helloabound.com/search?q=${enc(q)}`, moqBase: 4, cost: [1.4, 2.2], ship: 0.4, rating: 4.4, lead: "3–10 days", custom: false, risk: "low", type: "us-wholesale", fast: true },
  { name: "Wholesale Central", site: "wholesalecentral.com", region: "USA", build: (q) => `https://www.wholesalecentral.com/search.cgi?query=${enc(q)}`, moqBase: 12, cost: [1.2, 1.9], ship: 0.45, rating: 4.0, lead: "5–14 days", custom: false, risk: "low", type: "us-wholesale", fast: true },
  { name: "DollarDays", site: "dollardays.com", region: "USA", build: (q) => `https://www.dollardays.com/search?keywords=${enc(q)}`, moqBase: 12, cost: [1.1, 1.8], ship: 0.5, rating: 4.0, lead: "5–14 days", custom: false, risk: "low", type: "us-wholesale", fast: true },
  { name: "Kole Imports", site: "koleimports.com", region: "USA", build: (q) => `https://www.koleimports.com/search?q=${enc(q)}`, moqBase: 12, cost: [1.1, 1.8], ship: 0.5, rating: 4.0, lead: "5–14 days", custom: false, risk: "low", type: "us-wholesale", fast: true },
  { name: "Thomasnet", site: "thomasnet.com", region: "USA", build: (q) => `https://www.thomasnet.com/search.html?cov=NA&q=${enc(q)}`, moqBase: 50, cost: [1.3, 2.0], ship: 0.5, rating: 4.3, lead: "7–21 days", custom: true, risk: "low", type: "us-wholesale" },
  // ── general business suppliers ──
  { name: "Uline", site: "uline.com", region: "USA", build: (q) => `https://www.uline.com/Search?keywords=${enc(q)}`, moqBase: 1, cost: [1.6, 2.6], ship: 0.6, rating: 4.7, lead: "1–3 days", custom: false, risk: "low", type: "business", fast: true },
  { name: "WebstaurantStore", site: "webstaurantstore.com", region: "USA", build: (q) => `https://www.webstaurantstore.com/search/${slug(q)}.html`, moqBase: 1, cost: [1.4, 2.3], ship: 0.55, rating: 4.6, lead: "1–4 days", custom: false, risk: "low", type: "business", fast: true },
  { name: "Zoro", site: "zoro.com", region: "USA", build: (q) => `https://www.zoro.com/search?q=${enc(q)}`, moqBase: 1, cost: [1.6, 2.7], ship: 0.6, rating: 4.5, lead: "1–4 days", custom: false, risk: "low", type: "business", fast: true },
  { name: "Quill", site: "quill.com", region: "USA", build: (q) => `https://www.quill.com/search?keywords=${enc(q)}`, moqBase: 1, cost: [1.6, 2.6], ship: 0.6, rating: 4.4, lead: "1–4 days", custom: false, risk: "low", type: "business", fast: true },
];

/** Build wholesale sources for the exact typed query. Dollar figures appear only
 *  when an expected sell price is given (so we never invent costs out of thin air). */
export function findWholesale(query: string, expectedPrice?: number): WholesaleSource[] {
  const q = query.trim();
  if (!q) return [];
  const targetUnit = expectedPrice && expectedPrice > 0 ? Math.max(1.2, r2(expectedPrice * 0.22)) : undefined;
  return PROFILES.map((p) => {
    const cost = targetUnit ? ([r2(targetUnit * p.cost[0]), r2(targetUnit * p.cost[1])] as [number, number]) : undefined;
    const landed = cost ? r2((cost[0] + cost[1]) / 2 + p.ship) : undefined;
    return {
      name: p.name, site: p.site, region: p.region, url: p.build(q),
      moq: p.moqBase <= 1 ? "1 (no MOQ)" : `~${p.moqBase}`, moq_num: p.moqBase, lead_time: p.lead, fast: Boolean(p.fast),
      rating: p.rating, customization: p.custom, risk: p.risk, sourcing_type: p.type, unit_cost: cost, landed,
      note: p.custom ? "Private label / OEM available" : p.type !== "china" ? "US supplier, fast lead time" : "",
    };
  });
}

export interface WholesaleFilter { region?: "all" | "us-wholesale" | "china" | "business"; lowMoq?: boolean; fast?: boolean; privateLabel?: boolean; sort?: "match" | "landed"; }

export function filterWholesale(list: WholesaleSource[], f: WholesaleFilter): WholesaleSource[] {
  let out = list.filter((s) => {
    if (f.region && f.region !== "all" && s.sourcing_type !== f.region) return false;
    if (f.lowMoq && s.moq_num > 12) return false;
    if (f.fast && !s.fast) return false;
    if (f.privateLabel && !s.customization) return false;
    return true;
  });
  if (f.sort === "landed") out = [...out].sort((a, b) => (a.landed ?? 1e9) - (b.landed ?? 1e9));
  return out;
}

const STOP = new Set(["the", "a", "for", "and", "with", "of", "pack", "set", "pcs", "x", "in"]);
const toks = (s: string) => s.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/).filter((t) => t.length > 2 && !STOP.has(t));

/** Find the closest catalog product to the query (so we can surface its real matched suppliers). */
export function matchProduct(query: string, products: DashProduct[]): { product: DashProduct; score: number } | null {
  const qt = new Set(toks(query));
  if (!qt.size) return null;
  let best: { product: DashProduct; score: number } | null = null;
  for (const p of products) {
    const pt = toks(`${p.name} ${p.category}`);
    if (!pt.length) continue;
    let hit = 0;
    for (const t of pt) if (qt.has(t)) hit += 1;
    const score = hit / Math.max(qt.size, 1);
    if (score > 0.34 && (!best || score > best.score)) best = { product: p, score };
  }
  return best;
}

/** Rough landed→profit estimate at an expected price (estimate only). */
export function estimateDeal(expectedPrice: number, landed: number) {
  const referral = Math.max(0.3, expectedPrice * 0.15);
  const fba = expectedPrice < 12 ? 3.5 : 5.2;
  const ad = expectedPrice * 0.1;
  const ret = expectedPrice * 0.03;
  const net = r2(expectedPrice - landed - referral - fba - ad - ret);
  const margin = expectedPrice > 0 ? r2((net / expectedPrice) * 100) : 0;
  const roi = landed > 0 ? r2((net / landed) * 100) : 0;
  return { net, margin, roi, referral: r2(referral), fba };
}

export const bestSupplierForProduct = (p: DashProduct): Supplier | undefined => p.suppliers?.[0];
