import { useState } from "react";
import type { DashProduct, MarketingStrategy } from "../lib/types";
import { money, num, pct, gatingLabel, riskColor } from "../lib/formatters";
import { breakEvenAcos, targetAcos } from "../lib/ppc";
import { GradeBadge } from "./GradeBadge";
import { ProductImage } from "./ProductImage";
import { GradeBreakdown } from "./GradeBreakdown";
import { CheckIndicators } from "./CheckIndicators";
import { SupplierComparison } from "./SupplierComparison";
import { RiskPanel, ManualChecklist } from "./RiskPanel";
import { SourceCitations } from "./SourceCitations";
import { ProfitCalculator } from "./ProfitCalculator";
import { Icon } from "./Icon";
import { isWatched, toggleWatch, setState } from "../lib/watchlist";
import { decisionFor } from "../lib/decision";

const TABS = ["Overview", "Profit", "Suppliers", "PPC", "Keywords", "Risk", "Checks", "Citations"] as const;
type Tab = typeof TABS[number];

export function ProductDetail({ product, marketing }: { product: DashProduct; marketing?: MarketingStrategy }) {
  const [tab, setTab] = useState<Tab>("Overview");
  const p = product;
  const f = p.profitability;
  const risk = p.risks?.[0];
  const netBeforeAds = f.netProfit + p.estimatedSalePrice * 0.1;
  const be = breakEvenAcos(netBeforeAds, p.estimatedSalePrice);
  const tAcos = targetAcos(be, "low");
  const keywords = deriveKeywords(p.name);
  const [watched, setWatched] = useState(isWatched(p.id));
  const [, force] = useState(0);
  const dec = decisionFor(p);
  const caps = p.grade?.grade_caps_applied ?? [];
  const mark = (patch: any) => { setState(p.id, patch); force((n) => n + 1); };

  return (
    <div className="detail">
      <div className="detail-head">
        <div className="detail-img"><ProductImage image={p.image} name={p.name} fit="cover" /></div>
        <div className="detail-head-info">
          <div className="detail-title-row">
            <GradeBadge grade={p.grade?.grade} size="lg" />
            <div>
              <h2>{p.name}</h2>
              <p className="muted">{p.category} · {gatingLabel(p.gating_status)} · <span style={{ color: riskColor[p.risk_level] }}>{p.risk_level} risk</span></p>
            </div>
          </div>
          <div className="detail-tags">
            <span className="pill">Score {p.opportunity_score}</span>
            <span className="pill">Confidence: {p.grade?.confidence_label ?? "estimate-level"}</span>
            <span className="pill">{p.bucket === "needs_check" ? "Needs deeper check" : "Top opportunity"}</span>
          </div>
          {p.image && <div className="muted small detail-imgsrc">Image: {p.image.image_source_name} · {p.image.image_confidence} confidence · {p.image.attribution}</div>}
        </div>
      </div>

      <div className="detail-actions">
        <button className={`btn btn-sm${watched ? " primary" : ""}`} onClick={() => { toggleWatch(p.id); setWatched(isWatched(p.id)); }}><Icon name="star" size={14} /> {watched ? "Watchlisted" : "Add to watchlist"}</button>
        <button className="btn btn-sm" onClick={() => mark({ verified: { seller_central: true }, status: "checked" })}>Mark SC checked</button>
        <button className="btn btn-sm" onClick={() => mark({ verified: { supplier_quote: true }, status: "supplier_contacted" })}>Supplier contacted</button>
        <button className="btn btn-sm" onClick={() => mark({ verified: { sample_ordered: true }, status: "sample_ordered" })}>Sample ordered</button>
        <span className={`mpill ${dec.tone === "good" ? "good" : dec.tone === "bad" ? "bad" : dec.tone === "warn" ? "warn" : "neutral"}`} style={{ marginLeft: "auto" }}>{dec.label}</span>
      </div>

      <div className="detail-tabs">
        {TABS.map((t) => <button key={t} className={`detail-tab${tab === t ? " active" : ""}`} onClick={() => setTab(t)}>{t}</button>)}
      </div>

      {tab === "Overview" && (
        <div>
          <div className="modal-grid">
            <Stat label="Sale price" value={money(p.estimatedSalePrice)} />
            <Stat label="Landed cost" value={money(f.landedCost)} />
            <Stat label="Net profit / unit" value={money(f.netProfit)} accent={f.netProfit >= 0 ? "#16a34a" : "#dc2626"} />
            <Stat label="ROI" value={pct(f.roi)} accent="#16a34a" />
            <Stat label="Margin" value={pct(f.margin)} />
            <Stat label="Monthly sales (est)" value={num(p.estimatedMonthlySales)} />
            <Stat label="Monthly revenue (est)" value={money(p.estimatedRevenue)} />
            <Stat label="Sellers" value={String(p.seller_count)} />
            <Stat label="Trend" value={p.trend_status} />
            <Stat label="Capital fit" value={`${p.capitalFit ?? 0}/5`} />
          </div>
          <div className={`decision dec-${dec.tone}`}><Icon name="bolt" size={16} /> <b>{dec.label}</b> — {dec.reason}</div>
          {caps.length > 0 && (
            <div className="why-capped"><Icon name="info" size={15} /> <span><b>Capped at {p.grade?.grade}.</b> {caps[0].explanation} Add live data or verification (Help Center → Grade Unlock) to earn A-grade scoring.</span></div>
          )}
          <div className="detail-section"><GradeBreakdown grade={p.grade} /></div>
          <div className="grid-2 detail-whys">
            <div className="ppc-card"><h3>Why it could work</h3><p className="muted">{p.grade?.reason_summary}</p></div>
            <div className="ppc-card"><h3>Why it could fail</h3><p className="muted">{p.grade?.weakness_summary} {risk ? `Overall risk ${risk.overall_risk}.` : ""}</p></div>
          </div>
          {marketing && <div className="detail-section ppc-card"><h3>Positioning</h3><p className="muted">{marketing.positioning} Target: {marketing.target_customer}</p></div>}
        </div>
      )}

      {tab === "Profit" && (
        <div>
          <div className="modal-grid">
            <Stat label="Landed" value={money(f.landedCost)} />
            <Stat label="FBA fee" value={money(f.fbaFee)} />
            <Stat label="Referral" value={money(f.referralFee)} />
            <Stat label="Net / unit" value={money(f.netProfit)} accent="#16a34a" />
            <Stat label="ROI" value={pct(f.roi)} />
            <Stat label="Margin" value={pct(f.margin)} />
            <Stat label="Break-even price" value={money(f.breakEvenPrice)} />
          </div>
          <div className="detail-section"><ProfitCalculator initial={{ salePrice: p.estimatedSalePrice, unitCost: f.unitCost, fbaFee: f.fbaFee }} /></div>
        </div>
      )}

      {tab === "Suppliers" && <SupplierComparison suppliers={p.suppliers} />}

      {tab === "PPC" && (
        <div>
          <div className="ppc-kpis">
            <Kpi label="Break-even ACOS" value={`${be}%`} />
            <Kpi label="Target ACOS" value={`${tAcos}%`} accent="#16a34a" />
            <Kpi label="Net before ads" value={money(netBeforeAds)} />
          </div>
          <p className="muted small">Open the <b>PPC Manager</b> tab for the full campaign structure, keyword groups, negatives, weekly plan, and Ads-report optimizer for this product.</p>
          {marketing && <div className="ppc-card" style={{ marginTop: 12 }}><h3>PPC strategy</h3><p className="muted">{marketing.ppc_strategy}</p></div>}
        </div>
      )}

      {tab === "Keywords" && (
        <div className="ppc-card">
          <h3>Keyword starter (derived)</h3>
          <p className="muted small">Volumes unknown without live data. Use these as PPC seeds + listing terms.</p>
          <div className="neg-chips" style={{ marginTop: 8 }}>{keywords.map((k, i) => <span key={i} className="pill">{k}</span>)}</div>
        </div>
      )}

      {tab === "Risk" && (
        <div>
          <RiskPanel risk={risk} />
          {risk && <div className="detail-section"><h3 className="sub">Pre-order checklist (Seller Central)</h3><ManualChecklist steps={risk.manual_verification_steps} /></div>}
        </div>
      )}

      {tab === "Checks" && <CheckIndicators checks={p.checks} />}

      {tab === "Citations" && <SourceCitations citations={p.citations} />}
    </div>
  );
}

function deriveKeywords(name: string): string[] {
  const base = name.toLowerCase().replace(/\(.*?\)/g, "").trim();
  return Array.from(new Set([base, `${base} for home`, `${base} organizer`, `${base} set`, `${base} pack`])).slice(0, 6);
}
function Stat({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return <div className="modal-stat"><div className="modal-stat-value" style={accent ? { color: accent } : undefined}>{value}</div><div className="modal-stat-label">{label}</div></div>;
}
function Kpi({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return <div className="ppc-kpi"><div className="ppc-kpi-v" style={accent ? { color: accent } : undefined}>{value}</div><div className="ppc-kpi-l">{label}</div></div>;
}
