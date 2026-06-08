import { useState } from "react";
import type { Dashboard, PPCStrategy } from "../lib/types";
import { breakEvenAcos, targetAcos as calcTarget, parseCsv, optimizeRows } from "../lib/ppc";
import { money } from "../lib/formatters";

export function PpcManager({ data }: { data: Dashboard }) {
  const strat = data.ppcManager?.strategy;
  const products = data.products;
  const [productId, setProductId] = useState(data.ppcManager?.selectedProductId || products[0]?.id || "");
  const selected = products.find((p) => p.id === productId);

  // interactive inputs seeded from the product economics
  const netBeforeAds = selected ? selected.profitability.netProfit + 0 : 6;
  const [risk, setRisk] = useState<"low" | "medium" | "high">("low");
  const [monthly, setMonthly] = useState(strat?.monthly_budget ?? 450);
  const be = selected ? breakEvenAcos(selected.profitability.netProfit + selected.estimatedSalePrice * 0.1, selected.estimatedSalePrice) : (strat?.break_even_acos_percent ?? 35);
  const [tAcos, setTAcos] = useState<number>(strat?.target_acos_percent ?? calcTarget(be, risk));
  const daily = Math.round((monthly / 30) * 100) / 100;

  const [opt, setOpt] = useState<ReturnType<typeof optimizeRows> | null>(null);
  const onFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]; if (!f) return;
    f.text().then((t) => setOpt(optimizeRows(parseCsv(t), tAcos, be)));
  };

  const exportPlan = () => {
    if (!strat) return;
    const blob = new Blob([JSON.stringify({ ...strat, target_acos_percent: tAcos, monthly_budget: monthly, daily_budget: daily }, null, 2)], { type: "application/json" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "ppc-strategy.json"; a.click();
  };

  return (
    <section>
      <div className="info-note">
        This PPC plan is a starting framework. Upload a real Amazon Ads report below to tune it to your numbers. Start small and scale on results.
      </div>

      <div className="tab-toolbar">
        <h2 className="section-title" style={{ margin: 0 }}>PPC Manager</h2>
        <select value={productId} onChange={(e) => setProductId(e.target.value)}>
          {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <button className="btn primary" onClick={exportPlan} disabled={!strat}>Export PPC plan</button>
      </div>

      <div className="ppc-kpis">
        <Kpi label="Break-even ACOS" value={`${be}%`} />
        <Kpi label="Target ACOS" value={`${tAcos}%`} accent="#16a34a" />
        <Kpi label="Monthly budget" value={money(monthly)} />
        <Kpi label="Daily budget" value={money(daily)} accent="#2563eb" />
        <Kpi label="Max safe daily" value={money(data.capitalPlanner?.max_safe_daily_ad_spend ?? daily)} />
      </div>

      <div className="ppc-controls">
        <label className="calc-field"><span>Risk</span>
          <select value={risk} onChange={(e) => { const r = e.target.value as typeof risk; setRisk(r); setTAcos(calcTarget(be, r)); }}>
            <option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
          </select>
        </label>
        <label className="calc-field"><span>Target ACOS %</span><input type="number" value={tAcos} onChange={(e) => setTAcos(parseFloat(e.target.value) || 0)} /></label>
        <label className="calc-field"><span>Monthly budget $</span><input type="number" step={25} value={monthly} onChange={(e) => setMonthly(parseFloat(e.target.value) || 0)} /></label>
      </div>

      {strat ? (
        <>
          <h3 className="sub">Campaign structure</h3>
          <div className="campaign-grid">
            {strat.campaign_structure.map((c, i) => (
              <div className="ppc-card" key={i}>
                <div className="campaign-type">{c.type}</div>
                <div className="campaign-name">{c.name}</div>
                <div className="muted small">{c.goal}</div>
                <div className="campaign-stats">
                  <span>Daily {money(c.daily_budget)}</span>
                  <span>Bid {money(c.bid_range.min)}–{money(c.bid_range.max)}</span>
                </div>
                <div className="muted small">{c.notes}</div>
              </div>
            ))}
          </div>

          <div className="planner-layout">
            <div className="ppc-card">
              <h3>Keyword groups</h3>
              <table className="data-table compact">
                <thead><tr><th>Group</th><th>Match</th><th>Keywords</th></tr></thead>
                <tbody>
                  {strat.keyword_groups.map((g, i) => (
                    <tr key={i}><td>{g.group}</td><td><span className="pill">{g.match_type}</span></td><td>{g.keywords.join(", ")}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="ppc-card">
              <h3>Negative keywords</h3>
              <div className="neg-chips">{strat.negative_keywords.map((n, i) => <span className="neg-chip" key={i}>{n}</span>)}</div>
              <h3 style={{ marginTop: 14 }}>Bid strategy</h3>
              <p className="muted small">{strat.bid_strategy}</p>
            </div>
          </div>

          <div className="ppc-card">
            <h3>Weekly optimization checklist</h3>
            <ul className="checklist">{strat.optimization_rules.map((r, i) => <li key={i}>{r}</li>)}</ul>
          </div>

          <h3 className="sub">Weekly action plan</h3>
          <div className="plan-grid">
            {strat.weekly_action_plan.map((w, i) => (
              <div className="ppc-card" key={i}><h3>{w.week}</h3><ul className="checklist">{w.actions.map((a, j) => <li key={j}>{a}</li>)}</ul></div>
            ))}
          </div>
        </>
      ) : <p className="muted">No prebuilt PPC strategy in this dataset. Generate one with the <code>generate_ppc_strategy</code> tool.</p>}

      <div className="ppc-card" style={{ marginTop: 16 }}>
        <h3>Optimize from an Amazon Ads report (CSV)</h3>
        <p className="muted small">Upload a Search Term / Targeting / Campaign report. Columns like Customer Search Term, Clicks, Spend, Sales, Orders, ACOS are auto-detected.</p>
        <label className="btn primary" style={{ marginTop: 8 }}>Upload Ads report CSV<input type="file" accept=".csv" hidden onChange={onFile} /></label>
        {opt && (
          <div style={{ marginTop: 14 }}>
            {!opt.colsOk && <div className="warn-banner">Could not confidently detect search-term/spend columns. Showing best-effort parse — verify column names.</div>}
            <div className="ppc-kpis">
              <Kpi label="Wasted spend" value={money(opt.totalWasted)} accent="#dc2626" />
              <Kpi label="Pause" value={String(opt.pause.length)} />
              <Kpi label="Raise bid" value={String(opt.raise.length)} accent="#16a34a" />
              <Kpi label="Lower bid" value={String(opt.lower.length)} />
              <Kpi label="Add exact" value={String(opt.addExact.length)} />
              <Kpi label="Add negative" value={String(opt.addNegative.length)} />
            </div>
            <div className="planner-layout">
              <OptTable title="Pause (wasted spend)" rows={opt.pause} />
              <OptTable title="Raise bid (profitable)" rows={opt.raise} />
            </div>
            <div className="planner-layout">
              <OptTable title="Lower bid (over target)" rows={opt.lower} />
              <OptTable title="Add as negative" rows={opt.addNegative} />
            </div>
            {opt.addExact.length > 0 && <p className="muted small">Promote to exact: {opt.addExact.join(", ")}</p>}
          </div>
        )}
      </div>
    </section>
  );
}

function Kpi({ label, value, accent }: { label: string; value: string; accent?: string }) {
  return <div className="ppc-kpi"><div className="ppc-kpi-v" style={accent ? { color: accent } : undefined}>{value}</div><div className="ppc-kpi-l">{label}</div></div>;
}
function OptTable({ title, rows }: { title: string; rows: Array<{ term: string; reason: string }> }) {
  return (
    <div className="ppc-card">
      <h3>{title} ({rows.length})</h3>
      {rows.length === 0 ? <p className="muted small">None.</p> : (
        <table className="data-table compact"><tbody>
          {rows.map((r, i) => <tr key={i}><td>{r.term}</td><td className="muted small">{r.reason}</td></tr>)}
        </tbody></table>
      )}
    </div>
  );
}
