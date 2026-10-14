// backend/src/controllers/quizController.js
const db = require('../config/db');

const ALLOWED_DIFFICULTIES = ['basic', 'intermediate', 'advanced'];
const ALLOWED_LIMITS = [10, 20, 30, 40, 50, 100];

const getQuizQuestions = (req, res) => {
    const { book, chapter, difficulty } = req.query;
    const limitParam = parseInt(req.query.limit, 10);
    const limit = ALLOWED_LIMITS.includes(limitParam) ? limitParam : 10;

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
        const chapterNum = parseInt(chapter, 10);
        if (!Number.isNaN(chapterNum)) {
            conditions.push('chapter = ?');
            params.push(chapterNum);
        }
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const sql = `SELECT * FROM bible_quanes ${where} ORDER BY RANDOM() LIMIT ?`;
    params.push(limit);

    try {
        const rows = db.prepare(sql).all(...params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Failed to load quiz questions', error: err.message });
    }
};

// Return the distinct list of books and their chapters, for dropdowns
const getQuizFacets = (req, res) => {
    try {
        const books = db.prepare(
            'SELECT DISTINCT book FROM bible_quanes ORDER BY book ASC'
        ).all().map(r => r.book);

        // Available chapters per book (map: book -> [chapters])
        const chapterRows = db.prepare(
            'SELECT DISTINCT book, chapter FROM bible_quanes WHERE chapter IS NOT NULL ORDER BY book, chapter'
        ).all();

        const chapters = {};
        for (const row of chapterRows) {
            if (!chapters[row.book]) chapters[row.book] = [];
            chapters[row.book].push(row.chapter);
        }

        // Difficulty counts per filter (for UI hints)
        const counts = db.prepare(
            `SELECT difficulty, COUNT(*) AS count FROM bible_quanes GROUP BY difficulty`
        ).all();

        res.json({ books, chapters, counts });
    } catch (err) {
        res.status(500).json({ message: 'Failed to load facets', error: err.message });
    }
};

// Return total count matching a given filter (used to warn "only N available")
const getQuizCount = (req, res) => {
    const { book, chapter, difficulty } = req.query;
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
        const chapterNum = parseInt(chapter, 10);
        if (!Number.isNaN(chapterNum)) {
            conditions.push('chapter = ?');
            params.push(chapterNum);
        }
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const row = db.prepare(`SELECT COUNT(*) AS count FROM bible_quanes ${where}`).get(...params);
    res.json({ count: row.count });
};

module.exports = { getQuizQuestions, getQuizFacets, getQuizCount };