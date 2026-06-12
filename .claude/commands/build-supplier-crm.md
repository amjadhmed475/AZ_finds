# Build: Supplier CRM + Reorder Engine

## Context
AZ Finds — React 18 + TypeScript + Vite 5.
Frontend: `artifact/app/src/`. HTTP server: `server/src/http.ts` (port 3001).
Data persistence: use a local SQLite database via `better-sqlite3` (no cloud needed, file stored at `data/azfinds.db`).
Design system: `artifact/app/src/theme-ultra.css`.

## What to Build

### 1. Database Layer — `server/src/db/database.ts`
Install `better-sqlite3` and `@types/better-sqlite3` in `server/`.
Create SQLite DB at `data/azfinds.db` (add `data/*.db` to `.gitignore`, add `data/.gitkeep`).

Tables:
```sql
CREATE TABLE suppliers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  whatsapp TEXT,
  wechat TEXT,
  website TEXT,
  country TEXT DEFAULT 'CN',
  payment_terms TEXT,   -- e.g. "30% deposit, 70% before ship"
  lead_time_days INTEGER DEFAULT 30,
  min_order_qty INTEGER DEFAULT 100,
  quality_rating INTEGER DEFAULT 3,  -- 1-5
  response_rating INTEGER DEFAULT 3, -- 1-5
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE supplier_products (
  id TEXT PRIMARY KEY,
  supplier_id TEXT REFERENCES suppliers(id),
  asin TEXT,
  product_name TEXT NOT NULL,
  sku TEXT,
  unit_cost_usd REAL,
  moq INTEGER,
  lead_time_days INTEGER,
  last_order_date TEXT,
  last_order_qty INTEGER,
  last_order_price REAL,
  notes TEXT
);

CREATE TABLE orders (
  id TEXT PRIMARY KEY,
  supplier_id TEXT REFERENCES suppliers(id),
  status TEXT DEFAULT 'draft',  -- draft|sent|confirmed|in_production|shipped|received
  order_date TEXT,
  expected_arrival TEXT,
  total_units INTEGER,
  total_cost_usd REAL,
  shipping_cost_usd REAL,
  notes TEXT,
  po_number TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT REFERENCES orders(id),
  supplier_product_id TEXT REFERENCES supplier_products(id),
  qty INTEGER,
  unit_price REAL,
  asin TEXT,
  product_name TEXT
);

CREATE TABLE supplier_notes (
  id TEXT PRIMARY KEY,
  supplier_id TEXT REFERENCES suppliers(id),
  note TEXT NOT NULL,
  type TEXT DEFAULT 'general',  -- general|negotiation|quality|logistics
  created_at TEXT DEFAULT (datetime('now'))
);
```

### 2. Supplier CRM HTTP Endpoints — add to `server/src/http.ts`
```
GET    /api/suppliers                    → list all suppliers
POST   /api/suppliers                    → create supplier
GET    /api/suppliers/:id                → get supplier with products + orders + notes
PUT    /api/suppliers/:id                → update supplier
DELETE /api/suppliers/:id                → soft delete

GET    /api/suppliers/:id/products       → list products for supplier
POST   /api/suppliers/:id/products       → add product

GET    /api/orders                       → list all orders (with supplier name)
POST   /api/orders                       → create order
PUT    /api/orders/:id                   → update order (status, etc.)
POST   /api/orders/:id/items             → add item to order

GET    /api/reorder-recommendations      → MAXIMUS-powered reorder suggestions
POST   /api/suppliers/:id/notes          → add a note
POST   /api/generate-po/:orderId         → generate PO PDF or text and return as download
POST   /api/generate-supplier-email/:id  → AI-drafted negotiation/reorder email via claude-fable-5
```

### 3. Reorder Recommendation Engine — `server/src/services/reorderEngine.ts`
Logic:
1. Load inventory levels (from SP-API if connected, else from latest batch data)
2. For each ASIN with <30 days of supply:
   - Find matching `supplier_products` records
   - Calculate recommended order qty: (30-day velocity × 90) - current_stock
   - Calculate estimated landed cost
   - Find best-priced supplier for that ASIN
3. Return ranked list: `{ asin, product_name, days_of_supply, recommended_qty, best_supplier, estimated_cost, urgency: "critical"|"soon"|"plan" }`

### 4. AI Email Drafter — `server/src/services/emailDrafter.ts`
Uses claude-fable-5 (server-side) to draft supplier emails:

Contexts:
- **Reorder**: "Draft a professional reorder email to {supplier_name} ({contact_name}) for {qty} units of {product_name} at target price ${target_price}. We need delivery by {date}. Use a firm but collaborative tone."
- **Negotiation**: "Draft a price negotiation email to {supplier_name}. We've been ordering {history}. We want to reduce unit price from ${current} to ${target} in exchange for {commitment}."
- **Quality issue**: "Draft a quality complaint email to {supplier_name} about {issue}. We need a resolution within 7 days."

Return the draft as plain text the user can copy or edit.

### 5. SupplierCRM Component — `artifact/app/src/components/SupplierCRM.tsx`
Replace the existing "Suppliers" tab content (`SupplierComparison` component) with this full CRM.

