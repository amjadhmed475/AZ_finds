# MASTER BUILD — Full CEO Roadmap Execution

## Overview
This is the complete build sequence for transforming AZ Finds from a research tool 
into a full Amazon FBA operating system for a $10-50k/month seller.

Run each command in sequence. Each is self-contained and can be resumed if interrupted.

---

## Build Order (must be sequential — each builds on the prior)

### Step 1 — Live P&L War Room
```
/build-pnl-warroom
```
**What it does:** SP-API + Ads API connection, live revenue/ACOS/profit dashboard,
inventory stockout alerts, cash runway widget. The War Room becomes your daily driver.
**Time estimate:** 2-3 hours
**Prerequisite:** None (works with estimates if no SP-API keys)

---

### Step 2 — MAXIMUS Proactive Intelligence
```
/build-maximus-alerts
```
**What it does:** MAXIMUS stops being a chatbot and starts being a CIO.
Background analysis loop, 7 AM morning brief, push alerts via SMS/email/iMessage,
Alert Bell in topbar with severity-colored drawer.
**Time estimate:** 2-3 hours
**Prerequisite:** Step 1 (uses P&L data for alerts)

---

### Step 3 — Supplier CRM + Reorder Engine
```
/build-supplier-crm
```
**What it does:** SQLite-backed supplier CRM with contact management, order history,
AI-drafted negotiation emails, auto reorder recommendations, PO generator.
Never miss a reorder again.
**Time estimate:** 3-4 hours
**Prerequisite:** Step 1 (reorder engine uses inventory data)

---

### Step 4 — Team Mode
```
/build-team-mode
```
**What it does:** JWT auth, 5 roles (owner/manager/sourcer/ppc_manager/viewer),
product comment threads, approval workflows, team avatars, invite system.
Ready to scale from solo to team.
**Time estimate:** 3-4 hours
**Prerequisite:** Step 3 (uses same SQLite database)

---

### Step 5 — Mobile War Room
```
/build-mobile-warroom
```
**What it does:** 3-number mobile view (revenue/spend/profit), bottom tab navigation,
swipe gestures, product bottom sheets, fullscreen MAXIMUS on mobile, PWA for home screen install.
**Time estimate:** 2-3 hours
**Prerequisite:** Steps 1-2 (uses P&L data and alerts)

---

## Environment Variables Needed

Set these in root `.env` before running builds (add real values for full functionality):

```bash
# MAXIMUS AI — Required for all AI features
ANTHROPIC_API_KEY=sk-ant-...

# Amazon SP-API — Required for live P&L (Step 1)
SP_API_REFRESH_TOKEN=
SP_API_CLIENT_ID=
SP_API_CLIENT_SECRET=
SP_API_MARKETPLACE_ID=ATVPDKIKX0DER

# Amazon Advertising API — Required for live ACOS (Step 1)
ADS_CLIENT_ID=
ADS_CLIENT_SECRET=
ADS_REFRESH_TOKEN=
ADS_PROFILE_ID=

# Push Notifications — Required for MAXIMUS alerts (Step 2)
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=+1...
SELLER_PHONE_NUMBER=+1...
SENDGRID_API_KEY=
SELLER_EMAIL=

# iMessage (macOS only, Step 2)
IMESSAGE_RECIPIENT=+1...

# Team Auth — Required for Step 4
JWT_SECRET=generate-with-openssl-rand-hex-32

# Existing
RETAILERAPI_KEY=
KEEPA_API_KEY=
MAXIMUS_PORT=3001
```

**Get SP-API credentials:**
1. Go to Seller Central → Apps & Services → Develop Apps
2. Create a new app → Self-Authorized → grant Reports + Inventory + Advertising access
3. Generate refresh token via Login with Amazon (LWA)
Full guide: https://developer-docs.amazon.com/sp-api/docs/sp-api-registration-overview

**Get Advertising API credentials:**
1. Go to advertising.amazon.com → API Access
2. Create application → copy Profile ID from your account

---

## Architecture After All Steps

```
AZ Finds (Full Stack)
├── artifact/app/          React 18 + TypeScript frontend
│   ├── MobileWarRoom      3-number mobile view (PWA)
│   ├── Dashboard          15-tab desktop command center
│   ├── PnlWarRoom         Live P&L with SP-API data
│   ├── AlertBell          Real-time intelligence alerts
│   ├── SupplierCRM        SQLite-backed supplier management
│   ├── ApprovalQueue      Team workflows + comments
│   ├── CommandPalette     ⌘K search + MAXIMUS queries
│   └── MaximusPanel       Streaming AI chat (claude-fable-5)
│
├── server/src/
│   ├── index.ts           MCP stdio server (32 tools)
│   ├── http.ts            Express API (port 3001)
│   ├── db/database.ts     SQLite (suppliers, users, tasks)
│   └── services/
│       ├── spApiService.ts        Amazon SP-API
│       ├── adsApiService.ts       Amazon Ads API
│       ├── intelligenceEngine.ts  Background alert analyzer
│       ├── reorderEngine.ts       Stockout + reorder logic
│       ├── emailDrafter.ts        AI supplier emails
│       └── pushService.ts         SMS/email/iMessage delivery
│
├── netlify/edge-functions/
│   └── maximus.ts         Production SSE (Deno, key server-side)
│
└── agents/src/            Multi-agent pipeline
    ├── orchestrator.ts    Mission pipeline (Scout→Maximus→Herald)
    └── agents/            Error detection + daily briefing
```

---

## Deployment Checklist (after all builds complete)

### Local Dev
```bash
./start.sh   # starts server (3001) + Vite (5174)
```

### Netlify Production
1. Set all env vars in Netlify dashboard (never in git)
2. `git push origin claude/ultrathink-site-redesign-t42cvn`
3. Netlify auto-deploys from `artifact/app/` directory
4. Edge function handles /api/maximus in production
5. Note: SP-API, Ads API, and database calls need a persistent server
   → For full production: deploy Express server to Railway/Render alongside Netlify

### Database for Production
SQLite works locally. For production team access:
- Option A: Deploy Express to Railway (includes SQLite persistence)
- Option B: Migrate to PlanetScale (MySQL) or Supabase (Postgres) — both have free tiers
- Option C: Use Turso (SQLite edge database) — drops in as a near-zero change

---

## Quick Status Check
After each build step, run:
```bash
npm run build   # in artifact/app/ — must show zero TypeScript errors
./start.sh      # both servers start cleanly
```
Then take screenshots to verify the new features visually.
