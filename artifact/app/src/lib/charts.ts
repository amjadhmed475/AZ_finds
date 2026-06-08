import type { Dashboard } from "./types";

/** Recharts-friendly transforms. Most series pass through unchanged. */
export function scatterData(d: Dashboard) {
  return d.charts.demandCompetitionScatter.map((s) => ({
    x: s.competition,
    y: s.demand,
    z: s.score,
    name: s.name,
  }));
}

/** Merge per-product trend timelines into one multi-series dataset keyed by month. */
export function trendData(d: Dashboard) {
  const months = d.charts.trendTimeline[0]?.series.map((p) => p.t) ?? [];
  return months.map((t, i) => {
    const row: Record<string, number | string> = { t };
    for (const line of d.charts.trendTimeline) {
      row[line.name] = line.series[i]?.v ?? 0;
    }
    return row;
  });
}

export function trendKeys(d: Dashboard): string[] {
  return d.charts.trendTimeline.map((l) => l.name);
}
