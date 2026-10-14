// backend/src/controllers/kjvController.js
const fs = require('fs');
const path = require('path');

const KJV_FILE = path.join(__dirname, '../../data/kjv_bible.json');
let kjvData = null;

// Lazy-load the KJV once and cache in memory
function loadKJV() {
    if (kjvData) return kjvData;
    try {
        kjvData = JSON.parse(fs.readFileSync(KJV_FILE, 'utf8'));
        return kjvData;
    } catch (err) {
        console.error('Failed to load KJV:', err.message);
        return null;
    }
}

// GET /api/kjv/books — list all books
const listBooks = (req, res) => {
    const kjv = loadKJV();
    if (!kjv) return res.status(500).json({ message: 'KJV not available' });

    const books = kjv.books.map(b => ({
        book: b.book,
        abbrev: b.abbrev,
        testament: b.testament,
        chapters: b.chapters.length
    }));

    res.json(books);
};

// GET /api/kjv/:book/:chapter — get verses for a chapter
const getChapter = (req, res) => {
    const kjv = loadKJV();
    if (!kjv) return res.status(500).json({ message: 'KJV not available' });

    const bookName = decodeURIComponent(req.params.book);
    const chapterNum = parseInt(req.params.chapter, 10);

    const book = kjv.books.find(b => b.book.toLowerCase() === bookName.toLowerCase());
    if (!book) return res.status(404).json({ message: 'Book not found' });

    const chapter = book.chapters.find(c => c.chapter === chapterNum);
    if (!chapter) return res.status(404).json({ message: 'Chapter not found' });

    res.json({
        book: book.book,
        chapter: chapter.chapter,
        verses: chapter.verses
    });
};

module.exports = { listBooks, getChapter };