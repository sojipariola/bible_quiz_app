// backend/src/controllers/reviewController.js
const fs = require('fs');
const path = require('path');
const db = require('../config/db');

const DATA_DIR = path.join(__dirname, '../../data');
const REVIEW_FILE = path.join(DATA_DIR, 'needs-review.json');
const VERIFIED_FILE = path.join(DATA_DIR, 'verified.json');

const ALLOWED_DIFFICULTIES = ['basic', 'intermediate', 'advanced'];

// GET /api/review/queue?page=1&pageSize=20
const getQueue = (req, res) => {
    if (!fs.existsSync(REVIEW_FILE)) {
        return res.status(404).json({
            message: 'No review queue found. Run npm run verify-against-kjv first.'
        });
    }

    try {
        const items = JSON.parse(fs.readFileSync(REVIEW_FILE, 'utf8'));
        const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
        const pageSize = Math.min(Math.max(parseInt(req.query.pageSize, 10) || 20, 1), 100);
        const offset = (page - 1) * pageSize;

        const slice = items.slice(offset, offset + pageSize);

        // Strip the internal _verseText to a shorter preview? Keep full for review.
        res.json({
            data: slice.map((q, i) => ({ ...q, _index: offset + i })),
            pagination: {
                page,
                pageSize,
                total: items.length,
                totalPages: Math.ceil(items.length / pageSize)
            }
        });
    } catch (err) {
        res.status(500).json({ message: 'Failed to load review queue', error: err.message });
    }
};

// POST /api/review/accept  { index }
const accept = (req, res) => {
    const { index } = req.body;
    if (typeof index !== 'number') return res.status(400).json({ message: 'index is required' });

    try {
        const items = JSON.parse(fs.readFileSync(REVIEW_FILE, 'utf8'));
        if (!items[index]) return res.status(404).json({ message: 'Item not found' });

        const item = items[index];
        const { _reason, _verseText, ...cleanQuestion } = item;

        // Append to verified.json
        const verified = fs.existsSync(VERIFIED_FILE)
            ? JSON.parse(fs.readFileSync(VERIFIED_FILE, 'utf8'))
            : [];
        verified.push(cleanQuestion);
        fs.writeFileSync(VERIFIED_FILE, JSON.stringify(verified, null, 2));

        // Remove from review queue
        items.splice(index, 1);
        fs.writeFileSync(REVIEW_FILE, JSON.stringify(items, null, 2));

        res.json({ message: 'Accepted', remaining: items.length });
    } catch (err) {
        res.status(500).json({ message: 'Accept failed', error: err.message });
    }
};

// POST /api/review/edit  { index, updates: { answer?, question?, reference?, difficulty? } }
const edit = (req, res) => {
    const { index, updates } = req.body;
    if (typeof index !== 'number' || !updates || typeof updates !== 'object') {
        return res.status(400).json({ message: 'index and updates are required' });
    }

    try {
        const items = JSON.parse(fs.readFileSync(REVIEW_FILE, 'utf8'));
        if (!items[index]) return res.status(404).json({ message: 'Item not found' });

        const item = items[index];

        // Apply allowed fields only
        const allowed = ['question', 'answer', 'explanation', 'reference', 'difficulty', 'chapter', 'book'];
        for (const key of allowed) {
            if (updates[key] !== undefined) item[key] = updates[key];
        }
        if (item.difficulty && !ALLOWED_DIFFICULTIES.includes(item.difficulty)) {
            item.difficulty = 'basic';
        }

        items[index] = item;
        fs.writeFileSync(REVIEW_FILE, JSON.stringify(items, null, 2));

        res.json({ message: 'Updated', item });
    } catch (err) {
        res.status(500).json({ message: 'Edit failed', error: err.message });
    }
};

// POST /api/review/reject  { index }
const reject = (req, res) => {
    const { index } = req.body;
    if (typeof index !== 'number') return res.status(400).json({ message: 'index is required' });

    try {
        const items = JSON.parse(fs.readFileSync(REVIEW_FILE, 'utf8'));
        if (!items[index]) return res.status(404).json({ message: 'Item not found' });

        // Archive rejected items so we can recover them
        const rejectedFile = path.join(DATA_DIR, 'rejected.json');
        const rejected = fs.existsSync(rejectedFile)
            ? JSON.parse(fs.readFileSync(rejectedFile, 'utf8'))
            : [];
        rejected.push({ ...items[index], _rejectedAt: new Date().toISOString() });
        fs.writeFileSync(rejectedFile, JSON.stringify(rejected, null, 2));

        // Remove from review queue
        items.splice(index, 1);
        fs.writeFileSync(REVIEW_FILE, JSON.stringify(items, null, 2));

        res.json({ message: 'Rejected', remaining: items.length });
    } catch (err) {
        res.status(500).json({ message: 'Reject failed', error: err.message });
    }
};

// GET /api/review/stats
const stats = (req, res) => {
    const result = {};
    try {
        result.verified = fs.existsSync(VERIFIED_FILE)
            ? JSON.parse(fs.readFileSync(VERIFIED_FILE, 'utf8')).length : 0;
        result.review = fs.existsSync(REVIEW_FILE)
            ? JSON.parse(fs.readFileSync(REVIEW_FILE, 'utf8')).length : 0;
        const rejectedFile = path.join(DATA_DIR, 'rejected.json');
        result.rejected = fs.existsSync(rejectedFile)
            ? JSON.parse(fs.readFileSync(rejectedFile, 'utf8')).length : 0;
        result.inDb = db.prepare('SELECT COUNT(*) AS c FROM bible_quanes').get().c;
        res.json(result);
    } catch (err) {
        res.status(500).json({ message: 'Failed to load stats', error: err.message });
    }
};

// POST /api/review/rebuild-db  — reload bible_quanes from verified.json
const rebuildDb = (req, res) => {
    if (!fs.existsSync(VERIFIED_FILE)) {
        return res.status(404).json({ message: 'verified.json not found' });
    }

    try {
        const verified = JSON.parse(fs.readFileSync(VERIFIED_FILE, 'utf8'));

        const insert = db.prepare(
            `INSERT INTO bible_quanes
                (book, chapter, question, answer, explanation, reference, difficulty)
             VALUES (?, ?, ?, ?, ?, ?, ?)`
        );

        const tx = db.transaction(() => {
            db.prepare('DELETE FROM bible_quanes').run();
            for (const q of verified) {
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

        res.json({ message: `Rebuilt DB with ${verified.length} questions` });
    } catch (err) {
        res.status(500).json({ message: 'Rebuild failed', error: err.message });
    }
};

module.exports = { getQueue, accept, edit, reject, stats, rebuildDb };