import { useMemo } from "react";
import type { Dashboard, DashProduct } from "../lib/types";
import { money, pct } from "../lib/formatters";
import { GradeBadge } from "./GradeBadge";
import { Icon } from "./Icon";

const beAcos = (p: DashProduct) => {
  const price = p.estimatedSalePrice || 0;
  if (price <= 0) return 0;
  return ((p.profitability.netProfit + price * 0.1) / price) * 100;
};

export function Widgets({ data, onOpen }: { data: Dashboard; onOpen: (p: DashProduct) => void }) {
  const w = useMemo(() => {
    const ps = data.products;
    const byScore = [...ps].sort((a, b) => b.opportunity_score - a.opportunity_score);
    const byRoi = [...ps].sort((a, b) => b.profitability.roi - a.profitability.roi);
    const byMargin = [...ps].sort((a, b) => b.profitability.margin - a.profitability.margin);
    const lowRisk = byScore.filter((p) => p.risk_level === "low");
    const bySupplier = [...ps].sort((a, b) => (b.suppliers?.[0]?.match_quality_score ?? 0) - (a.suppliers?.[0]?.match_quality_score ?? 0));
    const byPpc = [...ps].sort((a, b) => beAcos(b) - beAcos(a));
    const byCapital = [...ps].sort((a, b) => (b.capitalFit ?? 0) - (a.capitalFit ?? 0));
    const landedVals = ps.map((p) => p.suppliers?.[0]?.estimated_landed_cost).filter((x): x is number => x != null);
    const profitPotential = ps.reduce((s, p) => s + Math.max(0, p.profitability.netProfit) * (p.estimatedMonthlySales || 0), 0);

    const rej = data.richRejected ?? [];
    const blockedRestricted = rej.filter((r) => r.rejected_by_rule === "restricted_category");
    const reasonCounts: Record<string, number> = {};
    for (const r of rej) reasonCounts[r.rejected_by_rule] = (reasonCounts[r.rejected_by_rule] ?? 0) + 1;
    const topReason = Object.entries(reasonCounts).sort((a, b) => b[1] - a[1])[0]?.[0]?.replace(/_/g, " ");

    const risks = ps.map((p) => p.risks?.[0]).filter(Boolean) as any[];
    const cnt = (f: (r: any, p: DashProduct) => boolean) => ps.filter((p) => f(p.risks?.[0] ?? {}, p)).length;

    return {
      best: byScore[0], roi: byRoi[0], margin: byMargin[0], lowRisk: lowRisk[0],
      supplier: bySupplier[0], ppc: byPpc[0], capital: byCapital[0],
      profitPotential,
      bestLanded: landedVals.length ? Math.min(...landedVals) : 0,
      needSC: ps.filter((p) => p.gating_status !== "likely ungated").length,
      needSample: ps.length,
      needImage: ps.filter((p) => p.image?.fallback_used || (p.image?.image_type || "").includes("placeholder")).length,
      restrictedPassed: ps.length,
      restrictedBlocked: blockedRestricted.length,
      topReason,
      ppcHealthy: ps.filter((p) => beAcos(p) >= 25).length,
      ppcWeak: ps.filter((p) => beAcos(p) < 15).length,
      riskRadar: {
        restricted: blockedRestricted.length,
        ip: cnt((r) => r.IP_risk === "high" || r.trademark_risk === "high"),
        hazmat: cnt((r) => r.hazmat_risk === "high"),
        lowMargin: ps.filter((p) => p.profitability.margin < 20).length,
        noSupplier: ps.filter((p) => !(p.suppliers?.length)).length,
        poorDemand: ps.filter((p) => p.estimatedMonthlySales < 200).length,
        oversized: cnt((r) => r.fragile_risk === "high") + rej.filter((r) => r.rejected_by_rule === "oversize").length,
      },
      supplierSites: 14,
      newMatches: ps.reduce((s, p) => s + (p.suppliers?.length ?? 0), 0),
      _risks: risks,
    };
  }, [data]);

  const Best = ({ icon, label, p, metric }: { icon: string; label: string; p?: DashProduct; metric: string }) =>
    p ? (
      <button className="wd wd-best" onClick={() => onOpen(p)}>
        <div className="wd-top"><span className="wd-ic"><Icon name={icon} size={16} /></span><span className="wd-label">{label}</span></div>
        <div className="wd-best-row"><GradeBadge grade={p.grade?.grade} size="sm" /><span className="wd-best-name">{p.name}</span></div>
        <div className="wd-best-metric">{metric}</div>
      </button>
    ) : null;

  const Stat = ({ icon, label, value, sub, accent }: { icon: string; label: string; value: string | number; sub?: string; accent?: string }) => (
    <div className="wd wd-stat">
      <div className="wd-top"><span className="wd-ic"><Icon name={icon} size={16} /></span><span className="wd-label">{label}</span></div>
      <div className="wd-value" style={accent ? { color: accent } : undefined}>{value}</div>
      {sub && <div className="wd-sub">{sub}</div>}
    </div>
  );

  return (
    <div className="widgets">
      {/* hero KPI row */}
      <div className="wd-row">
        <Stat icon="bolt" label="Profit potential / mo" value={money(w.profitPotential)} sub="sum of net × est. monthly sales" accent="#34d399" />
        <Stat icon="wallet" label="Launch capital needed" value={money(data.capitalPlanner?.inventory_budget ?? 0)} sub={`${data.capitalPlanner?.estimated_units_to_order ?? 0} units · top product`} />
        <Stat icon="box" label="Best landed cost" value={money(w.bestLanded)} sub="cheapest supplier in batch" />
        <Stat icon="database" label="API calls saved" value={data.apiUsage?.estimated_calls_saved ?? 0} sub={`${data.apiUsage?.api_calls_used_today ?? 0} used today`} accent="#5b8cf5" />
      </div>

      {/* best-product widgets */}
      <div className="wd-row wd-row-4">
        <Best icon="target" label="Today's best product" p={w.best} metric={`Score ${w.best?.opportunity_score} · ${pct(w.best?.profitability.roi ?? 0)} ROI`} />
        <Best icon="activity" label="Highest ROI" p={w.roi} metric={`${pct(w.roi?.profitability.roi ?? 0)} ROI · ${money(w.roi?.profitability.netProfit ?? 0)} net`} />
        <Best icon="grid" label="Best margin" p={w.margin} metric={`${pct(w.margin?.profitability.margin ?? 0)} margin`} />
        <Best icon="ban" label="Best low-risk" p={w.lowRisk} metric={w.lowRisk ? `low risk · score ${w.lowRisk.opportunity_score}` : "—"} />
        <Best icon="truck" label="Best supplier match" p={w.supplier} metric={`${w.supplier?.suppliers?.[0]?.match_quality_score ?? 0}/100 · ${w.supplier?.suppliers?.[0]?.supplier_name ?? ""}`} />
        <Best icon="megaphone" label="Best PPC-ready" p={w.ppc} metric={`${Math.round(beAcos(w.ppc!))}% break-even ACOS`} />
        <Best icon="wallet" label="Best capital fit" p={w.capital} metric={`${w.capital?.capitalFit ?? 0}/5 capital fit`} />
        <Stat icon="list" label="Watchlist / to-do" value={`${w.needSC} need SC check`} sub={`${w.needSample} need sample · ${w.needImage} need image`} accent="#fbbf24" />
      </div>

      {/* panels: grade unlock, risk radar, restricted shield, sourcing pulse, ppc readiness, today's actions */}
      <div className="wd-panels">
        <GradeUnlock />
        <RestrictedShield passed={w.restrictedPassed} blocked={w.restrictedBlocked} reason={w.topReason} />
        <RiskRadar r={w.riskRadar} />
        <SourcingPulse sites={w.supplierSites} matches={w.newMatches} landed={w.bestLanded} />
        <PpcReadiness healthy={w.ppcHealthy} weak={w.ppcWeak} total={data.products.length} />
        <TodaysActions />
      </div>
    </div>
  );
}

