import { useState } from "react";
import type { DashProduct, MarketingStrategy } from "../lib/types";
import { money, num, pct, gatingLabel, riskColor } from "../lib/formatters";
import { breakEvenAcos, targetAcos } from "../lib/ppc";
import { ppcDecisionFor } from "../lib/ppcDecision";
import { GradeBadge } from "./GradeBadge";
import { ProductImage } from "./ProductImage";
import { GradeBreakdown } from "./GradeBreakdown";
import { CheckIndicators } from "./CheckIndicators";
import { SupplierComparison } from "./SupplierComparison";
import { RiskPanel, ManualChecklist } from "./RiskPanel";
import { SourceCitations } from "./SourceCitations";
import { ProfitCalculator } from "./ProfitCalculator";
import { Icon } from "./Icon";
import { amazonUrl, heliumStats, validatedSource } from "../lib/amazon";
import { isWatched, toggleWatch, setState } from "../lib/watchlist";
import { decisionFor } from "../lib/decision";

const TABS = ["Overview", "Profit", "Suppliers", "PPC", "Keywords", "Risk", "Checks", "Citations"] as const;
type Tab = typeof TABS[number];

export function ProductDetail({ product, marketing, initialTab }: { product: DashProduct; marketing?: MarketingStrategy; initialTab?: string }) {
  const [tab, setTab] = useState<Tab>((TABS as readonly string[]).includes(initialTab ?? "") ? (initialTab as Tab) : "Overview");
  const p = product;
  const f = p.profitability;
  const risk = p.risks?.[0];
  const best = p.suppliers?.[0];
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
        <a className="btn btn-sm primary" href={amazonUrl(p)} target="_blank" rel="noopener noreferrer"><Icon name="external" size={13} /> View on Amazon</a>
        {best && <a className="btn btn-sm" href={best.direct_product_url} target="_blank" rel="noopener noreferrer" title={`${best.supplier_name} — ${best.lead_time}`}><Icon name="truck" size={13} /> Best supplier ↗</a>}
        <button className="btn btn-sm" onClick={() => setTab("Suppliers")}><Icon name="grid" size={13} /> All suppliers ({p.suppliers?.length ?? 0})</button>
        <span className={`mpill ${dec.tone === "good" ? "good" : dec.tone === "bad" ? "bad" : dec.tone === "warn" ? "warn" : "neutral"}`} style={{ marginLeft: "auto" }}>{dec.label}</span>
      </div>

      <div className="detail-tabs">
        {TABS.map((t) => <button key={t} className={`detail-tab${tab === t ? " active" : ""}`} onClick={() => setTab(t)}>{t}</button>)}
      </div>

      {tab === "Overview" && (
        <div>
          <div className="hx-head"><span className="hx-title">Product stats</span>{validatedSource(p) ? <span className="conf-pill live">✓ Live validated · {validatedSource(p)}</span> : <span className="muted small">estimate-level · connect Keepa/retailerapi for live</span>}</div>
          <div className="helium-grid">
            {heliumStats(p).map((st) => (
              <div className="hstat" key={st.label}>
                <div className="hstat-label">{st.label}</div>
                <div className={`hstat-value${st.mono ? " mono" : ""}`} style={st.tone === "good" ? { color: "#34d399" } : st.tone === "warn" ? { color: "#fbbf24" } : st.tone === "bad" ? { color: "#fb7185" } : undefined}>{st.value}</div>
              </div>
            ))}
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
          <div className="price-verify">
            <Icon name="info" size={15} />
            <span><b>These are estimates, not live data.</b> The {money(p.estimatedSalePrice)} price is modelled (no Keepa connected) — look up the real Amazon price, type it below, and ROI/margin update instantly and save. FBA fee already covers Amazon's outbound shipping; switch to FBM if you ship it yourself (adds ~$5.99).</span>
            <a className="btn btn-sm" href={`https://www.amazon.com/s?k=${encodeURIComponent(p.name)}`} target="_blank" rel="noopener noreferrer">Check real price <Icon name="external" size={13} /></a>
          </div>
          <div className="detail-section"><ProfitCalculator productId={p.id} initial={{ salePrice: p.estimatedSalePrice, unitCost: f.unitCost, fbaFee: f.fbaFee }} /></div>
        </div>
      )}

      {tab === "Suppliers" && <SupplierComparison suppliers={p.suppliers} />}

      {tab === "PPC" && (
        <div>
          {(() => {
            const ppc = ppcDecisionFor(p);
            const tone = ppc.grade === "A" ? "good" : ppc.grade === "B" ? "neutral" : ppc.grade === "C" ? "warn" : "bad";
            return (
              <div className={`decision dec-${tone}`} style={{ marginTop: 0 }}>
                <Icon name="megaphone" size={16} /> <b>PPC {ppc.grade} · {ppc.score}/100 — {ppc.decision}.</b>&nbsp;
                Break-even ACOS {ppc.breakEvenAcos}% · target {ppc.targetAcos.moderate}% · max CPC {money(ppc.maxCpc)} · needs ~{ppc.requiredCvr}% conversion · test budget {money(ppc.minTestBudget)} (≈{money(ppc.dailyBudget)}/day).
              </div>
            );
          })()}
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
