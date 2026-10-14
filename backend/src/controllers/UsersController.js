// backend/src/controllers/UsersController.js
const db = require('../config/db');
const bcrypt = require('bcrypt');

const ALLOWED_ROLES = ['admin', 'user', 'manager', 'editor', 'viewer'];

const add = async (req, res) => {
    const { username, email, password, role } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: 'username and password are required' });
    }

    const userRole = ALLOWED_ROLES.includes(role) ? role : 'user';
    const userEmail = email || `${username}@local`;

    try {
        const hashed = await bcrypt.hash(password, 10);
        const result = db.prepare(
            'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)'
        ).run(username, userEmail, hashed, userRole);

        res.status(201).json({ message: 'Created', id: result.lastInsertRowid });
    } catch (err) {
        if (
            err.code === 'SQLITE_CONSTRAINT_UNIQUE' ||
            err.code === 'SQLITE_CONSTRAINT' ||
            (err.message && err.message.includes('UNIQUE constraint failed'))
        ) {
            return res.status(409).json({ message: 'Username or email already exists' });
        }
        res.status(500).json({ message: 'Insert failed', error: err.message });
    }
};

const list = (req, res) => {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize, 10) || 10, 1), 100);
    const offset = (page - 1) * pageSize;

    try {
        const total = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
        const rows = db.prepare(
            'SELECT id, username, email, role, createdAt FROM users ORDER BY id DESC LIMIT ? OFFSET ?'
        ).all(pageSize, offset);

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
    const row = db.prepare(
        'SELECT id, username, email, role, createdAt FROM users WHERE id = ?'
    ).get(req.params.id);
    if (!row) return res.status(404).json({ message: 'Not found' });
    res.json(row);
};

const update = async (req, res) => {
    const { username, email, password, role } = req.body;
    const isAdmin = req.user?.role === 'admin';

    if (role !== undefined && !ALLOWED_ROLES.includes(role)) {
        return res.status(400).json({ message: `Invalid role. Allowed: ${ALLOWED_ROLES.join(', ')}` });
    }

    const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Not found' });

    // Only admins may change roles or touch admin accounts.
    if (!isAdmin && role !== undefined && role !== existing.role) {
        return res.status(403).json({ message: 'Only admins can change roles' });
    }
    if (!isAdmin && existing.role === 'admin') {
        return res.status(403).json({ message: 'Only admins can modify admin accounts' });
    }
    // Stop an admin from demoting themselves and locking everyone out.
    if (isAdmin && String(existing.id) === String(req.user.id) && role && role !== 'admin') {
        return res.status(400).json({ message: 'You cannot remove your own admin role' });
    }

    const userRole = role;

    const newUsername = username || existing.username;
    const newEmail = email || existing.email;
    const newRole = userRole || existing.role;
    const newPassword = password ? await bcrypt.hash(password, 10) : existing.password;

    try {
        db.prepare(
            'UPDATE users SET username = ?, email = ?, password = ?, role = ? WHERE id = ?'
        ).run(newUsername, newEmail, newPassword, newRole, req.params.id);

        res.json({ message: 'Updated' });
    } catch (err) {
        if (
            err.code === 'SQLITE_CONSTRAINT_UNIQUE' ||
            err.code === 'SQLITE_CONSTRAINT' ||
            (err.message && err.message.includes('UNIQUE constraint failed'))
        ) {
            return res.status(409).json({ message: 'Username or email already exists' });
        }
        res.status(500).json({ message: 'Update failed', error: err.message });
    }
};

const remove = (req, res) => {
    const existing = db.prepare('SELECT id, role FROM users WHERE id = ?').get(req.params.id);
    if (!existing) return res.status(404).json({ message: 'Not found' });
    if (existing.role === 'admin' && req.user?.role !== 'admin') {
        return res.status(403).json({ message: 'Only admins can delete admin accounts' });
    }
    if (String(existing.id) === String(req.user?.id)) {
        return res.status(400).json({ message: 'You cannot delete your own account here' });
    }

    const result = db.prepare('DELETE FROM users WHERE id = ?').run(req.params.id);
    if (result.changes === 0) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Deleted' });
};

module.exports = { add, list, getOne, update, remove };