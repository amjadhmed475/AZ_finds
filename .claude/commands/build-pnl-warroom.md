# Build: Live P&L War Room

## Context
This is the AZ Finds seller research platform (React 18 + TypeScript + Vite 5).
- Frontend: `artifact/app/src/`
- MCP server: `server/src/index.ts` (20 tools, stdio transport)
- Express HTTP server: `server/src/http.ts` (port 3001, proxied via Vite /api/*)
- Design system: `artifact/app/src/theme-ultra.css` (deep space glassmorphism)
- All API keys in root `.env` — NEVER expose to browser

## What to Build

### 1. SP-API Connection Module — `server/src/services/spApiService.ts`
Create a service that connects to Amazon Selling Partner API:
- Load `SP_API_REFRESH_TOKEN`, `SP_API_CLIENT_ID`, `SP_API_CLIENT_SECRET`, `SP_API_MARKETPLACE_ID` from `.env`
- OAuth2 token refresh: POST to `https://api.amazon.com/auth/o2/token`
- Cache access token in memory with 55-minute TTL
- Methods:
  - `getOrderMetrics(days: number)` → daily revenue, units, orders from Reports API
  - `getInventoryLevels()` → ASIN → {qty_available, days_of_supply} from FBA Inventory API
  - `getSalesAndTrafficReport()` → sessions, units ordered, conversion from Business Reports API
- Graceful fallback: if no SP-API keys, return `{ connected: false, data: null }`
- Add to `.env.example`: `SP_API_REFRESH_TOKEN=`, `SP_API_CLIENT_ID=`, `SP_API_CLIENT_SECRET=`, `SP_API_MARKETPLACE_ID=ATVPDKIKX0DER`

### 2. Ads API Connection — `server/src/services/adsApiService.ts`
Connect to Amazon Advertising API:
- Load `ADS_CLIENT_ID`, `ADS_CLIENT_SECRET`, `ADS_REFRESH_TOKEN`, `ADS_PROFILE_ID` from `.env`
- OAuth2 flow same pattern as SP-API
- Methods:
  - `getCampaignMetrics(days: number)` → campaignId, spend, impressions, clicks, orders, ACOS, ROAS
  - `getAdGroupMetrics(campaignId: string)` → per ad-group breakdown
  - `getKeywordMetrics(days: number)` → top keywords by spend and conversion
- Fallback: if no keys, return mock data with `connected: false` flag

### 3. P&L HTTP Endpoint — add to `server/src/http.ts`
```
GET /api/pnl?days=30
```
Returns:
```json
{
  "connected": true,
  "period_days": 30,
  "revenue": 42180.50,
  "ad_spend": 6230.00,
  "fba_fees": 8100.00,
  "cogs": 14000.00,
  "net_profit": 13850.50,
  "acos_overall": 14.77,
  "roas": 6.77,
  "units_sold": 847,
  "daily": [{ "date": "2026-06-01", "revenue": 1400, "spend": 210, "profit": 450 }],
  "by_asin": [{ "asin": "B0...", "name": "...", "revenue": 0, "acos": 0, "units": 0, "profit": 0 }],
  "inventory_alerts": [{ "asin": "B0...", "name": "...", "days_of_supply": 8, "severity": "critical" }]
}
```

### 4. MCP Tools — add to `server/src/index.ts`
Tool 23: `get_pnl_summary` — calls /api/pnl internally, returns full P&L with narrative
Tool 24: `get_inventory_health` — stockout risk ranking, reorder recommendations
Tool 25: `get_advertising_performance` — ACOS by campaign, top/worst performers

### 5. PnlWarRoom Component — `artifact/app/src/components/PnlWarRoom.tsx`
Full-width war room tab replacing the "sources" tab or as a new "War Room" tab:

**Top row — 5 hero KPI cards (use existing KpiCard with use3DTilt):**
- Today's Revenue (green neon border)
- Net Profit MTD (gold neon border)
- Overall ACOS (blue, shows red if >25%)
- Active SKUs (cyan)
- Inventory Health score (green/amber/red based on days_of_supply)

**Middle — dual chart row:**
- Left: 30-day Revenue vs Ad Spend area chart (Recharts AreaChart, two areas)
- Right: Profit waterfall bar chart (Revenue → minus COGS → minus Fees → minus ADS → Net Profit)

**Bottom left — ASIN P&L table:**
Columns: ASIN thumbnail | Name | Revenue | Ad Spend | ACOS | Units | Net Profit | Trend arrow
Sort by Net Profit descending. Color-code ACOS: green <15%, amber 15-25%, red >25%

**Bottom right — Inventory Alert panel:**
List of ASINs sorted by days_of_supply ascending. Show:
- Red pulse dot if <14 days
- Amber dot if 14-30 days
- "REORDER NOW" button that copies a pre-filled supplier email template to clipboard

**Connection banner:**
If SP-API not connected: show amber banner "Connect Seller Central → Settings → SP-API" with link to setup guide

### 6. Wire into Dashboard.tsx
Add tab `["warroom", "War Room", "activity"]` as the SECOND tab (after Overview).
Assign director: `NEXUS` (existing director, reassign from "details" or add new director `COMMAND` for War Room)
Import and render `<PnlWarRoom data={data} />` in the war room tab block.

### 7. Cash Flow Runway Widget — `artifact/app/src/components/CashRunway.tsx`
Small widget that appears in the War Room sidebar:
- Input: current cash balance (stored in localStorage)
- Calculates: at current burn rate (COGS + ads + fees), how many days of inventory can be funded
- Shows: "At $42k/mo gross, you need $18k to fund next reorder cycle. Current runway: 23 days."
- Alert if runway < 30 days

### 8. StatusBar update
When on war room tab, show today's revenue and ACOS in the status bar instead of scan counts.

## Styling
Use existing `theme-ultra.css` vars. Add new CSS block at the bottom:
- `.warroom-grid` — CSS grid, 5-col hero row, 2-col charts, 2-col bottom
- `.pnl-table` — dark glassmorphism table, sticky header, hover row highlight
- `.inventory-alert-item` — flex row, pulse dot, ASIN name, days badge, reorder button
- `.cash-runway-bar` — horizontal gradient bar (green→amber→red based on runway days)

## Definition of Done
- [ ] `GET /api/pnl` returns data (mock if no SP-API keys, real if keys present)
- [ ] War Room tab visible in sidebar as second tab
- [ ] 5 KPI cards with live 3D tilt
- [ ] Revenue vs Spend chart renders with Recharts
- [ ] ASIN P&L table sortable by column header click
- [ ] Inventory alerts show with correct severity colors
- [ ] REORDER NOW copies email template to clipboard
- [ ] Cash runway widget reads from localStorage input
- [ ] Zero TypeScript errors (`npm run build` passes)
- [ ] Commit and push to `claude/ultrathink-site-redesign-t42cvn`
