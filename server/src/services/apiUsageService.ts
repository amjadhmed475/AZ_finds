import type { ApiUsageStatus, DataMode, SourceStatus } from "../types/api.js";

// Process-level counters. Reset per batch run.
const state = { calls: 0, hits: 0, misses: 0 };

export function recordApiCall(): void { state.calls += 1; state.misses += 1; }
export function recordCacheHit(): void { state.hits += 1; }
export function resetApiCounters(): void { state.calls = 0; state.hits = 0; state.misses = 0; }
export function apiSnapshot() { return { ...state }; }

export function sourceStatuses(): SourceStatus[] {
  return [
    { name: "Amazon SP-API", env: "SP_API_REFRESH_TOKEN" },
    { name: "Amazon Ads API", env: "AMAZON_ADS_REFRESH_TOKEN" },
    { name: "Amazon Creators API", env: "AMAZON_CREATORS_API_KEY" },
    { name: "Keepa", env: "KEEPA_API_KEY" },
    { name: "SerpAPI", env: "SERPAPI_KEY" },
    { name: "Bing Search", env: "BING_SEARCH_API_KEY" },
  ].map((s) => {
    const connected = Boolean(process.env[s.env]);
    return { name: s.name, connected, status: connected ? ("live" as const) : ("locked" as const) };
  });
}

export interface UsageContext {
  data_mode: DataMode;
  product_count: number;
  max_api_calls: number;
  date: string;
}

export function getApiUsageStatus(ctx: UsageContext): ApiUsageStatus {
  const sources = sourceStatuses();
  const liveSources = sources.filter((s) => s.connected).length;
  const snap = apiSnapshot();
  // What a full live scan would have cost (every product × every connected source).
  const fullScanCalls = ctx.product_count * Math.max(liveSources, 0);
  const saved = Math.max(0, fullScanCalls - snap.calls);
  const hits = snap.hits || ctx.product_count; // estimate-engine serves each product without a paid call
  const now = Date.now();
  const warnings: string[] = [];
  if (liveSources === 0) {
    warnings.push("No live sources connected — running on the estimate engine; 0 paid API calls. Connect a key to enable live data.");
  }
  if (ctx.data_mode === "hybrid_low_cost") {
    warnings.push("Hybrid low-cost mode: paid calls are reserved for A-grade / high-B-grade candidates and cached for CACHE_TTL_HOURS.");
  }
  return {
    data_mode: ctx.data_mode,
    sources,
    api_calls_used_today: snap.calls,
    cache_hits: hits,
    cache_misses: snap.misses,
    estimated_calls_saved: saved,
    last_refresh: new Date(now).toISOString(),
    next_refresh: new Date(now + 24 * 3600 * 1000).toISOString(),
    max_api_calls: ctx.max_api_calls,
    warnings,
  };
}
