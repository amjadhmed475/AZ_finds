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
import { AgentNetwork } from "./AgentNetwork";
import { FbmCommandCenter } from "./FbmCommandCenter";
import { BuyBoxTracker } from "./BuyBoxTracker";
import { AccountHealthMonitor } from "./AccountHealthMonitor";
import { OrderOpsHub } from "./OrderOpsHub";
import { ChineseSupplierFinder } from "./ChineseSupplierFinder";

type Tab = "warroom" | "agent" | "seo" | "markets" | "livefeed" | "sourcing" | "overview" | "products" | "wholesale" | "china" | "details" | "suppliers" | "verify" | "live" | "ppc" | "capital" | "launch" | "watchlist" | "rejected" | "sources" | "approvals" | "help" | "fbm" | "buybox" | "orders" | "health";

type NavGroup = { label: string; items: Array<[Tab, string, string]> };

/* ── Mobile bottom nav ──────────────────────────────────── */
function MobileNav({ tab, navigate }: { tab: Tab; navigate: (t: Tab) => void }) {
  const items: Array<[Tab, string, string]> = [
    ["overview", "Home",      "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10"],
    ["products", "Products",  "M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z"],
    ["fbm",      "FBM",       "M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"],
    ["warroom",  "War Room",  "M22 12h-4l-3 9L9 3l-3 9H2"],
    ["china",    "Suppliers", "M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z M12 10a1 1 0 100-2 1 1 0 000 2z"],
  ];
  return (
    <nav className="mobile-bottom-nav">
      {items.map(([id, label, path]) => (
        <button
          key={id}
          className={`mnav-item${tab === id ? " active" : ""}`}
          onClick={() => navigate(id)}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            {path.split("M").filter(Boolean).map((p, i) => <path key={i} d={`M${p}`} />)}
          </svg>
          <span>{label}</span>
        </button>
      ))}
    </nav>
  );
}

/* ── Hamburger icon ─────────────────────────────────────── */
function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <rect
        x="2" y={open ? "7.3" : "3"} width="12" height="1.4" rx="0.7"
        fill="currentColor"
        style={{ transition: "transform 0.22s, y 0.22s", transformOrigin: "8px 8px", transform: open ? "rotate(45deg)" : "none" }}
      />
      <rect
        x="2" y="7.3" width="12" height="1.4" rx="0.7"
        fill="currentColor"
        style={{ transition: "opacity 0.18s", opacity: open ? 0 : 1 }}
      />
      <rect
        x="2" y={open ? "7.3" : "11.6"} width="12" height="1.4" rx="0.7"
        fill="currentColor"
        style={{ transition: "transform 0.22s, y 0.22s", transformOrigin: "8px 8px", transform: open ? "rotate(-45deg)" : "none" }}
      />
    </svg>
  );
}

/* ── Single nav item ────────────────────────────────────── */
function NavItem({ id, label, icon, active, onClick, badge, collapsed }: {
  id: Tab; label: string; icon: string; active: boolean;
  onClick: () => void; badge?: number; collapsed: boolean;
}) {
  return (
    <button
      className={`sb-item${active ? " active" : ""}${collapsed ? " sb-item--icon" : ""}`}
      onClick={onClick}
      title={collapsed ? label : undefined}
    >
      <Icon name={icon} size={15} />
      {!collapsed && <span className="sb-label">{label}</span>}
      {!collapsed && badge !== undefined && badge > 0 && (
        <span className="sb-badge">{badge}</span>
      )}
    </button>
  );
}