function Panel({ title, icon, children, accent }: { title: string; icon: string; children: React.ReactNode; accent?: string }) {
  return (
    <div className="wd-panel">
      <div className="wd-panel-head"><span className="wd-ic" style={accent ? { color: accent, background: `${accent}22` } : undefined}><Icon name={icon} size={15} /></span>{title}</div>
      {children}
    </div>
  );
}

function GradeUnlock() {
  const steps = [
    "Add Keepa price/rank data",
    "Add search/browser source validation",
    "Confirm a supplier product-page match",
    "Run a Seller Central listing check",
    "Verify fees in the Revenue Calculator",
    "Upload a supplier quote/invoice",
    "Confirm the product image source",
  ];
  return (
    <Panel title="Grade Unlock" icon="bolt" accent="#f5a524">
      <div className="gu-mode"><span className="gu-tier">Estimate-level</span><span className="gu-arrow">→ max grade</span><GradeBadge grade={"B3"} size="sm" /></div>
      <div className="gu-tiers">
        <span className="gu-chip">Estimate → B3</span>
        <span className="gu-chip">Hybrid → A2</span>
        <span className="gu-chip">Live → A5</span>
        <span className="gu-chip">User-verified → A5</span>
      </div>
      <p className="muted small" style={{ margin: "8px 0 6px" }}>To let products earn A-grades, add higher-confidence data:</p>
      <ul className="gu-list">{steps.map((s, i) => <li key={i}><span className="gu-dot" />{s}</li>)}</ul>
    </Panel>
  );
}

