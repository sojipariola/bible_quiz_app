// backend/scripts/import-questions.js
const fs = require('fs');
const path = require('path');
const db = require('../src/config/db');
const BOOKS = require('../data/bible-books.json');

const ALLOWED_DIFFICULTIES = ['basic', 'intermediate', 'advanced'];

const inputFile = process.argv[2];
if (!inputFile) {
    console.error('Usage: node scripts/import-questions.js <file.json>');
    process.exit(1);
}

const resolved = path.resolve(inputFile);
if (!fs.existsSync(resolved)) {
    console.error('File not found:', resolved);
    process.exit(1);
}

let data;
try {
    data = JSON.parse(fs.readFileSync(resolved, 'utf8'));
} catch (err) {
    console.error('Invalid JSON:', err.message);
    process.exit(1);
}

const questions = Array.isArray(data) ? data : data.bible_quanes;
if (!Array.isArray(questions)) {
    console.error('Expected an array or { bible_quanes: [...] }');
    process.exit(1);
}

// Validate before inserting
const errors = [];
questions.forEach((q, i) => {
    if (!q.book || !BOOKS[q.book]) errors.push(`[${i}] unknown book: ${q.book}`);
    if (q.book && BOOKS[q.book] && q.chapter) {
        const max = BOOKS[q.book].chapters;
        if (q.chapter < 1 || q.chapter > max) {
            errors.push(`[${i}] chapter ${q.chapter} out of range for ${q.book}`);
        }
    }
    if (!q.question || !q.answer) errors.push(`[${i}] missing question or answer`);
});

if (errors.length) {
    console.error(`\n❌ ${errors.length} validation error(s):`);
    errors.forEach(e => console.error('  ', e));
    process.exit(1);
}

const insert = db.prepare(
    `INSERT INTO bible_quanes
        (book, chapter, question, answer, explanation, reference, difficulty)
     VALUES (?, ?, ?, ?, ?, ?, ?)`
);

const existing = db.prepare('SELECT COUNT(*) AS c FROM bible_quanes').get().c;
if (existing > 0) {
    console.warn(`⚠ ${existing} rows already in bible_quanes.`);
    console.warn('   Delete them first if you want a clean import:');
    console.warn('   sqlite3 bible_quiz_db.db "DELETE FROM bible_quanes;"');
    process.exit(1);
}

const insertMany = db.transaction((rows) => {
    for (const q of rows) {
        const diff = ALLOWED_DIFFICULTIES.includes(q.difficulty) ? q.difficulty : 'basic';
        insert.run(
            q.book,
            q.chapter ?? null,
            q.question,
            q.answer,
            q.explanation ?? null,
            q.reference ?? null,
            diff
        );
    }
});

insertMany(questions);
console.log(`✓ Imported ${questions.length} questions from ${path.basename(resolved)}`);
db.close();