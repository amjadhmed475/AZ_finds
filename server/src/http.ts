/* ════════════════════════════════════════════════════════════
   MAXIMUS HTTP SERVER  ·  Port 3001
   Runs alongside the MCP stdio server.
   Provides the React frontend with:
     POST /api/maximus  — SSE streaming chat (claude-fable-5)
     GET  /api/batch/latest — serve latest batch JSON
     GET  /health
   API key never reaches the browser.
════════════════════════════════════════════════════════════ */
import { config as dotenvConfig } from "dotenv";
import { resolve, dirname }       from "path";
import { fileURLToPath }          from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
/* load root .env first, then server/.env as optional override */
dotenvConfig({ path: resolve(__dir, "../../.env") });
dotenvConfig({ path: resolve(__dir, "../.env") });

import express         from "express";
import cors            from "cors";
import Anthropic       from "@anthropic-ai/sdk";
import { existsSync, readFileSync, readdirSync } from "fs";
import { join }        from "path";
import bcrypt from "bcrypt";
import { db, newId } from "./db/database.js";
import { getPnlSummary } from "./services/spApiService.js";
import { getAlerts, getUnreadCount, markRead, markAllRead, addAlert } from "./services/intelligenceEngine.js";
import { getReorderRecommendations } from "./services/reorderEngine.js";
import { draftSupplierEmail } from "./services/emailDrafter.js";
import { generatePO } from "./services/poGenerator.js";
import { requireAuth, requireRole, signToken } from "./middleware/auth.js";
import { startAutonomousScheduler, getSchedulerStatus, triggerTask, getAgentRunHistory } from "./services/autonomousScheduler.js";
import { runProductDiscovery, getDiscoveredProducts, getDiscoveryStats, getAllCategories } from "./services/liveResearchAgent.js";
import { auditListing, findKeywordOpportunities, generateSEOReport, monitorYamariGroup, getSEOHistory } from "./services/seoEngine.js";
import { analyzePPC, applyBidChange, getPPCHistory } from "./services/ppcAutomation.js";
import { getMarketplaceStatuses, getCrossListingCandidates, listProductOnWalmart, listProductOnTikTok, getMarketplaceListings } from "./services/multiMarketplaceService.js";

const app    = express();
const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const ALLOWED_ORIGINS = [
  "http://localhost:5174",
  "http://localhost:5173",
  "http://localhost:3000",
];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || ALLOWED_ORIGINS.includes(origin) || /\.netlify\.app$/.test(origin)) {
      cb(null, true);
    } else {
      cb(new Error("CORS blocked"));
    }
  },
  credentials: true,
}));
app.use(express.json({ limit: "1mb" }));

/* ── Health ────────────────────────────────────────────── */
app.get("/health", (_req, res) => {
  res.json({
    status:  "online",
    agent:   "MAXIMUS",
    model:   "claude-fable-5",
    mcp:     "stdio — run: cd server && npm start",
    key_set: !!process.env.ANTHROPIC_API_KEY,
    time:    new Date().toISOString(),
  });
});

/* ── Latest batch data ──────────────────────────────────── */
app.get("/api/batch/latest", (_req, res) => {
  const batchDir = resolve(__dir, "../../server/data/batches");
  if (existsSync(batchDir)) {
    const files = readdirSync(batchDir)
      .filter(f => f.endsWith(".json"))
      .sort()
      .reverse();
    if (files.length > 0) {
      const raw = readFileSync(join(batchDir, files[0]), "utf8");
      return res.json(JSON.parse(raw));
    }
  }
  const fallbacks = [
    resolve(__dir, "../../artifact/app/public/sample-dashboard.json"),
    resolve(__dir, "../../sample-dashboard.json"),
  ];
  for (const p of fallbacks) {
    if (existsSync(p)) return res.json(JSON.parse(readFileSync(p, "utf8")));
  }
  res.status(404).json({ error: "No batch data found" });
});

