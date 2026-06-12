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
`);

export function newId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}
