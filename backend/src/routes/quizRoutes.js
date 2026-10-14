// backend/src/routes/quizRoutes.js
const express = require('express');
const { authenticate } = require('../middleware/auth');
const {
    getQuizQuestions,
    getQuizFacets,
    getQuizCount
} = require('../controllers/quizController');

const router = express.Router();

router.get('/questions', authenticate, getQuizQuestions);
router.get('/facets', authenticate, getQuizFacets);
router.get('/count', authenticate, getQuizCount);

module.exports = router;