// backend/scripts/verify-against-kjv.js
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '../data');
const KJV_FILE = path.join(DATA_DIR, 'kjv_bible.json');
const FILE_PATTERN = /^bible_quanes_(\d{2})(\w+)\.json$/;
// Now supports "Book 1:1", "Book 1:1-3", "Book 1:1, 3", "Book 1:1, 3-5"
const REFERENCE_PATTERN = /^([1-3]?\s?[A-Za-z\s]+?)\s+(\d+):([\d,\s\-]+)$/;
// Titles: "Psalms 3 (title)" = chapter title (Psalm superscription); "Genesis (title)" = book title
const CHAPTER_TITLE_PATTERN = /^([1-3]?\s?[A-Za-z\s]+?)\s+(\d+)\s+\(title\)$/;
const BOOK_TITLE_PATTERN = /^([1-3]?\s?[A-Za-z\s]+?)\s+\(title\)$/;
const titleIndex = { books: {}, chapters: {} };

// ---------- Synonyms for KJV vs modern paraphrases ----------
const SYNONYMS = {
    heavens: ['heaven'],
    heaven: ['heavens'],
    tunic: ['coat', 'coats', 'garment', 'garments'],
    tunics: ['coat', 'coats', 'garment', 'garments'],
    sun: ['greater light'],
    moon: ['lesser light'],
    expanse: ['firmament'],
    vegetation: ['grass', 'herb', 'tree'],
    genealogy: ['generations'],
    generations: ['genealogy'],
    mark: ['mark'],
    // add more as you spot them
};

// ---------- Load KJV ----------
let kjvIndex;
try {
    const raw = JSON.parse(fs.readFileSync(KJV_FILE, 'utf8'));
    kjvIndex = buildIndex(raw);
} catch (err) {
    console.error('❌ Could not read kjv_bible.json:', err.message);
    process.exit(1);
}

function buildIndex(raw) {
    const index = {};
    for (const book of raw.books) {
        index[book.book] = {};
        if (book.title) titleIndex.books[book.book] = book.title;
        titleIndex.chapters[book.book] = {};
        for (const ch of book.chapters) {
            index[book.book][ch.chapter] = {};
            if (ch.title) titleIndex.chapters[book.book][ch.chapter] = ch.title;
            for (const v of ch.verses) {
                index[book.book][ch.chapter][v.verse] = v.text;
            }
        }
    }
    return index;
}

function getVerseText(book, chapter, verse) {
    const b = kjvIndex[book];
    if (!b) return null;
    const c = b[chapter];
    if (!c) return null;
    return c[verse] || null;
}

// Parse "1, 3-5" into [1,3,4,5]
function parseVerseList(s) {
    const verses = [];
    for (const part of s.split(',')) {
        const trimmed = part.trim();
        if (trimmed.includes('-')) {
            const [a, b] = trimmed.split('-').map(x => parseInt(x.trim(), 10));
            for (let v = a; v <= b; v++) verses.push(v);
        } else {
            verses.push(parseInt(trimmed, 10));
        }
    }
    return verses.filter(n => !Number.isNaN(n));
}

function getVerseRangeText(book, chapter, verseList) {
    const parts = [];
    for (const v of verseList) {
        const t = getVerseText(book, chapter, v);
        if (t) parts.push(t);
    }
    return parts.length ? parts.join(' ') : null;
}

