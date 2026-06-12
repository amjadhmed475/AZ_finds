import { useState, useEffect } from "react";
import { useSwipe } from "../hooks/useSwipe";
import { AlertBell } from "./AlertBell";
import { MobileProductList } from "./MobileProductList";
import { MaximusPanel } from "./MaximusPanel";
import type { Dashboard } from "../lib/types";

interface Props { data: Dashboard; }

type Tab = "home" | "products" | "alerts" | "suppliers" | "maximus";

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: "home",      label: "Home",      icon: "🏠" },
  { id: "products",  label: "Products",  icon: "⊞" },
  { id: "alerts",    label: "Alerts",    icon: "🔔" },
  { id: "suppliers", label: "Suppliers", icon: "🚚" },
  { id: "maximus",   label: "MAXIMUS",   icon: "M" },
];

interface DayPnl {
  revenue: number;
  ad_spend: number;
  net_profit: number;
  revenue_trend?: number;
  profit_trend?: number;
}

function TrendBadge({ pct }: { pct?: number }) {
  if (pct === undefined) return null;
  const up = pct >= 0;
  return (
    <span style={{ fontSize: 13, fontWeight: 600, color: up ? "#10b981" : "#ef4444", marginLeft: 6 }}>
      {up ? "↑" : "↓"}{Math.abs(pct).toFixed(1)}%
    </span>
  );
}

