// backend/src/routes/reviewRoutes.js
const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const {
    getQueue, accept, edit, reject, stats, rebuildDb
} = require('../controllers/reviewController');

const router = express.Router();

// Admin only — no manager/editor/viewer
router.use(authenticate);
router.use(requireRole('admin'));

router.get('/queue', getQueue);
router.get('/stats', stats);
router.post('/accept', accept);
router.post('/edit', edit);
router.post('/reject', reject);
router.post('/rebuild-db', rebuildDb);

module.exports = router;