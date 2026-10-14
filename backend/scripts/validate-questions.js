// backend/scripts/validate-questions.js
const fs = require('fs');
const path = require('path');

const BOOKS = require('../data/bible-books.json');
const DATA_DIR = path.join(__dirname, '../data');
// Same files import-all-questions.js loads: data/bible_quanes_01gen.json ... _66rev.json
const FILE_PATTERN = /^bible_quanes_(\d{2})(\w+)\.json$/;

const ALLOWED_DIFFICULTIES = ['basic', 'intermediate', 'advanced'];
// Accepts "Book 3", "Book 3:16", "Book 3:16-18", "Book 3:1, 4" and "Psalms 3 (title)"
const REFERENCE_PATTERN = /^([1-3]?\s?[A-Za-z\s]+?)\s+(\d+)(?::[\d,\s\-]+|\s+\(title\))?$/;

function validateQuestions() {
    const files = fs.readdirSync(DATA_DIR).filter(f => FILE_PATTERN.test(f)).sort();
    if (files.length === 0) {
        console.error('❌ No bible_quanes_NNxxx.json files found in', DATA_DIR);
        process.exit(1);
    }

    const questions = [];
    for (const file of files) {
        let data;
        try {
            data = JSON.parse(fs.readFileSync(path.join(DATA_DIR, file), 'utf8'));
        } catch (err) {
            console.error(`❌ ${file}: invalid JSON — ${err.message}`);
            process.exit(1);
        }
        const items = Array.isArray(data) ? data : data.bible_quanes;
        if (!Array.isArray(items)) {
            console.error(`❌ ${file}: bible_quanes must be an array`);
            process.exit(1);
        }
        questions.push(...items);
    }
    console.log(`Loaded ${questions.length} questions from ${files.length} files`);

    const errors = [];
    const warnings = [];

    questions.forEach((q, idx) => {
        const label = `[${idx + 1}] "${(q.question || '').slice(0, 40)}..."`;

        // Required fields
        for (const field of ['book', 'chapter', 'question', 'answer']) {
            if (q[field] === undefined || q[field] === null || q[field] === '') {
                errors.push(`${label}: missing required field "${field}"`);
            }
        }

        // Book exists
        if (q.book && !BOOKS[q.book]) {
            errors.push(`${label}: unknown book "${q.book}"`);
        }

        // Chapter in range
        if (q.book && BOOKS[q.book] && q.chapter) {
            const max = BOOKS[q.book].chapters;
            if (typeof q.chapter !== 'number' || q.chapter < 1 || q.chapter > max) {
                errors.push(`${label}: chapter ${q.chapter} out of range (${q.book} has ${max})`);
            }
        }

        // Difficulty
        if (q.difficulty && !ALLOWED_DIFFICULTIES.includes(q.difficulty)) {
            errors.push(`${label}: invalid difficulty "${q.difficulty}"`);
        } else if (!q.difficulty) {
            warnings.push(`${label}: no difficulty set (defaults to 'basic')`);
        }

        // Reference format and consistency
        if (q.reference) {
            const match = q.reference.match(REFERENCE_PATTERN);
            if (!match) {
                warnings.push(`${label}: reference "${q.reference}" does not match expected format`);
            } else {
                const [, refBook, refChapter] = match;
                const normalizedRefBook = refBook.trim();
                if (q.book && normalizedRefBook !== q.book) {
                    warnings.push(`${label}: reference book "${normalizedRefBook}" ≠ book "${q.book}"`);
                }
                if (q.chapter && parseInt(refChapter, 10) !== q.chapter) {
                    warnings.push(`${label}: reference chapter ${refChapter} ≠ chapter ${q.chapter}`);
                }
            }
        }
    });

    // Summary
    const byDifficulty = questions.reduce((acc, q) => {
        const d = ALLOWED_DIFFICULTIES.includes(q.difficulty) ? q.difficulty : 'basic';
        acc[d] = (acc[d] || 0) + 1;
        return acc;
    }, {});

    const byBook = questions.reduce((acc, q) => {
        acc[q.book] = (acc[q.book] || 0) + 1;
        return acc;
    }, {});

    console.log('\n=== Validation Report ===\n');
    console.log(`Total questions: ${questions.length}`);
    console.log(`By difficulty: ${JSON.stringify(byDifficulty)}`);
    console.log(`By book: ${JSON.stringify(byBook)}`);
    console.log(`Errors:   ${errors.length}`);
    console.log(`Warnings: ${warnings.length}`);

    if (errors.length) {
        console.log('\n--- ERRORS ---');
        errors.forEach(e => console.log('  ✗', e));
    }
    if (warnings.length) {
        console.log('\n--- WARNINGS ---');
        warnings.forEach(w => console.log('  ⚠', w));
    }

    console.log('\n');
    process.exit(errors.length > 0 ? 1 : 0);
}

validateQuestions();