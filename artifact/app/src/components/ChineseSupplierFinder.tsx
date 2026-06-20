import { useState, useMemo } from "react";
import type { Dashboard } from "../lib/types";
import { getChineseSuppliers, getChinaHub, type ResolvedSupplier } from "../lib/chineseSuppliers";

const TRUST_COLORS: Record<ResolvedSupplier["trustLevel"], { color: string; label: string }> = {
  "verified":        { color: "var(--p-green)", label: "✓ Verified" },
  "trade-assurance": { color: "var(--p-blue)",  label: "🛡 Trade Assurance" },
  "standard":        { color: "var(--p-t3)",    label: "Standard" },
};

function SupplierCard({ s, query }: { s: ResolvedSupplier; query: string }) {
  const ts = TRUST_COLORS[s.trustLevel];
  const searchUrl = s.url || `https://www.alibaba.com/trade/search?SearchText=${encodeURIComponent(query)}`;

  return (
    <div style={{
      background: "var(--p-raised)", border: "1px solid var(--p-b1)", borderRadius: 10,
      padding: 16, display: "flex", flexDirection: "column", gap: 10,
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: "var(--p-t1)" }}>{s.name}</div>
          <div style={{ fontSize: 11, color: "var(--p-blue)", marginTop: 2 }}>{s.site}</div>
        </div>
        <span style={{
          fontSize: 9, fontWeight: 700, padding: "3px 8px", borderRadius: 5,
          background: `${ts.color}18`, color: ts.color, whiteSpace: "nowrap", flexShrink: 0,
        }}>{ts.label}</span>
      </div>

      <div style={{ fontSize: 12, color: "var(--p-t2)", lineHeight: 1.55 }}>{s.specialty}</div>

      <div style={{ display: "flex", gap: 16, flexWrap: "wrap" }}>
        {[
          { k: "MOQ", v: s.moqRange },
          { k: "Lead Time", v: s.leadDays },
          { k: "Hub", v: s.china_region },
        ].map(({ k, v }) => (
          <div key={k}>
            <div style={{ fontSize: 9, color: "var(--p-t3)", textTransform: "uppercase", letterSpacing: "0.1em" }}>{k}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: "var(--p-t1)", marginTop: 2 }}>{v}</div>
          </div>
        ))}
      </div>

      <div style={{
        background: "rgba(240,165,0,0.07)", border: "1px solid rgba(240,165,0,0.15)",
        borderRadius: 7, padding: "8px 10px", fontSize: 11, color: "var(--p-gold)", lineHeight: 1.5,
      }}>
        💡 {s.advantage}
      </div>

      <div style={{ fontSize: 11, color: "var(--p-t3)", lineHeight: 1.5 }}>
        <span style={{ color: "var(--p-t2)", fontWeight: 600 }}>Pro tip: </span>{s.tip}
      </div>

      <a
        href={searchUrl}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          display: "block", textAlign: "center", padding: "9px 14px",
          background: "var(--p-gold-bg)", border: "1px solid var(--p-gold-bd)",
          borderRadius: 8, color: "var(--p-gold)", fontSize: 12, fontWeight: 600,
          textDecoration: "none",
        }}
      >
        Search "{query.length > 24 ? query.slice(0, 23) + "…" : query}" on {s.name} ↗
      </a>
    </div>
  );
}

