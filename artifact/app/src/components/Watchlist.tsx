import { useState } from "react";
import type { Dashboard, DashProduct } from "../lib/types";
import { getWatchlist, toggleWatch, getState, setState } from "../lib/watchlist";
import { money, pct } from "../lib/formatters";
import { GradeBadge } from "./GradeBadge";
import { ProductImage } from "./ProductImage";
import { decisionFor } from "../lib/decision";

export function Watchlist({ data, onOpen }: { data: Dashboard; onOpen: (p: DashProduct) => void }) {
  const [ids, setIds] = useState<string[]>(getWatchlist());
  const [, force] = useState(0);
  const items = ids.map((id) => data.products.find((p) => p.id === id)).filter(Boolean) as DashProduct[];

  if (!items.length) {
    return (
      <section>
        <h2 className="section-title">Watchlist</h2>
        <div className="empty">
          <p className="muted">No saved products yet. Open any product and tap <b>Add to watchlist</b> to track it here — with notes, supplier responses, and next actions.</p>
        </div>
      </section>
    );
  }

  return (
    <section>
      <h2 className="section-title">Watchlist ({items.length})</h2>
      <div className="wl-grid">
        {items.map((p) => {
          const st = getState(p.id);
          const dec = decisionFor(p);
          return (
            <div className="wl-card" key={p.id}>
              <div className="wl-img" onClick={() => onOpen(p)}><ProductImage image={p.image} name={p.name} fit="cover" /></div>
              <div className="wl-body">
                <div className="wl-head"><GradeBadge grade={p.grade?.grade} size="sm" /><b className="wl-name" onClick={() => onOpen(p)}>{p.name}</b></div>
                <div className="wl-metrics">
                  <span className="mpill good">{pct(p.profitability.roi)} ROI</span>
                  <span className="mpill">{pct(p.profitability.margin)} margin</span>
                  <span className="mpill good">{money(p.profitability.netProfit)} net</span>
                </div>
                <div className={`wl-dec dec-${dec.tone}`}>{dec.label}</div>
                <textarea className="wl-notes" placeholder="Notes: Seller Central result, supplier reply, sample price, MOQ negotiated, follow-up date…"
                  defaultValue={st.notes}
                  onBlur={(e) => setState(p.id, { notes: e.target.value })} />
                <button className="btn btn-sm" onClick={() => { setIds(toggleWatch(p.id)); force((n) => n + 1); }}>Remove</button>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
