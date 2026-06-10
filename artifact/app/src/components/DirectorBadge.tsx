import type { Dashboard } from "../lib/types";

type Tab =
  | "sourcing" | "overview" | "products" | "wholesale" | "details"
  | "suppliers" | "verify" | "live" | "ppc" | "capital" | "launch"
  | "watchlist" | "rejected" | "sources" | "help";

interface DirectorInfo {
  name:    string;
  title:   string;
  dept:    string;
  color:   string;
  status:  string;
  mission: string;
}

const DIRECTORS: Record<Tab, DirectorInfo> = {
  overview:  { name: "ARIA",     color: "#f5a524", title: "Chief Executive Officer",       dept: "Executive Command",       status: "Monitoring",  mission: "Full-spectrum opportunity assessment" },
  sourcing:  { name: "ATLAS",    color: "#5b8cf5", title: "Director of Sourcing",          dept: "Supply Chain Command",    status: "Scanning",    mission: "Identify and qualify supplier paths" },
  products:  { name: "SCOUT",    color: "#34d399", title: "Director of Research",          dept: "Product Intelligence",    status: "Active",      mission: "Surface the highest-ROI opportunities" },
  wholesale: { name: "MERIDIAN", color: "#f471b5", title: "Director of Trade Intelligence",dept: "Wholesale Division",      status: "Connected",   mission: "Direct supplier access and negotiation" },
  details:   { name: "NEXUS",    color: "#a78bfa", title: "Director of Deep Analysis",     dept: "Intelligence Division",   status: "Analyzing",   mission: "Full product-level breakdown and scoring" },
  suppliers: { name: "FORGE",    color: "#fb923c", title: "Director of Supplier Relations",dept: "Supplier Command",        status: "Vetting",     mission: "Qualify supplier quality, cost, and risk" },
  verify:    { name: "SENTINEL", color: "#22c55e", title: "Director of Compliance",        dept: "Trust & Verification",    status: "Auditing",    mission: "Trust signals, legitimacy, red-flag detection" },
  live:      { name: "PULSE",    color: "#ec4899", title: "Director of Real-Time Ops",     dept: "Live Operations",         status: "Live",        mission: "Keepa, RetailerAPI, and store data feeds" },
  ppc:       { name: "APEX",     color: "#eab308", title: "Director of Growth Marketing",  dept: "Growth Division",         status: "Optimizing",  mission: "PPC structure, bids, and keyword strategy" },
  capital:   { name: "VAULT",    color: "#10b981", title: "Director of Finance",           dept: "Capital Command",         status: "Calculating", mission: "Capital allocation, scenarios, ROI projections" },
  launch:    { name: "IGNITE",   color: "#f97316", title: "Director of Launch Operations", dept: "Launch Division",         status: "Ready",       mission: "Pre-launch checklist and go-to-market plan" },
  watchlist: { name: "ORACLE",   color: "#8b5cf6", title: "Director of Strategic Watch",   dept: "Strategic Intelligence",  status: "Watching",    mission: "Track, compare, and decide on saved products" },
  rejected:  { name: "SHIELD",   color: "#ef4444", title: "Director of Risk Management",   dept: "Risk Division",           status: "Flagged",     mission: "Document and learn from rejected opportunities" },
  sources:   { name: "MATRIX",   color: "#06b6d4", title: "Director of Data Architecture", dept: "Data Command",            status: "Routing",     mission: "API usage, cache status, source health" },
  help:      { name: "SAGE",     color: "#84cc16", title: "Director of Knowledge",         dept: "Knowledge Base",          status: "Available",   mission: "Guides, glossary, and integration docs" },
};

interface Props {
  tab:  Tab;
  data: Dashboard;
}

function statForTab(tab: Tab, data: Dashboard): string {
  const s = data.summary;
  switch (tab) {
    case "overview":  return `${s.productsScanned} scanned · ${s.productsPassed} passed`;
    case "products":  return `${data.products.length} products loaded`;
    case "sourcing":  return `${s.likelyUngatedCount} ungated opportunities`;
    case "suppliers": return `${data.products.reduce((n, p) => n + (p.suppliers?.length ?? 0), 0)} supplier matches`;
    case "ppc":       return `${data.products.length} products eligible`;
    case "rejected":  return `${data.richRejected?.length ?? 0} rejected`;
    case "watchlist": return "Saved to local storage";
    case "live":      return data.apiUsage?.data_mode ?? "estimate mode";
    default:          return `Batch ${data.batch?.batch_date ?? "—"}`;
  }
}

export function DirectorBadge({ tab, data }: Props) {
  const d = DIRECTORS[tab];
  if (!d) return null;

  return (
    <div className="director-badge" style={{ "--dir-color": d.color } as React.CSSProperties}>
      <div className="dir-avatar">
        <svg viewBox="0 0 40 40" fill="none">
          <polygon points="20,4 36,13 36,27 20,36 4,27 4,13" fill={d.color} fillOpacity="0.18" stroke={d.color} strokeWidth="1.5" />
          <text x="20" y="25" textAnchor="middle" fill={d.color} fontSize="11" fontWeight="900" fontFamily="Manrope,sans-serif">
            {d.name.slice(0, 2)}
          </text>
        </svg>
      </div>
      <div className="dir-info">
        <div className="dir-name">{d.name}</div>
        <div className="dir-title">{d.title}</div>
        <div className="dir-dept">{d.dept}</div>
      </div>
      <div className="dir-right">
        <div className="dir-status">
          <span className="dir-status-dot" />
          {d.status}
        </div>
        <div className="dir-stat">{statForTab(tab, data)}</div>
      </div>
      <div className="dir-mission">{d.mission}</div>
    </div>
  );
}
