import { useMemo } from "react";
import type { Dashboard, DashProduct } from "../lib/types";
import { launchReadiness, type Readiness } from "../lib/launch";
import { pct } from "../lib/formatters";
import { GradeBadge } from "./GradeBadge";

const toneClass = (t: string) => (t === "good" ? "good" : t === "warn" ? "warn" : t === "bad" ? "bad" : "neutral");

export function LaunchReadiness({ data, onOpen }: { data: Dashboard; onOpen: (p: DashProduct) => void }) {
  const rows = useMemo(
    () => data.products.map((p) => ({ p, r: launchReadiness(p) })).sort((a, b) => b.r.score - a.r.score),
    [data]
  );

  const counts: Record<string, number> = {};
  rows.forEach(({ r }) => { counts[r.decision] = (counts[r.decision] ?? 0) + 1; });
  const order = ["Launch now", "Order sample first", "Check Seller Central first", "Contact supplier first", "Watchlist", "Reject"];
  const toneFor = (d: string) => (d === "Launch now" ? "good" : d === "Reject" ? "bad" : d === "Watchlist" ? "neutral" : "warn");

  return (
    <section>
      <h2 className="section-title">Launch Readiness</h2>
      <p className="muted small" style={{ margin: "2px 0 14px" }}>
        One decision per product, combining product grade, supplier score, 2–3 week shipping, PPC viability, capital fit, profitability and Seller Central status.
      </p>

      <div className="lr-summary">
        {order.filter((d) => counts[d]).map((d) => (
          <div className={`lr-chip ${toneFor(d)}`} key={d}><b>{counts[d]}</b> {d}</div>
        ))}
      </div>

      <div className="table-wrap" style={{ marginTop: 14 }}>
        <table className="data-table">
          <thead><tr>
            <th>Product</th><th>Readiness</th><th>Decision</th><th>Supplier</th><th>Shipping</th><th>PPC</th><th>Blocking / next step</th>
          </tr></thead>
          <tbody>
            {rows.map(({ p, r }) => (
              <tr key={p.id} className="row-click" onClick={() => onOpen(p)}>
                <td className="cell-name"><GradeBadge grade={p.grade?.grade} size="sm" /> {p.name}</td>
                <td>
                  <div className="lr-bar"><span style={{ width: `${r.score}%`, background: r.tone === "good" ? "#34d399" : r.tone === "bad" ? "#fb7185" : "#fbbf24" }} /></div>
                  <span className="lr-score">{r.score}</span>
                </td>
                <td><span className={`mpill ${toneClass(r.tone)}`}>{r.decision}</span></td>
                <td>{r.bestSupplier ? <span className="sg" style={{ background: "rgba(91,140,245,0.14)", color: "#9cb8ff" }}>{r.bestSupplier.grade} · {r.bestSupplier.score}</span> : <span className="muted small">none</span>}</td>
                <td className="muted small">{r.bestSupplier ? `${r.bestSupplier.shipping.max ?? "?"}d · ${r.bestSupplier.shipping.status}` : "—"}</td>
                <td className="muted small">{r.parts.ppc}/100</td>
                <td className="lr-next">{r.blocking[0] ?? r.nextSteps[0] ?? r.summary}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
