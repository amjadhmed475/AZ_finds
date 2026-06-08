import { useMemo, useState } from "react";
import type { Dashboard, DashProduct } from "../lib/types";
import { applyFilters, DEFAULT_FILTERS, type FilterState } from "../lib/filters";
import { downloadProductsCsv, downloadProductsWorkbook } from "../lib/exporters";
import { ProductCard } from "./ProductCard";
import { ProductTable } from "./ProductTable";

const PAGE = 12;

export function ProductGrid({ data, onOpen }: { data: Dashboard; onOpen: (p: DashProduct) => void }) {
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [view, setView] = useState<"cards" | "table">("cards");
  const [page, setPage] = useState(0);

  const categories = useMemo(() => ["all", ...Array.from(new Set(data.products.map((p) => p.category)))], [data]);
  const filtered = useMemo(() => applyFilters(data.products, filters), [data, filters]);
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const pageItems = filtered.slice(page * PAGE, page * PAGE + PAGE);
  const set = (patch: Partial<FilterState>) => { setFilters((f) => ({ ...f, ...patch })); setPage(0); };

  const exportCsv = () => downloadProductsCsv(filtered);
  const exportXlsx = () => downloadProductsWorkbook(data, filtered);

  const top = filtered.filter((p) => (p.bucket ?? "top") === "top").length;
  const needs = filtered.length - top;

  const SAVED_VIEWS: Array<[string, Partial<FilterState>]> = [
    ["All", { ...DEFAULT_FILTERS }],
    ["A & B grade", { grade: "B" }],
    ["50%+ ROI", { minRoi: 50 }],
    ["Low risk", { risk: "low" }],
    ["Supplier found", { supplier: "has" }],
    ["Top opportunities", { bucket: "top" }],
    ["Needs check", { bucket: "needs_check" }],
  ];
  const activeFilters: Array<[string, string, () => void]> = [];
  if (filters.grade !== "all") activeFilters.push(["Grade", filters.grade, () => set({ grade: "all" })]);
  if (filters.category !== "all") activeFilters.push(["Category", filters.category, () => set({ category: "all" })]);
  if (filters.bucket !== "all") activeFilters.push(["Bucket", filters.bucket, () => set({ bucket: "all" })]);
  if (filters.risk !== "all") activeFilters.push(["Risk", filters.risk, () => set({ risk: "all" })]);
  if (filters.supplier !== "all") activeFilters.push(["Supplier", filters.supplier, () => set({ supplier: "all" })]);
  if (filters.minRoi > 0) activeFilters.push(["Min ROI", `${filters.minRoi}%`, () => set({ minRoi: 0 })]);
  if (filters.minMargin > 0) activeFilters.push(["Min margin", `${filters.minMargin}%`, () => set({ minMargin: 0 })]);
  if (filters.search) activeFilters.push(["Search", filters.search, () => set({ search: "" })]);

  return (
    <section>
      <div className="tab-toolbar">
        <h2 className="section-title" style={{ margin: 0 }}>Products ({filtered.length}) · top {top} / needs check {needs}</h2>
        <div className="view-toggle">
          <button className={view === "cards" ? "active" : ""} onClick={() => setView("cards")}>Cards</button>
          <button className={view === "table" ? "active" : ""} onClick={() => setView("table")}>Table</button>
        </div>
        <div className="export-actions">
          <button className="btn primary" onClick={exportCsv}>Export CSV</button>
          <button className="btn" onClick={exportXlsx}>Export XLSX</button>
        </div>
      </div>

      <div className="saved-views">
        {SAVED_VIEWS.map(([label, patch]) => (
          <button key={label} className="saved-view" onClick={() => { setFilters({ ...DEFAULT_FILTERS, ...patch }); setPage(0); }}>{label}</button>
        ))}
      </div>

      {activeFilters.length > 0 && (
        <div className="active-filters">
          {activeFilters.map(([k, v, clear], i) => (
            <span className="afilter" key={i}>{k}: {v} <button onClick={clear} aria-label="remove">×</button></span>
          ))}
          <button className="clear-filters" onClick={() => { setFilters(DEFAULT_FILTERS); setPage(0); }}>Clear all</button>
        </div>
      )}

      <div className="filter-bar">
        <input className="filter-search" placeholder="Search…" value={filters.search} onChange={(e) => set({ search: e.target.value })} />
        <select value={filters.grade} onChange={(e) => set({ grade: e.target.value })}>
          <option value="all">All grades</option><option value="A">A tier</option><option value="B">B tier</option><option value="C">C tier</option><option value="D">D tier</option>
        </select>
        <select value={filters.category} onChange={(e) => set({ category: e.target.value })}>
          {categories.map((c) => <option key={c} value={c}>{c === "all" ? "All categories" : c}</option>)}
        </select>
        <select value={filters.bucket} onChange={(e) => set({ bucket: e.target.value })}>
          <option value="all">All buckets</option><option value="top">Top opportunities</option><option value="needs_check">Needs deeper check</option>
        </select>
        <select value={filters.risk} onChange={(e) => set({ risk: e.target.value })}>
          <option value="all">All risk</option><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option>
        </select>
        <select value={filters.supplier} onChange={(e) => set({ supplier: e.target.value })}>
          <option value="all">Any supplier</option><option value="has">Has supplier match</option>
        </select>
        <select value={filters.gating} onChange={(e) => set({ gating: e.target.value })}>
          <option value="all">All gating</option><option value="likely ungated">Likely ungated</option><option value="manual">Seller Central check</option>
        </select>
        <label className="roi-filter">Min ROI {filters.minRoi}%<input type="range" min={0} max={300} step={10} value={filters.minRoi} onChange={(e) => set({ minRoi: Number(e.target.value) })} /></label>
        <label className="roi-filter">Min margin {filters.minMargin}%<input type="range" min={0} max={60} step={5} value={filters.minMargin} onChange={(e) => set({ minMargin: Number(e.target.value) })} /></label>
      </div>

      {view === "cards" ? (
        <div className="card-grid">
          {pageItems.map((p) => <ProductCard key={p.id} product={p} onOpen={onOpen} />)}
          {pageItems.length === 0 && <p className="muted center">No products match the filters.</p>}
        </div>
      ) : (
        <ProductTable products={pageItems} filters={filters} onSort={(k) => setFilters((f) => ({ ...f, sortKey: k, sortDir: f.sortKey === k && f.sortDir === "asc" ? "desc" : "asc" }))} onSelect={onOpen} />
      )}

      {pages > 1 && (
        <div className="pager">
          <button className="btn btn-sm" disabled={page === 0} onClick={() => setPage((p) => p - 1)}>← Prev</button>
          <span className="muted small">Page {page + 1} / {pages}</span>
          <button className="btn btn-sm" disabled={page >= pages - 1} onClick={() => setPage((p) => p + 1)}>Next →</button>
        </div>
      )}
    </section>
  );
}