function InlineAlertList() {
  const [alerts, setAlerts] = useState<Array<{ id: string; severity: string; category: string; title: string; body: string; read: boolean; created_at: string }>>([]);

  useEffect(() => {
    fetch("/api/alerts")
      .then(r => r.ok ? r.json() : { alerts: [] })
      .then(d => setAlerts(d.alerts ?? []))
      .catch(() => {});
  }, []);

  const SEVERITY_COLOR: Record<string, string> = { critical: "#ef4444", warning: "#f59e0b", info: "#3b82f6" };
  const CAT_ICON: Record<string, string> = { inventory: "📦", ppc: "📢", competitor: "⚔️", listing: "📋", opportunity: "💡" };

  if (alerts.length === 0) {
    return (
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--u-muted)", fontSize: 14 }}>
        No alerts — all systems nominal
      </div>
    );
  }

  return (
    <div style={{ flex: 1, overflowY: "auto" }}>
      {alerts.map(a => {
        const color = SEVERITY_COLOR[a.severity] ?? "#3b82f6";
        return (
          <div key={a.id} style={{
            padding: "14px 16px", borderBottom: "1px solid var(--u-border)",
            borderLeft: `3px solid ${color}`,
            background: a.read ? "transparent" : "var(--u-glass)",
          }}>
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <span style={{ fontSize: 16 }}>{CAT_ICON[a.category] ?? "🔔"}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: "var(--u-text)" }}>{a.title}</div>
                <div style={{ fontSize: 12, color: "var(--u-muted)", marginTop: 2, lineHeight: 1.4 }}>{a.body}</div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export function MobileWarRoom({ data }: Props) {
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [pnl, setPnl] = useState<DayPnl | null>(null);
  const [ticker, setTicker] = useState("Loading market data...");

  useEffect(() => {
    fetch("/api/pnl?days=1")
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d) setPnl(d); })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const msgs = [
      `${data.summary.productsScanned} products scanned · ${data.summary.productsPassed} passed`,
      `Best score: ${data.summary.bestScore}/100 · Avg margin: ${data.summary.averageMargin?.toFixed(1)}%`,
      `Ungated: ${data.summary.likelyUngatedCount} · Manual check: ${data.summary.manualCheckRequiredCount}`,
    ];
    let i = 0;
    setTicker(msgs[0]);
    const iv = setInterval(() => { i = (i + 1) % msgs.length; setTicker(msgs[i]); }, 4000);
    return () => clearInterval(iv);
  }, [data]);

  const tabIndex = TABS.findIndex(t => t.id === activeTab);
  const swipeHandlers = useSwipe(
    () => { const next = TABS[tabIndex + 1]; if (next) setActiveTab(next.id); },
    () => { const prev = TABS[tabIndex - 1]; if (prev) setActiveTab(prev.id); },
  );

  // MAXIMUS is fullscreen overlay
  if (activeTab === "maximus") {
    return (
      <div style={{ position: "fixed", inset: 0, zIndex: 500, background: "var(--u-void)", display: "flex", flexDirection: "column" }}>
        <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--u-border)", display: "flex", alignItems: "center", gap: 12 }}>
          <button onClick={() => setActiveTab("home")} style={{ background: "none", border: "none", color: "var(--u-muted)", fontSize: 20, cursor: "pointer", lineHeight: 1 }}>←</button>
          <span style={{ fontSize: 15, fontWeight: 700, color: "var(--u-neon-violet)" }}>MAXIMUS</span>
        </div>
        <div style={{ flex: 1, overflow: "hidden" }}>
          <MaximusPanel />
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ display: "flex", flexDirection: "column", height: "100dvh", background: "var(--u-void)", overflow: "hidden" }}
      {...swipeHandlers}
    >
      {/* Topbar */}
      <div style={{
        height: 48, display: "flex", alignItems: "center", padding: "0 16px",
        borderBottom: "1px solid var(--u-border)", background: "var(--u-deep)",
        justifyContent: "space-between", flexShrink: 0,
      }}>
        <div style={{ fontSize: 16, fontWeight: 800, color: "var(--u-neon-gold)", letterSpacing: "-0.01em" }}>AZ Finds</div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            onClick={() => setActiveTab("maximus")}
            style={{
              padding: "4px 10px", background: "var(--u-neon-violet)", color: "#fff",
              border: "none", borderRadius: 6, fontSize: 11, fontWeight: 700, cursor: "pointer",
            }}
          >MAXIMUS</button>
          <AlertBell />
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>

        {/* HOME tab */}
        {activeTab === "home" && (
          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "24px 20px", gap: 24 }}>
            {/* Today's Revenue — hero number */}
            <div style={{ textAlign: "center" }}>
              <div style={{ fontSize: 11, color: "var(--u-muted)", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>Today's Revenue</div>
              <div style={{ fontSize: 52, fontWeight: 900, color: "var(--u-neon-gold)", letterSpacing: "-0.03em", lineHeight: 1 }}>
                {pnl ? `$${Math.round(pnl.revenue).toLocaleString()}` : "$—"}
              </div>
              <TrendBadge pct={pnl?.revenue_trend} />
            </div>

            {/* Two smaller numbers */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{
                background: "var(--u-card)", border: "1px solid var(--u-border)", borderRadius: 14,
                padding: "16px", textAlign: "center", borderTop: "3px solid #ec4899",
              }}>
                <div style={{ fontSize: 10, color: "var(--u-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Ad Spend</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "#ec4899" }}>
                  {pnl ? `$${Math.round(pnl.ad_spend).toLocaleString()}` : "$—"}
                </div>
              </div>
              <div style={{
                background: "var(--u-card)", border: "1px solid var(--u-border)", borderRadius: 14,
                padding: "16px", textAlign: "center",
                borderTop: `3px solid ${pnl && pnl.net_profit >= 0 ? "#10b981" : "#ef4444"}`,
              }}>
                <div style={{ fontSize: 10, color: "var(--u-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6 }}>Net Profit</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: pnl && pnl.net_profit >= 0 ? "#10b981" : "#ef4444" }}>
                  {pnl ? `$${Math.round(pnl.net_profit).toLocaleString()}` : "$—"}
                </div>
                <TrendBadge pct={pnl?.profit_trend} />
              </div>
            </div>

            {/* Scan summary */}
            <div style={{
              background: "var(--u-card)", border: "1px solid var(--u-border)", borderRadius: 12,
              padding: "14px 16px", display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 0,
            }}>
              {[
                { label: "Scanned", value: data.summary.productsScanned },
                { label: "Passed", value: data.summary.productsPassed },
                { label: "Best", value: `${data.summary.bestScore}/100` },
              ].map((item, i) => (
                <div key={item.label} style={{ textAlign: "center", borderRight: i < 2 ? "1px solid var(--u-border)" : "none", padding: "0 8px" }}>
                  <div style={{ fontSize: 18, fontWeight: 800, color: "var(--u-text)" }}>{item.value}</div>
                  <div style={{ fontSize: 10, color: "var(--u-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 2 }}>{item.label}</div>
                </div>
              ))}
            </div>

            {/* Swipe hint */}
            <div style={{ textAlign: "center", fontSize: 11, color: "var(--u-dim)" }}>Swipe left/right to navigate</div>
          </div>
        )}

        {/* PRODUCTS tab */}
        {activeTab === "products" && (
          <MobileProductList products={data.products} />
        )}

        {/* ALERTS tab */}
        {activeTab === "alerts" && (
          <InlineAlertList />
        )}

        {/* SUPPLIERS tab */}
        {activeTab === "suppliers" && (
          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 32, textAlign: "center" }}>
            <div>
              <div style={{ fontSize: 40, marginBottom: 16 }}>🖥️</div>
              <div style={{ fontSize: 15, fontWeight: 600, color: "var(--u-text)", marginBottom: 8 }}>Open Desktop for Full CRM</div>
              <div style={{ fontSize: 13, color: "var(--u-muted)", lineHeight: 1.6 }}>
                The Supplier CRM with order management, AI email generation, and PO creation is optimized for desktop. Visit AZ Finds on a larger screen for the full experience.
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Alert ticker */}
      <div style={{
        height: 44, background: "var(--u-deep)", borderTop: "1px solid var(--u-border)", borderBottom: "1px solid var(--u-border)",
        display: "flex", alignItems: "center", padding: "0 16px", flexShrink: 0, overflow: "hidden",
      }}>
        <div style={{ fontSize: 12, color: "var(--u-muted)", whiteSpace: "nowrap" }}>
          📊 {ticker}
        </div>
      </div>

      {/* Bottom tab bar */}
      <div style={{
        height: 64, display: "flex", alignItems: "center", background: "var(--u-deep)",
        borderTop: "1px solid var(--u-border)", flexShrink: 0, paddingBottom: "env(safe-area-inset-bottom)",
      }}>
        {TABS.map(tab => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                gap: 3, background: "none", border: "none", cursor: "pointer", height: "100%",
                color: active ? "var(--u-neon-blue)" : "var(--u-dim)",
                transition: "color 0.2s",
              }}
            >
              <span style={{ fontSize: tab.id === "maximus" ? 14 : 18, fontWeight: tab.id === "maximus" ? 800 : 400 }}>{tab.icon}</span>
              <span style={{ fontSize: 9, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.04em" }}>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
