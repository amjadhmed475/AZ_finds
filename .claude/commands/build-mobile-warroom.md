# Build: Mobile War Room — 3-Number View + Responsive Overhaul

## Context
AZ Finds — React 18 + TypeScript + Vite 5.
Design system: `artifact/app/src/theme-ultra.css` (deep space glassmorphism).
The current app is desktop-only and unusable on mobile.
Goal: seller checks this on their phone at 11 PM, sees 3 numbers instantly, no scrolling.

## What to Build

### 1. Mobile Detection Hook — `artifact/app/src/hooks/useIsMobile.ts`
```typescript
export function useIsMobile(breakpoint = 768) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < breakpoint);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < breakpoint);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, [breakpoint]);
  return isMobile;
}
```

### 2. Mobile War Room Screen — `artifact/app/src/components/MobileWarRoom.tsx`
Renders when `isMobile === true` AND data is loaded (replaces full Dashboard on mobile).

**Full screen layout (100dvh, no scroll on the root):**

```
┌─────────────────────────────────┐
│  AZ Finds           [M] [🔔]   │  ← topbar: 48px, logo + MAXIMUS + alerts
├─────────────────────────────────┤
│                                 │
│   TODAY'S REVENUE               │
│   $1,847.50          ↑ 12%      │  ← hero number, 72px font, gold neon
│                                 │
│   AD SPEND  $284    NET  $891   │  ← secondary row, 28px font
│                                 │
├─────────────────────────────────┤
│  🔴 Pantry Bins — 8 days left   │  ← alerts ticker, scrolls horizontally if >1
├─────────────────────────────────┤
│  [Overview] [Products] [Alerts] │  ← bottom tab bar (3 tabs only on mobile)
│  [Suppliers] [MAXIMUS]          │
└─────────────────────────────────┘
```

**Section: Hero Numbers (top 55% of screen)**
- "TODAY'S REVENUE" label (tiny caps, muted)
- Revenue number: animated counter, 72px, gold neon, letter-spacing -2px
- Change vs yesterday: "↑ 12% vs yesterday" (green) or "↓ 8% vs yesterday" (red)
- Second row: "AD SPEND $284 · NET PROFIT $891" — two numbers, 28px, separated by dot

If SP-API not connected: show estimates from sample data with "(est.)" label.

**Section: Alert Ticker (thin strip, 44px)**
- Horizontal scrolling marquee of active alerts
- Red background if any critical, amber if warnings only, blue if info
- Tap to open Alert Drawer

**Section: Bottom Tab Bar (fixed, 64px)**
5 tabs in bottom nav (iOS-style):
- Overview (house icon) — shows hero numbers view
- Products (grid icon) — shows scrollable product list
- Alerts (bell icon) — shows alert drawer inline
- Suppliers (truck icon) — shows supplier list (read-only on mobile)
- MAXIMUS (M icon) — opens fullscreen MAXIMUS chat

### 3. Mobile Product List — `artifact/app/src/components/MobileProductList.tsx`
Simple vertical scroll of product cards optimized for thumb:

Each card (full width, 120px height):
```
[Grade] Product Name (truncated 1 line)           [$4.20 landed]
        ROI: 124% · Margin: 18% · Risk: Low       [A5] badge
```
- Tap card → slides in product detail panel from bottom (bottom sheet)
- Bottom sheet: full product info, scrollable, close by swiping down
- "Ask MAXIMUS" button in bottom sheet footer

### 4. Mobile MAXIMUS — fullscreen chat
When MAXIMUS tab selected on mobile, render full-screen chat (100dvh):
- Top: MAXIMUS header with arc reactor + close button
- Middle: message list (scrollable)
- Bottom: input + send button (keyboard-aware, moves up with keyboard)
- Quick actions rendered as horizontal scrolling chips above input

### 5. Responsive CSS Overhaul — `artifact/app/src/theme-ultra.css`
Add a comprehensive mobile block at the end of the file:

