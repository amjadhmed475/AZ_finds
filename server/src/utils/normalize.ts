/** Lowercase, strip punctuation, collapse whitespace. */
export function normalizeText(input: string): string {
  return String(input || "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(input: string): string[] {
  return normalizeText(input).split(" ").filter(Boolean);
}

const STOPWORDS = new Set([
  "the", "a", "an", "for", "and", "or", "with", "of", "to", "in", "on",
  "pack", "set", "pcs", "pieces", "new", "premium", "best",
]);

export function keywordTokens(input: string): string[] {
  return tokenize(input).filter((t) => !STOPWORDS.has(t) && t.length > 1);
}

export function slugify(input: string): string {
  return normalizeText(input).replace(/\s+/g, "-").slice(0, 60);
}

export function round(n: number, dp = 2): number {
  const f = Math.pow(10, dp);
  return Math.round((n + Number.EPSILON) * f) / f;
}
