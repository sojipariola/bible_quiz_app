// backend/scripts/import-all-questions.js
const fs = require('fs');
const path = require('path');
const db = require('../src/config/db');
const BOOKS = require('../data/bible-books.json');

const DATA_DIR = path.join(__dirname, '../data');
const ALLOWED_DIFFICULTIES = ['basic', 'intermediate', 'advanced'];
const FILE_PATTERN = /^bible_quanes_(\d{2})(\w+)\.json$/;

function collectQuestions() {
    const files = fs.readdirSync(DATA_DIR)
        .filter(f => FILE_PATTERN.test(f))
        .sort();

    const all = [];
    const perFile = [];

    for (const file of files) {
        const full = path.join(DATA_DIR, file);
        let data;
        try {
            data = JSON.parse(fs.readFileSync(full, 'utf8'));
        } catch (err) {
            console.error(`❌ ${file}: invalid JSON — ${err.message}`);
            continue;
        }

        const items = Array.isArray(data) ? data : (data.bible_quanes || []);
        const fallbackBook = data.book;
        perFile.push({ file, count: items.length });

        for (const q of items) {
            all.push({ ...q, book: q.book || fallbackBook });
        }
    }

    return { all, perFile };
}

function validate(questions) {
    const errors = [];
    questions.forEach((q, i) => {
        const label = `[${i}] ${q.book || '?'} ${q.chapter ?? '?'} "${(q.question || '').slice(0, 40)}"`;
        if (!q.book || !BOOKS[q.book]) errors.push(`${label}: unknown book "${q.book}"`);
        if (q.book && BOOKS[q.book] && q.chapter) {
            const max = BOOKS[q.book].chapters;
            if (q.chapter < 1 || q.chapter > max) {
                errors.push(`${label}: chapter ${q.chapter} out of range (max ${max})`);
            }
        }
        if (!q.question) errors.push(`${label}: missing question`);
        if (!q.answer) errors.push(`${label}: missing answer`);
        if (q.difficulty && !ALLOWED_DIFFICULTIES.includes(q.difficulty)) {
            errors.push(`${label}: invalid difficulty "${q.difficulty}"`);
        }
    });
    return errors;
}

(function run() {
    console.log('\n=== Importing questions ===\n');

    const { all, perFile } = collectQuestions();
    perFile.forEach(f => {
        const bar = '█'.repeat(Math.min(f.count, 40));
        console.log(`  ${f.file.padEnd(32)} ${String(f.count).padStart(5)}  ${bar}`);
    });
    console.log(`\nTotal collected: ${all.length}\n`);

    if (all.length === 0) {
        console.log('Nothing to import. Fill some per-book files first.');
        process.exit(0);
    }

    const errors = validate(all);
    if (errors.length) {
        console.error(`❌ ${errors.length} validation error(s):`);
        errors.slice(0, 30).forEach(e => console.error('  ', e));
        if (errors.length > 30) console.error(`  ... and ${errors.length - 30} more`);
        process.exit(1);
    }

    const tx = db.transaction(() => {
        db.prepare('DELETE FROM bible_quanes').run();

        const insert = db.prepare(
            `INSERT INTO bible_quanes
                (book, chapter, question, answer, explanation, reference, difficulty)
             VALUES (?, ?, ?, ?, ?, ?, ?)`
        );

        for (const q of all) {
            insert.run(
                q.book,
                q.chapter ?? null,
                q.question,
                q.answer,
                q.explanation ?? null,
                q.reference ?? null,
                ALLOWED_DIFFICULTIES.includes(q.difficulty) ? q.difficulty : 'basic'
            );
        }
    });

    tx();
    console.log(`✓ Imported ${all.length} questions`);
    db.close();
})();