```css
@media (max-width: 767px) {
  /* Hide desktop shell entirely */
  .shell { display: none !important; }
  
  /* Mobile war room */
  .mobile-warroom { display: flex; flex-direction: column; height: 100dvh; }
  
  /* Hero numbers */
  .mobile-hero { flex: 1; display: flex; flex-direction: column; 
                 justify-content: center; align-items: center; padding: 24px; }
  .mobile-hero-label { font-size: 11px; letter-spacing: 3px; color: var(--u-muted); text-transform: uppercase; }
  .mobile-hero-number { font-size: 72px; font-weight: 700; color: var(--u-neon-gold);
                        letter-spacing: -3px; line-height: 1; margin: 8px 0; }
  .mobile-hero-change { font-size: 16px; }
  .mobile-hero-secondary { display: flex; gap: 24px; margin-top: 16px; }
  .mobile-hero-secondary-item { text-align: center; }
  .mobile-hero-secondary-label { font-size: 10px; color: var(--u-muted); }
  .mobile-hero-secondary-value { font-size: 22px; font-weight: 600; }
  
  /* Alert ticker */
  .mobile-alert-ticker { height: 44px; display: flex; align-items: center; 
                          padding: 0 16px; overflow: hidden; }
  .mobile-alert-scroll { white-space: nowrap; animation: tickerScroll 20s linear infinite; }
  @keyframes tickerScroll { from { transform: translateX(100vw); } to { transform: translateX(-100%); } }
  
  /* Bottom tab bar */
  .mobile-tabs { height: 64px; display: flex; border-top: 1px solid var(--u-border);
                  background: var(--u-card); }
  .mobile-tab { flex: 1; display: flex; flex-direction: column; align-items: center;
                 justify-content: center; gap: 3px; border: none; background: none;
                 color: var(--u-muted); font-size: 10px; cursor: pointer; }
  .mobile-tab.active { color: var(--u-neon-blue); }
  .mobile-tab svg { width: 22px; height: 22px; }
  
  /* Product list */
  .mobile-product-list { flex: 1; overflow-y: auto; padding: 8px; }
  .mobile-product-card { display: flex; justify-content: space-between; align-items: center;
                           padding: 12px 16px; margin-bottom: 8px; border-radius: 12px;
                           background: var(--u-card); border: 1px solid var(--u-border); }
  
  /* Bottom sheet */
  .mobile-bottom-sheet { position: fixed; bottom: 0; left: 0; right: 0;
                           background: var(--u-deep); border-radius: 20px 20px 0 0;
                           max-height: 85dvh; overflow-y: auto;
                           transform: translateY(0); transition: transform 0.3s ease;
                           border-top: 1px solid var(--u-border-hi); }
  .mobile-bottom-sheet--hidden { transform: translateY(100%); }
  .mobile-sheet-handle { width: 40px; height: 4px; background: var(--u-border-hi);
                          border-radius: 2px; margin: 12px auto; }
  
  /* Fullscreen MAXIMUS on mobile */
  .maximus-panel { position: fixed; inset: 0; width: 100vw; height: 100dvh;
                    border-radius: 0; right: 0; bottom: 0; }
  .maximus-fab { display: none; }  /* FAB hidden, tab bar is the trigger */
  
  /* Hide desktop-only elements */
  .status-bar { display: none; }
  .starfield { display: none; }  /* performance on mobile */
  .cmd-overlay { display: none; }  /* cmd palette not needed on mobile */
  
  /* Topbar minimal */
  .topbar { height: 48px; padding: 0 16px; }
  .topbar-head p { display: none; }  /* hide eyebrow on mobile */
  .topbar-head h1 { font-size: 18px; }
  .topbar-right .founders-badge { display: none; }
  .topbar-right .batch-chip { display: none; }
}

@media (max-width: 767px) and (prefers-color-scheme: dark) {
  /* Ensure OLED blacks on mobile */
  body { background: #000000; }
  .mobile-warroom { background: #000000; }
}
```

### 6. Swipe Gestures — `artifact/app/src/hooks/useSwipe.ts`
```typescript
export function useSwipe(onSwipeLeft?: () => void, onSwipeRight?: () => void, onSwipeDown?: () => void) {
  // Touch start: record x, y
  // Touch end: calculate deltaX, deltaY
  // If |deltaX| > 50 and |deltaX| > |deltaY|: left/right swipe
  // If deltaY > 80: swipe down
  // Attach to ref, return { ref }
}
```
Use in:
- MobileWarRoom: swipe left/right to change active tab
- MobileBottomSheet: swipe down to close

### 7. PWA Support — `artifact/app/public/manifest.json` + service worker
Make AZ Finds installable on iPhone home screen:

`manifest.json`:
```json
{
  "name": "AZ Finds",
  "short_name": "AZ Finds",
  "description": "Amazon Seller Research Command Center",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#080c14",
  "theme_color": "#3b82f6",
  "orientation": "portrait-primary",
  "icons": [
    { "src": "/favicon.svg", "sizes": "any", "type": "image/svg+xml", "purpose": "any maskable" }
  ]
}
```

Add to `index.html`:
```html
<link rel="manifest" href="/manifest.json">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="theme-color" content="#080c14">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
```

Basic service worker at `artifact/app/public/sw.js`:
- Cache shell assets on install
- Network-first for API calls
- Cache-first for static assets

Register in `main.tsx`:
```typescript
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/sw.js');
}
```

### 8. Wire into App.tsx
```tsx
import { useIsMobile } from "./hooks/useIsMobile";
import { MobileWarRoom } from "./components/MobileWarRoom";

// In App component, after data loads:
const isMobile = useIsMobile();

if (data) {
  return isMobile ? <MobileWarRoom data={data} /> : <Dashboard data={data} />;
}
```

## Definition of Done
- [ ] Desktop layout unchanged — zero regressions at ≥768px
- [ ] At 390px (iPhone 14), shows MobileWarRoom with 3-number hero
- [ ] Revenue/spend/profit numbers visible without any scrolling
- [ ] Alert ticker scrolls if active alerts exist
- [ ] Bottom tab bar switches between views
- [ ] Product list scrollable, tapping card opens bottom sheet
- [ ] MAXIMUS tab opens full-screen chat on mobile
- [ ] Swipe left/right changes mobile tabs
- [ ] PWA installable: "Add to Home Screen" on iOS shows AZ Finds icon
- [ ] Standalone mode (launched from home screen) hides Safari UI
- [ ] Zero TypeScript errors
- [ ] Test at 390px, 430px, 768px breakpoints in browser devtools
- [ ] Commit and push to `claude/ultrathink-site-redesign-t42cvn`
