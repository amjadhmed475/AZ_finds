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
import { SourcingCommandCenter } from "./SourcingCommandCenter";
import { LiveDataPanel } from "./LiveDataPanel";
import { Icon } from "./Icon";
import { WholesaleFinder } from "./WholesaleFinder";
import { Watchlist } from "./Watchlist";
import { HelpCenter } from "./HelpCenter";
import { SupplierVerification } from "./SupplierVerification";
import { LaunchReadiness } from "./LaunchReadiness";
import { LogoMark } from "./LogoMark";
import { RefreshTimer } from "./RefreshTimer";
import { KpiDashboard } from "./KpiDashboard";
import { DirectorBadge } from "./DirectorBadge";
import { MaximusPanel } from "./MaximusPanel";
import { useMagnetic } from "../hooks/useMagnetic";
import { pct } from "../lib/formatters";

type Tab = "sourcing" | "overview" | "products" | "wholesale" | "details" | "suppliers" | "verify" | "live" | "ppc" | "capital" | "launch" | "watchlist" | "rejected" | "sources" | "help";

/* Individual magnetic sidebar button */
function MagNavItem({
  id, label, icon, active, onClick,
}: { id: Tab; label: string; icon: string; active: boolean; onClick: () => void }) {
  const mag = useMagnetic(0.28, 60);
  return (
    <button
      ref={mag.ref}
      className={`sb-item${active ? " active" : ""}`}
      onClick={onClick}
      onMouseMove={mag.onMouseMove}
      onMouseLeave={mag.onMouseLeave}
      onMouseDown={mag.onMouseDown}
    >
      <Icon name={icon} size={17} />
      <span className="sb-label">{label}</span>
    </button>
  );
}

