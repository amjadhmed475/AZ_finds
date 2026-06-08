export const money = (n: number | undefined): string =>
  `$${(Math.round((n || 0) * 100) / 100).toFixed(2)}`;

export const pct = (n: number | undefined): string => `${Math.round((n || 0) * 10) / 10}%`;

export const num = (n: number | undefined): string => (n || 0).toLocaleString("en-US");

export function scoreColor(score: number): string {
  if (score >= 90) return "#15803d";
  if (score >= 80) return "#16a34a";
  if (score >= 70) return "#ca8a04";
  if (score >= 60) return "#ea580c";
  return "#dc2626";
}

export function scoreGrade(score: number): string {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  return "D";
}

export const riskColor: Record<string, string> = {
  low: "#16a34a",
  medium: "#d97706",
  high: "#dc2626",
};

/** Calmer display label for gating status (keeps the underlying estimate honest). */
export function gatingLabel(status: string): string {
  if (status === "manual check required") return "Seller Central check";
  return status;
}

export function gatingColor(status: string): string {
  if (status.includes("likely ungated")) return "#16a34a";
  if (status.includes("possibly")) return "#d97706";
  if (status.includes("likely gated")) return "#dc2626";
  return "#64748b";
}

export const CHART_COLORS = ["#2563eb", "#16a34a", "#d97706", "#dc2626", "#7c3aed", "#0891b2", "#db2777", "#65a30d"];
