import { useState } from "react";
import type { Dashboard } from "../lib/types";
import { Icon } from "./Icon";

const SECTIONS: Array<{ id: string; title: string; body: React.ReactNode }> = [
  { id: "start", title: "1. Getting Started", body: (
    <>
      <p>AZ Finds ranks generic Amazon products you can realistically buy, land, and defend. It runs in <b>estimate-level</b> mode by default — every figure is an estimate, clearly labelled, and grades cap at <b>B3</b> until you add higher-confidence data.</p>
      <ul><li>Browse <b>Products</b> for graded opportunities.</li><li>Use <b>Wholesale Finder</b> to find suppliers for any product.</li><li>Open a product to see profit, suppliers, PPC, risk, and a pre-order checklist.</li><li>Save products to your <b>Watchlist</b> and track verification.</li></ul>
    </>
  )},
  { id: "research", title: "★ Research a product accurately — step by step", body: (
    <>
      <p>The dashboard's prices, sales and ROI are <b>estimates</b> (no live Amazon feed by default), so they will differ from the real listing. Here is how to turn any product into a real, confident decision:</p>
      <ol>
        <li><b>Open the product</b> and go to the <b>Profit</b> tab.</li>
        <li><b>Check the real price.</b> Click <b>“Check real price”</b> — it opens Amazon's search for that product. Note the actual selling price (e.g. a yoga strap may list at $22.09, not the estimate).</li>
        <li><b>Type the real numbers into the calculator.</b> Enter the real Amazon price, your real supplier unit cost (from a Wholesale Finder quote), and pick <b>FBA</b> (Amazon ships — the FBA fee covers outbound shipping) or <b>FBM</b> (you ship — adds ~$5.99). ROI, margin and net profit recompute and <b>save automatically</b> for that product.</li>
        <li><b>Confirm fees</b> in Amazon's <b>Revenue Calculator</b> (paste the ASIN), then copy the exact referral + FBA fee back into the calculator.</li>
        <li><b>Check Seller Central</b> eligibility (Add a Product → restrictions) and mark the result on the product.</li>
        <li><b>Get a supplier quote + sample</b> from the Wholesale Finder links; update unit cost and MOQ.</li>
        <li><b>Decide:</b> the product's decision line (Buy sample / Check Seller Central / Watch / Avoid) plus your real ROI tells you whether to order a small test batch.</li>
      </ol>
      <p className="hc-defs"><b>Want price/sales to be real automatically?</b> The engine is already wired for it:
        <br />• <b>Keepa</b> (paid, most accurate): set <code>KEEPA_API_KEY</code> → real BSR, price history, sales rank.
        <br />• <b>retailerapi</b> (free 1,000 lookups/mo): real Amazon price/sellers by ASIN — set <code>RETAILERAPI_KEY</code>.
        <br />There is <b>no</b> free Helium 10 / Jungle Scout API for ad-hoc lookups; those need their paid subscriptions. With a real source connected, grades can rise above B3.</p>
    </>
  )},
  { id: "sc", title: "2. Connect Amazon Seller Central", body: (
    <>
      <p><b>This app cannot and will not bypass Seller Central.</b> You verify eligibility yourself:</p>
      <ol>
        <li>In Seller Central → <b>Catalog → Add a Product</b>.</li>
        <li>Search the product. Click <b>“Show limitations”</b> / <b>“Sell this product”</b> to see if approval is required.</li>
        <li>Confirm category and sub-category restrictions.</li>
        <li>Check whether <b>invoices</b> or compliance documents are requested.</li>
        <li>Confirm you can list it as <b>Generic</b>.</li>
        <li>Back in AZ Finds, open the product → mark <b>Seller Central checked</b> (pass/fail). This raises the product’s data quality.</li>
      </ol>
    </>
  )},
  { id: "ads", title: "3. Connect Amazon Ads / PPC Reports", body: (
    <>
      <p>Export reports from <b>Amazon Ads → Sponsored Products → Reports</b>:</p>
      <ul><li>Search-term report</li><li>Targeting report</li><li>Campaign report</li><li>Advertised-product report</li></ul>
      <p>Upload a report in <b>PPC Manager</b> to get pause/scale/negative recommendations.</p>
      <p className="hc-defs"><b>ACOS</b> = ad spend ÷ ad sales. <b>ROAS</b> = sales ÷ spend. <b>CPC</b> = cost per click. <b>CTR</b> = clicks ÷ impressions. <b>CVR</b> = orders ÷ clicks. Pause terms with spend and no orders; scale terms below your target ACOS.</p>
    </>
  )},
  { id: "keepa", title: "4. Connect Keepa", body: (
    <>
      <p>Add <code>KEEPA_API_KEY</code> to <code>.env</code> (never commit it). Keepa unlocks <b>BSR history, price history, sales-rank signals, buy-box & seller-count</b> — real demand data.</p>
      <p>Because this is measured data (not estimates), it lets products earn grades above B3 (toward <b>A5</b> in live mode).</p>
    </>
  )},
  { id: "mcp", title: "5. Connect Search / Browser MCP", body: (
    <>
      <p>A search or browser MCP (Playwright, Fetch, or SerpAPI/Bing) helps find supplier product pages and real product images.</p>
      <ul><li>Use <b>public, legal</b> sources only.</li><li>Never scrape private Seller Central pages or bypass site protections.</li><li>Every claim must keep a <b>citation</b> and confidence label.</li></ul>
    </>
  )},
  { id: "supplier", title: "6. Add Supplier Data", body: (
    <p>In the product drawer use <b>Find more suppliers</b>, or paste a supplier quote / product link. A confirmed supplier product-page match raises supplier confidence and can lift the grade.</p>
  )},
  { id: "alibaba", title: "★ How to vet an Alibaba supplier", body: (
    <ol>
      <li>Open the <b>direct product page</b> (not the supplier homepage).</li>
      <li>Confirm the <b>product title and images</b> match your exact item, pack count and variation.</li>
      <li>Check <b>MOQ</b> and whether samples are available.</li>
      <li>Check <b>Trade Assurance</b> / buyer protection, <b>Verified Supplier</b> badge, and <b>years active</b>.</li>
      <li>Check ratings/reviews, response rate and transaction history if shown.</li>
      <li>Check the <b>shipping method and delivery estimate</b> — does it fit 2–3 weeks?</li>
      <li>Message the supplier to confirm landed price, lead time, and stock.</li>
      <li><b>Order a sample before any bulk order.</b></li>
    </ol>
  )},
  { id: "aliexpress", title: "★ How to vet an AliExpress supplier", body: (
    <ol>
      <li>Open the <b>direct product page</b>.</li>
      <li>Check the <b>number of orders</b> and <b>store rating</b> (avoid low-evidence listings).</li>
      <li>Read <b>reviews and review photos</b> — do they match the listing?</li>
      <li>Check the <b>estimated delivery date</b> and <b>ships-from</b> location (prefer US/CA warehouses for speed).</li>
      <li>Confirm <b>return/refund protection</b>.</li>
      <li>Avoid listings with poor reviews, mismatched images, or unrealistically low prices.</li>
      <li><b>Order a sample first.</b></li>
    </ol>
  )},
  { id: "shipping", title: "★ Confirm 2–3 week delivery + message templates", body: (
    <>
      <p>The Supplier Check tab flags shipping as <b>Pass (≤21d)</b>, <b>Borderline (22–28d)</b>, <b>Fail (&gt;28d)</b>, or <b>Unknown</b>. Estimates can change — always confirm in writing:</p>
      <ul><li>Ask for the shipping method, tracking, and whether stock is on hand.</li><li>Ask if private label / custom packaging adds lead time.</li><li>Get written confirmation before ordering.</li></ul>
      <p className="hc-defs"><b>Alibaba message:</b> “Hi, I'm interested in sourcing [PRODUCT]. Can you confirm unit price for [QTY], MOQ, sample cost, shipping cost to [LOCATION], estimated delivery time, shipping methods, dimensions, material, packaging options, and whether private labeling is available? Is it in stock, and can delivery arrive within 2–3 weeks?”</p>
      <p className="hc-defs"><b>AliExpress message:</b> “Hi, I'm interested in [PRODUCT]. Can you confirm exact dimensions/material, whether it's in stock, shipping method, estimated delivery time to [LOCATION], tracking availability, and whether delivery can arrive within 2–3 weeks?”</p>
      <p className="hc-defs"><b>US wholesaler message:</b> “Hi, I'm interested in purchasing [PRODUCT] wholesale. Can you confirm wholesale pricing, MOQ, case-pack quantity, shipping cost to [LOCATION], estimated delivery time, dimensions, material, and whether samples or small test orders are available?”</p>
    </>
  )},
  { id: "csv", title: "7. Upload CSV Reports", body: (
    <p>Upload Amazon Ads CSVs in PPC Manager. For Seller Central results, mark them on each product. CSV exports from AZ Finds are <b>raw data only</b> — use <b>Export XLSX Pro</b> for a formatted workbook with images.</p>
  )},
  { id: "verify", title: "8. Verify Products Before Ordering", body: (
    <ol>
      <li>Seller Central eligibility check</li>
      <li>Amazon Revenue Calculator fee check</li>
      <li>Trademark search (USPTO TESS)</li>
      <li>Patent / design check</li>
      <li>Order a supplier sample</li>
      <li>Packaging & barcode/FNSKU check</li>
      <li>FBA size/weight tier check</li>
      <li>Return-risk review</li>
      <li>Start with a small test order</li>
    </ol>
  )},
  { id: "export", title: "9. Export Professional Reports", body: (
    <p><b>Export CSV</b> = raw data. <b>Export XLSX Pro</b> = multi-sheet workbook (cover, summary, top products, rejected, suppliers, profit, PPC, capital, risk, citations, codebook) with grade/risk/ROI colors, formulas, and image links. PDF/ZIP are on the roadmap.</p>
  )},
  { id: "trouble", title: "10. Troubleshooting", body: (
    <ul>
      <li><b>Everything is B3?</b> That’s correct in estimate mode — see the Grade Unlock widget on Overview.</li>
      <li><b>Images look generic?</b> They’re representative photos from your image source; add a supplier image URL in the drawer for an exact match.</li>
      <li><b>New MCP tools not callable?</b> Fully restart Claude Code so newly-added MCP servers expose their tools.</li>
    </ul>
  )},
];

