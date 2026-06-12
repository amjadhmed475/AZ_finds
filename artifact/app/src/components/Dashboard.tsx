import { useEffect, useMemo, useState } from "react";
import type { Dashboard as DashboardData, DashProduct } from "../lib/types";
import { ProductGrid } from "./ProductGrid";
import { ProductDetail } from "./ProductDetail";
import { ProductDetailModal } from "./ProductDetailModal";
import { PpcManager } from "./PpcManager";
import { CapitalPlanner } from "./CapitalPlanner";
import { RejectedPanel } from "./RejectedPanel";
import { ApiUsagePanel } from "./ApiUsagePanel";
import { SourcingCommandCenter } from "./SourcingCommandCenter";
import { LiveDataPanel } from "./LiveDataPanel";
import { Icon } from "./Icon";
import { WholesaleFinder } from "./WholesaleFinder";
import { Watchlist } from "./Watchlist";
import { HelpCenter } from "./HelpCenter";
import { SupplierVerification } from "./SupplierVerification";
import { LaunchReadiness } from "./LaunchReadiness";
import { RefreshTimer } from "./RefreshTimer";
import { KpiDashboard } from "./KpiDashboard";
import { DirectorBadge } from "./DirectorBadge";
import { MaximusPanel } from "./MaximusPanel";
import { CommandPalette } from "./CommandPalette";
import { NotificationBus } from "./NotificationBus";
import { StatusBar } from "./StatusBar";
import { AlertBell } from "./AlertBell";
import { PnlWarRoom } from "./PnlWarRoom";
import { SupplierCRM } from "./SupplierCRM";
import { ApprovalQueue } from "./ApprovalQueue";
import { useAuth } from "../contexts/AuthContext";
import { TeamAvatar } from "./TeamAvatar";
import { AgentControlPanel } from "./AgentControlPanel";
import { SeoCommandCenter } from "./SeoCommandCenter";
import { MultiMarketplace } from "./MultiMarketplace";
import { LiveProductFeed } from "./LiveProductFeed";
import { ChartsGrid } from "./TrendCharts";

type Tab = "warroom" | "agent" | "seo" | "markets" | "livefeed" | "sourcing" | "overview" | "products" | "wholesale" | "details" | "suppliers" | "verify" | "live" | "ppc" | "capital" | "launch" | "watchlist" | "rejected" | "sources" | "approvals" | "help";

type NavGroup = {
  label: string;
  items: Array<[Tab, string, string]>;
};

function NavItem({ id, label, icon, active, onClick, badge }: {
  id: Tab; label: string; icon: string; active: boolean; onClick: () => void; badge?: number;
}) {
  return (
    <button className={`sb-item${active ? " active" : ""}`} onClick={onClick}>
      <Icon name={icon} size={15} />
      <span className="sb-label">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span style={{
          marginLeft: "auto", minWidth: 17, height: 17, borderRadius: 9,
          background: "var(--p-blue)", color: "#fff", fontSize: 9.5, fontWeight: 700,
          display: "flex", alignItems: "center", justifyContent: "center", padding: "0 4px",
        }}>{badge}</span>
      )}
    </button>
  );
}

