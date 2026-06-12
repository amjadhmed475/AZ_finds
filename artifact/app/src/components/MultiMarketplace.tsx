import { useState, useEffect } from "react";
import { Icon } from "./Icon";

type Marketplace = "amazon" | "walmart" | "tiktok_shop";

interface MarketplaceStatus {
  marketplace: Marketplace;
  connected: boolean;
  accountName?: string;
  activeListings: number;
  pendingOrders: number;
  last30dRevenue: number;
  last30dOrders: number;
  fees30d: number;
  netProfit30d: number;
  connectionUrl?: string;
}

interface CrossListingCandidate {
  asin?: string;
  title: string;
  price: number;
  category: string;
  monthlyUnits: number;
  amazonRevenue: number;
  walmartPotential?: number;
  tiktokPotential?: number;
  recommendedMarkup: number;
  eligibility: Record<string, { eligible: boolean; reason?: string }>;
}

const MP_META: Record<Marketplace, { label: string; color: string; icon: string }> = {
  amazon:      { label: "Amazon",      color: "#f59e0b", icon: "box" },
  walmart:     { label: "Walmart",     color: "#3b82f6", icon: "box" },
  tiktok_shop: { label: "TikTok Shop", color: "#ec4899", icon: "megaphone" },
};

function StatTile({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div style={{ textAlign: "center", padding: "12px 0" }}>
      <div style={{ fontSize: 22, fontWeight: 800, color: "var(--u-text)" }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: "var(--u-neon-gold)", fontWeight: 600 }}>{sub}</div>}
      <div style={{ fontSize: 10, color: "var(--u-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 2 }}>{label}</div>
    </div>
  );
}

function MarketplaceCard({ status }: { status: MarketplaceStatus }) {
  const [listing, setListing] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const meta = MP_META[status.marketplace];

  async function handleList() {
    setListing(true);
    setMsg(null);
    try {
      const endpoint = status.marketplace === "walmart"
        ? "/api/marketplace/walmart/list"
        : "/api/marketplace/tiktok/list";
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "Sample Product", price: 29.99, category: "General" }),
      });
      const d = await res.json();
      setMsg(d.message ?? (d.success ? "Listed!" : "Failed"));
    } catch {
      setMsg("Network error");
    } finally {
      setListing(false);
    }
  }

  return (
    <div style={{
      background: "var(--u-card)", border: `1px solid var(--u-border)`,
      borderTop: `3px solid ${meta.color}`, borderRadius: 14, padding: "20px 24px",
      display: "flex", flexDirection: "column", gap: 16,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: `${meta.color}22`, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <span style={{ fontSize: 18 }}>{status.marketplace === "amazon" ? "🟠" : status.marketplace === "walmart" ? "🔵" : "🎵"}</span>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: "var(--u-text)" }}>{meta.label}</div>
          <div style={{ fontSize: 12, color: status.connected ? "#10b981" : "var(--u-muted)" }}>
            {status.connected ? (status.accountName ?? "Connected") : "Not connected"}
          </div>
        </div>
        <div style={{
          padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
          background: status.connected ? "rgba(16,185,129,0.12)" : "rgba(239,68,68,0.12)",
          color: status.connected ? "#10b981" : "#ef4444",
        }}>
          {status.connected ? "LIVE" : "SETUP NEEDED"}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0, borderTop: "1px solid var(--u-border)", paddingTop: 16 }}>
        <StatTile label="Listings" value={String(status.activeListings)} />
        <StatTile label="30d Revenue" value={`$${status.last30dRevenue.toLocaleString()}`} />
        <StatTile label="Net Profit" value={`$${status.netProfit30d.toLocaleString()}`} sub={status.netProfit30d > 0 ? "profitable" : undefined} />
      </div>

      {!status.connected && status.marketplace !== "amazon" && (
        <div style={{ fontSize: 12, color: "var(--u-muted)", background: "var(--u-elevated)", borderRadius: 8, padding: "10px 12px", lineHeight: 1.6 }}>
          Set <code style={{ color: "var(--u-neon-blue)", fontSize: 11 }}>
            {status.marketplace === "walmart" ? "WALMART_CLIENT_ID + WALMART_CLIENT_SECRET" : "TIKTOK_APP_KEY + TIKTOK_APP_SECRET + TIKTOK_ACCESS_TOKEN"}
          </code> in your <code style={{ color: "var(--u-neon-blue)", fontSize: 11 }}>.env</code> to connect.
        </div>
      )}

      {status.marketplace !== "amazon" && (
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          <button
            onClick={handleList}
            disabled={listing}
            style={{
              flex: 1, padding: "8px 0", background: status.connected ? meta.color : "var(--u-elevated)",
              color: status.connected ? "#fff" : "var(--u-muted)", border: "none", borderRadius: 8,
              fontSize: 12, fontWeight: 600, cursor: listing ? "not-allowed" : "pointer",
            }}
          >
            {listing ? "Listing…" : `List on ${meta.label}`}
          </button>
          {msg && <span style={{ fontSize: 11, color: "var(--u-muted)" }}>{msg}</span>}
        </div>
      )}
    </div>
  );
}

