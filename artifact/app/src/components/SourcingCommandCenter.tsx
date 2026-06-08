import { useMemo } from "react";
import type { Dashboard, DashProduct, Supplier } from "../lib/types";
import { money, pct, riskColor } from "../lib/formatters";
import { GradeBadge } from "./GradeBadge";

interface SupplierRow extends Supplier {
  product: DashProduct;
  sourcingScore: number;
  action: string;
}

const sourcingScore = (product: DashProduct, supplier: Supplier): number => {
  const landedFit = Math.max(0, 24 - supplier.estimated_landed_cost * 2.2);
  const riskPenalty = supplier.supplier_risk === "high" ? 20 : supplier.supplier_risk === "medium" ? 8 : 0;
  const moqPenalty = supplier.moq > 250 ? 10 : supplier.moq > 100 ? 5 : 0;
  const privateLabelBonus = supplier.customization_available ? 4 : 0;
  return Math.round(
    product.opportunity_score * 0.34 +
      product.profitability.roi * 0.08 +
      supplier.match_quality_score * 0.32 +
      landedFit +
      privateLabelBonus -
      riskPenalty -
      moqPenalty,
  );
};

const nextAction = (row: SupplierRow): string => {
  if (row.supplier_risk === "high") return "Hold for manual supplier review";
  if (row.match_quality_score >= 78 && row.estimated_landed_cost <= row.product.profitability.landedCost * 1.08) {
    return "Request quote + spec sheet";
  }
  if (row.moq <= 12) return "Order sample";
  return "Compare against 2 alternates";
};

export function SourcingCommandCenter({ data, onOpen }: { data: Dashboard; onOpen: (p: DashProduct) => void }) {
  const rows = useMemo<SupplierRow[]>(() => {
    return data.products
      .flatMap((product) =>
        (product.suppliers ?? []).map((supplier) => {
          const row = {
            ...supplier,
            product,
            sourcingScore: sourcingScore(product, supplier),
            action: "",
          };
          row.action = nextAction(row);
          return row;
        }),
      )
      .sort((a, b) => b.sourcingScore - a.sourcingScore || a.estimated_landed_cost - b.estimated_landed_cost);
  }, [data.products]);

  const bestByProduct = useMemo(
    () =>
      data.products
        .map((product) => rows.find((row) => row.product.id === product.id))
        .filter((row): row is SupplierRow => Boolean(row))
        .sort((a, b) => b.sourcingScore - a.sourcingScore),
    [data.products, rows],
  );

  const lowRisk = rows.filter((row) => row.supplier_risk === "low").length;
  const sampleReady = rows.filter((row) => row.moq <= 12).length;
  const privateLabel = rows.filter((row) => row.customization_available).length;
  const avgLanded = rows.length ? rows.reduce((sum, row) => sum + row.estimated_landed_cost, 0) / rows.length : 0;
  const bestScore = rows[0]?.sourcingScore ?? 0;
  const topProducts = bestByProduct.slice(0, 5);

  return (
    <section className="sourcing-shell">
      <div className="sourcing-hero">
        <div>
          <p className="eyebrow">Sourcing first</p>
          <h2>Find the product you can actually buy, land, and defend.</h2>
          <p className="muted">
            Ranked by supplier match quality, landed cost, MOQ, lead time, product ROI, risk, and private-label potential.
          </p>
        </div>
        <div className="sourcing-hero-card">
          <span>Best sourcing score</span>
          <strong>{bestScore}</strong>
          <small>{rows[0] ? `${rows[0].product.name} via ${rows[0].supplier_name}` : "No supplier matches yet"}</small>
        </div>
      </div>

      <div className="sourcing-kpis">
        <Kpi label="Supplier matches" value={rows.length.toLocaleString()} />
        <Kpi label="Low-risk sources" value={lowRisk.toLocaleString()} tone="good" />
        <Kpi label="Sample-ready" value={sampleReady.toLocaleString()} tone="warn" />
        <Kpi label="Private label" value={privateLabel.toLocaleString()} />
        <Kpi label="Avg landed" value={money(avgLanded)} />
      </div>

      <div className="sourcing-layout">
        <div className="source-queue">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Priority queue</p>
              <h3>Top products to source now</h3>
            </div>
            <span className="source-pill">ranked by buyability</span>
          </div>
          {topProducts.map((row, index) => (
            <button className="source-priority" key={row.id} onClick={() => onOpen(row.product)}>
              <span className="source-rank">{index + 1}</span>
              <span className="source-main">
                <span className="source-title">
                  <GradeBadge grade={row.product.grade?.grade} size="sm" />
                  <strong>{row.product.name}</strong>
                </span>
                <span className="source-meta">
                  {row.supplier_name} · MOQ {row.moq} · {row.lead_time} · {money(row.estimated_landed_cost)} landed
                </span>
              </span>
              <span className="source-score">{row.sourcingScore}</span>
            </button>
          ))}
        </div>

        <div className="source-playbook">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Before buying inventory</p>
              <h3>Verification playbook</h3>
            </div>
          </div>
          <ul className="playbook-list">
            <li>Open at least three supplier links and confirm exact dimensions, materials, packaging, and variant.</li>
            <li>Ask for DDP landed quote, sample cost, production photos, carton dimensions, and inspection terms.</li>
            <li>Run Seller Central restriction check before paying for samples or photography.</li>
            <li>Compare the sample against top Amazon review complaints and product-page images.</li>
            <li>Only scale after supplier docs, first sample, fee math, and PPC break-even all agree.</li>
          </ul>
        </div>
      </div>

      <div className="table-wrap sourcing-table-wrap">
        <table className="data-table compact sourcing-table">
          <thead>
            <tr>
              <th>Priority</th>
              <th>Product</th>
              <th>Supplier</th>
              <th>Landed</th>
              <th>MOQ</th>
              <th>Lead time</th>
              <th>Match</th>
              <th>ROI</th>
              <th>Risk</th>
              <th>Next action</th>
            </tr>
          </thead>
          <tbody>
            {rows.slice(0, 18).map((row) => (
              <tr key={`${row.product.id}-${row.id}`}>
                <td><b>{row.sourcingScore}</b></td>
                <td className="cell-name">
                  <button className="link-button" onClick={() => onOpen(row.product)}>{row.product.name}</button>
                  <span className="muted small">{row.product.category}</span>
                </td>
                <td>
                  <a href={row.direct_product_url} target="_blank" rel="noopener noreferrer">{row.supplier_name}</a>
                  {row.customization_available && <span className="tag">private label</span>}
                </td>
                <td>{money(row.estimated_landed_cost)}</td>
                <td>{row.moq}</td>
                <td>{row.lead_time}</td>
                <td>
                  <div className="match-bar"><span style={{ width: `${row.match_quality_score}%` }} /></div>
                  <span className="muted">{row.match_quality_score}</span>
                </td>
                <td>{pct(row.product.profitability.roi)}</td>
                <td><span className="dot" style={{ background: riskColor[row.supplier_risk] }} /> {row.supplier_risk}</td>
                <td>{row.action}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function Kpi({ label, value, tone }: { label: string; value: string; tone?: "good" | "warn" }) {
  return (
    <div className={`source-kpi ${tone ?? ""}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
