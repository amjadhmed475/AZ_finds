import { useMemo, useState } from "react";
import type { Dashboard, DashProduct, Supplier } from "../lib/types";
import { verifyAndRank, type SupplierVerdict, shipColor, gradeColorS } from "../lib/supplierCheck";
import { money, pct } from "../lib/formatters";
import { GradeBadge } from "./GradeBadge";
import { Icon } from "./Icon";

type Row = { s: Supplier; v: SupplierVerdict };
type Sort = "score" | "shipping" | "landed" | "moq" | "match";

const shipLabel = (st: string) => (st === "pass" ? "≤21d ✓" : st === "borderline" ? "22–28d" : st === "fail" ? ">28d ✗" : "unknown");
const linkLabel = (l: string) => (l === "direct" ? "Direct link" : l === "search" ? "Search link only" : l === "homepage" ? "Homepage only" : "No link");

export function SupplierVerification({ data, initialId }: { data: Dashboard; initialId?: string }) {
  const withSuppliers = data.products.filter((p) => (p.suppliers?.length ?? 0) > 0);
  const [pid, setPid] = useState(initialId || withSuppliers[0]?.id || data.products[0]?.id);
  const [sort, setSort] = useState<Sort>("score");
  const product = data.products.find((p) => p.id === pid) ?? withSuppliers[0];

  const rows = useMemo<Row[]>(() => (product ? verifyAndRank(product) : []), [product]);
  const sorted = useMemo(() => {
    const c = [...rows];
    if (sort === "shipping") c.sort((a, b) => (a.v.shipping.max ?? 999) - (b.v.shipping.max ?? 999));
    else if (sort === "landed") c.sort((a, b) => a.s.estimated_landed_cost - b.s.estimated_landed_cost);
    else if (sort === "moq") c.sort((a, b) => a.s.moq - b.s.moq);
    else if (sort === "match") c.sort((a, b) => b.v.productMatch - a.v.productMatch);
    else c.sort((a, b) => Number(b.v.canBeBest) - Number(a.v.canBeBest) || b.v.score - a.v.score);
    return c;
  }, [rows, sort]);

  if (!product) return <section><h2 className="section-title">Supplier Verification</h2><div className="empty"><p className="muted">No suppliers to verify.</p></div></section>;

  const passable = rows.filter((r) => r.v.canBeBest);
  const best = passable[0] ?? rows[0];
  const fastest = [...rows].filter((r) => r.v.shipping.status !== "fail" && r.v.shipping.max != null).sort((a, b) => a.v.shipping.max! - b.v.shipping.max!)[0];
  const cheapest = [...rows].sort((a, b) => a.s.estimated_landed_cost - b.s.estimated_landed_cost)[0];
  const lowMoq = [...rows].sort((a, b) => a.s.moq - b.s.moq)[0];
  const avoid = rows.filter((r) => r.v.grade === "D" || r.s.supplier_risk === "high");

  const Rec = ({ icon, label, row, note }: { icon: string; label: string; row?: Row; note?: string }) =>
    row ? (
      <div className="rec">
        <div className="rec-top"><Icon name={icon} size={14} /> {label}</div>
        <div className="rec-name"><span className="sg" style={{ background: `${gradeColorS(row.v.grade)}22`, color: gradeColorS(row.v.grade) }}>{row.v.grade}</span> {row.s.supplier_name}</div>
        <div className="rec-note">{note ?? `${money(row.s.estimated_landed_cost)} landed · MOQ ${row.s.moq} · ${shipLabel(row.v.shipping.status)}`}</div>
      </div>
    ) : null;

  return (
    <section>
      <div className="tab-toolbar">
        <h2 className="section-title" style={{ margin: 0 }}>Supplier Verification — Wholesaler Check</h2>
        <select value={pid} onChange={(e) => setPid(e.target.value)}>
          {data.products.map((p) => <option key={p.id} value={p.id}>[{p.grade?.grade}] {p.name}</option>)}
        </select>
      </div>
      <p className="muted small" style={{ margin: "2px 0 14px" }}>
        Every supplier is scored 0–100 and graded A–D on product match, price/MOQ clarity, 2–3 week shipping, rating, age, protection and risk.
        A supplier is only “best” if it has a direct link, ≥75 match, A/B grade and pass/borderline shipping. Shipping estimates can change — confirm with the supplier before ordering.
      </p>

      <div className="rec-grid">
        <Rec icon="truck" label="Best to contact first" row={best} note={best?.v.canBeBest ? best.v.action : "No supplier passes minimum checks — verify manually"} />
        <Rec icon="bolt" label="Fastest shipping" row={fastest} note={fastest ? `${fastest.v.shipping.max}d max · ${shipLabel(fastest.v.shipping.status)}` : undefined} />
        <Rec icon="wallet" label="Lowest landed cost" row={cheapest} />
        <Rec icon="box" label="Lowest MOQ" row={lowMoq} note={lowMoq ? `MOQ ${lowMoq.s.moq} · ${money(lowMoq.s.estimated_landed_cost)} landed` : undefined} />
      </div>
      {avoid.length > 0 && <div className="info-note" style={{ marginTop: 12, background: "var(--bad-soft)", borderColor: "rgba(251,113,133,0.3)", color: "#ffb3bd" }}>Avoid: {avoid.map((r) => r.s.supplier_name).join(", ")} — weak grade or high risk.</div>}

      <div className="sv-sort">
        <span className="muted small">Sort:</span>
        {(["score", "shipping", "landed", "moq", "match"] as Sort[]).map((k) => (
          <button key={k} className={`wf-fchip${sort === k ? " active" : ""}`} onClick={() => setSort(k)}>
            {k === "score" ? "Supplier score" : k === "shipping" ? "Fastest" : k === "landed" ? "Lowest landed" : k === "moq" ? "Lowest MOQ" : "Best match"}
          </button>
        ))}
      </div>

      <div className="sv-cards">
        {sorted.map(({ s, v }) => (
          <div className={`sv-card${v.canBeBest ? " can-best" : ""}`} key={s.id}>
            <div className="sv-head">
              <span className="sg-lg" style={{ background: `${gradeColorS(v.grade)}1f`, color: gradeColorS(v.grade), borderColor: `${gradeColorS(v.grade)}55` }}>{v.grade}</span>
              <div className="sv-name">
                <b>{s.supplier_name}</b>
                <span className="muted small">{s.supplier_site} · {s.region}{v.canBeBest && <span className="best-star"> ★ passes checks</span>}</span>
              </div>
              <div className="sv-score"><span className="sv-score-v">{v.score}</span><span className="muted small">/100 · {v.status}</span></div>
            </div>
            <div className="sv-metrics">
              <span className="mpill" style={{ color: shipColor(v.shipping.status), borderColor: `${shipColor(v.shipping.status)}55` }}>{v.shipping.min ?? "?"}–{v.shipping.max ?? "?"}d · {shipLabel(v.shipping.status)}</span>
              <span className={`mpill ${v.link === "direct" ? "good" : "warn"}`}>{linkLabel(v.link)}</span>
              <span className="mpill">{money(s.estimated_landed_cost)} landed</span>
              <span className="mpill">MOQ {s.moq}</span>
              <span className="mpill">{s.supplier_rating > 0 ? `${s.supplier_rating.toFixed(1)}★` : "no rating"}</span>
              <span className="mpill">match {v.productMatch}/100</span>
            </div>
            <div className="sv-quality">{v.qualityLabel}</div>
            <div className="sv-checks">
              {v.checks.map((c) => (
                <span key={c.label} className={`chk chk-${c.state}`} title={c.label}>{c.state === "pass" ? "✓" : c.state === "fail" ? "✕" : "?"} {c.label}</span>
              ))}
            </div>
            {v.riskNotes.length > 0 && <ul className="sv-risks">{v.riskNotes.map((n, i) => <li key={i}>{n}</li>)}</ul>}
            <div className="sv-foot">
              <span className={`sv-action ${v.grade === "D" ? "bad" : v.canBeBest ? "good" : "warn"}`}>{v.action}</span>
              <a className="wf-open" href={s.direct_product_url} target="_blank" rel="noopener noreferrer">Open listing <Icon name="external" size={13} /></a>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
