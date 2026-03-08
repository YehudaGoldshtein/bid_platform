import { createClient } from '@libsql/client';

const db = createClient({
  url: process.env.TURSO_DATABASE_URL!,
  authToken: process.env.TURSO_AUTH_TOKEN,
});

// Initialize database schema
async function initializeDatabase() {
  await db.batch([
    {
      sql: `CREATE TABLE IF NOT EXISTS bids (
        id TEXT PRIMARY KEY,
        title TEXT NOT NULL,
        description TEXT NOT NULL,
        deadline TEXT NOT NULL,
        created_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
      args: [],
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS bid_parameters (
        id TEXT PRIMARY KEY,
        bid_id TEXT NOT NULL REFERENCES bids(id) ON DELETE CASCADE,
        name TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0
      )`,
      args: [],
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS bid_parameter_options (
        id TEXT PRIMARY KEY,
        parameter_id TEXT NOT NULL REFERENCES bid_parameters(id) ON DELETE CASCADE,
        value TEXT NOT NULL,
        sort_order INTEGER NOT NULL DEFAULT 0
      )`,
      args: [],
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS bid_files (
        id TEXT PRIMARY KEY,
        bid_id TEXT NOT NULL REFERENCES bids(id) ON DELETE CASCADE,
        filename TEXT NOT NULL,
        data BLOB NOT NULL
      )`,
      args: [],
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS vendor_responses (
        id TEXT PRIMARY KEY,
        bid_id TEXT NOT NULL REFERENCES bids(id) ON DELETE CASCADE,
        vendor_name TEXT NOT NULL,
        pricing_mode TEXT NOT NULL DEFAULT 'combination',
        base_price REAL,
        rules TEXT,
        submitted_at TEXT NOT NULL DEFAULT (datetime('now'))
      )`,
      args: [],
    },
    {
      sql: `CREATE TABLE IF NOT EXISTS vendor_prices (
        id TEXT PRIMARY KEY,
        response_id TEXT NOT NULL REFERENCES vendor_responses(id) ON DELETE CASCADE,
        combination_key TEXT NOT NULL,
        price REAL NOT NULL
      )`,
      args: [],
    },
  ], 'write');
}

// Initialize on first import
const dbReady = initializeDatabase().catch(console.error);

export { db, dbReady };