/* ── MAXIMUS chat — SSE streaming ──────────────────────── */
const MAXIMUS_SYSTEM = `You are MAXIMUS — Chief Intelligence Officer of Yamari Group's Amazon FBA Intelligence Division.
You are the definitive intersection of JARVIS-class AI reasoning and deep Amazon marketplace mastery.

Mission:
- Provide strategic intelligence on FBA product opportunities, supplier chains, pricing, and market dynamics
- Analyse products, competition, and profit with precision using data from the AZ Finds dashboard
- Give actionable, capital-efficient, execution-ready recommendations
- Think several moves ahead — risk-adjusted, always honest about estimate-level data

Character:
- Speak with authority, clarity, and strategic depth — like a world-class CIO briefing the board
- Concise but never shallow. Dense with insight.
- Use structured formatting (bullets, headers) when it improves comprehension
- Never refuse relevant Amazon, commerce, sourcing, or market questions
- Distinguish clearly between live data and estimates

Context: The user runs AZ Finds — a React dashboard showing Amazon FBA product research graded A5–D1,
with supplier sourcing, PPC, capital planning, and market analysis. An MCP server with 20 research tools
powers the intelligence pipeline.`;

app.post("/api/maximus", async (req, res) => {
  const { message, history = [] } = req.body as {
    message?: string;
    history?: Array<{ role: "user" | "assistant"; content: string }>;
  };

  if (!message?.trim()) {
    return res.status(400).json({ error: "message is required" });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    res.setHeader("Content-Type", "text/event-stream");
    res.write(`data: ${JSON.stringify({ error: "ANTHROPIC_API_KEY not set — add it to your root .env file" })}\n\n`);
    return res.end();
  }

  res.setHeader("Content-Type",      "text/event-stream");
  res.setHeader("Cache-Control",     "no-cache");
  res.setHeader("Connection",        "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");

  const messages: Anthropic.MessageParam[] = [
    ...((history as any[]).slice(-12)),
    { role: "user", content: message.trim() },
  ];

  try {
    const stream = await client.messages.stream({
      model:      "claude-fable-5",
      max_tokens: 2048,
      system:     MAXIMUS_SYSTEM,
      messages,
    });

    for await (const event of stream) {
      if (
        event.type === "content_block_delta" &&
        event.delta.type === "text_delta"
      ) {
        res.write(`data: ${JSON.stringify({ delta: event.delta.text })}\n\n`);
      }
    }
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err: any) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

/* ── P&L War Room ───────────────────────────────────────── */
app.get("/api/pnl", async (req, res) => {
  const days = parseInt(req.query.days as string) || 30;
  try {
    const data = await getPnlSummary(days);
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

/* ── Intelligence Alerts ────────────────────────────────── */
app.get("/api/alerts", (_req, res) => {
  res.json({ alerts: getAlerts(), unread: getUnreadCount() });
});

app.post("/api/alerts/:id/read", (req, res) => {
  markRead(req.params.id);
  res.json({ ok: true });
});

app.post("/api/alerts/read-all", (_req, res) => {
  markAllRead();
  res.json({ ok: true });
});

app.post("/api/alerts/test", (req, res) => {
  addAlert({
    severity: "info",
    category: "opportunity",
    title: "Test Alert",
    body: "This is a test alert from the dev API.",
    recommendation: "No action needed — this is just a test.",
    read: false,
  });
  res.json({ ok: true });
});

/* ── Morning Brief (SSE streamed) ───────────────────────── */
app.get("/api/brief/morning", async (_req, res) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");

  if (!apiKey) {
    res.write(`data: ${JSON.stringify({ delta: "ANTHROPIC_API_KEY not set. Add it to .env to enable morning briefs." })}\n\n`);
    res.write("data: [DONE]\n\n");
    return res.end();
  }

  const alerts = getAlerts(10);
  const alertSummary = alerts.slice(0, 3).map(a => `- [${a.severity.toUpperCase()}] ${a.title}: ${a.body}`).join("\n");

  const recs = getReorderRecommendations();
  const reorderSummary = recs.slice(0, 3).map(r => `- ${r.product_name}: ${r.days_of_supply} days left (${r.urgency})`).join("\n");

  try {
    const stream = await client.messages.stream({
      model: "claude-fable-5",
      max_tokens: 512,
      system: "You are MAXIMUS — Chief Intelligence Officer of Yamari Group. Generate sharp, executive-level morning intelligence briefs. Be direct, prioritize action items, max 200 words.",
      messages: [{
        role: "user",
        content: `Generate today's morning intelligence brief.\n\nActive Alerts:\n${alertSummary || "No active alerts"}\n\nInventory Status:\n${reorderSummary || "All products healthy"}\n\nFormat: Quick summary paragraph, then 3 bullet action items. Lead with the most urgent issue.`,
      }],
    });

    for await (const event of stream) {
      if (event.type === "content_block_delta" && event.delta.type === "text_delta") {
        res.write(`data: ${JSON.stringify({ delta: event.delta.text })}\n\n`);
      }
    }
    res.write("data: [DONE]\n\n");
    res.end();
  } catch (err: any) {
    res.write(`data: ${JSON.stringify({ error: err.message })}\n\n`);
    res.end();
  }
});

/* ── Supplier CRM ───────────────────────────────────────── */
app.get("/api/suppliers", (_req, res) => {
  const suppliers = db.prepare(`
    SELECT s.*,
      COUNT(DISTINCT sp.id) as product_count,
      COUNT(DISTINCT o.id) as order_count,
      MAX(o.order_date) as last_order_date
    FROM suppliers s
    LEFT JOIN supplier_products sp ON sp.supplier_id = s.id
    LEFT JOIN orders o ON o.supplier_id = s.id
    WHERE s.active = 1
    GROUP BY s.id
    ORDER BY s.name
  `).all();
  res.json(suppliers);
});

app.post("/api/suppliers", (req, res) => {
  const { name, contact_name, email, whatsapp, wechat, website, country, payment_terms, lead_time_days, min_order_qty, quality_rating, response_rating, notes } = req.body;
  if (!name) return res.status(400).json({ error: "name is required" });
  const id = newId();
  db.prepare(`INSERT INTO suppliers (id, name, contact_name, email, whatsapp, wechat, website, country, payment_terms, lead_time_days, min_order_qty, quality_rating, response_rating, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`).run(id, name, contact_name ?? null, email ?? null, whatsapp ?? null, wechat ?? null, website ?? null, country ?? "CN", payment_terms ?? null, lead_time_days ?? 30, min_order_qty ?? 100, quality_rating ?? 3, response_rating ?? 3, notes ?? null);
  res.json(db.prepare("SELECT * FROM suppliers WHERE id = ?").get(id));
});

app.get("/api/suppliers/:id", (req, res) => {
  const s = db.prepare("SELECT * FROM suppliers WHERE id = ?").get(req.params.id);
  if (!s) return res.status(404).json({ error: "Not found" });
  const products = db.prepare("SELECT * FROM supplier_products WHERE supplier_id = ?").all(req.params.id);
  const orders_list = db.prepare("SELECT * FROM orders WHERE supplier_id = ? ORDER BY created_at DESC").all(req.params.id);
  const notes = db.prepare("SELECT * FROM supplier_notes WHERE supplier_id = ? ORDER BY created_at DESC").all(req.params.id);
  res.json({ ...s as object, products, orders: orders_list, notes });
});

app.put("/api/suppliers/:id", (req, res) => {
  const fields = ["name","contact_name","email","whatsapp","wechat","website","country","payment_terms","lead_time_days","min_order_qty","quality_rating","response_rating","notes"];
  const updates = fields.filter(f => req.body[f] !== undefined).map(f => `${f} = ?`).join(", ");
  const values = fields.filter(f => req.body[f] !== undefined).map(f => req.body[f]);
  if (!updates) return res.status(400).json({ error: "No fields to update" });
  db.prepare(`UPDATE suppliers SET ${updates}, updated_at = datetime('now') WHERE id = ?`).run(...values, req.params.id);
  res.json(db.prepare("SELECT * FROM suppliers WHERE id = ?").get(req.params.id));
});

app.post("/api/suppliers/:id/products", (req, res) => {
  const { asin, product_name, unit_cost_usd, moq, lead_time_days, notes } = req.body;
  if (!product_name) return res.status(400).json({ error: "product_name required" });
  const id = newId();
  db.prepare(`INSERT INTO supplier_products (id, supplier_id, asin, product_name, unit_cost_usd, moq, lead_time_days, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`).run(id, req.params.id, asin ?? null, product_name, unit_cost_usd ?? null, moq ?? null, lead_time_days ?? null, notes ?? null);
  res.json(db.prepare("SELECT * FROM supplier_products WHERE id = ?").get(id));
});

app.post("/api/suppliers/:id/notes", (req, res) => {
  const { note, type } = req.body;
  if (!note) return res.status(400).json({ error: "note required" });
  const id = newId();
  db.prepare("INSERT INTO supplier_notes (id, supplier_id, note, type) VALUES (?, ?, ?, ?)").run(id, req.params.id, note, type ?? "general");
  res.json({ id, supplier_id: req.params.id, note, type: type ?? "general" });
});

app.get("/api/orders", (_req, res) => {
  res.json(db.prepare(`SELECT o.*, s.name as supplier_name FROM orders o JOIN suppliers s ON s.id = o.supplier_id ORDER BY o.created_at DESC LIMIT 50`).all());
});

app.post("/api/orders", (req, res) => {
  const { supplier_id, items = [], expected_arrival, notes, po_number } = req.body;
  if (!supplier_id) return res.status(400).json({ error: "supplier_id required" });
  const id = newId();
  const total_units = (items as any[]).reduce((s: number, i: any) => s + (i.qty ?? 0), 0);
  const total_cost = (items as any[]).reduce((s: number, i: any) => s + (i.qty ?? 0) * (i.unit_price ?? 0), 0);
  const poNum = po_number ?? `AZ-${new Date().getFullYear()}-${Math.floor(Math.random() * 900 + 100)}`;
  db.prepare(`INSERT INTO orders (id, supplier_id, status, order_date, expected_arrival, total_units, total_cost_usd, notes, po_number) VALUES (?, ?, 'draft', date('now'), ?, ?, ?, ?, ?)`).run(id, supplier_id, expected_arrival ?? null, total_units, Math.round(total_cost * 100) / 100, notes ?? null, poNum);

  const insertItem = db.prepare("INSERT INTO order_items (id, order_id, qty, unit_price, asin, product_name) VALUES (?, ?, ?, ?, ?, ?)");
  for (const item of items as any[]) {
    insertItem.run(newId(), id, item.qty, item.unit_price, item.asin ?? null, item.product_name ?? "");
  }
  res.json(db.prepare("SELECT * FROM orders WHERE id = ?").get(id));
});

app.put("/api/orders/:id", (req, res) => {
  const { status, notes, expected_arrival } = req.body;
  db.prepare("UPDATE orders SET status = COALESCE(?, status), notes = COALESCE(?, notes), expected_arrival = COALESCE(?, expected_arrival), updated_at = datetime('now') WHERE id = ?").run(status ?? null, notes ?? null, expected_arrival ?? null, req.params.id);
  res.json(db.prepare("SELECT * FROM orders WHERE id = ?").get(req.params.id));
});

app.get("/api/reorder-recommendations", (_req, res) => {
  res.json(getReorderRecommendations());
});

app.post("/api/generate-supplier-email/:id", async (req, res) => {
  const supplier = db.prepare("SELECT * FROM suppliers WHERE id = ?").get(req.params.id) as any;
  if (!supplier) return res.status(404).json({ error: "Supplier not found" });
  const { type, product_name, qty, current_price, target_price, delivery_date, issue } = req.body;
  const draft = await draftSupplierEmail({ type: type ?? "reorder", supplier_name: supplier.name, contact_name: supplier.contact_name, product_name, qty, current_price, target_price, delivery_date, issue });
  res.json({ draft });
});

app.post("/api/generate-po/:orderId", (req, res) => {
  const order = db.prepare("SELECT o.*, s.name as supplier_name, s.email as supplier_email, s.payment_terms FROM orders o JOIN suppliers s ON s.id = o.supplier_id WHERE o.id = ?").get(req.params.orderId) as any;
  if (!order) return res.status(404).json({ error: "Order not found" });
  const items = db.prepare("SELECT * FROM order_items WHERE order_id = ?").all(req.params.orderId) as any[];
  const po = generatePO({
    po_number: order.po_number ?? req.params.orderId.slice(0, 8),
    supplier_name: order.supplier_name,
    contact_email: order.supplier_email,
    items: items.map(i => ({ product_name: i.product_name, asin: i.asin, qty: i.qty, unit_price: i.unit_price })),
    payment_terms: order.payment_terms,
    expected_delivery: order.expected_arrival,
    notes: order.notes,
  });
  res.json({ po, order_id: req.params.orderId });
});

/* ── Auth ───────────────────────────────────────────────── */
app.get("/api/auth/status", (_req, res) => {
  const count = (db.prepare("SELECT COUNT(*) as c FROM users").get() as any).c;
  res.json({ has_users: count > 0 });
});

app.post("/api/auth/register", async (req, res) => {
  const { email, name, password, role } = req.body;
  if (!email || !name || !password) return res.status(400).json({ error: "email, name, password required" });
  if (password.length < 8) return res.status(400).json({ error: "Password must be at least 8 characters" });

  const existing = db.prepare("SELECT id FROM users WHERE email = ?").get(email);
  if (existing) return res.status(409).json({ error: "Email already registered" });

  const userCount = (db.prepare("SELECT COUNT(*) as c FROM users").get() as any).c;
  const assignedRole = userCount === 0 ? "owner" : (role ?? "viewer");

  const hash = await bcrypt.hash(password, 12);
  const id = newId();
  const avatarColors = ["#3b82f6","#8b5cf6","#06b6d4","#10b981","#f59e0b","#ef4444"];
  const color = avatarColors[Math.floor(Math.random() * avatarColors.length)];

  db.prepare("INSERT INTO users (id, email, name, role, password_hash, avatar_color) VALUES (?, ?, ?, ?, ?, ?)").run(id, email, name, assignedRole, hash, color);

  const user = { id, email, name, role: assignedRole };
  const token = signToken(user);
  res.json({ token, user });
});

app.post("/api/auth/login", async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.status(400).json({ error: "email and password required" });

  const user = db.prepare("SELECT * FROM users WHERE email = ? AND active = 1").get(email) as any;
  if (!user) return res.status(401).json({ error: "Invalid credentials" });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: "Invalid credentials" });

  db.prepare("UPDATE users SET last_seen = datetime('now') WHERE id = ?").run(user.id);
  const token = signToken({ id: user.id, email: user.email, name: user.name, role: user.role });
  res.json({ token, user: { id: user.id, email: user.email, name: user.name, role: user.role, avatar_color: user.avatar_color } });
});

app.get("/api/auth/me", requireAuth, (req, res) => {
  const user = db.prepare("SELECT id, email, name, role, avatar_color, last_seen FROM users WHERE id = ?").get(req.user!.id);
  if (!user) return res.status(401).json({ error: "User not found" });
  res.json(user);
});

app.get("/api/team", requireAuth, (req, res) => {
  if (!["owner","manager"].includes(req.user!.role)) return res.status(403).json({ error: "Insufficient permissions" });
  res.json(db.prepare("SELECT id, email, name, role, avatar_color, active, last_seen, created_at FROM users ORDER BY created_at").all());
});

app.put("/api/team/:id", requireAuth, requireRole("owner"), (req, res) => {
  const { role, active } = req.body;
  if (role) db.prepare("UPDATE users SET role = ? WHERE id = ?").run(role, req.params.id);
  if (active !== undefined) db.prepare("UPDATE users SET active = ? WHERE id = ?").run(active ? 1 : 0, req.params.id);
  res.json(db.prepare("SELECT id, email, name, role, active FROM users WHERE id = ?").get(req.params.id));
});

/* ── Comments & Tasks ───────────────────────────────────── */
app.get("/api/products/:id/comments", (req, res) => {
  const comments = db.prepare(`
    SELECT c.*, u.name as user_name, u.avatar_color, u.role as user_role
    FROM product_comments c
    JOIN users u ON u.id = c.user_id
    WHERE c.product_id = ?
    ORDER BY c.created_at ASC
  `).all(req.params.id);
  res.json(comments);
});

app.post("/api/products/:id/comments", requireAuth, (req, res) => {
  const { content, type } = req.body;
  if (!content?.trim()) return res.status(400).json({ error: "content required" });
  const id = newId();
  db.prepare("INSERT INTO product_comments (id, product_id, user_id, content, type) VALUES (?, ?, ?, ?, ?)").run(id, req.params.id, req.user!.id, content.trim(), type ?? "general");
  const comment = db.prepare("SELECT c.*, u.name as user_name, u.avatar_color FROM product_comments c JOIN users u ON u.id = c.user_id WHERE c.id = ?").get(id);
  res.json(comment);
});

app.get("/api/tasks", requireAuth, (req, res) => {
  const tasks = req.user!.role === "owner" || req.user!.role === "manager"
    ? db.prepare("SELECT t.*, u1.name as assigned_to_name, u2.name as assigned_by_name FROM approval_tasks t LEFT JOIN users u1 ON u1.id = t.assigned_to LEFT JOIN users u2 ON u2.id = t.assigned_by ORDER BY t.created_at DESC").all()
    : db.prepare("SELECT t.*, u1.name as assigned_to_name, u2.name as assigned_by_name FROM approval_tasks t LEFT JOIN users u1 ON u1.id = t.assigned_to LEFT JOIN users u2 ON u2.id = t.assigned_by WHERE t.assigned_to = ? ORDER BY t.created_at DESC").all(req.user!.id);
  res.json(tasks);
});

app.post("/api/tasks", requireAuth, (req, res) => {
  const { product_id, title, description, assigned_to, priority, due_date } = req.body;
  if (!product_id || !title) return res.status(400).json({ error: "product_id and title required" });
  const id = newId();
  db.prepare("INSERT INTO approval_tasks (id, product_id, title, description, assigned_to, assigned_by, priority, due_date) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(id, product_id, title, description ?? null, assigned_to ?? null, req.user!.id, priority ?? "normal", due_date ?? null);
  res.json(db.prepare("SELECT * FROM approval_tasks WHERE id = ?").get(id));
});

app.put("/api/tasks/:id", requireAuth, (req, res) => {
  const { status, notes } = req.body;
  db.prepare("UPDATE approval_tasks SET status = COALESCE(?, status), notes = COALESCE(?, notes), updated_at = datetime('now') WHERE id = ?").run(status ?? null, notes ?? null, req.params.id);
  res.json(db.prepare("SELECT * FROM approval_tasks WHERE id = ?").get(req.params.id));
});

app.get("/api/tasks/pending-count", requireAuth, (req, res) => {
  const count = req.user!.role === "owner" || req.user!.role === "manager"
    ? (db.prepare("SELECT COUNT(*) as c FROM approval_tasks WHERE status = 'pending'").get() as any).c
    : (db.prepare("SELECT COUNT(*) as c FROM approval_tasks WHERE status = 'pending' AND assigned_to = ?").get(req.user!.id) as any).c;
  res.json({ count });
});

/* ── Autonomous Agent ── */
app.get("/api/agent/status", requireAuth, (_req, res) => {
  res.json(getSchedulerStatus());
});

app.post("/api/agent/trigger", requireAuth, async (req, res) => {
  const { task } = req.body;
  if (!task) return res.status(400).json({ error: "task required" });
  try {
    const result = await triggerTask(task);
    res.json({ ok: true, result });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/agent/history", requireAuth, (req, res) => {
  const limit = Number(req.query.limit ?? 20);
  res.json({ runs: getAgentRunHistory(limit) });
});

/* ── Live Research (SSE stream) ── */
app.get("/api/research/stream", requireAuth, async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  const categories = req.query.categories
    ? String(req.query.categories).split(",")
    : getAllCategories();

  let closed = false;
  req.on("close", () => { closed = true; });

  try {
    await runProductDiscovery({ categories, maxProducts: 0 }, (product) => {
      if (!closed) {
        res.write(`event: product\ndata: ${JSON.stringify(product)}\n\n`);
      }
    });
    const stats = getDiscoveryStats();
    if (!closed) res.write(`event: stats\ndata: ${JSON.stringify(stats)}\n\n`);
    if (!closed) res.write(`event: done\ndata: {}\n\n`);
  } catch (e: any) {
    if (!closed) res.write(`event: error\ndata: ${JSON.stringify({ message: e.message })}\n\n`);
  } finally {
    res.end();
  }
});

app.get("/api/research/discovered", requireAuth, (req, res) => {
  const limit = Number(req.query.limit ?? 200);
  const minGrade = req.query.minGrade ? String(req.query.minGrade) : undefined;
  res.json({ products: getDiscoveredProducts(limit, minGrade) });
});

app.get("/api/research/stats", requireAuth, (_req, res) => {
  res.json(getDiscoveryStats());
});

app.get("/api/research/categories", (_req, res) => {
  res.json({ categories: getAllCategories() });
});

/* ── SEO Engine ── */
app.post("/api/seo/audit", requireAuth, async (req, res) => {
  const { product } = req.body;
  if (!product) return res.status(400).json({ error: "product required" });
  try {
    const report = await generateSEOReport(product);
    res.json(report);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/seo/listing-audit", requireAuth, (req, res) => {
  const { product } = req.body;
  if (!product) return res.status(400).json({ error: "product required" });
  res.json(auditListing(product));
});

app.get("/api/seo/keywords", requireAuth, async (req, res) => {
  const title = String(req.query.title ?? "");
  const category = String(req.query.category ?? "General");
  const asin = req.query.asin ? String(req.query.asin) : undefined;
  if (!title) return res.status(400).json({ error: "title required" });
  try {
    const keywords = await findKeywordOpportunities(title, category, asin);
    res.json({ keywords });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/seo/yamarigroup", requireAuth, async (_req, res) => {
  try {
    const data = await monitorYamariGroup();
    res.json(data);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/seo/history", requireAuth, (req, res) => {
  const asin = req.query.asin ? String(req.query.asin) : undefined;
  const limit = Number(req.query.limit ?? 20);
  res.json({ history: getSEOHistory(asin, limit) });
});

/* ── PPC Automation ── */
app.get("/api/ppc/analysis", requireAuth, (_req, res) => {
  res.json(analyzePPC());
});

app.post("/api/ppc/apply-bid", requireAuth, (req, res) => {
  const { keyword, newBid } = req.body;
  if (!keyword || newBid == null) return res.status(400).json({ error: "keyword and newBid required" });
  res.json(applyBidChange(keyword, Number(newBid)));
});

app.get("/api/ppc/history", requireAuth, (req, res) => {
  const days = Number(req.query.days ?? 30);
  res.json({ history: getPPCHistory(days) });
});

/* ── Multi-Marketplace ── */
app.get("/api/marketplace/status", requireAuth, (_req, res) => {
  res.json({ statuses: getMarketplaceStatuses() });
});

app.get("/api/marketplace/cross-listing", requireAuth, (_req, res) => {
  res.json({ candidates: getCrossListingCandidates() });
});

app.post("/api/marketplace/walmart/list", requireAuth, async (req, res) => {
  try {
    const result = await listProductOnWalmart(req.body);
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.post("/api/marketplace/tiktok/list", requireAuth, async (req, res) => {
  try {
    const result = await listProductOnTikTok(req.body);
    res.json(result);
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get("/api/marketplace/listings", requireAuth, (req, res) => {
  const marketplace = req.query.marketplace as any;
  res.json({ listings: getMarketplaceListings(marketplace) });
});

const PORT = Number(process.env.MAXIMUS_PORT ?? 3001);
startAutonomousScheduler();
app.listen(PORT, () => {
  console.log(`\n[MAXIMUS] Intelligence server → http://localhost:${PORT}`);
  console.log(`[MAXIMUS] Model:  claude-fable-5`);
  console.log(`[MAXIMUS] Chat:   POST  /api/maximus`);
  console.log(`[MAXIMUS] Batch:  GET   /api/batch/latest`);
  console.log(`[MAXIMUS] Health: GET   /health`);
  console.log(`[MAXIMUS] Agent:  GET   /api/agent/status`);
  console.log(`[MAXIMUS] SEO:    POST  /api/seo/audit`);
  console.log(`[MAXIMUS] Mkts:   GET   /api/marketplace/status\n`);
});
