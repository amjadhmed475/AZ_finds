import { useMemo, useState } from "react";
import type { Dashboard as DashboardData, DashProduct } from "../lib/types";
import { SummaryCard } from "./ProductScoreCard";
import { ChartsGrid } from "./TrendCharts";
import { ProductGrid } from "./ProductGrid";
import { ProductDetail } from "./ProductDetail";
import { ProductDetailModal } from "./ProductDetailModal";
import { PpcManager } from "./PpcManager";
import { CapitalPlanner } from "./CapitalPlanner";
import { RejectedPanel } from "./RejectedPanel";
import { ApiUsagePanel } from "./ApiUsagePanel";
import { BatchHeader } from "./BatchHeader";
import { SupplierComparison } from "./SupplierComparison";
import { pct } from "../lib/formatters";

type Tab = "overview" | "products" | "details" | "suppliers" | "ppc" | "capital" | "rejected" | "sources";

export function Dashboard({ data }: { data: DashboardData }) {
  const [tab, setTab] = useState<Tab>("overview");
  const [selected, setSelected] = useState<DashProduct | null>(null);
  const [detailId, setDetailId] = useState<string>(data.products[0]?.id ?? "");

  const marketingFor = (id: string) => data.marketingStrategies?.find((m) => m.product_candidate_id === id);
  const open = (p: DashProduct) => setSelected(p);
  const detailProduct = data.products.find((p) => p.id === detailId) ?? data.products[0];

  const s = data.summary;
  const tabs: Array<[Tab, string]> = [
    ["overview", "Overview"],
    ["products", `Products (${data.products.length})`],
    ["details", "Product Details"],
    ["suppliers", "Suppliers"],
    ["ppc", "PPC Manager"],
    ["capital", "Capital Planner"],
    ["rejected", `Rejected (${data.richRejected?.length ?? 0})`],
    ["sources", "Data Sources"],
  ];

  const allSuppliers = useMemo(
    () => data.products.flatMap((p) => (p.suppliers ?? []).slice(0, 2).map((sup) => ({ ...sup, _product: p.name }))),
    [data]
  );

  return (
    <div className="dash">
      <header className="dash-header">
        <div>
          <h1>Amazon Product Research</h1>
          <p className="muted">A5–D1 graded opportunities. Estimate-level confidence — verify in Seller Central.</p>
        </div>
      </header>

      <nav className="dash-tabs">
        {tabs.map(([id, label]) => (
          <button key={id} className={`dash-tab${tab === id ? " active" : ""}`} onClick={() => setTab(id)}>{label}</button>
        ))}
      </nav>

      {tab === "overview" && (
        <>
          <BatchHeader data={data} />
          <section className="summary-grid" style={{ marginTop: 16 }}>
            <SummaryCard label="Displayed" value={data.products.length} />
            <SummaryCard label="Best score" value={s.bestScore} accent="#16a34a" />
            <SummaryCard label="Highest ROI" value={pct(s.highestRoi)} accent="#16a34a" />
            <SummaryCard label="Avg margin" value={pct(s.averageMargin)} />
            <SummaryCard label="Likely ungated" value={s.likelyUngatedCount} accent="#2563eb" />
            <SummaryCard label="Rejected" value={data.richRejected?.length ?? 0} accent="#dc2626" />
          </section>
          <section><h2 className="section-title">Visual analysis</h2><ChartsGrid d={data} /></section>
        </>
      )}

      {tab === "products" && <ProductGrid data={data} onOpen={open} />}

      {tab === "details" && (
        <section>
          <div className="tab-toolbar">
            <h2 className="section-title" style={{ margin: 0 }}>Product Details</h2>
            <select value={detailId} onChange={(e) => setDetailId(e.target.value)}>
              {data.products.map((p) => <option key={p.id} value={p.id}>[{p.grade?.grade}] {p.name}</option>)}
            </select>
          </div>
          {detailProduct && <ProductDetail product={detailProduct} marketing={marketingFor(detailProduct.id)} />}
        </section>
      )}

      {tab === "suppliers" && (
        <section>
          <h2 className="section-title">Supplier comparison ({allSuppliers.length})</h2>
          <p className="muted small" style={{ marginBottom: 10 }}>Top supplier matches across displayed products. Open a product for its full supplier table.</p>
          <SupplierComparison suppliers={allSuppliers as any} />
        </section>
      )}

      {tab === "ppc" && <PpcManager data={data} />}
      {tab === "capital" && <CapitalPlanner seed={data.capitalPlanner} />}
      {tab === "rejected" && <RejectedPanel rejected={data.richRejected} />}
      {tab === "sources" && <ApiUsagePanel data={data} />}

      <footer className="dash-footer">
        <p className="muted small">
          {data.citations.length} citations across products. The estimate engine ranks and organizes opportunities but does not replace
          Seller Central checks, the Amazon Revenue Calculator, supplier samples, or live market validation. Fees and gating drift over time.
        </p>
      </footer>

      <ProductDetailModal product={selected} marketing={selected ? marketingFor(selected.id) : undefined} onClose={() => setSelected(null)} />
    </div>
  );
}
