// backend/scripts/migrate.js
const db = require('../src/config/db');
const { loadMigrations, getAppliedVersions } = require('../src/migrations/runner');

const cmd = process.argv[2];

if (cmd === 'status') {
    const applied = getAppliedVersions(db);
    const migrations = loadMigrations();
    console.log('Version  Name                    Status');
    console.log('----------------------------------------------');
    for (const m of migrations) {
        const status = applied.has(m.version) ? 'applied' : 'pending';
        console.log(`${m.version}    ${m.name.padEnd(24)}${status}`);
    }
    process.exit(0);
}

if (cmd === 'rollback') {
    const applied = getAppliedVersions(db);
    const migrations = loadMigrations().filter(m => applied.has(m.version));
    if (migrations.length === 0) {
        console.log('Nothing to roll back');
        process.exit(0);
    }
    const last = migrations[migrations.length - 1];
    if (typeof last.down !== 'function') {
        console.error(`Migration ${last.version} has no "down" function`);
        process.exit(1);
    }
    const tx = db.transaction(() => {
        last.down(db);
        db.prepare('DELETE FROM schema_migrations WHERE version = ?').run(last.version);
    });
    tx();
    console.log(`Rolled back ${last.version}_${last.name}`);
    process.exit(0);
}

console.log('Usage: node scripts/migrate.js [status|rollback]');
process.exit(1);