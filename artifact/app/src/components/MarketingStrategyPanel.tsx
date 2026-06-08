import { useState } from "react";
import type { MarketingStrategy } from "../lib/types";

export function MarketingStrategyPanel({ strategies }: { strategies?: MarketingStrategy[] }) {
  const list = strategies ?? [];
  const [idx, setIdx] = useState(0);
  if (!list.length) return <p className="muted">No marketing strategies in this dataset.</p>;
  const m = list[Math.min(idx, list.length - 1)];

  const rows: Array<[string, string]> = [
    ["Positioning", m.positioning],
    ["Target customer", m.target_customer],
    ["Main pain point", m.main_pain_point],
    ["Title strategy", m.title_strategy],
    ["Bullet strategy", m.bullet_strategy],
    ["Image strategy", m.image_strategy],
    ["Infographic", m.infographic_strategy],
    ["A+ content", m.a_plus_content_strategy],
    ["Pricing", m.pricing_strategy],
    ["Coupons", m.coupon_strategy],
    ["PPC", m.ppc_strategy],
    ["Organic ranking", m.organic_ranking_strategy],
    ["Differentiation", m.competitor_differentiation],
    ["Capital allocation", m.capital_allocation],
  ];

  return (
    <section>
      <div className="tab-toolbar">
        <h2 className="section-title" style={{ margin: 0 }}>Marketing strategy</h2>
        <select value={idx} onChange={(e) => setIdx(Number(e.target.value))}>
          {list.map((s, i) => <option key={s.product_candidate_id} value={i}>{s.product_name}</option>)}
        </select>
      </div>

      <div className="strategy-grid">
        {rows.map(([k, v]) => (
          <div className="strategy-cell" key={k}>
            <div className="strategy-key">{k}</div>
            <div className="strategy-val">{v}</div>
          </div>
        ))}
      </div>

      <div className="ppc-card" style={{ marginTop: 16 }}>
        <h3>Review strategy (Amazon-policy-compliant)</h3>
        <ul className="checklist">{m.review_strategy.map((s, i) => <li key={i}>{s}</li>)}</ul>
      </div>

      <div className="plan-grid">
        <Plan title="30-day plan" items={m.launch_plan_30_days} />
        <Plan title="60-day plan" items={m.launch_plan_60_days} />
        <Plan title="90-day plan" items={m.launch_plan_90_days} />
      </div>

      <div className="warn-banner" style={{ marginTop: 16 }}>
        {m.warnings.join(" ")}
      </div>
    </section>
  );
}

function Plan({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="ppc-card">
      <h3>{title}</h3>
      <ul className="checklist">{items.map((s, i) => <li key={i}>{s}</li>)}</ul>
    </div>
  );
}
