const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const reportController = require('../controllers/reportController');

const router = express.Router();

router.get('/summary', authenticate, reportController.getSummary);
// Contains every user's email — staff only
router.get('/users', authenticate, requireRole('admin', 'manager'), reportController.getUsersReport);
router.get('/bible_quanes', authenticate, reportController.getBibleQuanesReport);

module.exports = router;