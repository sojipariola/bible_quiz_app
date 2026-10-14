// backend/src/config/db.js
const Database = require('better-sqlite3');
const path = require('path');
const { DB_FILE, NODE_ENV } = require('./env');
const { runMigrations } = require('../migrations/runner');

const dbFile = DB_FILE || path.join(__dirname, '../../bible_quiz_db.db');
const db = new Database(dbFile);

const quiet = NODE_ENV === 'test';
if (!quiet) console.log('Connected to SQLite:', dbFile);

db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('foreign_keys = ON');
db.pragma('busy_timeout = 5000');
db.pragma('cache_size = -64000');
db.pragma('temp_store = MEMORY');
db.pragma('wal_autocheckpoint = 1000');
db.pragma('journal_size_limit = 67108864');

// Apply migrations instead of schema.sql
runMigrations(db);

// Integrity check
const integrity = db.pragma('quick_check', { simple: true });
if (integrity !== 'ok') {
    console.error('Database integrity check FAILED:', integrity);
    process.exit(1);
}
if (!quiet) console.log('Database integrity: OK');

module.exports = db;