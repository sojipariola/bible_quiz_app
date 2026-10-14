// backend/src/migrations/runner.js
const fs = require('fs');
const path = require('path');
const { NODE_ENV } = require('../config/env');

const MIGRATIONS_DIR = __dirname;
const MIGRATION_PATTERN = /^(\d{3})_.+\.js$/;
const quiet = NODE_ENV === 'test';

function ensureMigrationsTable(db) {
    db.exec(`
        CREATE TABLE IF NOT EXISTS schema_migrations (
            id          INTEGER PRIMARY KEY AUTOINCREMENT,
            version     TEXT NOT NULL UNIQUE,
            name        TEXT NOT NULL,
            applied_at  DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);
}

function loadMigrations() {
    const files = fs.readdirSync(MIGRATIONS_DIR)
        .filter(f => MIGRATION_PATTERN.test(f))
        .sort();

    return files.map(file => {
        const match = file.match(MIGRATION_PATTERN);
        const version = match[1];
        const name = file.replace(/^\d{3}_/, '').replace(/\.js$/, '');
        const mod = require(path.join(MIGRATIONS_DIR, file));

        if (typeof mod.up !== 'function') {
            throw new Error(`Migration ${file} must export an "up" function`);
        }

        return { version, name, file, up: mod.up, down: mod.down };
    });
}

function getAppliedVersions(db) {
    return new Set(
        db.prepare('SELECT version FROM schema_migrations').all().map(r => r.version)
    );
}

function runMigrations(db) {
    ensureMigrationsTable(db);

    const applied = getAppliedVersions(db);
    const migrations = loadMigrations();
    const pending = migrations.filter(m => !applied.has(m.version));

    if (pending.length === 0) {
        if (!quiet) console.log('Migrations: all up to date');
        return;
    }

    if (!quiet) console.log(`Migrations: applying ${pending.length} pending`);

    for (const migration of pending) {
        const tx = db.transaction(() => {
            migration.up(db);
            db.prepare(
                'INSERT INTO schema_migrations (version, name) VALUES (?, ?)'
            ).run(migration.version, migration.name);
        });

        try {
            tx();
            if (!quiet) console.log(`  ✓ ${migration.version}_${migration.name}`);
        } catch (err) {
            console.error(`  ✗ ${migration.version}_${migration.name}: ${err.message}`);
            throw err;
        }
    }

    if (!quiet) console.log('Migrations: complete');
}

module.exports = { runMigrations, loadMigrations, getAppliedVersions };