export function Dashboard({ data }: { data: DashboardData }) {
  const [tab,      setTab]      = useState<Tab>("overview");
  const [selected, setSelected] = useState<DashProduct | null>(null);
  const [openTab,  setOpenTab]  = useState<string | undefined>(undefined);
  const [detailId, setDetailId] = useState<string>(data.products[0]?.id ?? "");
  const [pendingTasks, setPendingTasks] = useState(0);
  const { user, authHeader } = useAuth();

  useEffect(() => {
    const h = () => setTab("suppliers");
    window.addEventListener("navigate:suppliers", h);
    return () => window.removeEventListener("navigate:suppliers", h);
  }, []);

  useEffect(() => {
    const token = authHeader();
    if (!token["Authorization"]) return;
    const check = () => {
      fetch("/api/tasks/pending-count", { headers: token })
        .then(r => r.ok ? r.json() : { count: 0 })
        .then(d => setPendingTasks(d.count ?? 0))
        .catch(() => {});
    };
    check();
    const iv = setInterval(check, 60000);
    return () => clearInterval(iv);
  }, [authHeader]);

  const marketingFor = (id: string) => data.marketingStrategies?.find((m) => m.product_candidate_id === id);
  const open = (p: DashProduct, t?: string) => { setSelected(p); setOpenTab(t); };
  const detailProduct = data.products.find((p) => p.id === detailId) ?? data.products[0];

  const navGroups: NavGroup[] = [
    { label: "Command", items: [
      ["warroom",  "War Room",      "activity"],
      ["overview", "Overview",      "dashboard"],
    ]},
    { label: "Research", items: [
      ["livefeed",  "Live Discovery",             "bolt"],
      ["sourcing",  "Sourcing",                   "target"],
      ["products",  `Products (${data.products.length})`, "grid"],
      ["wholesale", "Wholesale Finder",            "box"],
      ["details",   "Product Details",             "list"],
      ["watchlist", "Watchlist",                   "star"],
    ]},
    { label: "Intelligence", items: [
      ["agent",  "AI Agent",      "bolt"],
      ["seo",    "SEO Engine",    "target"],
      ["ppc",    "PPC Manager",   "megaphone"],
      ["markets","Markets",       "external"],
      ["launch", "Launch",        "rocket"],
    ]},
    { label: "Operations", items: [
      ["suppliers", "Suppliers",        "truck"],
      ["verify",    "Supplier Check",   "shield"],
      ["live",      "Live + Store",     "activity"],
      ["capital",   "Capital Planner",  "wallet"],
    ]},
    { label: "Admin", items: [
      ["rejected",  `Rejected (${data.richRejected?.length ?? 0})`, "ban"],
      ["approvals", "Approvals",   "shield"],
      ["sources",   "Data Sources","database"],
      ["help",      "Help",        "help"],
    ]},
  ];

  const allTabs = navGroups.flatMap(g => g.items);
  const currentTitle = (allTabs.find(([id]) => id === tab)?.[1] ?? "Dashboard").replace(/\s*\(.*\)/, "");

  return (
    <div className="shell">
      <CommandPalette onTab={(t) => setTab(t as Tab)} />
      <NotificationBus />

      {/* ── Sidebar ── */}
      <aside className="sidebar">
        <div className="sb-brand">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            {/* Clean wordmark — no spinning rings */}
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: "var(--p-gold-bg)",
              border: "1px solid var(--p-gold-bd)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
                <path d="M12 3 L20 20 H4 Z" stroke="var(--p-gold)" strokeWidth="1.8" strokeLinejoin="round" fill="none"/>
                <path d="M9 15 L12 8 L15 15" stroke="var(--p-blue)" strokeWidth="1.3" strokeLinejoin="round" fill="none"/>
              </svg>
            </div>
            <div>
              <div className="sb-name">AZ Finds</div>
              <div className="sb-sub">Seller Intelligence</div>
            </div>
          </div>
        </div>

        <nav className="sb-nav" style={{ flex: 1, overflowY: "auto", padding: "6px 0" }}>
          {navGroups.map((group) => (
            <div key={group.label}>
              <div className="sb-group">{group.label}</div>
              {group.items.map(([id, label, icon]) => (
                <NavItem
                  key={id} id={id} label={label} icon={icon}
                  active={tab === id} onClick={() => setTab(id)}
                  badge={id === "approvals" ? pendingTasks : undefined}
                />
              ))}
            </div>
          ))}
        </nav>

        <RefreshTimer />
        <div className="sb-foot">
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <span className="sb-dot" />
            <span>Estimate engine</span>
          </div>
          <span className="sb-foot-sub">data updated live</span>
        </div>
      </aside>

      {/* ── Main area ── */}
      <div className="shell-main">
        <header className="topbar">
          <div className="topbar-head">
            <p className="eyebrow">Amazon seller command center · Yamari Group</p>
            <h1>{currentTitle}</h1>
          </div>
          <div className="topbar-right">
            {user && (
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <TeamAvatar name={user.name} color={user.avatar_color} role={user.role} size="sm" />
                <span style={{ fontSize: 12, color: "var(--p-t2)", fontWeight: 500 }}>{user.name}</span>
              </div>
            )}
            <AlertBell />
            <a
              href="https://yamarigroup.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                fontSize: 11, fontWeight: 600, color: "var(--p-gold)",
                textDecoration: "none", padding: "4px 10px",
                border: "1px solid var(--p-gold-bd)", borderRadius: "var(--p-r1)",
                background: "var(--p-gold-bg)",
              }}
            >yamarigroup.com ↗</a>
            {data.batch?.batch_date && (
              <span className="batch-chip">
                <Icon name="box" size={12} /> {data.batch.batch_date}
              </span>
            )}
            <span className="batch-chip">
              <Icon name="grid" size={12} /> {data.products.length} products
            </span>
            <span className="batch-chip est">
              <span className="sb-dot" style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--p-green)", display: "inline-block", marginRight: 4 }} />
              live
            </span>
          </div>
        </header>

        <main className="content" key={tab}>

          {tab === "warroom" && (
            <>
              <DirectorBadge tab="overview" data={data} />
              <PnlWarRoom />
            </>
          )}

          {tab === "agent" && (
            <>
              <DirectorBadge tab="overview" data={data} />
              <AgentControlPanel />
            </>
          )}

          {tab === "seo" && (
            <>
              <DirectorBadge tab="sourcing" data={data} />
              <SeoCommandCenter />
            </>
          )}

          {tab === "markets" && (
            <>
              <DirectorBadge tab="overview" data={data} />
              <MultiMarketplace />
            </>
          )}

          {tab === "livefeed" && (
            <>
              <DirectorBadge tab="products" data={data} />
              <LiveProductFeed />
            </>
          )}

          {tab === "overview" && (
            <>
              <DirectorBadge tab="overview" data={data} />
              <KpiDashboard data={data} />
              <section style={{ marginTop: 28 }}>
                <h2 className="section-title">Trend charts</h2>
                <ChartsGrid d={data} />
              </section>
            </>
          )}

          {tab === "sourcing" && (
            <>
              <DirectorBadge tab="sourcing" data={data} />
              <SourcingCommandCenter data={data} onOpen={open} />
            </>
          )}

          {tab === "products" && (
            <>
              <DirectorBadge tab="products" data={data} />
              <ProductGrid data={data} onOpen={open} />
            </>
          )}

          {tab === "wholesale" && (
            <>
              <DirectorBadge tab="wholesale" data={data} />
              <WholesaleFinder data={data} onOpen={open} />
            </>
          )}

          {tab === "details" && (
            <>
              <DirectorBadge tab="details" data={data} />
              <section>
                <div className="tab-toolbar">
                  <h2 className="section-title" style={{ margin: 0 }}>Product Details</h2>
                  <select
                    value={detailId}
                    onChange={(e) => setDetailId(e.target.value)}
                    style={{
                      background: "var(--p-card)", color: "var(--p-t1)",
                      border: "1px solid var(--p-b2)", borderRadius: "var(--p-r1)",
                      padding: "5px 10px", fontSize: 12,
                    }}
                  >
                    {data.products.map((p) => (
                      <option key={p.id} value={p.id}>[{p.grade?.grade}] {p.name}</option>
                    ))}
                  </select>
                </div>
                {detailProduct && (
                  <ProductDetail product={detailProduct} marketing={marketingFor(detailProduct.id)} />
                )}
              </section>
            </>
          )}

          {tab === "suppliers" && (
            <>
              <DirectorBadge tab="suppliers" data={data} />
              <SupplierCRM />
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

          {tab === "approvals" && (
            <>
              <DirectorBadge tab="verify" data={data} />
              <ApprovalQueue />
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
              {data.citations.length} citations across products. Estimate engine — not a replacement for
              Seller Central checks, the Amazon Revenue Calculator, or live market validation.
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

      <MaximusPanel />
      <StatusBar data={data} tab={tab} />
    </div>
  );
}
