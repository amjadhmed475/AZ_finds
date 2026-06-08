import type { Dashboard } from "../lib/types";
import { pct, money } from "../lib/formatters";

export function BatchHeader({ data }: { data: Dashboard }) {
  const b = data.batch;
  const products = data.products;
  const aCount = products.filter((p) => p.grade?.grade?.startsWith("A")).length;
  const bCount = products.filter((p) => p.grade?.grade?.startsWith("B")).length;
  const bestGrade = [...products].map((p) => p.grade?.grade).filter(Boolean).sort()[0] || "—";
  const highestRoi = Math.max(0, ...products.map((p) => p.profitability.roi));
  const bestCapital = Math.max(0, ...products.map((p) => p.capitalFit ?? 0));
  const cells: Array<[string, string | number, string?]> = [
    ["Batch date", b?.batch_date || "—"],
    ["Scanned", b?.products_generated ?? products.length],
    ["Displayed", products.length],
    ["A-grade", aCount, "#15803d"],
    ["B-grade", bCount, "#2563eb"],
    ["Rejected", (data.richRejected?.length ?? b?.products_rejected ?? 0), "#dc2626"],
    ["Best grade", bestGrade, "#15803d"],
    ["Highest ROI", pct(highestRoi), "#16a34a"],
    ["Best capital fit", `${bestCapital}/5`],
    ["API calls", data.apiUsage?.api_calls_used_today ?? 0],
    ["Cache hits", data.apiUsage?.cache_hits ?? 0],
  ];
  return (
    <div className="batch-header">
      <div className="batch-title">
        <span className="batch-pill">Today's Batch</span>
        <span className="muted small">{b?.batch_source || "estimate engine"} · {b?.data_source_status || "sources locked"}</span>
      </div>
      <div className="batch-grid">
        {cells.map(([label, value, color]) => (
          <div className="batch-cell" key={label}>
            <div className="batch-val" style={color ? { color } : undefined}>{value}</div>
            <div className="batch-lab">{label}</div>
          </div>
        ))}
      </div>
      {aCount === 0 && (
        <p className="muted small" style={{ marginTop: 8 }}>
          No A-tier grades: in estimate mode grades are capped at B3 (low demand confidence). Connect a live data source to let products earn higher grades. {money(0) && ""}
        </p>
      )}
    </div>
  );
}
