# Build: Team Mode — Roles, Comments, Approval Workflows

## Context
AZ Finds — React 18 + TypeScript + Vite 5.
Server: `server/src/http.ts` (Express, port 3001).
Database: SQLite at `data/azfinds.db` (created by build-supplier-crm, or create if not exists).
Design system: `artifact/app/src/theme-ultra.css`.
Auth: lightweight JWT — no external auth provider needed at this stage.

## What to Build

### 1. Auth Tables — add to `server/src/db/database.ts`
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer',  -- owner|manager|sourcer|ppc_manager|viewer
  password_hash TEXT NOT NULL,          -- bcrypt hash
  avatar_color TEXT DEFAULT '#3b82f6',  -- hex color for avatar initials
  active INTEGER DEFAULT 1,
  last_seen TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  token TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE product_comments (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,  -- links to product in sample-dashboard.json by id field
  user_id TEXT REFERENCES users(id),
  content TEXT NOT NULL,
  type TEXT DEFAULT 'general',  -- general|research|risk|approved|rejected
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE approval_tasks (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to TEXT REFERENCES users(id),
  assigned_by TEXT REFERENCES users(id),
  status TEXT DEFAULT 'pending',  -- pending|in_review|approved|rejected|needs_info
  priority TEXT DEFAULT 'normal', -- low|normal|high|urgent
  due_date TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE activity_log (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  action TEXT NOT NULL,   -- e.g. "approved_product", "added_supplier", "commented"
  entity_type TEXT,       -- "product"|"supplier"|"order"|"task"
  entity_id TEXT,
  metadata TEXT,          -- JSON string with extra context
  created_at TEXT DEFAULT (datetime('now'))
);
```

### 2. Role Permission Matrix
```typescript
const PERMISSIONS = {
  owner:       { canApprove: true,  canReject: true,  canManageTeam: true,  canSeePnl: true,  canManageSuppliers: true, canManagePpc: true },
  manager:     { canApprove: true,  canReject: true,  canManageTeam: false, canSeePnl: true,  canManageSuppliers: true, canManagePpc: true },
  sourcer:     { canApprove: false, canReject: false, canManageTeam: false, canSeePnl: false, canManageSuppliers: true, canManagePpc: false },
  ppc_manager: { canApprove: false, canReject: false, canManageTeam: false, canSeePnl: true,  canManageSuppliers: false, canManagePpc: true },
  viewer:      { canApprove: false, canReject: false, canManageTeam: false, canSeePnl: false, canManageSuppliers: false, canManagePpc: false },
};
```

Hide tabs based on role:
- War Room P&L: `owner` and `manager` only
- Capital Planner: `owner` and `manager` only
- PPC Manager: `owner`, `manager`, `ppc_manager`
- Supplier CRM: `owner`, `manager`, `sourcer`
- All research tabs: all roles

### 3. Auth Endpoints — add to `server/src/http.ts`
```
POST /api/auth/register     → first user becomes owner (no invite needed), subsequent require invite
POST /api/auth/login        → email + password → JWT token (7-day expiry)
POST /api/auth/logout       → invalidate session token
GET  /api/auth/me           → returns current user from Bearer token
POST /api/auth/invite       → owner/manager sends invite link (token stored in DB, valid 48h)
GET  /api/auth/invite/:token → validates invite token, returns email pre-filled
POST /api/auth/accept-invite → completes registration from invite

GET  /api/team              → list all team members (owner/manager only)
PUT  /api/team/:id          → update role or deactivate
DELETE /api/team/:id        → remove user (owner only)
```

Auth middleware:
```typescript
// middleware/auth.ts
// Reads Bearer token from Authorization header
// Attaches req.user = { id, email, name, role } to request
// Returns 401 if missing/invalid/expired
// Returns 403 if role doesn't have required permission
```

### 4. Comment + Task Endpoints — add to `server/src/http.ts`
```
GET  /api/products/:id/comments    → get all comments for a product
POST /api/products/:id/comments    → add comment (authenticated)
DELETE /api/comments/:id           → delete own comment or any (if owner)

GET  /api/tasks                    → list tasks assigned to me or all (if owner)
POST /api/tasks                    → create approval task
PUT  /api/tasks/:id                → update status/notes
GET  /api/tasks/pending            → pending tasks count (for badge)

GET  /api/activity                 → recent activity feed (last 50 items)
```

### 5. Login Page — `artifact/app/src/components/LoginPage.tsx`
Shown when no valid JWT in localStorage.

Layout: centered card, glassmorphism, AZ Finds logo at top.
- Email input + Password input
- "Sign In" button (calls POST /api/auth/login, stores token in localStorage)
- "First time? Set up your account" link (shown if 0 users exist — check GET /api/auth/status)
- Error toast via NotificationBus on failed login

Register flow (first user / invite):
- Name + Email + Password (min 12 chars) + Role (invite-only for non-first)
- Password strength indicator

### 6. AuthContext — `artifact/app/src/contexts/AuthContext.tsx`
```typescript
interface AuthContextValue {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  can: (permission: keyof typeof PERMISSIONS[Role]) => boolean;
  loading: boolean;
}
```

Wrap `<App />` in `<AuthProvider>` in `main.tsx`.
All API calls in the app include `Authorization: Bearer {token}` header.

### 7. TeamAvatar Component — `artifact/app/src/components/TeamAvatar.tsx`
```tsx
// Shows initials in a colored circle (color from user.avatar_color)
// Sizes: sm (24px), md (32px), lg (48px)
// Tooltip on hover shows full name + role
// Group variant: stacked overlapping avatars showing who's "online" (last_seen < 5min)
```
Show TeamAvatar group in the topbar (right side, before AlertBell).

### 8. Product Comment Thread — `artifact/app/src/components/CommentThread.tsx`
Add to `ProductCard` component (in the product card detail/modal):

```
[Comment Thread]
──────────────────────────────────────────
Ahmed (Sourcer) · 2h ago · [research]
  "Checked gating on ATLAS — cleared for standard account. 
   Supplier on Alibaba has 4.8 stars, 500+ transactions."

You (Owner) · 1h ago · [approved]  ✓
  "Approved. Ahmed please create order with Wu Liang."
──────────────────────────────────────────
[Add comment...]          [research ▼] [Post]
```

Comment types (colored tags): general (gray) | research (blue) | risk (red) | approved (green) | rejected (red)
Only `owner`/`manager` can post `approved`/`rejected` type.
When a comment of type `approved` is posted → product card gets a green "APPROVED" badge.

### 9. Approval Workflow Panel — `artifact/app/src/components/ApprovalQueue.tsx`
New tab: "Approvals" (show only if user has `canApprove` or has tasks assigned to them).

Layout:
```
Pending Approval (3)          My Tasks (2)          Recent Activity
─────────────────────────────────────────────────────────────────
[Product Card] Pantry Organizer    URGENT
  Assigned by: Ahmed (Sourcer)
  "Please review — meets all A5 criteria, supplier ready"
  [View Product] [Approve ✓] [Reject ✗] [Need More Info ...]

[Product Card] Garage Organizer    HIGH
  Assigned to: You
  Due: Tomorrow
  [View Product] [Update Status ▼]
```

Activity feed (right panel):
- "Ahmed approved Pantry Organizer" · 10m ago
- "You rejected Bamboo Shelf" · 2h ago — with rejection reason
- "Carlos added supplier Wu Liang" · 3h ago

### 10. Team Management Page — accessible from sidebar footer
Only visible to `owner`. Shows:
- Team member list: avatar | name | email | role dropdown | last seen | deactivate button
- "Invite Team Member" button → generates invite link with role pre-set
- Copy invite link to clipboard (valid 48h, show expiry)
- Activity summary per member (tasks completed this week)

### 11. Wire into App.tsx
```tsx
// In App.tsx:
// 1. Check localStorage for JWT token
// 2. If no token: render <LoginPage />
// 3. If token: validate with GET /api/auth/me
//    - If valid: proceed to Dashboard
//    - If expired: render <LoginPage /> with "Session expired" message
// 4. Pass can() helper down via AuthContext so components hide/show based on role
```

In `Dashboard.tsx`:
- Filter `tabs` array using `can()` — hide P&L/Capital from non-managers
- Add "Approvals" tab (show badge count from `/api/tasks/pending`)
- Add `<TeamAvatar />` group to topbar

### 12. Seed Data — `server/src/db/seeds.ts`
Create `npm run db:seed` script that:
- Creates default owner account: `owner@azfinds.local` / `AZFinds2026!`
- Logs credentials to console on first run
- Only runs if `users` table is empty

## Styling (add to theme-ultra.css)
- `.login-card` — centered, 420px, glassmorphism, fade-in animation
- `.comment-thread` — flex col, gap 8px, padding inside card modal
- `.comment-item` — flex row, avatar | content, subtle border-bottom
- `.comment-tag` — small colored chip (general/research/risk/approved/rejected)
- `.approval-queue` — 3-col layout like Kanban but list view
- `.task-card` — glass card, left border by priority color, action buttons
- `.team-avatar-group` — flex row, negative margin-left for stacking, z-index layered
- `.password-strength` — horizontal bar filling left to right (red→amber→green)

## Security Notes
- Passwords: use `bcrypt` with salt rounds = 12
- JWT secret: loaded from `JWT_SECRET` env var (add to .env.example)
- All /api/* routes except /auth/login and /auth/register require valid JWT
- Role checks happen server-side, not just client-side
- Add `JWT_SECRET=` to `.env.example`

## Definition of Done
- [ ] First user registration works (creates owner account)
- [ ] Login returns JWT, stored in localStorage
- [ ] Tabs hidden based on role (test with sourcer role)
- [ ] Comments save to DB and appear in product card modal
- [ ] Approval workflow: assign → review → approve creates green APPROVED badge
- [ ] Team management page lists users and invite link works
- [ ] TeamAvatar group shows in topbar
- [ ] Activity feed shows recent actions
- [ ] Zero TypeScript errors
- [ ] Commit and push to `claude/ultrathink-site-redesign-t42cvn`
