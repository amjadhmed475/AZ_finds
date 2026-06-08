import type { DashProduct, Supplier } from "./types";

const enc = encodeURIComponent;
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const r2 = (n: number) => Math.round(n * 100) / 100;

export interface WholesaleSource {
  name: string;
  site: string;
  region: string;
  url: string;             // direct marketplace search for the exact query
  moq: string;
  lead_time: string;
  rating: number;
  customization: boolean;
  risk: "low" | "medium" | "high";
  unit_cost?: [number, number];
  landed?: number;
  note: string;
}

interface Profile {
  name: string; site: string; region: string; build: (q: string) => string;
  moqBase: number; cost: [number, number]; ship: number; rating: number;
  lead: string; custom: boolean; risk: "low" | "medium" | "high";
}

// Mirrors the server supplierService profiles so client + server stay consistent.
const PROFILES: Profile[] = [
  { name: "Alibaba", site: "alibaba.com", region: "China", build: (q) => `https://www.alibaba.com/trade/search?SearchText=${enc(q)}`, moqBase: 100, cost: [0.7, 1.0], ship: 1.1, rating: 4.4, lead: "20–35 days", custom: true, risk: "medium" },
  { name: "AliExpress", site: "aliexpress.com", region: "China", build: (q) => `https://www.aliexpress.com/wholesale?SearchText=${enc(q)}`, moqBase: 1, cost: [0.95, 1.4], ship: 0, rating: 4.3, lead: "12–25 days", custom: false, risk: "medium" },
  { name: "Global Sources", site: "globalsources.com", region: "China/HK", build: (q) => `https://www.globalsources.com/searchList/products?keyWord=${enc(q)}`, moqBase: 200, cost: [0.65, 0.95], ship: 1.2, rating: 4.5, lead: "25–40 days", custom: true, risk: "low" },
  { name: "Made-in-China", site: "made-in-china.com", region: "China", build: (q) => `https://www.made-in-china.com/productsearch/${slug(q)}.html`, moqBase: 150, cost: [0.68, 1.0], ship: 1.15, rating: 4.3, lead: "25–40 days", custom: true, risk: "medium" },
  { name: "DHgate", site: "dhgate.com", region: "China", build: (q) => `https://www.dhgate.com/wholesale/search.do?searchkey=${enc(q)}`, moqBase: 10, cost: [0.9, 1.3], ship: 0.6, rating: 4.1, lead: "15–30 days", custom: false, risk: "medium" },
  { name: "Faire", site: "faire.com", region: "USA", build: (q) => `https://www.faire.com/search?q=${enc(q)}`, moqBase: 6, cost: [1.4, 2.2], ship: 0.4, rating: 4.6, lead: "3–10 days (US)", custom: false, risk: "low" },
  { name: "Tundra", site: "tundra.com", region: "USA", build: (q) => `https://www.tundra.com/search?q=${enc(q)}`, moqBase: 6, cost: [1.4, 2.1], ship: 0.35, rating: 4.4, lead: "3–10 days (US)", custom: false, risk: "low" },
  { name: "CJdropshipping", site: "cjdropshipping.com", region: "China/US WH", build: (q) => `https://cjdropshipping.com/list/wholesale?search=${enc(q)}`, moqBase: 1, cost: [1.0, 1.5], ship: 0.5, rating: 4.2, lead: "8–20 days", custom: false, risk: "medium" },
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
      moq: p.moqBase <= 1 ? "1 (no MOQ)" : `~${p.moqBase}`, lead_time: p.lead, rating: p.rating,
      customization: p.custom, risk: p.risk, unit_cost: cost, landed,
      note: p.custom ? "Private label / OEM available" : p.region.includes("USA") ? "US wholesale, fast lead time" : "",
    };
  });
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
