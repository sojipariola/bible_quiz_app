// backend/src/controllers/BibleQuanesController.js
const db = require('../config/db');

const ALLOWED_DIFFICULTIES = ['basic', 'intermediate', 'advanced'];

const add = (req, res) => {
    const { book, chapter, question, answer, explanation, reference, difficulty } = req.body;

    if (!book || !question || !answer) {
        return res.status(400).json({ message: 'book, question and answer are required' });
    }

    const diff = ALLOWED_DIFFICULTIES.includes(difficulty) ? difficulty : 'basic';

    try {
        const result = db.prepare(
            `INSERT INTO bible_quanes
                (book, chapter, question, answer, explanation, reference, difficulty)
             VALUES (?, ?, ?, ?, ?, ?, ?)`
        ).run(book, chapter ?? null, question, answer, explanation ?? null, reference ?? null, diff);

        res.status(201).json({ message: 'Created', id: result.lastInsertRowid });
    } catch (err) {
        res.status(500).json({ message: 'Insert failed', error: err.message });
    }
};

// Bare-array version — used by the quiz
const list = (req, res) => {
    const rows = db.prepare('SELECT * FROM bible_quanes ORDER BY id DESC').all();
    res.json(rows);
};

// Paginated version — used by the admin table
const listPaginated = (req, res) => {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize, 10) || 10, 1), 100);
    const offset = (page - 1) * pageSize;

    const { difficulty, book, chapter } = req.query;
    const conditions = [];
    const params = [];

    if (difficulty && ALLOWED_DIFFICULTIES.includes(difficulty)) {
        conditions.push('difficulty = ?');
        params.push(difficulty);
    }
    if (book) {
        conditions.push('book = ?');
        params.push(book);
    }
    if (chapter) {
        const ch = parseInt(chapter, 10);
        if (!Number.isNaN(ch)) {
            conditions.push('chapter = ?');
            params.push(ch);
        }
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    try {
        const total = db.prepare(
            `SELECT COUNT(*) AS c FROM bible_quanes ${where}`
        ).get(...params).c;

        const rows = db.prepare(
            `SELECT * FROM bible_quanes ${where} ORDER BY id DESC LIMIT ? OFFSET ?`
        ).all(...params, pageSize, offset);

        res.json({
            data: rows,
            pagination: {
                page,
                pageSize,
                total,
                totalPages: Math.ceil(total / pageSize)
            }
        });
    } catch (err) {
        res.status(500).json({ message: 'Fetch failed', error: err.message });
    }
};

const getOne = (req, res) => {
    const row = db.prepare('SELECT * FROM bible_quanes WHERE id = ?').get(req.params.id);
    if (!row) return res.status(404).json({ message: 'Not found' });
    res.json(row);
};

const update = (req, res) => {
    const { book, chapter, question, answer, explanation, reference, difficulty } = req.body;
    const diff = ALLOWED_DIFFICULTIES.includes(difficulty) ? difficulty : 'basic';

    const result = db.prepare(
        `UPDATE bible_quanes
            SET book = ?, chapter = ?, question = ?, answer = ?,
                explanation = ?, reference = ?, difficulty = ?
          WHERE id = ?`
    ).run(book, chapter ?? null, question, answer, explanation ?? null, reference ?? null, diff, req.params.id);

    if (result.changes === 0) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Updated' });
};

const remove = (req, res) => {
    const result = db.prepare('DELETE FROM bible_quanes WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
};

module.exports = { add, list, listPaginated, getOne, update, remove };