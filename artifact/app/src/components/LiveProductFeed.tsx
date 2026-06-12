import { useState, useEffect, useRef, useCallback } from "react";

interface LiveProduct {
  id: string;
  title: string;
  category: string;
  asin?: string;
  bsr?: number;
  price: number;
  review_count?: number;
  review_rating?: number;
  estimated_monthly_sales?: number;
  roi_estimate?: number;
  margin_estimate?: number;
  opportunity_score?: number;
  grade?: string;
  source?: string;
}

interface DiscoveryStats {
  total: number;
  gradeA: number;
  avgROI: number;
  categories: number;
}

const GRADE_COLOR: Record<string, string> = {
  A: "#10b981", B: "#3b82f6", C: "#f59e0b", D: "#ef4444",
};

function gradeColor(grade?: string) {
  if (!grade) return "var(--u-muted)";
  return GRADE_COLOR[grade[0]] ?? "var(--u-muted)";
}

function ProductCard({ product, isNew }: { product: LiveProduct; isNew: boolean }) {
  const color = gradeColor(product.grade);
  return (
    <div
      style={{
        background: "var(--u-card)", border: "1px solid var(--u-border)", borderRadius: 12,
        borderLeft: `3px solid ${color}`, padding: "14px 16px", display: "flex", flexDirection: "column", gap: 8,
        animation: isNew ? "slideUp 0.35s ease" : undefined,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 8 }}>
        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--u-text)", flex: 1, lineHeight: 1.35 }}>
          {product.title}
        </div>
        {product.grade && (
          <span style={{
            padding: "2px 8px", borderRadius: 6, background: `${color}22`, color, fontSize: 11, fontWeight: 700, flexShrink: 0,
          }}>
            {product.grade}
          </span>
        )}
      </div>
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <span style={{ fontSize: 11, color: "var(--u-muted)" }}>📦 {product.category}</span>
        {product.price > 0 && <span style={{ fontSize: 11, color: "var(--u-text)", fontWeight: 600 }}>${product.price.toFixed(2)}</span>}
        {product.bsr && <span style={{ fontSize: 11, color: "var(--u-muted)" }}>BSR #{product.bsr.toLocaleString()}</span>}
        {product.roi_estimate && (
          <span style={{ fontSize: 11, color: "#10b981", fontWeight: 600 }}>ROI {product.roi_estimate.toFixed(0)}%</span>
        )}
        {product.review_rating && (
          <span style={{ fontSize: 11, color: "#f59e0b" }}>★ {product.review_rating.toFixed(1)} ({product.review_count?.toLocaleString()})</span>
        )}
      </div>
      {product.asin && <div style={{ fontSize: 10, color: "var(--u-dim)", fontFamily: "monospace" }}>{product.asin}</div>}
    </div>
  );
}

export function LiveProductFeed() {
  const [products, setProducts] = useState<LiveProduct[]>([]);
  const [stats, setStats] = useState<DiscoveryStats | null>(null);
  const [running, setRunning] = useState(false);
  const [newIds, setNewIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [categories, setCategories] = useState<string[]>([]);
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    fetch("/api/research/categories").then(r => r.ok ? r.json() : { categories: [] }).then(d => setCategories(d.categories ?? [])).catch(() => {});
    fetch("/api/research/stats").then(r => r.ok ? r.json() : null).then(d => { if (d) setStats(d); }).catch(() => {});
    fetch("/api/research/discovered?limit=50").then(r => r.ok ? r.json() : { products: [] }).then(d => setProducts(d.products ?? [])).catch(() => {});
  }, []);

  const startDiscovery = useCallback(() => {
    if (running) return;
    setError(null);
    setRunning(true);

    const es = new EventSource("/api/research/stream");
    esRef.current = es;

    es.addEventListener("product", (e) => {
      try {
        const p: LiveProduct = JSON.parse((e as MessageEvent).data);
        setProducts(prev => {
          if (prev.find(x => x.id === p.id)) return prev;
          return [p, ...prev];
        });
        setNewIds(prev => new Set([...prev, p.id]));
        setTimeout(() => setNewIds(prev => { const n = new Set(prev); n.delete(p.id); return n; }), 1000);
      } catch { /* ignore parse error */ }
    });

    es.addEventListener("stats", (e) => {
      try { setStats(JSON.parse((e as MessageEvent).data)); } catch { /* ignore */ }
    });

    es.addEventListener("done", () => {
      setRunning(false);
      es.close();
      esRef.current = null;
    });

    es.addEventListener("error", () => {
      setError("Discovery stream error — check server connection");
      setRunning(false);
      es.close();
      esRef.current = null;
    });
  }, [running]);

  const stopDiscovery = useCallback(() => {
    esRef.current?.close();
    esRef.current = null;
    setRunning(false);
  }, []);

  useEffect(() => () => { esRef.current?.close(); }, []);

  const gradeACnt = products.filter(p => p.grade?.startsWith("A")).length;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
      {/* Header controls */}
      <div style={{
        background: "var(--u-card)", border: "1px solid var(--u-border)", borderRadius: 14,
        padding: "20px 24px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 16, fontWeight: 800, color: "var(--u-text)", marginBottom: 4 }}>Live Product Discovery</div>
          <div style={{ fontSize: 12, color: "var(--u-muted)" }}>
            Searches {categories.length || 30}+ Amazon categories simultaneously using live web data · no cap on products found
          </div>
        </div>
        <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
          {running && (
            <span style={{
              display: "inline-flex", alignItems: "center", gap: 5,
              background: "rgba(239,68,68,0.12)", color: "#ef4444",
              padding: "4px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700,
            }}>
              <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444", animation: "liveBlink 1s infinite" }} />
              SCANNING
            </span>
          )}
          <button
            onClick={running ? stopDiscovery : startDiscovery}
            style={{
              padding: "8px 20px", background: running ? "#ef4444" : "var(--u-neon-blue)",
              color: "#fff", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 700, cursor: "pointer",
            }}
          >
            {running ? "Stop" : "Start Discovery"}
          </button>
        </div>
      </div>

      {error && (
        <div style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#ef4444" }}>
          {error}
        </div>
      )}

      {/* Stats */}
      {(stats || products.length > 0) && (
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 0,
          background: "var(--u-card)", border: "1px solid var(--u-border)", borderRadius: 12, overflow: "hidden",
        }}>
          {[
            { label: "Discovered", value: String(stats?.total ?? products.length) },
            { label: "Grade A", value: String(stats?.gradeA ?? gradeACnt) },
            { label: "Avg ROI", value: `${(stats?.avgROI ?? 0).toFixed(0)}%` },
            { label: "Categories", value: String(stats?.categories ?? categories.length) },
          ].map((item, i) => (
            <div key={item.label} style={{ padding: "16px", textAlign: "center", borderRight: i < 3 ? "1px solid var(--u-border)" : "none" }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: "var(--u-text)" }}>{item.value}</div>
              <div style={{ fontSize: 10, color: "var(--u-muted)", textTransform: "uppercase", letterSpacing: "0.06em", marginTop: 3 }}>{item.label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Product stream */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {products.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 0", color: "var(--u-muted)", fontSize: 14 }}>
            {running ? "Scanning categories…" : "Click Start Discovery to begin live product research"}
          </div>
        ) : (
          products.map(p => <ProductCard key={p.id} product={p} isNew={newIds.has(p.id)} />)
        )}
      </div>
    </div>
  );
}