export function ChineseSupplierFinder({ data }: { data: Dashboard }) {
  const [selectedId, setSelectedId] = useState(data.products[0]?.id ?? "");
  const [customQuery, setCustomQuery]   = useState("");

  const product = useMemo(
    () => data.products.find(p => p.id === selectedId) ?? data.products[0],
    [data.products, selectedId]
  );

  const query    = customQuery.trim() || (product?.name ?? "");
  const category = product?.category ?? "";
  const hub      = getChinaHub(category, product?.name ?? "");

  const suppliers = useMemo(
    () => getChineseSuppliers(product?.name ?? "", category, query),
    [product, category, query]
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
      {/* Header */}
      <div>
        <h2 style={{ fontSize: 20, fontWeight: 700, color: "var(--p-t1)", marginBottom: 6, letterSpacing: "-0.02em" }}>
          Chinese Supplier Intelligence
        </h2>
        <p style={{ fontSize: 13, color: "var(--p-t3)", lineHeight: 1.6, margin: 0 }}>
          Category-specific Chinese B2B platforms — beyond generic Alibaba.
          Each platform maps to the actual Chinese manufacturing cluster where your product is made.
        </p>
      </div>

      {/* Product selector + custom search */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <div style={{ flex: "1 1 200px" }}>
          <div style={{ fontSize: 10, color: "var(--p-t3)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.1em" }}>Select product</div>
          <select
            value={selectedId}
            onChange={e => { setSelectedId(e.target.value); setCustomQuery(""); }}
            style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--p-b2)", background: "var(--p-raised)", color: "var(--p-t1)", fontSize: 12 }}
          >
            {data.products.map(p => (
              <option key={p.id} value={p.id}>[{p.grade?.grade}] {p.name}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: "1 1 200px" }}>
          <div style={{ fontSize: 10, color: "var(--p-t3)", marginBottom: 5, textTransform: "uppercase", letterSpacing: "0.1em" }}>Custom search (optional)</div>
          <input
            type="text"
            value={customQuery}
            onChange={e => setCustomQuery(e.target.value)}
            placeholder={product?.name ?? "e.g. bamboo cutting board"}
            style={{ width: "100%", padding: "8px 12px", borderRadius: 8, border: "1px solid var(--p-b2)", background: "var(--p-raised)", color: "var(--p-t1)", fontSize: 12, outline: "none", boxSizing: "border-box" }}
          />
        </div>
      </div>

      {/* Product info strip */}
      {product && (
        <div style={{
          background: "var(--p-card)", border: "1px solid var(--p-b1)", borderRadius: 10,
          padding: "12px 16px", display: "flex", gap: 20, alignItems: "center", flexWrap: "wrap",
        }}>
          <div style={{ flex: 1, minWidth: 120 }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: "var(--p-t1)" }}>{product.name}</div>
            <div style={{ fontSize: 11, color: "var(--p-t3)", marginTop: 2 }}>{category}</div>
          </div>
          {[
            { l: "Unit Cost", v: `$${product.profitability.unitCost.toFixed(2)}` },
            { l: "Sell Price", v: `$${product.estimatedSalePrice.toFixed(2)}` },
            { l: "ROI",  v: `${Math.round(product.profitability.roi)}%` },
            { l: "Grade", v: product.grade?.grade ?? "—" },
          ].map(s => (
            <div key={s.l} style={{ textAlign: "right" }}>
              <div style={{ fontSize: 10, color: "var(--p-t3)" }}>{s.l}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: "var(--p-t1)", marginTop: 1 }}>{s.v}</div>
            </div>
          ))}
        </div>
      )}

      {/* Manufacturing hub badge */}
      <div style={{
        background: "var(--p-card)", border: "1px solid var(--p-b1)", borderRadius: 10,
        padding: "14px 18px", display: "flex", alignItems: "center", gap: 14,
      }}>
        <div style={{ fontSize: 28, flexShrink: 0 }}>🏭</div>
        <div>
          <div style={{ fontSize: 12, fontWeight: 700, color: "var(--p-t1)" }}>Manufacturing Hub: {hub.city}</div>
          <div style={{ fontSize: 11, color: "var(--p-t3)", marginTop: 2 }}>{hub.region} · {hub.known_for}</div>
        </div>
      </div>

      {/* Safety warning */}
      <div style={{
        background: "rgba(79,142,247,0.06)", border: "1px solid rgba(79,142,247,0.15)",
        borderRadius: 8, padding: "10px 14px", fontSize: 11, color: "var(--p-t2)", lineHeight: 1.6,
      }}>
        ⚠️ <strong>Always:</strong> verify suppliers independently · request samples before bulk ·
        use Trade Assurance or escrow · never wire-transfer to unknown suppliers.
      </div>

      {/* Supplier cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 14 }}>
        {suppliers.length > 0
          ? suppliers.map(s => <SupplierCard key={`${s.name}-${s.site}`} s={s} query={query} />)
          : (
            <div style={{ gridColumn: "span 2", textAlign: "center", padding: 40, color: "var(--p-t3)" }}>
              No specialized suppliers found. Try a custom search above.
            </div>
          )
        }
      </div>

      {/* General platforms footer */}
      <div style={{ background: "var(--p-card)", border: "1px solid var(--p-b1)", borderRadius: 10, padding: "16px 20px" }}>
        <div style={{ fontSize: 12, fontWeight: 600, color: "var(--p-t1)", marginBottom: 10 }}>General Chinese B2B (always available)</div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          {[
            { name: "Alibaba",        url: `https://www.alibaba.com/trade/search?SearchText=${encodeURIComponent(query)}`,                                            note: "Trade Assurance"    },
            { name: "1688.com",       url: `https://s.1688.com/selloffer/offer_search.htm?keywords=${encodeURIComponent(query)}`,                                     note: "Domestic CN prices" },
            { name: "Made-in-China",  url: `https://www.made-in-china.com/products-search/hot-china-products/${encodeURIComponent(query)}.html`,                       note: "Factory direct"     },
            { name: "Global Sources", url: `https://www.globalsources.com/searchList/products?keyWord=${encodeURIComponent(query)}`,                                   note: "Verified exporters" },
            { name: "DHgate",         url: `https://www.dhgate.com/wholesale/search.do?searchkey=${encodeURIComponent(query)}`,                                        note: "Low MOQ"            },
            { name: "AliExpress",     url: `https://www.aliexpress.com/wholesale?SearchText=${encodeURIComponent(query)}`,                                             note: "Small quantities"   },
          ].map(p => (
            <a
              key={p.name}
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                padding: "7px 13px", borderRadius: 7, border: "1px solid var(--p-b2)",
                background: "var(--p-raised)", color: "var(--p-t2)", fontSize: 11,
                textDecoration: "none", display: "flex", flexDirection: "column", gap: 1,
              }}
            >
              <span style={{ fontWeight: 600 }}>{p.name} ↗</span>
              <span style={{ fontSize: 9, color: "var(--p-t3)" }}>{p.note}</span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
