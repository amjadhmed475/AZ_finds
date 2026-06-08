import { useState } from "react";
import { computeProfit, type ProfitInputs } from "../lib/scoring";
import { money, pct } from "../lib/formatters";

const FIELDS: Array<[keyof ProfitInputs, string, number]> = [
  ["salePrice", "Sale price ($)", 0.5],
  ["unitCost", "Unit cost ($)", 0.1],
  ["inbound", "Inbound ship/unit ($)", 0.1],
  ["shippingPerUnit", "Outbound ship/unit ($)", 0.1],
  ["fbaFee", "FBA fee ($)", 0.1],
  ["referralPct", "Referral fee (%)", 1],
  ["prepCost", "Prep cost ($)", 0.05],
  ["packagingCost", "Packaging ($)", 0.05],
  ["storage", "Storage ($)", 0.05],
  ["returnPct", "Return rate (%)", 1],
  ["adPct", "Ad cost (%)", 1],
];

export function ProfitCalculator({ initial }: { initial?: Partial<ProfitInputs> }) {
  const [v, setV] = useState<ProfitInputs>({
    salePrice: 18.99, unitCost: 3.2, shippingPerUnit: 0, fbaFee: 3.65, referralPct: 15,
    prepCost: 0.2, packagingCost: 0.3, storage: 0.1, returnPct: 3, adPct: 10, inbound: 0.6,
    ...initial,
  });
  const r = computeProfit(v);
  const profitColor = r.net >= 0 ? "#16a34a" : "#dc2626";

  return (
    <div className="calc">
      <div className="calc-inputs">
        {FIELDS.map(([key, label, step]) => (
          <label key={key} className="calc-field">
            <span>{label}</span>
            <input
              type="number" step={step} value={v[key]}
              onChange={(e) => setV({ ...v, [key]: parseFloat(e.target.value) || 0 })}
            />
          </label>
        ))}
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
