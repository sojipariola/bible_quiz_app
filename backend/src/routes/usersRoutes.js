// backend/src/routes/usersRoutes.js
// User management is staff-only. Regular users must not be able to list
// other people's accounts or create/elevate accounts.
const express = require('express');
const { authenticate, requireRole } = require('../middleware/auth');
const { add, list, getOne, update, remove } = require('../controllers/UsersController');

const router = express.Router();

router.use(authenticate);

router.post('/', requireRole('admin'), add);
router.get('/', requireRole('admin', 'manager'), list);
router.get('/:id', requireRole('admin', 'manager'), getOne);
// Managers may edit/delete non-admin accounts but cannot change roles
// (enforced in the controller).
router.put('/:id', requireRole('admin', 'manager'), update);
router.delete('/:id', requireRole('admin', 'manager'), remove);

module.exports = router;
