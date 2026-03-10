const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DB_PATH || path.join(__dirname, '../../data/shortlinkx.db');

// Ensure data directory exists
const fs = require('fs');
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const db = new Database(DB_PATH);

// Enable WAL mode for better concurrency
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Initialize schema
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    email       TEXT    UNIQUE NOT NULL,
    password    TEXT    NOT NULL,
    api_key     TEXT    UNIQUE,
    created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS urls (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    original_url  TEXT    NOT NULL,
    short_code    TEXT    UNIQUE NOT NULL,
    user_id       INTEGER REFERENCES users(id),
    expiry_date   DATETIME,
    password_hash TEXT,
    is_active     INTEGER DEFAULT 1,
    click_count   INTEGER DEFAULT 0,
    title         TEXT,
    description   TEXT,
    image         TEXT,
    created_at    DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS clicks (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    short_code  TEXT    NOT NULL,
    ip_address  TEXT,
    country     TEXT,
    city        TEXT,
    device      TEXT,
    browser     TEXT,
    os          TEXT,
    referrer    TEXT,
    clicked_at  DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE INDEX IF NOT EXISTS idx_clicks_short_code ON clicks(short_code);
  CREATE INDEX IF NOT EXISTS idx_urls_short_code   ON urls(short_code);
  CREATE INDEX IF NOT EXISTS idx_urls_user_id      ON urls(user_id);
`);

module.exports = db;
