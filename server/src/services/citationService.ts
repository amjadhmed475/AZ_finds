import type { Citation } from "../types/citations.js";

const today = () => new Date().toISOString().slice(0, 10);

/** Reliability priors by source type. Official data > marketplace > anecdote. */
const RELIABILITY: Record<string, number> = {
  official: 0.95,
  api: 0.9,
  marketplace: 0.7,
  search: 0.55,
  blog: 0.45,
  forum: 0.35,
  anecdote: 0.25,
  estimate: 0.4,
  mock: 0.2,
};

export function makeCitation(
  source_name: string,
  source_url: string,
  claim_supported: string,
  kind: keyof typeof RELIABILITY = "search"
): Citation {
  return {
    source_name,
    source_url,
    accessed_date: today(),
    claim_supported,
    reliability_score: RELIABILITY[kind] ?? 0.5,
  };
}

export function dedupeCitations(list: Citation[]): Citation[] {
  const seen = new Set<string>();
  const out: Citation[] = [];
  for (const c of list) {
    const key = `${c.source_url}::${c.claim_supported}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c);
  }
  return out;
}
