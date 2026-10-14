// backend/scripts/verify-backup.js
const Database = require('better-sqlite3');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const backupPath = process.argv[2];

if (!backupPath) {
    console.error('Usage: node verify-backup.js <backup-file>');
    process.exit(1);
}

const resolvedPath = path.resolve(backupPath);

if (!fs.existsSync(resolvedPath)) {
    console.error('File not found:', resolvedPath);
    process.exit(1);
}

// SHA-256
const hash = crypto.createHash('sha256');
hash.update(fs.readFileSync(resolvedPath));
const sha256 = hash.digest('hex');

// Integrity + row counts
let integrity = 'unknown';
let users = 0;
let questions = 0;
let error = null;

try {
    const db = new Database(resolvedPath, { readonly: true });
    integrity = db.pragma('quick_check', { simple: true });
    users = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
    questions = db.prepare('SELECT COUNT(*) AS c FROM bible_quanes').get().c;
    db.close();
} catch (err) {
    error = err.message;
}

// Compare against manifest if it exists
const manifestPath = resolvedPath + '.manifest.json';
let manifestMatch = null;

if (fs.existsSync(manifestPath)) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    manifestMatch = manifest.sha256 === sha256;
}

const report = {
    file: path.basename(resolvedPath),
    sha256,
    integrity,
    users,
    questions,
    manifestMatch,
    error,
    verifiedAt: new Date().toISOString()
};

console.log(JSON.stringify(report, null, 2));

process.exit(integrity === 'ok' && !error ? 0 : 1);