**Three-panel layout:**
```
[Supplier List Sidebar] | [Supplier Detail Panel] | [Order/Notes Timeline]
      200px                      flex-1                    300px
```

**Supplier List Sidebar:**
- Search input (filter by name, country, product)
- "+ Add Supplier" button
- Each item: supplier name, country flag emoji, quality stars, last order badge
- Color left border: green (ordered <30 days), amber (30-90 days), red (90+ days or never)
- Click to select and show detail panel

**Supplier Detail Panel:**
Tabs: Overview | Products | Orders | Notes

*Overview tab:*
- Editable fields: name, contact, email, WhatsApp, WeChat, website, country, payment terms, lead time, MOQ
- Star ratings (1-5) for quality and response speed
- "Generate AI Email" dropdown: Reorder | Negotiate | Quality Issue

*Products tab:*
- Table: Product Name | ASIN | Unit Cost | MOQ | Last Order Date | Last Price
- "+ Add Product" row (inline edit)
- "Set Reorder Alert" toggle per product

*Orders tab:*
- Status pipeline: Draft → Sent → Confirmed → In Production → Shipped → Received
- Each order: PO number, date, units, cost, expected arrival, status badge
- "Generate PO" button downloads a formatted purchase order
- "+ New Order" button

*Notes tab:*
- Timeline of notes (general/negotiation/quality/logistics with color tags)
- "+ Add Note" textarea + type selector

**Order/Notes Timeline (right panel):**
- Shows most recent activity across all suppliers
- "Recent Orders" section: last 10 orders by date with status badges
- "Reorder Alerts" section: ASINs needing reorder (from reorderEngine), click → prefills new order

### 6. Reorder Alert Panel — `artifact/app/src/components/ReorderAlerts.tsx`
Standalone widget that can appear in:
- The War Room tab (as a sidebar widget)
- The Suppliers tab (as a top banner when critical)

Shows:
```
🔴 CRITICAL RESTOCK  Pantry Organizer (B0XXXXX)  8 days left  [CREATE ORDER]
🟡 REORDER SOON     Garage Wall Storage (B0YYYY)  21 days left [CREATE ORDER]
```
Clicking CREATE ORDER opens the SupplierCRM with a pre-filled new order.

### 7. PO Generator — `server/src/services/poGenerator.ts`
Generates a plain-text (and optionally HTML) Purchase Order:
```
PURCHASE ORDER #AZ-2026-047
Date: June 12, 2026
To: Wu Liang Trading Co.
   Contact: David Wu | david@wuliang.com

From: Yamari Group

Items:
  1. Pantry Storage Bins (B0XXX)   300 units @ $4.20/unit = $1,260.00
  2. Hanging Organizer (B0YYY)     150 units @ $3.80/unit = $570.00

Subtotal:        $1,830.00
Shipping (est.): $420.00
TOTAL:           $2,250.00

Payment Terms: 30% deposit ($675.00) on confirmation, 70% ($1,575.00) before shipment
Expected Delivery: August 15, 2026

Notes: Please confirm stock availability within 48 hours.

Authorized by: [Seller Name]
```
Return as downloadable text file or copy-to-clipboard JSON.

### 8. MCP Tools — add to `server/src/index.ts`
Tool 29: `get_supplier_list` — returns all suppliers with summary stats
Tool 30: `get_reorder_recommendations` — calls reorderEngine, returns ranked list
Tool 31: `create_supplier_order` — creates a new order in DB with items
Tool 32: `draft_supplier_email` — AI drafts email for negotiation/reorder/quality

### 9. Wire into Dashboard.tsx
The "suppliers" tab already exists. Replace `<SupplierComparison />` with `<SupplierCRM />`.
Import `<ReorderAlerts />` and render it at the top of the War Room tab.

## Styling (add to theme-ultra.css)
- `.crm-shell` — 3-column grid, gap 0, full content area height
- `.crm-sidebar` — 200px, dark border-right, scrollable list
- `.crm-detail` — flex-1, tabbed content area
- `.crm-timeline` — 300px, border-left, timeline items
- `.supplier-item` — flex row, left border colored, hover highlight
- `.order-pipeline` — flex row, step-by-step status badges with connecting lines
- `.reorder-alert-banner` — full-width, red/amber gradient background, urgent typography
- `.po-preview` — monospace font, pre-formatted, dark background

## Definition of Done
- [ ] SQLite DB creates correctly at `data/azfinds.db` on server start
- [ ] CRUD endpoints for suppliers, products, orders all return correct data
- [ ] SupplierCRM renders with 3-panel layout in the Suppliers tab
- [ ] "+ Add Supplier" form saves to DB and appears in list
- [ ] "Generate AI Email" calls claude-fable-5 and returns draft in <5s
- [ ] Reorder Alerts show in War Room tab
- [ ] "Generate PO" produces formatted purchase order text
- [ ] MCP tools 29-32 callable from MCP client
- [ ] Zero TypeScript errors
- [ ] Commit and push to `claude/ultrathink-site-redesign-t42cvn`