export function MultiMarketplace() {
  const [statuses, setStatuses] = useState<MarketplaceStatus[]>([]);
  const [candidates, setCandidates] = useState<CrossListingCandidate[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/marketplace/status").then(r => r.ok ? r.json() : { statuses: [] }),
      fetch("/api/marketplace/cross-listing").then(r => r.ok ? r.json() : { candidates: [] }),
    ]).then(([s, c]) => {
      setStatuses(s.statuses ?? []);
      setCandidates(c.candidates ?? []);
    }).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: 200, color: "var(--u-muted)", fontSize: 14 }}>
        Loading marketplace data…
      </div>
    );
  }

  const totalRevenue = statuses.reduce((s, m) => s + m.last30dRevenue, 0);
  const totalProfit = statuses.reduce((s, m) => s + m.netProfit30d, 0);
  const totalListings = statuses.reduce((s, m) => s + m.activeListings, 0);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 }}>
      {/* Summary bar */}
      <div style={{
        display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0,
        background: "var(--u-card)", border: "1px solid var(--u-border)", borderRadius: 14, overflow: "hidden",
      }}>
        {[
          { label: "Marketplaces", value: `${statuses.filter(s => s.connected).length} / ${statuses.length}` },
          { label: "Total Listings", value: String(totalListings) },
          { label: "30d Revenue", value: `$${totalRevenue.toLocaleString()}` },
          { label: "30d Net Profit", value: `$${totalProfit.toLocaleString()}` },
        ].map((item, i) => (
          <div key={item.label} style={{ padding: "20px 16px", textAlign: "center", borderRight: i < 3 ? "1px solid var(--u-border)" : "none" }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: "var(--u-text)" }}>{item.value}</div>
            <div style={{ fontSize: 10, color: "var(--u-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 4 }}>{item.label}</div>
          </div>
        ))}
      </div>

      {/* Marketplace cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
        {statuses.length > 0
          ? statuses.map(s => <MarketplaceCard key={s.marketplace} status={s} />)
          : (["amazon", "walmart", "tiktok_shop"] as Marketplace[]).map(mp => (
              <MarketplaceCard key={mp} status={{
                marketplace: mp, connected: mp === "amazon", activeListings: mp === "amazon" ? 24 : 0,
                pendingOrders: 0, last30dRevenue: mp === "amazon" ? 18400 : 0, last30dOrders: mp === "amazon" ? 212 : 0,
                fees30d: mp === "amazon" ? 2800 : 0, netProfit30d: mp === "amazon" ? 4100 : 0,
              }} />
            ))
        }
      </div>

      {/* Cross-listing candidates */}
      {candidates.length > 0 && (
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: "var(--u-text)", marginBottom: 12 }}>
            <Icon name="bolt" size={14} /> Cross-Listing Opportunities
          </h3>
          <div style={{ background: "var(--u-card)", border: "1px solid var(--u-border)", borderRadius: 12, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--u-border)" }}>
                  {["Product", "Price", "Amazon Revenue", "Walmart Potential", "TikTok Potential", "Action"].map(h => (
                    <th key={h} style={{ padding: "10px 14px", fontSize: 10, fontWeight: 600, color: "var(--u-muted)", textTransform: "uppercase", letterSpacing: "0.06em", textAlign: "left" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {candidates.slice(0, 10).map((c, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--u-border)" }}>
                    <td style={{ padding: "10px 14px", fontSize: 13, color: "var(--u-text)", maxWidth: 200 }}>
                      <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title}</div>
                      {c.asin && <div style={{ fontSize: 10, color: "var(--u-muted)" }}>{c.asin}</div>}
                    </td>
                    <td style={{ padding: "10px 14px", fontSize: 13, color: "var(--u-text)" }}>${c.price.toFixed(2)}</td>
                    <td style={{ padding: "10px 14px", fontSize: 13, color: "#10b981" }}>${c.amazonRevenue.toLocaleString()}</td>
                    <td style={{ padding: "10px 14px", fontSize: 13, color: "#3b82f6" }}>${(c.walmartPotential ?? 0).toLocaleString()}</td>
                    <td style={{ padding: "10px 14px", fontSize: 13, color: "#ec4899" }}>${(c.tiktokPotential ?? 0).toLocaleString()}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <button style={{
                        padding: "4px 10px", background: "var(--u-neon-blue)", color: "#fff",
                        border: "none", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer",
                      }}>
                        Expand
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Yamarigroup.com integration note */}
      <div style={{ background: "var(--u-elevated)", border: "1px solid var(--u-border)", borderRadius: 12, padding: "16px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <span style={{ fontSize: 16 }}>🌐</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: "var(--u-text)" }}>Yamarigroup.com — Brand Hub</span>
          <a
            href="https://yamarigroup.com"
            target="_blank"
            rel="noopener noreferrer"
            style={{ fontSize: 11, color: "var(--u-neon-blue)", marginLeft: "auto" }}
          >
            Visit site →
          </a>
        </div>
        <p style={{ fontSize: 12, color: "var(--u-muted)", lineHeight: 1.6, margin: 0 }}>
          Your brand home for multi-channel expansion. As Walmart and TikTok Shop integrations go live, all channels sync under the Yamari Group brand umbrella. SEO content generated here is optimized for yamarigroup.com authority.
        </p>
      </div>
    </div>
  );
}