export function HelpCenter({ data }: { data: Dashboard }) {
  const [open, setOpen] = useState<string>("start");
  const sources = data.apiUsage?.sources ?? [];
  const stack: Array<[string, "connected" | "locked" | "optional"]> = [
    ["Estimate engine", "connected"],
    ...sources.map((s) => [s.name, s.connected ? "connected" : "locked"] as [string, "connected" | "locked"]),
    ["Amazon Ads reports", "optional"], ["Seller Central checks", "optional"], ["Supplier data", "optional"], ["Capital planner", "connected"],
  ];

  return (
    <section className="help">
      <div className="help-wizard">
        <h2 className="section-title" style={{ marginTop: 0 }}>Connect Your Stack</h2>
        <div className="stack-grid">
          {stack.map(([name, st]) => (
            <div className={`stack-card ${st}`} key={name}>
              <span className="stack-dot" />
              <div><div className="stack-name">{name}</div><div className="stack-st">{st === "connected" ? "Connected" : st === "locked" ? "Locked — add key" : "Optional"}</div></div>
            </div>
          ))}
        </div>
        <p className="muted small" style={{ marginTop: 10 }}>Default mode is <b>hybrid low-cost</b>: the estimate engine works with zero paid calls; add keys to unlock live data and higher grades.</p>
      </div>

      <h2 className="section-title">Help Center</h2>
      <div className="help-list">
        {SECTIONS.map((s) => (
          <div className={`help-item${open === s.id ? " open" : ""}`} key={s.id}>
            <button className="help-q" onClick={() => setOpen(open === s.id ? "" : s.id)}>
              <span>{s.title}</span><Icon name="chevron" size={16} className="help-chev" />
            </button>
            {open === s.id && <div className="help-a">{s.body}</div>}
          </div>
        ))}
      </div>
    </section>
  );
}
