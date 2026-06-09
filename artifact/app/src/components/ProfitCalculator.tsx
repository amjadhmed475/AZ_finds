import { useState } from "react";
import { computeProfit, type ProfitInputs } from "../lib/scoring";
import { money, pct } from "../lib/formatters";

type Mode = "FBA" | "FBM";

const FIELDS: Array<[keyof ProfitInputs, string, number]> = [
  ["salePrice", "Real Amazon price ($)", 0.5],
  ["unitCost", "Unit cost ($)", 0.1],
  ["inbound", "Inbound freight/unit ($)", 0.1],
  ["shippingPerUnit", "Ship to customer ($)", 0.1],
  ["fbaFee", "FBA fee ($)", 0.1],
  ["referralPct", "Referral fee (%)", 1],
  ["prepCost", "Prep cost ($)", 0.05],
  ["packagingCost", "Packaging ($)", 0.05],
  ["storage", "Storage ($)", 0.05],
  ["returnPct", "Return rate (%)", 1],
  ["adPct", "Ad cost (%)", 1],
];

const KEY = (id: string) => `azf_calc_${id}`;

export function ProfitCalculator({ initial, productId }: { initial?: Partial<ProfitInputs>; productId?: string }) {
  const [mode, setMode] = useState<Mode>("FBA");
  const [saved, setSaved] = useState(false);
  const [v, setV] = useState<ProfitInputs>(() => {
    const base: ProfitInputs = {
      salePrice: 18.99, unitCost: 3.2, shippingPerUnit: 0, fbaFee: 3.65, referralPct: 15,
      prepCost: 0.2, packagingCost: 0.3, storage: 0.1, returnPct: 3, adPct: 10, inbound: 0.6,
      ...initial,
    };
    if (productId) { try { const s = localStorage.getItem(KEY(productId)); if (s) { setTimeout(() => setSaved(true), 0); return { ...base, ...JSON.parse(s) }; } } catch { /* ignore */ } }
    return base;
  });
  const baseFba = initial?.fbaFee ?? 3.65;

  const update = (next: ProfitInputs) => {
    setV(next);
    if (productId) { try { localStorage.setItem(KEY(productId), JSON.stringify(next)); setSaved(true); } catch { /* ignore */ } }
  };
  const reset = () => {
    if (productId) { try { localStorage.removeItem(KEY(productId)); } catch { /* ignore */ } }
    setV({ salePrice: 18.99, unitCost: 3.2, shippingPerUnit: 0, fbaFee: 3.65, referralPct: 15, prepCost: 0.2, packagingCost: 0.3, storage: 0.1, returnPct: 3, adPct: 10, inbound: 0.6, ...initial });
    setSaved(false);
  };

  const setMode2 = (m: Mode) => {
    setMode(m);
    // FBA: Amazon's fee covers outbound shipping. FBM: you ship it (~$5.99), no FBA fee.
    if (m === "FBM") update({ ...v, fbaFee: 0, shippingPerUnit: v.shippingPerUnit > 0 ? v.shippingPerUnit : 5.99 });
    else update({ ...v, fbaFee: baseFba, shippingPerUnit: 0 });
  };

  const r = computeProfit(v);
  const profitColor = r.net >= 0 ? "#34d399" : "#fb7185";

  return (
    <div className="calc">
      <div className="calc-inputs">
        <div className="calc-mode">
          <span className="calc-mode-label">Fulfillment</span>
          <div className="seg">
            <button className={mode === "FBA" ? "on" : ""} onClick={() => setMode2("FBA")}>FBA</button>
            <button className={mode === "FBM" ? "on" : ""} onClick={() => setMode2("FBM")}>FBM</button>
          </div>
          <span className="muted small calc-mode-hint">
            {mode === "FBA" ? "FBA fee already includes Amazon outbound shipping." : "You ship it — outbound shipping (~$5.99) added, no FBA fee."}
          </span>
        </div>
        {FIELDS.filter(([k]) => (mode === "FBA" ? k !== "shippingPerUnit" : k !== "fbaFee")).map(([key, label, step]) => (
          <label key={key} className="calc-field">
            <span>{label}</span>
            <input type="number" step={step} value={v[key]}
              onChange={(e) => update({ ...v, [key]: parseFloat(e.target.value) || 0 })} />
          </label>
        ))}
        {productId && (
          <div className="calc-saved">
            {saved ? <span className="calc-saved-on">✓ Your numbers are saved for this product</span> : <span className="muted small">Edit any field — your real numbers save automatically.</span>}
            {saved && <button className="calc-reset" onClick={reset}>Reset to estimate</button>}
          </div>
        )}
      </div>
      <div className="calc-output">
        <Out label="Net profit / unit" value={money(r.net)} color={profitColor} big />
        <Out label="ROI" value={pct(r.roi)} color={profitColor} big />
        <Out label="Margin" value={pct(r.margin)} color={profitColor} big />
        <Out label="Break-even price" value={money(r.breakEven)} />
        <Out label="Max buy cost" value={money(r.maxBuy)} />
        <Out label="Total cost" value={money(r.total)} />
        <Out label="Referral fee" value={money(r.referral)} />
        <Out label="Landed cost" value={money(r.landed)} />
      </div>
    </div>
  );
}

function Out({ label, value, color, big }: { label: string; value: string; color?: string; big?: boolean }) {
  return (
    <div className={`calc-out${big ? " big" : ""}`}>
      <div className="calc-out-value" style={color ? { color } : undefined}>{value}</div>
      <div className="calc-out-label">{label}</div>
    </div>
  );
}