function RestrictedShield({ passed, blocked, reason }: { passed: number; blocked: number; reason?: string }) {
  return (
    <Panel title="Restricted Category Shield" icon="ban" accent="#fb7185">
      <div className="rr-grid">
        <div className="rr-cell"><div className="rr-v" style={{ color: "#34d399" }}>{passed}</div><div className="rr-l">passed</div></div>
        <div className="rr-cell"><div className="rr-v" style={{ color: "#fb7185" }}>{blocked}</div><div className="rr-l">blocked</div></div>
        <div className="rr-cell"><div className="rr-v" style={{ fontSize: 13 }}>{reason || "—"}</div><div className="rr-l">top reason</div></div>
      </div>
      <p className="muted small" style={{ marginTop: 8 }}>Supplements, food, batteries, hazmat, weapons, CBD, adult & FDA/EPA-regulated items are hard-rejected before scoring.</p>
    </Panel>
  );
}

function RiskRadar({ r }: { r: Record<string, number> }) {
  const items: Array<[string, number, string]> = [
    ["Restricted", r.restricted, "#fb7185"], ["IP / trademark", r.ip, "#fbbf24"], ["Hazmat", r.hazmat, "#fb7185"],
    ["Low margin", r.lowMargin, "#fbbf24"], ["No supplier", r.noSupplier, "#fb7185"], ["Poor demand", r.poorDemand, "#fbbf24"], ["Oversized", r.oversized, "#fbbf24"],
  ];
  return (
    <Panel title="Risk Radar" icon="activity" accent="#fbbf24">
      <div className="radar">{items.map(([l, v, c]) => (
        <div className="radar-row" key={l}><span>{l}</span><span className="radar-bar"><span style={{ width: `${Math.min(100, v * 12)}%`, background: c }} /></span><b>{v}</b></div>
      ))}</div>
    </Panel>
  );
}

function SourcingPulse({ sites, matches, landed }: { sites: number; matches: number; landed: number }) {
  return (
    <Panel title="Sourcing Pulse" icon="truck" accent="#5b8cf5">
      <div className="rr-grid">
        <div className="rr-cell"><div className="rr-v">{sites}</div><div className="rr-l">sites available</div></div>
        <div className="rr-cell"><div className="rr-v">{matches}</div><div className="rr-l">supplier matches</div></div>
        <div className="rr-cell"><div className="rr-v">{money(landed)}</div><div className="rr-l">best landed</div></div>
      </div>
      <p className="muted small" style={{ marginTop: 8 }}>Use the Wholesale Finder to search Alibaba, AliExpress, Global Sources, Faire, Tundra, IndiaMART, Uline and more.</p>
    </Panel>
  );
}

function PpcReadiness({ healthy, weak, total }: { healthy: number; weak: number; total: number }) {
  return (
    <Panel title="PPC Readiness" icon="megaphone" accent="#a78bfa">
      <div className="rr-grid">
        <div className="rr-cell"><div className="rr-v" style={{ color: "#34d399" }}>{healthy}</div><div className="rr-l">healthy ACOS room</div></div>
        <div className="rr-cell"><div className="rr-v" style={{ color: "#fb7185" }}>{weak}</div><div className="rr-l">weak PPC tolerance</div></div>
        <div className="rr-cell"><div className="rr-v">{total}</div><div className="rr-l">total products</div></div>
      </div>
      <p className="muted small" style={{ marginTop: 8 }}>“Healthy” = break-even ACOS ≥ 25%, leaving room for ads. Open PPC Manager for the full plan.</p>
    </Panel>
  );
}

function TodaysActions() {
  const actions = [
    "Check your top 5 products in Seller Central",
    "Verify fees in the Amazon Revenue Calculator",
    "Contact the top supplier for a quote",
    "Order a sample of your best product",
    "Review the PPC budget & break-even ACOS",
    "Export the batch (XLSX / CSV)",
    "Refresh the sourcing scan",
  ];
  return (
    <Panel title="Today's Actions" icon="list" accent="#34d399">
      <ul className="actions">{actions.map((a, i) => <li key={i}><span className="act-num">{i + 1}</span>{a}</li>)}</ul>
    </Panel>
  );
}
