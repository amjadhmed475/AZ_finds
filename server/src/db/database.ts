import Database from "better-sqlite3";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { existsSync, mkdirSync } from "fs";

const __dir = dirname(fileURLToPath(import.meta.url));
const dbPath = resolve(__dir, "../../../data/azfinds.db");
const dataDir = resolve(__dir, "../../../data");

if (!existsSync(dataDir)) {
  mkdirSync(dataDir, { recursive: true });
}

export const db = new Database(dbPath);
db.pragma("journal_mode = WAL");

db.exec(`
-- Suppliers CRM
CREATE TABLE IF NOT EXISTS suppliers (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  whatsapp TEXT,
  wechat TEXT,
  website TEXT,
  country TEXT DEFAULT 'CN',
  payment_terms TEXT,
  lead_time_days INTEGER DEFAULT 30,
  min_order_qty INTEGER DEFAULT 100,
  quality_rating INTEGER DEFAULT 3,
  response_rating INTEGER DEFAULT 3,
  notes TEXT,
  active INTEGER DEFAULT 1,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS supplier_products (
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
  notes TEXT,
  reorder_alert INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS orders (
  id TEXT PRIMARY KEY,
  supplier_id TEXT REFERENCES suppliers(id),
  status TEXT DEFAULT 'draft',
  order_date TEXT,
  expected_arrival TEXT,
  total_units INTEGER,
  total_cost_usd REAL,
  shipping_cost_usd REAL,
  notes TEXT,
  po_number TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS order_items (
  id TEXT PRIMARY KEY,
  order_id TEXT REFERENCES orders(id),
  supplier_product_id TEXT,
  qty INTEGER,
  unit_price REAL,
  asin TEXT,
  product_name TEXT
);

CREATE TABLE IF NOT EXISTS supplier_notes (
  id TEXT PRIMARY KEY,
  supplier_id TEXT REFERENCES suppliers(id),
  note TEXT NOT NULL,
  type TEXT DEFAULT 'general',
  created_at TEXT DEFAULT (datetime('now'))
);

-- Team / Auth
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'viewer',
  password_hash TEXT NOT NULL,
  avatar_color TEXT DEFAULT '#3b82f6',
  active INTEGER DEFAULT 1,
  last_seen TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  token TEXT UNIQUE NOT NULL,
  expires_at TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS product_comments (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  user_id TEXT REFERENCES users(id),
  content TEXT NOT NULL,
  type TEXT DEFAULT 'general',
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS approval_tasks (
  id TEXT PRIMARY KEY,
  product_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  assigned_to TEXT REFERENCES users(id),
  assigned_by TEXT REFERENCES users(id),
  status TEXT DEFAULT 'pending',
  priority TEXT DEFAULT 'normal',
  due_date TEXT,
  notes TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS activity_log (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id),
  action TEXT NOT NULL,
  entity_type TEXT,
  entity_id TEXT,
  metadata TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Alert system
CREATE TABLE IF NOT EXISTS intelligence_alerts (
  id TEXT PRIMARY KEY,
  severity TEXT NOT NULL,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  recommendation TEXT,
  asin TEXT,
  data TEXT,
  read INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now'))
);

-- Live discovered products from autonomous agent
CREATE TABLE IF NOT EXISTS discovered_products (
  id TEXT PRIMARY KEY,
  asin TEXT,
  title TEXT NOT NULL,
  category TEXT,
  subcategory TEXT,
  bsr INTEGER,
  bsr_main_category TEXT,
  price REAL,
  review_count INTEGER,
  review_rating REAL,
  estimated_monthly_sales INTEGER,
  estimated_revenue REAL,
  unit_cost_estimate REAL,
  fba_fee_estimate REAL,
  net_profit_estimate REAL,
  roi_estimate REAL,
  margin_estimate REAL,
  opportunity_score REAL,
  grade TEXT,
  weight_oz REAL,
  is_gated INTEGER DEFAULT 0,
  source TEXT DEFAULT 'live_agent',
  research_notes TEXT,
  discovered_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- Keyword tracking for SEO
CREATE TABLE IF NOT EXISTS keyword_rankings (
  id TEXT PRIMARY KEY,
  asin TEXT,
  product_id TEXT,
  keyword TEXT NOT NULL,
  search_volume_estimate INTEGER,
  competition_score REAL,
  organic_rank INTEGER,
  sponsored_rank INTEGER,
  relevance_score REAL,
  opportunity_score REAL,
  source TEXT DEFAULT 'seo_engine',
  checked_at TEXT DEFAULT (datetime('now'))
);

-- SEO listing scores and optimization history
CREATE TABLE IF NOT EXISTS seo_audits (
  id TEXT PRIMARY KEY,
  product_id TEXT,
  asin TEXT,
  title_score INTEGER,
  bullets_score INTEGER,
  description_score INTEGER,
  backend_keywords_score INTEGER,
  image_score INTEGER,
  overall_score INTEGER,
  issues TEXT,
  recommendations TEXT,
  optimized_title TEXT,
  optimized_bullets TEXT,
  audited_at TEXT DEFAULT (datetime('now'))
);

-- Autonomous agent task log
CREATE TABLE IF NOT EXISTS agent_runs (
  id TEXT PRIMARY KEY,
  task_type TEXT NOT NULL,
  status TEXT DEFAULT 'running',
  products_found INTEGER DEFAULT 0,
  products_graded INTEGER DEFAULT 0,
  alerts_generated INTEGER DEFAULT 0,
  summary TEXT,
  error TEXT,
  started_at TEXT DEFAULT (datetime('now')),
  completed_at TEXT
);

-- Marketplace listings (Walmart, TikTok Shop)
CREATE TABLE IF NOT EXISTS marketplace_listings (
  id TEXT PRIMARY KEY,
  asin TEXT,
  product_id TEXT,
  marketplace TEXT NOT NULL,
  external_id TEXT,
  status TEXT DEFAULT 'draft',
  price REAL,
  inventory INTEGER,
  listing_url TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

-- PPC analysis snapshots
CREATE TABLE IF NOT EXISTS ppc_snapshots (
  id TEXT PRIMARY KEY,
  campaign_id TEXT,
  campaign_name TEXT,
  keyword TEXT,
  match_type TEXT,
  impressions INTEGER,
  clicks INTEGER,
  spend REAL,
  sales REAL,
  acos REAL,
  roas REAL,
  bid_current REAL,
  bid_recommended REAL,
  action_recommended TEXT,
  snapshot_date TEXT DEFAULT (date('now'))
);
`);

export function newId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
