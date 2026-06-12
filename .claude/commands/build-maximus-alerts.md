# Build: MAXIMUS Proactive Push Intelligence

## Context
MAXIMUS is currently a reactive chatbot in `artifact/app/src/components/MaximusPanel.tsx`.
The Express server is at `server/src/http.ts` (port 3001).
MAXIMUS uses `claude-fable-5` server-side — ANTHROPIC_API_KEY never reaches the browser.
Design system: `artifact/app/src/theme-ultra.css` (deep space glassmorphism).

## What to Build

### 1. Intelligence Engine — `server/src/services/intelligenceEngine.ts`
A background analysis loop that runs every 15 minutes (when server is running):

```typescript
// Runs analysis, generates alerts, stores in memory (ring buffer, last 50)
// Triggers: BSR drops, ACOS spikes, inventory alerts, competitor price changes, listing suppressions
```

Alert types:
```typescript
type AlertSeverity = "critical" | "warning" | "info";
type AlertCategory = "inventory" | "ppc" | "competitor" | "listing" | "opportunity";

interface IntelAlert {
  id: string;
  severity: AlertSeverity;
  category: AlertCategory;
  title: string;           // "Stockout Risk: Pantry Organizer"
  body: string;            // "Days of supply: 8. At current velocity, stockout in 8 days."
  recommendation: string;  // "Reorder 300 units from Wu Liang at $4.20 landed. Email template ready."
  asin?: string;
  data?: Record<string, unknown>;
  createdAt: Date;
  read: boolean;
}
```

Analysis triggers (check each cycle):
- If any ASIN has `days_of_supply < 14` → critical inventory alert
- If any campaign `ACOS > 30%` for 3+ days → warning PPC alert
- If a product's BSR dropped >15% vs 7-day average → warning competitor alert
- If overall revenue dropped >20% vs same day last week → critical alert
- Daily at 7 AM: generate full morning brief via claude-fable-5

Morning brief prompt:
```
You are MAXIMUS, Chief Intelligence Officer for an Amazon FBA seller doing $10-50k/month.
Analyze this data: {batch_summary} {pnl_summary} {inventory_levels}
Generate a sharp morning intelligence brief covering:
1. Overnight revenue and any anomalies
2. Top 1-2 risks that need action TODAY (with specific recommended action)
3. Top opportunity to capture this week
Keep it to 150 words max. Be a CIO, not a chatbot.
```

### 2. Alert HTTP Endpoints — add to `server/src/http.ts`
```
GET  /api/alerts              → returns last 50 alerts, unread count
POST /api/alerts/:id/read     → mark as read
POST /api/alerts/read-all     → mark all read
GET  /api/brief/morning       → trigger on-demand morning brief (SSE streamed)
POST /api/alerts/test         → inject a test alert (dev only)
```

### 3. Push Notification Service — `server/src/services/pushService.ts`
Three delivery channels (all optional, configured via .env):

**SMS via Twilio:**
```
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=
SELLER_PHONE_NUMBER=
```
Send SMS for `critical` severity alerts only. Format: "🔴 MAXIMUS: {title}. {recommendation}"

**Email via SendGrid (or nodemailer SMTP):**
```
SENDGRID_API_KEY=
SELLER_EMAIL=
```
Send formatted HTML email for morning brief and critical alerts.

**iMessage via AppleScript (macOS only):**
Uses existing `agents/src/agents/heraldAgent.ts` pattern.
Only fires if `IMESSAGE_RECIPIENT` set in .env and platform is darwin.

Add to `.env.example`:
```
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_FROM_NUMBER=+1...
SELLER_PHONE_NUMBER=+1...
SENDGRID_API_KEY=
SELLER_EMAIL=
```

### 4. Alert Bell Component — `artifact/app/src/components/AlertBell.tsx`
Place in the topbar (right side, before the Yamari Group badge):