export function Dashboard({ data }: { data: DashboardData }) {
  const [tab,      setTab]      = useState<Tab>("overview");
  const [selected, setSelected] = useState<DashProduct | null>(null);
  const [openTab,  setOpenTab]  = useState<string | undefined>(undefined);
  const [detailId, setDetailId] = useState<string>(data.products[0]?.id ?? "");

  const marketingFor = (id: string) => data.marketingStrategies?.find((m) => m.product_candidate_id === id);
  const open = (p: DashProduct, t?: string) => { setSelected(p); setOpenTab(t); };
  const detailProduct = data.products.find((p) => p.id === detailId) ?? data.products[0];
  const s = data.summary;

  const tabs: Array<[Tab, string, string]> = [
    ["overview",   "Overview",                   "dashboard"],
    ["sourcing",   "Sourcing",                   "target"],
    ["products",   `Products (${data.products.length})`, "grid"],
    ["wholesale",  "Wholesale Finder",            "box"],
    ["details",    "Product Details",             "list"],
    ["suppliers",  "Suppliers",                   "truck"],
    ["verify",     "Supplier Check",              "shield"],
    ["live",       "Live + Store",                "activity"],
    ["ppc",        "PPC Manager",                 "megaphone"],
    ["capital",    "Capital Planner",             "wallet"],
    ["launch",     "Launch Readiness",            "rocket"],
    ["watchlist",  "Watchlist",                   "star"],
    ["rejected",   `Rejected (${data.richRejected?.length ?? 0})`, "ban"],
    ["sources",    "Data Sources",                "database"],
    ["help",       "Help Center",                 "help"],
  ];
  const currentTitle = (tabs.find((t) => t[0] === tab)?.[1] || "Dashboard").replace(/\s*\(.*\)/, "");

  const allSuppliers = useMemo(
    () => data.products.flatMap((p) => (p.suppliers ?? []).slice(0, 2).map((sup) => ({ ...sup, _product: p.name }))),
    [data]
  );

  return (
    <div className="shell">
      <aside className="sidebar">
        <div className="sb-brand">
          <LogoMark />
          <div><div className="sb-name">AZ Finds</div><div className="sb-sub">Seller Research</div></div>
        </div>
        <nav className="sb-nav">
          {tabs.map(([id, label, icon]) => (
            <MagNavItem key={id} id={id} label={label} icon={icon} active={tab === id} onClick={() => setTab(id)} />
          ))}
        </nav>
        <RefreshTimer />
        <div className="sb-foot">
          <span className="sb-dot" /> Estimate engine
          <span className="sb-foot-sub">live sources locked</span>
        </div>
      </aside>

      <div className="shell-main">
        <header className="topbar">
          <div className="topbar-head">
            <p className="eyebrow">Amazon seller command center · by Yamari Group</p>
            <h1>{currentTitle}</h1>
          </div>
          <div className="topbar-right">
            <span className="founders-badge"><span className="fb-label">Founders</span><b>Yamari Group</b></span>
            {data.batch?.batch_date && <span className="batch-chip"><Icon name="box" size={14} /> {data.batch.batch_date}</span>}
            <span className="batch-chip"><Icon name="grid" size={14} /> {data.products.length} products</span>
            <span className="batch-chip est"><span className="sb-dot" /> estimate-level</span>
          </div>
        </header>

        <main className="content">

          {/* ── Overview ── */}
          {tab === "overview" && (
            <>
              <DirectorBadge tab="overview" data={data} />
              <KpiDashboard data={data} />
              <section style={{ marginTop: 28 }}>
                <h2 className="section-title">Detailed charts</h2>
                <ChartsGrid d={data} />
              </section>
            </>
          )}

          {/* ── Sourcing ── */}
          {tab === "sourcing" && (
            <>
              <DirectorBadge tab="sourcing" data={data} />
              <SourcingCommandCenter data={data} onOpen={open} />
            </>
          )}

          {/* ── Products ── */}
          {tab === "products" && (
            <>
              <DirectorBadge tab="products" data={data} />
              <ProductGrid data={data} onOpen={open} />
            </>
          )}

          {/* ── Wholesale ── */}
          {tab === "wholesale" && (
            <>
              <DirectorBadge tab="wholesale" data={data} />
              <WholesaleFinder data={data} onOpen={open} />
            </>
          )}

          {/* ── Details ── */}
          {tab === "details" && (
            <>
              <DirectorBadge tab="details" data={data} />
              <section>
                <div className="tab-toolbar">
                  <h2 className="section-title" style={{ margin: 0 }}>Product Details</h2>
                  <select value={detailId} onChange={(e) => setDetailId(e.target.value)}>
                    {data.products.map((p) => <option key={p.id} value={p.id}>[{p.grade?.grade}] {p.name}</option>)}
                  </select>
                </div>
                {detailProduct && <ProductDetail product={detailProduct} marketing={marketingFor(detailProduct.id)} />}
              </section>
            </>
          )}

          {/* ── Suppliers ── */}
          {tab === "suppliers" && (
            <>
              <DirectorBadge tab="suppliers" data={data} />
              <section>
                <h2 className="section-title">Supplier comparison ({allSuppliers.length})</h2>
                <p className="muted small" style={{ marginBottom: 10 }}>Top supplier matches across displayed products.</p>
                <SupplierComparison suppliers={allSuppliers as any} />
              </section>
            </>
          )}

          {tab === "verify" && (
            <>
              <DirectorBadge tab="verify" data={data} />
              <SupplierVerification data={data} />
            </>
          )}

          {tab === "live" && (
            <>
              <DirectorBadge tab="live" data={data} />
              <LiveDataPanel data={data} />
            </>
          )}

          {tab === "ppc" && (
            <>
              <DirectorBadge tab="ppc" data={data} />
              <PpcManager data={data} />
            </>
          )}

          {tab === "capital" && (
            <>
              <DirectorBadge tab="capital" data={data} />
              <CapitalPlanner seed={data.capitalPlanner} />
            </>
          )}

          {tab === "launch" && (
            <>
              <DirectorBadge tab="launch" data={data} />
              <LaunchReadiness data={data} onOpen={open} />
            </>
          )}

          {tab === "watchlist" && (
            <>
              <DirectorBadge tab="watchlist" data={data} />
              <Watchlist data={data} onOpen={open} />
            </>
          )}

          {tab === "rejected" && (
            <>
              <DirectorBadge tab="rejected" data={data} />
              <RejectedPanel rejected={data.richRejected} />
            </>
          )}

          {tab === "sources" && (
            <>
              <DirectorBadge tab="sources" data={data} />
              <ApiUsagePanel data={data} />
            </>
          )}

          {tab === "help" && (
            <>
              <DirectorBadge tab="help" data={data} />
              <HelpCenter data={data} />
            </>
          )}

          <footer className="dash-footer">
            <p className="muted small">
              {data.citations.length} citations across products. The estimate engine ranks and organizes opportunities
              but does not replace Seller Central checks, the Amazon Revenue Calculator, supplier samples, or live
              market validation. Fees and gating drift over time.
            </p>
          </footer>
        </main>
      </div>

      <ProductDetailModal
        product={selected}
        marketing={selected ? marketingFor(selected.id) : undefined}
        initialTab={openTab}
        onClose={() => setSelected(null)}
      />

      {/* JARVIS-class floating intelligence panel */}
      <MaximusPanel />
    </div>
  );
}
