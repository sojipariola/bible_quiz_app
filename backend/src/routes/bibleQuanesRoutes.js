// backend/src/routes/bibleQuanesRoutes.js
const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const {
    add,
    list,
    listPaginated,
    getOne,
    update,
    remove
} = require('../controllers/BibleQuanesController');

const router = express.Router();

router.post('/', authenticate, requireRole('admin', 'manager'), add);

// Plain list — used by the quiz and quiz setup
router.get('/', authenticate, requireRole('admin', 'user', 'manager', 'editor', 'viewer'), list);

// Paginated list — used by the admin table.
// MUST be registered before '/:id' or Express will treat 'paginated' as an ID.
router.get('/paginated', authenticate, requireRole('admin', 'user', 'manager', 'editor', 'viewer'), listPaginated);

router.get('/:id', authenticate, requireRole('admin', 'user', 'manager', 'editor', 'viewer'), getOne);
router.put('/:id', authenticate, requireRole('admin', 'manager', 'editor'), update);
router.delete('/:id', authenticate, requireRole('admin', 'manager'), remove);

module.exports = router;