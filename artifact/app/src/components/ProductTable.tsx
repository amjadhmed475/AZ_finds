import type { DashProduct } from "../lib/types";
import type { FilterState } from "../lib/filters";
import { money, num, pct, riskColor } from "../lib/formatters";
import { GradeBadge } from "./GradeBadge";
import { ProductImage } from "./ProductImage";

interface Props {
  products: DashProduct[];
  filters: FilterState;
  onSort: (key: FilterState["sortKey"]) => void;
  onSelect: (p: DashProduct) => void;
}

const COLS: Array<{ key?: FilterState["sortKey"]; label: string }> = [
  { label: "" },
  { key: "grade", label: "Grade" },
  { key: "name", label: "Product" },
  { key: "category", label: "Category" },
  { key: "opportunity_score", label: "Score" },
  { key: "roi", label: "ROI" },
  { key: "margin", label: "Margin" },
  { key: "netProfit", label: "Profit" },
  { key: "estimatedMonthlySales", label: "Sales/mo" },
  { label: "Trend" },
  { label: "Risk" },
  { label: "Supplier" },
  { label: "Capital" },
  { label: "" },
];

export function ProductTable({ products, filters, onSort, onSelect }: Props) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {COLS.map((c, i) => (
              <th key={i} onClick={() => c.key && onSort(c.key)} className={c.key ? "sortable" : ""}>
                {c.label}{filters.sortKey === c.key && <span className="sort-arrow">{filters.sortDir === "asc" ? " ▲" : " ▼"}</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {products.map((p) => {
            const best = p.suppliers?.[0];
            return (
              <tr key={p.id} onClick={() => onSelect(p)} className="row-click">
                <td><div className="thumb" style={{ width: 40, height: 40, overflow: "hidden" }}><ProductImage image={p.image} name={p.name} fit="cover" showBadge={false} /></div></td>
                <td><GradeBadge grade={p.grade?.grade} size="sm" /></td>
                <td className="cell-name">{p.name}</td>
                <td>{p.category}</td>
                <td><span className="score-bar"><span style={{ width: `${p.opportunity_score}%` }} /></span>{p.opportunity_score}</td>
                <td><span className={`mpill ${p.profitability.roi >= 50 ? "good" : p.profitability.roi >= 30 ? "warn" : "bad"}`}>{pct(p.profitability.roi)}</span></td>
                <td><span className={`mpill ${p.profitability.margin >= 25 ? "good" : p.profitability.margin >= 15 ? "warn" : "bad"}`}>{pct(p.profitability.margin)}</span></td>
                <td style={{ color: p.profitability.netProfit >= 0 ? "#059669" : "#e11d48", fontWeight: 700 }}>{money(p.profitability.netProfit)}</td>
                <td>{num(p.estimatedMonthlySales)}</td>
                <td><span className="pill">{p.trend_status}</span></td>
                <td><span className="dot" style={{ background: riskColor[p.risk_level] }} /> {p.risk_level}</td>
                <td>{best ? <span className="pill" title={best.supplier_name}>{best.match_quality_score}</span> : <span className="muted small">none</span>}</td>
                <td>{p.capitalFit ?? 0}/5</td>
                <td><button className="btn btn-sm" onClick={(e) => { e.stopPropagation(); onSelect(p); }}>View</button></td>
              </tr>
            );
          })}
          {products.length === 0 && <tr><td colSpan={COLS.length} className="muted center">No products match.</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
