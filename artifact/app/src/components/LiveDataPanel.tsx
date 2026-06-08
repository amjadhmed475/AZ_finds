import { useMemo, useState } from "react";
import type { Dashboard, DashProduct } from "../lib/types";
import { money, pct } from "../lib/formatters";

interface StoreRow {
  sku: string;
  asin: string;
  title: string;
  category: string;
  units: number;
  sales: number;
  sessions: number;
  conversionRate: number;
}

const docs = {
  spApiAuth: "https://developer-docs.amazon.com/sp-api/docs/authorizing-selling-partner-api-applications",
  spApiConnect: "https://developer-docs.amazon.com/sp-api/lang-en_EN/docs/connecting-to-the-selling-partner-api",
  inventoryReport: "https://developer-docs.amazon.com/sp-api/lang-en_EN/docs/report-type-values-inventory",
  adsApi: "https://advertising.amazon.com/about-api",
  paApi: "https://webservices.amazon.com/paapi5/documentation/quick-start/operations-and-resources.html",
};

const col = (row: Record<string, string>, names: string[]) => {
  const keys = Object.keys(row);
  const found = keys.find((key) => names.some((name) => key.toLowerCase().includes(name)));
  return found ? row[found] : "";
};

const num = (value: string) => {
  const parsed = Number(String(value ?? "").replace(/[$,%,"\s]/g, ""));
  return Number.isFinite(parsed) ? parsed : 0;
};

function parseCsv(text: string): StoreRow[] {
  const lines = text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
  if (lines.length < 2) return [];
  const header = splitCsvLine(lines[0]).map((h) => h.trim());
  return lines.slice(1).map((line, index) => {
    const cells = splitCsvLine(line);
    const raw = Object.fromEntries(header.map((h, i) => [h, cells[i] ?? ""]));
    const sales = num(col(raw, ["ordered product sales", "sales", "revenue"]));
    const units = num(col(raw, ["units ordered", "units", "quantity"]));
    const sessions = num(col(raw, ["sessions", "visits"]));
    const conversion = num(col(raw, ["unit session percentage", "conversion", "cvr"]));
    return {
      sku: col(raw, ["sku"]) || `row-${index + 1}`,
      asin: col(raw, ["asin"]),
      title: col(raw, ["title", "product name", "item name", "name"]) || "Imported listing",
      category: col(raw, ["category", "product type", "browse node"]),
      units,
      sales,
      sessions,
      conversionRate: conversion,
    };
  }).filter((row) => row.title !== "Imported listing" || row.sales || row.units || row.asin);
}

function splitCsvLine(line: string): string[] {
  const cells: string[] = [];
  let cell = "";
  let quoted = false;
  for (let i = 0; i < line.length; i += 1) {
    const char = line[i];
    const next = line[i + 1];
    if (char === "\"" && quoted && next === "\"") {
      cell += "\"";
      i += 1;
    } else if (char === "\"") {
      quoted = !quoted;
    } else if (char === "," && !quoted) {
      cells.push(cell);
      cell = "";
    } else {
      cell += char;
    }
  }
  cells.push(cell);
  return cells.map((value) => value.trim());
}

const tokens = (value: string) =>
  new Set(
    value
      .toLowerCase()
      .replace(/[^a-z0-9 ]/g, " ")
      .split(/\s+/)
      .filter((word) => word.length > 3),
  );

const storeFit = (product: DashProduct, rows: StoreRow[]) => {
  if (!rows.length) return 0;
  const productTokens = tokens(`${product.name} ${product.category}`);
  const best = rows.reduce((score, row) => {
    const rowTokens = tokens(`${row.title} ${row.category}`);
    let overlap = 0;
    productTokens.forEach((word) => {
      if (rowTokens.has(word)) overlap += 1;
    });
    const salesLift = Math.min(18, row.sales / 500);
    const categoryLift = product.category && row.category.toLowerCase().includes(product.category.toLowerCase()) ? 16 : 0;
    return Math.max(score, overlap * 9 + categoryLift + salesLift);
  }, 0);
  return Math.round(Math.min(100, best + product.opportunity_score * 0.25));
};

export function LiveDataPanel({ data }: { data: Dashboard }) {
  const [raw, setRaw] = useState("");
  const rows = useMemo(() => parseCsv(raw), [raw]);
  const totalSales = rows.reduce((sum, row) => sum + row.sales, 0);
  const totalUnits = rows.reduce((sum, row) => sum + row.units, 0);
  const avgCvr = rows.length ? rows.reduce((sum, row) => sum + row.conversionRate, 0) / rows.length : 0;
  const fit = useMemo(
    () =>
      data.products
        .map((product) => ({ product, fit: storeFit(product, rows) }))
        .sort((a, b) => b.fit - a.fit)
        .slice(0, 8),
    [data.products, rows],
  );

  const connectedNames = new Set([...(data.dataSources ?? []), ...(data.apiUsage?.sources ?? [])].filter((s) => s.connected).map((s) => s.name));

  const onFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    file.text().then(setRaw);
  };

  return (
    <section className="live-shell">
      <div className="live-hero">
        <div>
          <p className="eyebrow">Live data and your store</p>
          <h2>Connect the research engine to Seller Central reality.</h2>
          <p className="muted">
            Use official APIs for live data, or start immediately by importing Seller Central CSV exports into this dashboard.
          </p>
        </div>
        <label className="btn primary">
          Upload Seller Central CSV
          <input type="file" accept=".csv,text/csv" onChange={onFile} hidden />
        </label>
      </div>

      <div className="integration-grid">
        <IntegrationCard
          name="SP-API"
          status={connectedNames.has("Amazon SP-API") ? "live" : "locked"}
          purpose="Your listings, inventory, orders, pricing, catalog, and reports."
          env="SP_API_CLIENT_ID, SP_API_CLIENT_SECRET, SP_API_REFRESH_TOKEN, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY"
          links={[
            ["Authorize", docs.spApiAuth],
            ["Connect", docs.spApiConnect],
            ["Inventory report", docs.inventoryReport],
          ]}
        />
        <IntegrationCard
          name="Amazon Ads API"
          status={connectedNames.has("Amazon Ads API") ? "live" : "locked"}
          purpose="Campaigns, reports, targeting, budgets, bid automation, and Ads performance."
          env="AMAZON_ADS_CLIENT_ID, AMAZON_ADS_CLIENT_SECRET, AMAZON_ADS_REFRESH_TOKEN, AMAZON_ADS_PROFILE_ID"
          links={[["Request access", docs.adsApi]]}
        />
        <IntegrationCard
          name="Creator API / Product data"
          status={connectedNames.has("Amazon Creators API") ? "live" : "locked"}
          purpose="Product discovery and affiliate-style catalog data where eligible."
          env="AMAZON_CREATORS_API_KEY, AMAZON_ASSOCIATE_TAG"
          links={[["PA-API deprecation", docs.paApi]]}
          warning="PA-API documentation says PA-API was deprecated on May 15, 2026; migrate product discovery to Creators API where eligible."
        />
        <IntegrationCard
          name="Keepa"
          status={connectedNames.has("Keepa") ? "live" : "locked"}
          purpose="BSR, price history, offer count, and sales-rank validation for candidate ASINs."
          env="KEEPA_API_KEY"
          links={[["Keepa API", "https://keepa.com/#!api"]]}
        />
      </div>

      <div className="live-layout">
        <div className="store-import-card">
          <div className="panel-head">
            <div>
              <p className="eyebrow">CSV bridge</p>
              <h3>Import your store while API access is pending</h3>
            </div>
            <span className="source-pill">{rows.length ? `${rows.length} rows loaded` : "ready"}</span>
          </div>
          <textarea
            className="store-paste"
            placeholder="Paste Seller Central Business Report, inventory, listings, or Ads CSV here..."
            value={raw}
            onChange={(event) => setRaw(event.target.value)}
          />
          <div className="store-kpis">
            <Kpi label="Imported rows" value={rows.length.toLocaleString()} />
            <Kpi label="Sales in file" value={money(totalSales)} />
            <Kpi label="Units in file" value={totalUnits.toLocaleString()} />
            <Kpi label="Avg CVR" value={pct(avgCvr)} />
          </div>
        </div>

        <div className="store-fit-card">
          <div className="panel-head">
            <div>
              <p className="eyebrow">Store fit</p>
              <h3>Which sourcing ideas match your real store</h3>
            </div>
          </div>
          {rows.length ? (
            <div className="fit-list">
              {fit.map(({ product, fit: score }) => (
                <div className="fit-row" key={product.id}>
                  <span>{product.name}</span>
                  <div className="fit-meter"><span style={{ width: `${score}%` }} /></div>
                  <strong>{score}</strong>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              Upload or paste a CSV to score sourcing candidates against your actual catalog, sales mix, and category history.
            </div>
          )}
        </div>
      </div>

      <div className="live-roadmap">
        <div className="road-step"><b>1</b><span>Create a private SP-API app, self-authorize it in Seller Central, and store refresh token + AWS signing credentials.</span></div>
        <div className="road-step"><b>2</b><span>Pull listings/inventory reports first, then orders and catalog data only when needed.</span></div>
        <div className="road-step"><b>3</b><span>Request Ads API access separately for live campaign reports and bid automation.</span></div>
        <div className="road-step"><b>4</b><span>Feed store performance back into sourcing rank so the top of the list reflects your actual business.</span></div>
      </div>
    </section>
  );
}

function IntegrationCard({
  name,
  status,
  purpose,
  env,
  links,
  warning,
}: {
  name: string;
  status: "live" | "locked";
  purpose: string;
  env: string;
  links: Array<[string, string]>;
  warning?: string;
}) {
  return (
    <article className={`integration-card ${status}`}>
      <div className="integration-top">
        <strong>{name}</strong>
        <span>{status}</span>
      </div>
      <p>{purpose}</p>
      <code>{env}</code>
      {warning && <small className="integration-warning">{warning}</small>}
      <div className="integration-links">
        {links.map(([label, href]) => (
          <a key={href} href={href} target="_blank" rel="noopener noreferrer">{label}</a>
        ))}
      </div>
    </article>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <div className="store-kpi">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