// ---------- Normalization and matching ----------
function normalize(s) {
    return String(s)
        .toLowerCase()
        .replace(/[’‘`]/g, "'")
        .replace(/[“”]/g, '"')
        .replace(/\s+/g, ' ')
        .replace(/[^a-z0-9 ]/g, '')
        .trim();
}

function expandSynonyms(text) {
    let out = ` ${text} `;
    for (const [word, syns] of Object.entries(SYNONYMS)) {
        for (const syn of syns) {
            out = out.replace(new RegExp(`\\b${syn}\\b`, 'g'), word);
        }
    }
    return out.trim();
}

function answerAppearsInVerse(answer, verseText) {
    const aRaw = normalize(answer);
    const vRaw = normalize(verseText);
    const a = expandSynonyms(aRaw);
    const v = expandSynonyms(vRaw);
    if (!a || !v) return false;

    // Direct substring (after synonym expansion)
    if (v.includes(a)) return true;

    // Word-overlap: require all significant words from answer to appear in verse
    const words = a.split(' ').filter(w => w.length > 3);
    if (words.length === 0) return v.includes(a);
    return words.every(w => v.includes(w));
}

// ---------- Walk the files ----------
const files = fs.readdirSync(DATA_DIR)
    .filter(f => FILE_PATTERN.test(f))
    .sort();

if (files.length === 0) {
    console.log('No per-book files found in', DATA_DIR);
    process.exit(0);
}

let total = 0;
let verified = 0;
let mismatch = 0;
let noRef = 0;
let badRef = 0;
let verseMissing = 0;
const problems = [];
const samples = { mismatch: [], badRef: [] };

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

    items.forEach((q, idx) => {
        total++;
        const book = q.book || fallbackBook;

        if (!q.reference) {
            noRef++;
            problems.push({ file, idx, kind: 'no-reference', q });
            return;
        }

        // Title references ("Psalms 3 (title)", "Genesis (title)")
        const tm = q.reference.match(CHAPTER_TITLE_PATTERN);
        const bm = tm ? null : q.reference.match(BOOK_TITLE_PATTERN);
        if (tm || bm) {
            const tBook = (tm || bm)[1].trim();
            const titleText = tm
                ? (titleIndex.chapters[tBook] || {})[parseInt(tm[2], 10)]
                : titleIndex.books[tBook];
            if (!titleText) {
                verseMissing++;
                problems.push({ file, idx, kind: 'title-not-found', q });
            } else if (answerAppearsInVerse(q.answer, titleText)) {
                verified++;
            } else {
                mismatch++;
                if (samples.mismatch.length < 20) {
                    samples.mismatch.push({ file, idx, q, verseText: titleText.slice(0, 250) });
                }
            }
            return;
        }

        const m = q.reference.match(REFERENCE_PATTERN);
        if (!m) {
            badRef++;
            if (samples.badRef.length < 20) {
                samples.badRef.push({ file, idx, q });
            }
            problems.push({ file, idx, kind: 'unparsable-reference', q });
            return;
        }

        const [, refBookRaw, refChapter, verseListStr] = m;
        const refBook = refBookRaw.trim();
        const chNum = parseInt(refChapter, 10);
        const verseList = parseVerseList(verseListStr);

        const verseText = getVerseRangeText(refBook, chNum, verseList);

        if (!verseText) {
            verseMissing++;
            problems.push({ file, idx, kind: 'verse-not-found', q });
            return;
        }

        if (answerAppearsInVerse(q.answer, verseText)) {
            verified++;
        } else {
            mismatch++;
            if (samples.mismatch.length < 20) {
                samples.mismatch.push({
                    file, idx, q,
                    verseText: verseText.slice(0, 250)
                });
            }
        }
    });
}

// ---------- Report ----------
console.log('\n=== KJV Verification Report ===\n');
console.log(`Total questions:           ${total}`);
console.log(`✓ Verified:                ${verified}  (${((verified / total) * 100).toFixed(1)}%)`);
console.log(`✗ Answer not in verse:     ${mismatch}`);
console.log(`✗ Missing reference:       ${noRef}`);
console.log(`✗ Unparsable reference:    ${badRef}`);
console.log(`✗ Verse not found in KJV:  ${verseMissing}`);

if (samples.badRef.length) {
    console.log('\n--- Sample unparsable references ---');
    samples.badRef.forEach(p => {
        console.log(`  ${p.file} #${p.idx}  Ref: ${p.q.reference}`);
    });
}

if (samples.mismatch.length) {
    console.log('\n--- Sample answer-not-in-verse (may include real errors) ---');
    samples.mismatch.forEach(p => {
        console.log(`\n[${p.file} #${p.idx}]`);
        console.log(`  Q:     ${p.q.question}`);
        console.log(`  A:     ${p.q.answer}`);
        console.log(`  Ref:   ${p.q.reference}`);
        console.log(`  Verse: ${p.verseText}`);
    });
}

console.log('');
process.exit(badRef > 0 ? 1 : 0);