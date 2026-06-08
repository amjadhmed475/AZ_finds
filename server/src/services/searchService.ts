import { makeCitation } from "./citationService.js";
import { checkRestriction } from "./restrictionService.js";
import { RateLimiter } from "../utils/rateLimit.js";
import { globalCache } from "../utils/cache.js";
import { recordApiCall } from "./apiUsageService.js";
import { normalizeText } from "../utils/normalize.js";
import { SEED_CATALOG, type ProductSeed } from "../data/seedCatalog.js";

export { SEED_CATALOG };
export type { ProductSeed };

const limiter = new RateLimiter(2, 4);

export interface WebResult {
  title: string;
  link: string;
  snippet: string;
  source: string;
}

/** Generic web search via SerpAPI or Bing when keys exist. Empty array otherwise. */
export async function webSearch(query: string, num = 10): Promise<WebResult[]> {
  const cacheKey = `web:${query}:${num}`;
  return globalCache.wrap(cacheKey, async () => {
    await limiter.acquire();
    const serp = process.env.SERPAPI_KEY;
    const bing = process.env.BING_SEARCH_API_KEY;
    try {
      if (serp) {
        recordApiCall();
        const url = `https://serpapi.com/search.json?engine=google&q=${encodeURIComponent(query)}&num=${num}&api_key=${serp}`;
        const r = await fetch(url);
        if (r.ok) {
          const j: any = await r.json();
          return (j.organic_results || []).slice(0, num).map((o: any) => ({
            title: o.title || "", link: o.link || "", snippet: o.snippet || "", source: "SerpAPI/Google",
          }));
        }
      }
      if (bing) {
        recordApiCall();
        const url = `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(query)}&count=${num}`;
        const r = await fetch(url, { headers: { "Ocp-Apim-Subscription-Key": bing } });
        if (r.ok) {
          const j: any = await r.json();
          return (j.webPages?.value || []).slice(0, num).map((o: any) => ({
            title: o.name || "", link: o.url || "", snippet: o.snippet || "", source: "Bing",
          }));
        }
      }
    } catch {
      /* network error → empty */
    }
    return [];
  });
}

export interface FindParams {
  query: string;
  category_preferences?: string[];
  avoid_categories?: string[];
  max_landed_cost?: number;
  max_results?: number;
}

export interface RejectedSeed {
  name: string;
  category: string;
  reasons: string[];
}

export interface FindResult {
  accepted: ProductSeed[];
  rejected: RejectedSeed[];
}

/**
 * Find product seeds with restricted-category rejection. Returns both the
 * accepted seeds and a "why rejected" list. In real mode it augments accepted
 * seeds with public web evidence. The seed catalog is already pre-filtered of
 * restricted items, so this mainly applies user `avoid_categories`, cost caps,
 * and a final restriction re-check (defense in depth).
 */
export async function findOpportunitiesDetailed(p: FindParams): Promise<FindResult> {
  const q = normalizeText(p.query || "");
  const prefs = (p.category_preferences || []).map(normalizeText);
  const avoid = (p.avoid_categories || []).map(normalizeText);
  const max = p.max_results ?? 20;
  const rejected: RejectedSeed[] = [];

  let pool = SEED_CATALOG.filter((s) => {
    const hay = normalizeText(`${s.name} ${s.short_description} ${s.category} ${s.product_type} ${s.amazon_keywords.join(" ")}`);
    if (prefs.length && !prefs.some((pref) => hay.includes(pref))) return false;
    if (avoid.some((a) => hay.includes(a))) {
      rejected.push({ name: s.name, category: s.category, reasons: [`Excluded by your avoid_categories filter.`] });
      return false;
    }
    if (p.max_landed_cost && s.target_unit_cost > p.max_landed_cost) {
      rejected.push({ name: s.name, category: s.category, reasons: [`Estimated landed cost ${s.target_unit_cost} exceeds your max of ${p.max_landed_cost}.`] });
      return false;
    }
    const restriction = checkRestriction(`${s.name} ${s.short_description} ${s.product_type}`);
    if (restriction.restricted) {
      rejected.push({ name: s.name, category: s.category, reasons: restriction.reasons });
      return false;
    }
    if (q) {
      const matches = q.split(" ").some((w) => w.length > 2 && hay.includes(w));
      // Only narrow by query when the user gave no category preference.
      if (!matches && !prefs.length && q.split(" ").length <= 4) return false;
    }
    return true;
  });

  if (process.env.SERPAPI_KEY || process.env.BING_SEARCH_API_KEY) {
    const results = await webSearch(`${p.query} generic amazon fba product opportunity`, 6);
    pool = pool.map((s) => {
      const hits = results.filter((r) => normalizeText(r.title + " " + r.snippet).includes(normalizeText(s.product_type)));
      const cites = hits.slice(0, 2).map((h) => makeCitation(h.source, h.link, `Public discussion of ${s.product_type}`, "search"));
      return cites.length ? { ...s, citations: [...s.citations, ...cites] } : s;
    });
  }

  return { accepted: pool.slice(0, max), rejected };
}

/** Back-compat: accepted seeds only. */
export async function findOpportunities(p: FindParams): Promise<ProductSeed[]> {
  return (await findOpportunitiesDetailed(p)).accepted;
}