```tsx
// Shows a bell icon with unread count badge (red if critical alerts, amber if warnings)
// Clicking opens AlertDrawer
// Polls GET /api/alerts every 60 seconds
// On new critical alert: fires notify.error() via NotificationBus (existing toast system)
// Red pulsing animation on bell when unread critical alerts exist
```

### 5. Alert Drawer — `artifact/app/src/components/AlertDrawer.tsx`
Slides in from the right (400px wide, full height):

```
Header: "MAXIMUS Intelligence" + "Mark all read" button + close X

Alert list (virtualized if > 20):
  Each alert:
  - Severity color strip on left (red/amber/blue)
  - Category icon (inventory box / megaphone / shield / etc.)
  - Title (bold) + timestamp
  - Body text (2 lines, expandable)
  - Recommendation text (cyan, italic, "→ Action:")
  - If ASIN present: "View Product" button that navigates to details tab
  - "Ask MAXIMUS" button fires maximus:query CustomEvent with the alert body as context

Footer:
  "Morning Brief" button → opens MAXIMUS panel with streaming brief
  "Alert Settings" link → opens notification settings modal
```

### 6. Notification Settings Modal — `artifact/app/src/components/AlertSettings.tsx`
Simple modal triggered from drawer footer:
- Toggle: SMS alerts (shows input for phone if no env var set, else shows masked number)
- Toggle: Email alerts (same pattern)
- Toggle: iMessage (shows "macOS only, set IMESSAGE_RECIPIENT in .env")
- Threshold sliders: "Alert me when ACOS exceeds __% for __ days"
- Threshold: "Alert me when inventory drops below __ days of supply"
- Save to localStorage (frontend preferences) + POST /api/alert-settings

### 7. MAXIMUS Morning Brief in MaximusPanel
Add a "Morning Brief" quick action button to the existing QUICK_ACTIONS array in `artifact/app/src/components/MaximusPanel.tsx`:
```typescript
{ label: "Morning Brief", prompt: "Generate today's morning intelligence brief based on current batch data" }
```
Also: when AlertBell receives a new alert, auto-trigger the MAXIMUS panel to say:
"MAXIMUS ALERT: {alert.title}. {alert.recommendation}"

### 8. MCP Tool additions — `server/src/index.ts`
Tool 26: `get_intelligence_alerts` — returns recent alerts with severity, category, recommendations
Tool 27: `generate_morning_brief` — triggers on-demand AI brief via claude-fable-5, returns streamed text
Tool 28: `configure_push_alerts` — updates alert thresholds and notification preferences

### 9. Wire AlertBell into Dashboard.tsx
In the topbar header section, add `<AlertBell />` between the batch chips and Yamari Group badge.
Import AlertDrawer and render it alongside MaximusPanel (outside the main content area).

## Styling (add to theme-ultra.css)
- `.alert-bell` — position relative, hover scale(1.1), transition
- `.alert-badge` — absolute top-right, red circle, white count text, pulse animation when critical
- `.alert-drawer` — fixed right-0, full height, 400px width, glassmorphism background, slide-in animation
- `.alert-item` — flex row, left border 3px (red/amber/blue by severity), hover background
- `.alert-item--critical` — subtle red glow
- `.alert-item--warning` — subtle amber glow
- `.alert-settings-modal` — centered modal, dark glass background, slider styles

## Definition of Done
- [ ] `GET /api/alerts` returns alert array (with at least 1 seeded test alert)
- [ ] AlertBell visible in topbar with unread count
- [ ] Drawer slides in/out smoothly
- [ ] "Ask MAXIMUS" from an alert opens panel with context pre-filled
- [ ] Morning Brief button streams response in MAXIMUS panel
- [ ] Toast fires via NotificationBus when new critical alert arrives
- [ ] SMS/email/iMessage delivery documented in README section
- [ ] MCP tools 26-28 callable
- [ ] Zero TypeScript errors
- [ ] Commit and push to `claude/ultrathink-site-redesign-t42cvn`
