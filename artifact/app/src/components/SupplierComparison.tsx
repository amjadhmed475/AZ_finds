import type { Supplier } from "../lib/types";
import { money, riskColor } from "../lib/formatters";

export function SupplierComparison({ suppliers }: { suppliers: Supplier[] }) {
  if (!suppliers?.length) return <p className="muted">No supplier matches found.</p>;
  return (
    <div className="table-wrap">
      <table className="data-table compact">
        <thead>
          <tr>
            <th>Supplier</th><th>Region</th><th>Unit cost</th><th>MOQ</th>
            <th>Landed</th><th>Rating</th><th>Lead time</th><th>Match</th><th>Risk</th><th>Link</th>
          </tr>
        </thead>
        <tbody>
          {suppliers.map((s) => (
            <tr key={s.id}>
              <td>
                <b>{s.supplier_name}</b>
                {s.customization_available && <span className="tag">private label</span>}
              </td>
              <td>{s.region}</td>
              <td>{money(s.unit_cost_min)}–{money(s.unit_cost_max)}</td>
              <td>{s.moq}</td>
              <td>{money(s.estimated_landed_cost)}</td>
              <td>{s.supplier_rating.toFixed(1)}★</td>
              <td>{s.lead_time}</td>
              <td>
                <div className="match-bar"><span style={{ width: `${s.match_quality_score}%` }} /></div>
                <span className="muted">{s.match_quality_score}</span>
              </td>
              <td><span className="dot" style={{ background: riskColor[s.supplier_risk] }} /> {s.supplier_risk}</td>
              <td><a href={s.direct_product_url} target="_blank" rel="noopener noreferrer">Open →</a></td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="muted small">Links open the closest supplier product or search page. Always confirm the exact item, specs, and MOQ before ordering.</p>
    </div>
  );
}
