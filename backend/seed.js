// backend/seed.js
const bcrypt = require('bcrypt');
const crypto = require('crypto');
const db = require('./src/config/db');
const { NODE_ENV } = require('./src/config/env');

const ADMIN = {
    username: 'soji',
    email: 'sojipariola@gmail.com',
    role: 'admin'
};

// Generate a random password if none is provided via env var.
// This avoids hardcoding credentials in source control.
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || crypto.randomBytes(12).toString('base64url');
const PASSWORD_WAS_GENERATED = !process.env.ADMIN_PASSWORD;

const quiet = NODE_ENV === 'test';
const log = (...args) => { if (!quiet) console.log(...args); };

async function seedAdmin() {
    const existing = db.prepare(
        'SELECT id, username, email, role FROM users WHERE email = ? OR username = ?'
    ).get(ADMIN.email, ADMIN.username);

    if (existing) {
        if (existing.role !== 'admin') {
            db.prepare('UPDATE users SET role = ? WHERE id = ?').run('admin', existing.id);
            log(`Promoted existing user '${existing.username}' to admin`);
        } else {
            log(`Admin '${existing.username}' already exists, skipping`);
        }

        if (PASSWORD_WAS_GENERATED) {
            // User already existed; do not print a password we didn't set.
            return;
        }

        // If ADMIN_PASSWORD was explicitly provided, reset it.
        const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);
        db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashed, existing.id);
        log(`Reset password for '${existing.username}' from ADMIN_PASSWORD env var`);
        return;
    }

    const hashed = await bcrypt.hash(ADMIN_PASSWORD, 10);

    try {
        const result = db.prepare(
            'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)'
        ).run(ADMIN.username, ADMIN.email, hashed, ADMIN.role);

        log(`Created admin '${ADMIN.username}' (id=${result.lastInsertRowid})`);
        log(`  email:    ${ADMIN.email}`);
        log(`  role:     ${ADMIN.role}`);
        if (PASSWORD_WAS_GENERATED) {
            log(`  password: ${ADMIN_PASSWORD}`);
            log('  ⚠ This password was randomly generated. Save it now — it will not be shown again.');
            log('  ⚠ Change it immediately after first login.');
        } else {
            log('  password: (set from ADMIN_PASSWORD env var)');
        }
    } catch (err) {
        if (
            err.code === 'SQLITE_CONSTRAINT_UNIQUE' ||
            err.code === 'SQLITE_CONSTRAINT' ||
            (err.message && err.message.includes('UNIQUE constraint failed'))
        ) {
            log(`Admin '${ADMIN.username}' already exists (race or partial seed), skipping`);
            return;
        }
        throw err;
    }
}

function printQuestionCount() {
    const total = db.prepare('SELECT COUNT(*) AS c FROM bible_quanes').get().c;
    if (total === 0) {
        log('No bible_quanes in the database.');
        log('  Load them with: npm run import-all-questions');
        return;
    }

    const byBook = db.prepare(
        'SELECT book, COUNT(*) AS c FROM bible_quanes GROUP BY book ORDER BY c DESC LIMIT 10'
    ).all();

    log(`Bible quanes in DB: ${total}`);
    byBook.forEach(row => log(`  ${row.book.padEnd(25)} ${row.c}`));
    if (byBook.length === 10) {
        const more = db.prepare(
            'SELECT COUNT(DISTINCT book) AS c FROM bible_quanes'
        ).get().c - 10;
        if (more > 0) log(`  ... and ${more} more book(s)`);
    }
    log('  Re-import with: npm run import-all-questions');
}

(async () => {
    try {
        await seedAdmin();
        printQuestionCount();
        log('Seed complete.');
        db.close();
        process.exit(0);
    } catch (err) {
        console.error('Seed failed:', err.message);
        try { db.close(); } catch {}
        process.exit(1);
    }
})();