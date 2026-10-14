const express = require('express');
const { authenticate } = require('../middleware/auth');
const { synthesize } = require('../controllers/ttsController');

const router = express.Router();

router.post('/', authenticate, synthesize);

module.exports = router;