export function Dashboard({ data }: { data: DashboardData }) {
  const [tab,         setTab]         = useState<Tab>("overview");
  const [selected,    setSelected]    = useState<DashProduct | null>(null);
  const [openTab,     setOpenTab]     = useState<string | undefined>(undefined);
  const [detailId,    setDetailId]    = useState<string>(data.products[0]?.id ?? "");
  const [pendingTasks,setPendingTasks]= useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);

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

  const marketingFor = (id: string) =>
    data.marketingStrategies?.find(m => m.product_candidate_id === id);
  const open = (p: DashProduct, t?: string) => { setSelected(p); setOpenTab(t); };
  const detailProduct = data.products.find(p => p.id === detailId) ?? data.products[0];

  const navGroups: NavGroup[] = [
    { label: "Command", items: [
      ["warroom",  "War Room",  "activity"],
      ["overview", "Overview",  "dashboard"],
    ]},
    { label: "Research", items: [
      ["livefeed",  "Live Discovery",            "bolt"],
      ["sourcing",  "Sourcing",                  "target"],
      ["products",  `Products (${data.products.length})`, "grid"],
      ["wholesale", "Wholesale Finder",           "box"],
      ["china",     "Chinese Suppliers",          "search"],
      ["details",   "Product Details",            "list"],
      ["watchlist", "Watchlist",                  "star"],
    ]},
    { label: "Intelligence", items: [
      ["agent",   "AI Agent",       "bolt"],
      ["seo",     "SEO Engine",     "target"],
      ["ppc",     "PPC Manager",    "megaphone"],
      ["markets", "Markets",        "external"],
      ["launch",  "Launch",         "rocket"],
    ]},
    { label: "FBM Seller", items: [
      ["fbm",    "FBM Center",     "target"],
      ["buybox", "Buy Box",        "activity"],
      ["orders", "Order Ops",      "truck"],
      ["health", "Account Health", "shield"],
    ]},
    { label: "Operations", items: [
      ["suppliers", "Suppliers",       "truck"],
      ["verify",    "Supplier Check",  "shield"],
      ["live",      "Live + Store",    "activity"],
      ["capital",   "Capital Planner", "wallet"],
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

  const navigate = (id: Tab) => { setTab(id); setSidebarOpen(false); };

  return (
    <div className="shell">
      <CommandPalette onTab={t => setTab(t as Tab)} />
      <NotificationBus />

      {/* ── Backdrop ────────────────────────────────── */}
      <div
        className={`sidebar-backdrop${sidebarOpen ? " sidebar-backdrop--open" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />

      {/* ── Sidebar overlay drawer ──────────────────── */}
      <aside className={`sidebar${sidebarOpen ? " sidebar--open" : ""}`}>
        {/* Brand + close */}
        <div className="sb-brand">
          <div className="sb-logo-icon">
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none">
              <path d="M12 3 L20 20 H4 Z" stroke="var(--p-gold)" strokeWidth="1.8" strokeLinejoin="round"/>
              <path d="M9 15 L12 8 L15 15" stroke="var(--p-blue)" strokeWidth="1.3" strokeLinejoin="round"/>
            </svg>
          </div>
          <div className="sb-brand-text">
            <div className="sb-name">AZ Finds</div>
            <div className="sb-sub">Seller Intelligence</div>
          </div>
          <button
            className="sb-close"
            onClick={() => setSidebarOpen(false)}
            title="Close navigation"
          >
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M1 1L11 11M11 1L1 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        {/* Nav groups */}
        <nav className="sb-nav">
          {navGroups.map(group => (
            <div key={group.label} className="sb-group-block">
              <div className="sb-group">{group.label}</div>
              {group.items.map(([id, label, icon]) => (
                <NavItem
                  key={id} id={id} label={label} icon={icon}
                  active={tab === id} onClick={() => navigate(id)}
                  badge={id === "approvals" ? pendingTasks : undefined}
                  collapsed={false}
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

      {/* ── Main content ─────────────────────────────── */}
      <div className="shell-main">
        <header className="topbar">
          <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
            {/* Hamburger — always visible in topbar */}
            <button
              className="topbar-ham"
              onClick={() => setSidebarOpen(v => !v)}
              title="Open navigation"
            >
              <HamburgerIcon open={sidebarOpen} />
            </button>
            <div className="topbar-head">
              <p className="eyebrow">Amazon seller command center · Yamari Group</p>
              <h1>{currentTitle}</h1>
            </div>
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
              className="topbar-link"
            >yamarigroup.com ↗</a>
            {data.batch?.batch_date && (
              <span className="batch-chip"><Icon name="box" size={12} /> {data.batch.batch_date}</span>
            )}
            <span className="batch-chip"><Icon name="grid" size={12} /> {data.products.length} products</span>
            <span className="batch-chip est">
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: "var(--p-green)", display: "inline-block", marginRight: 4, flexShrink: 0 }} />
              live
            </span>
          </div>
        </header>

        <main className="content" key={tab}>

          {tab === "warroom" && <><DirectorBadge tab="overview" data={data} /><PnlWarRoom /></>}
          {tab === "agent"   && <><DirectorBadge tab="overview" data={data} /><AgentControlPanel /></>}
          {tab === "seo"     && <><DirectorBadge tab="sourcing" data={data} /><SeoCommandCenter /></>}
          {tab === "markets" && <><DirectorBadge tab="overview" data={data} /><MultiMarketplace /></>}
          {tab === "livefeed"&& <><DirectorBadge tab="products" data={data} /><LiveProductFeed /></>}

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

          {tab === "sourcing"  && <><DirectorBadge tab="sourcing"  data={data} /><SourcingCommandCenter data={data} onOpen={open} /></>}
          {tab === "products"  && <><DirectorBadge tab="products"  data={data} /><ProductGrid data={data} onOpen={open} /></>}
          {tab === "wholesale" && <><DirectorBadge tab="wholesale" data={data} /><WholesaleFinder data={data} onOpen={open} /></>}
          {tab === "china"    && <><DirectorBadge tab="sourcing"  data={data} /><ChineseSupplierFinder data={data} /></>}

          {tab === "details" && (
            <>
              <DirectorBadge tab="details" data={data} />
              <section>
                <div className="tab-toolbar">
                  <h2 className="section-title" style={{ margin: 0 }}>Product Details</h2>
                  <select value={detailId} onChange={e => setDetailId(e.target.value)} className="p-select">
                    {data.products.map(p => (
                      <option key={p.id} value={p.id}>[{p.grade?.grade}] {p.name}</option>
                    ))}
                  </select>
                </div>
                {detailProduct && <ProductDetail product={detailProduct} marketing={marketingFor(detailProduct.id)} />}
              </section>
            </>
          )}

          {tab === "fbm"     && <><DirectorBadge tab="overview"  data={data} /><FbmCommandCenter data={data} /></>}
          {tab === "buybox"  && <><DirectorBadge tab="overview"  data={data} /><BuyBoxTracker data={data} /></>}
          {tab === "orders"  && <><DirectorBadge tab="overview"  data={data} /><OrderOpsHub /></>}
          {tab === "health"  && <><DirectorBadge tab="overview"  data={data} /><AccountHealthMonitor /></>}

          {tab === "suppliers" && <><DirectorBadge tab="suppliers" data={data} /><SupplierCRM /></>}
          {tab === "verify"    && <><DirectorBadge tab="verify"    data={data} /><SupplierVerification data={data} /></>}
          {tab === "live"      && <><DirectorBadge tab="live"      data={data} /><LiveDataPanel data={data} /></>}
          {tab === "ppc"       && <><DirectorBadge tab="ppc"       data={data} /><PpcManager data={data} /></>}
          {tab === "capital"   && <><DirectorBadge tab="capital"   data={data} /><CapitalPlanner seed={data.capitalPlanner} /></>}
          {tab === "launch"    && <><DirectorBadge tab="launch"    data={data} /><LaunchReadiness data={data} onOpen={open} /></>}
          {tab === "watchlist" && <><DirectorBadge tab="watchlist" data={data} /><Watchlist data={data} onOpen={open} /></>}
          {tab === "rejected"  && <><DirectorBadge tab="rejected"  data={data} /><RejectedPanel rejected={data.richRejected} /></>}
          {tab === "sources"   && <><DirectorBadge tab="sources"   data={data} /><ApiUsagePanel data={data} /></>}
          {tab === "approvals" && <><DirectorBadge tab="verify"    data={data} /><ApprovalQueue /></>}
          {tab === "help"      && <><DirectorBadge tab="help"      data={data} /><HelpCenter data={data} /></>}

          <footer className="dash-footer">
            <p className="muted small">
              {data.citations.length} citations across products. Estimate engine — not a replacement for
              Seller Central checks, Amazon Revenue Calculator, or live market validation.
            </p>
          </footer>
        </main>
      </div>

      {/* ── Right: Agent Network Rail ─────────────── */}
      <aside className="agent-rail">
        <AgentNetwork />
      </aside>

      <ProductDetailModal
        product={selected}
        marketing={selected ? marketingFor(selected.id) : undefined}
        initialTab={openTab}
        onClose={() => setSelected(null)}
      />

      <MaximusPanel />
      <StatusBar data={data} tab={tab} />
      <MobileNav tab={tab} navigate={navigate} />
    </div>
  );
}
