// backend/src/routes/kjvRoutes.js
const express = require('express');
const { listBooks, getChapter } = require('../controllers/kjvController');

const router = express.Router();

// KJV text is public domain and read-only — no auth required for reading
router.get('/books', listBooks);
router.get('/:book/:chapter', getChapter);

module.exports = router;