import type { DashProduct } from "../lib/types";
import { money, pct, riskColor, gatingLabel } from "../lib/formatters";
import { amazonUrl } from "../lib/amazon";
import { GradeBadge } from "./GradeBadge";
import { ProductImage } from "./ProductImage";

const k = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}k` : String(n));

const CHK_ICON: Record<string, string> = { pass: "✓", fail: "✕", pending: "•" };

export function ProductCard({ product, onOpen }: { product: DashProduct; onOpen: (p: DashProduct) => void }) {
  const p = product;
  const f = p.profitability;
  const best = p.suppliers?.[0];
  const keyChecks = (p.checks ?? []).filter((c) =>
    /restricted|supplier|profit|roi|image/i.test(c.label)
  ).slice(0, 5);

  return (
    <div className="product-card" onClick={() => onOpen(p)} role="button" tabIndex={0}
      onKeyDown={(e) => { if (e.key === "Enter") onOpen(p); }}>
      <div className="pc-img">
        <ProductImage image={p.image} name={p.name} fit="cover" />
        <span className="pc-grade"><GradeBadge grade={p.grade?.grade} size="md" /></span>
        {p.bucket === "needs_check" && <span className="pc-bucket">Needs check</span>}
      </div>
      <div className="pc-body">
        <div className="pc-name">{p.name}</div>
        <div className="pc-cat muted small">{p.category}</div>
        <div className="pc-metrics">
          <Metric label="Score" value={String(p.opportunity_score)} />
          <Metric label="ROI" value={pct(f.roi)} color="#059669" />
          <Metric label="Margin" value={pct(f.margin)} />
          <Metric label="Profit" value={money(f.netProfit)} color={f.netProfit >= 0 ? "#059669" : "#e11d48"} />
        </div>
        <div className="pc-stats">
          <span><b>{k(p.estimatedMonthlySales)}</b> sales/mo</span>
          <span><b>{money(p.estimatedRevenue)}</b>/mo</span>
          {p.bsr != null && <span>BSR <b>#{k(p.bsr)}</b></span>}
          <span><b>{k(p.reviewCount)}</b> rev{p.reviewRating > 0 ? ` · ${p.reviewRating.toFixed(1)}★` : ""}</span>
        </div>
        <div className="pc-foot">
          <span className={`mpill ${p.risk_level === "low" ? "good" : p.risk_level === "medium" ? "warn" : "bad"}`}>
            <span className="dot" style={{ background: riskColor[p.risk_level] }} /> {p.risk_level} risk
          </span>
          <span className="conf-pill">{p.grade?.confidence_label ?? "estimate-level"}</span>
        </div>
        <div className="pc-foot">
          <span className="mpill neutral">{gatingLabel(p.gating_status)}</span>
          <span className="muted small">{best ? `${money(best.estimated_landed_cost)} landed` : ""}</span>
        </div>
        <div className="pc-supplier muted small">{best ? `Best: ${best.supplier_name}` : "No supplier match"}</div>
        <div className="pc-checks">
          {keyChecks.map((c, i) => <span key={i} className={`pc-chk ${c.state}`} title={`${c.label}: ${c.state}`}>{CHK_ICON[c.state]}</span>)}
        </div>
        <div className="pc-actions">
          <button className="btn btn-sm primary pc-view" onClick={(e) => { e.stopPropagation(); onOpen(p); }}>View details →</button>
          <a className="btn btn-sm pc-amz" href={amazonUrl(p)} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()} title="Open on Amazon">Amazon ↗</a>
        </div>
      </div>
    </div>
  );
}

function Metric({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="pc-metric">
      <div className="pc-metric-v" style={color ? { color } : undefined}>{value}</div>
      <div className="pc-metric-l">{label}</div>
    </div>
  );
}
