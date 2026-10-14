// backend/tests/helpers/db.js
const path = require('path');
const fs = require('fs');

const TEST_DB = path.join(__dirname, '../../test_bible_quiz.db');

// Set env before db module loads
process.env.DB_FILE = TEST_DB;
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test_secret_at_least_32_characters_long_for_tests';
process.env.NODE_ENV = 'test';

function deleteDbFiles() {
    for (const suffix of ['', '-wal', '-shm']) {
        const file = TEST_DB + suffix;
        if (fs.existsSync(file)) fs.unlinkSync(file);
    }
}

function resetTestDb() {
    deleteDbFiles();
}

function cleanupTestDb() {
    deleteDbFiles();
}

module.exports = { TEST_DB, resetTestDb, cleanupTestDb };