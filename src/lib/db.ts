import { createClient, type Client } from '@libsql/client';

let _db: Client | null = null;
let _dbReady: Promise<void> | null = null;

function getClient(): Client {
  if (!_db) {
    _db = createClient({
      url: process.env.TURSO_DATABASE_URL!,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  return _db;
}

async function initializeDatabase() {
  const client = getClient();
  await client.batch([
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

function ensureDbReady(): Promise<void> {
  if (!_dbReady) {
    _dbReady = initializeDatabase().catch(console.error) as Promise<void>;
  }
  return _dbReady;
}

// Lazy proxy: db is only created when first accessed at runtime, not at build time
const db = new Proxy({} as Client, {
  get(_target, prop) {
    return getClient()[prop as keyof Client];
  },
});

const dbReady = ensureDbReady;

export { db, dbReady };
