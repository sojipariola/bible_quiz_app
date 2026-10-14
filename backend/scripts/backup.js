// backend/scripts/backup.js
const Database = require('better-sqlite3');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const dbPath = process.env.DB_FILE
    ? path.resolve(process.env.DB_FILE)
    : path.join(__dirname, '../bible_quiz_db.db');

const backupDir = path.join(__dirname, '../backups');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupFile = path.join(backupDir, `bible_quiz-${timestamp}.db`);
const manifestFile = backupFile + '.manifest.json';

const KEEP_DAYS = parseInt(process.env.BACKUP_KEEP_DAYS, 10) || 30;

if (!fs.existsSync(dbPath)) {
    console.error('Database not found:', dbPath);
    process.exit(1);
}

if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
}

function rotateBackups() {
    const cutoff = Date.now() - KEEP_DAYS * 24 * 60 * 60 * 1000;
    const entries = fs.readdirSync(backupDir);
    let removed = 0;

    for (const entry of entries) {
        const fullPath = path.join(backupDir, entry);
        const stat = fs.statSync(fullPath);
        if (stat.mtimeMs < cutoff) {
            fs.unlinkSync(fullPath);
            removed++;
        }
    }

    if (removed > 0) {
        console.log(`Rotated out ${removed} backup file(s) older than ${KEEP_DAYS} days`);
    }
}

async function run() {
    const db = new Database(dbPath, { readonly: true });

    try {
        await db.backup(backupFile);
        db.close();

        const hash = crypto.createHash('sha256');
        hash.update(fs.readFileSync(backupFile));
        const sha256 = hash.digest('hex');

        const verifyDb = new Database(backupFile, { readonly: true });
        const integrity = verifyDb.pragma('quick_check', { simple: true });
        const usersCount = verifyDb.prepare('SELECT COUNT(*) AS c FROM users').get().c;
        const questionsCount = verifyDb.prepare('SELECT COUNT(*) AS c FROM bible_quanes').get().c;
        verifyDb.close();

        const manifest = {
            file: path.basename(backupFile),
            sha256,
            integrity,
            users: usersCount,
            questions: questionsCount,
            createdAt: new Date().toISOString()
        };

        fs.writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));

        console.log('Backup created:', backupFile);
        console.log('SHA-256:       ', sha256);
        console.log('Integrity:     ', integrity);
        console.log('Rows:          ', `users=${usersCount}, bible_quanes=${questionsCount}`);

        rotateBackups();

        process.exit(integrity === 'ok' ? 0 : 1);
    } catch (err) {
        console.error('Backup failed:', err.message);
        try { db.close(); } catch {}
        process.exit(1);
    }
}

run();