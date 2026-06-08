import { useMemo, useState } from "react";
import type { Dashboard, DashProduct } from "../lib/types";
import { findWholesale, matchProduct, estimateDeal } from "../lib/wholesale";
import { SupplierComparison } from "./SupplierComparison";
import { Icon } from "./Icon";
import { money } from "../lib/formatters";

const EXAMPLES = ["collapsible storage bin", "under sink organizer", "silicone stretch lids", "car seat gap filler", "resistance bands"];

export function WholesaleFinder({ data, onOpen }: { data: Dashboard; onOpen?: (p: DashProduct) => void }) {
  const [query, setQuery] = useState("");
  const [price, setPrice] = useState<string>("");

  const expected = parseFloat(price) || undefined;
  const sources = useMemo(() => findWholesale(query, expected), [query, expected]);
  const match = useMemo(() => matchProduct(query, data.products), [query, data.products]);

  const cheapest = sources.filter((s) => s.landed != null).sort((a, b) => (a.landed! - b.landed!))[0];
  const deal = expected && cheapest?.landed != null ? estimateDeal(expected, cheapest.landed) : null;

  return (
    <section>
      <div className="wf-hero">
        <div className="wf-head">
          <h2 className="wf-title">Wholesale Finder</h2>
          <p className="muted">Type the exact product you want to sell. Get direct wholesale listings across Alibaba, AliExpress, Faire, Tundra and more — plus estimated landed cost and profit.</p>
        </div>
        <div className="wf-controls">
          <div className="wf-search">
            <Icon name="search" size={18} />
            <input autoFocus value={query} onChange={(e) => setQuery(e.target.value)} placeholder="e.g. collapsible storage bin, phone stand, packing cubes…" />
          </div>
          <div className="wf-price">
            <span className="muted small">Expected Amazon price</span>
            <div className="wf-price-in"><span>$</span><input type="number" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="18.99" /></div>
          </div>
        </div>
        {!query && (
          <div className="wf-examples">
            <span className="muted small">Try:</span>
            {EXAMPLES.map((ex) => <button key={ex} className="wf-chip" onClick={() => setQuery(ex)}>{ex}</button>)}
          </div>
        )}
      </div>

      {query && (
        <>
          {deal && (
            <div className="wf-deal">
              <div><Icon name="bolt" size={16} /> Best landed via <b>{cheapest.name}</b> at <b>{money(cheapest.landed!)}</b> · sell at {money(expected!)} →</div>
              <div className="wf-deal-stats">
                <span className={`mpill ${deal.net >= 0 ? "good" : "bad"}`}>{money(deal.net)} net/unit</span>
                <span className={`mpill ${deal.roi >= 50 ? "good" : deal.roi >= 30 ? "warn" : "bad"}`}>{deal.roi}% ROI</span>
                <span className={`mpill ${deal.margin >= 25 ? "good" : "warn"}`}>{deal.margin}% margin</span>
              </div>
            </div>
          )}

          {match && (
            <div className="wf-match">
              <div className="wf-match-head">
                <span className="mpill neutral">Closest match in your batch</span>
                <b>[{match.product.grade?.grade}] {match.product.name}</b>
                {onOpen && <button className="btn btn-sm" onClick={() => onOpen(match.product)}>View product →</button>}
              </div>
              <p className="muted small" style={{ margin: "4px 0 10px" }}>Verified supplier matches already found for this product:</p>
              <SupplierComparison suppliers={match.product.suppliers as any} />
            </div>
          )}

          <h3 className="sub">Wholesale sources for “{query}”</h3>
          <div className="table-wrap">
            <table className="data-table">
              <thead><tr>
                <th>Source</th><th>Region</th><th>MOQ</th><th>Lead time</th>
                <th>Est. unit cost</th><th>Est. landed</th><th>Rating</th><th>Risk</th><th>Listings</th>
              </tr></thead>
              <tbody>
                {sources.map((s) => (
                  <tr key={s.name}>
                    <td><b>{s.name}</b>{s.customization && <span className="tag">private label</span>}</td>
                    <td>{s.region}</td>
                    <td>{s.moq}</td>
                    <td className="muted">{s.lead_time}</td>
                    <td>{s.unit_cost ? `${money(s.unit_cost[0])}–${money(s.unit_cost[1])}` : <span className="muted small">enter price</span>}</td>
                    <td>{s.landed != null ? <b>{money(s.landed)}</b> : <span className="muted small">—</span>}</td>
                    <td>{s.rating.toFixed(1)}★</td>
                    <td><span className={`mpill ${s.risk === "low" ? "good" : s.risk === "medium" ? "warn" : "bad"}`}>{s.risk}</span></td>
                    <td><a className="wf-open" href={s.url} target="_blank" rel="noopener noreferrer">Open <Icon name="external" size={13} /></a></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="info-note" style={{ marginTop: 14 }}>
            Each “Open” link runs that marketplace’s live search for exactly what you typed — open it to confirm the specific listing, specs, materials, and MOQ. Dollar figures are estimates (unit cost ≈ 22% of your expected price, plus typical shipping); verify the real quote and run Amazon’s revenue calculator before ordering.
          </div>
        </>
      )}
    </section>
  );
}
