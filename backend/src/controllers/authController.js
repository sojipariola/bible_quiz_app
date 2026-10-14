// backend/src/controllers/authController.js
const db = require('../config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { JWT_SECRET, NODE_ENV, FRONTEND_URL } = require('../config/env');

const ALLOWED_ROLES = ['admin', 'user', 'manager', 'editor', 'viewer'];
const PASSWORD_RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

// ============================================================
// Registration
// ============================================================
const register = async (req, res) => {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: 'username, email and password are required' });
    }

    const userRole = ALLOWED_ROLES.includes(role) ? role : 'user';

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        const stmt = db.prepare(
            'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)'
        );
        const result = stmt.run(username, email, hashedPassword, userRole);

        res.status(201).json({
            message: 'User registered successfully',
            user: { id: result.lastInsertRowid, username, email, role: userRole }
        });
    } catch (error) {
        if (
            error.code === 'SQLITE_CONSTRAINT_UNIQUE' ||
            error.code === 'SQLITE_CONSTRAINT' ||
            (error.message && error.message.includes('UNIQUE constraint failed'))
        ) {
            return res.status(409).json({ message: 'Username or email already exists' });
        }
        res.status(500).json({ message: 'Registration failed', error: error.message });
    }
};

// ============================================================
// Login
// ============================================================
const login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ message: 'email and password are required' });
    }

    try {
        const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const valid = await bcrypt.compare(password, user.password);
        if (!valid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: '8h', algorithm: 'HS256' }
        );

        res.json({
            message: 'Login successful',
            token,
            user: {
                id: user.id,
                username: user.username,
                email: user.email,
                role: user.role
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Login failed', error: error.message });
    }
};

// ============================================================
// Logout
// ============================================================
const logout = (req, res) => res.json({ message: 'Logout successful' });

// ============================================================
// Change password (authenticated)
// ============================================================
const changePassword = async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({ message: 'Authentication required' });
    }

    try {
        const user = db.prepare('SELECT id, password FROM users WHERE id = ?').get(userId);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        const valid = await bcrypt.compare(currentPassword, user.password);
        if (!valid) {
            return res.status(401).json({ message: 'Current password is incorrect' });
        }

        if (currentPassword === newPassword) {
            return res.status(400).json({ message: 'New password must differ from current password' });
        }

        const hashed = await bcrypt.hash(newPassword, 10);
        db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashed, userId);

        res.json({ message: 'Password updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Password change failed', error: error.message });
    }
};

// ============================================================
// Request password reset (public)
// ============================================================
const requestPasswordReset = async (req, res) => {
    const { email } = req.body;

    // Same response regardless of whether the email exists (prevents enumeration).
    const genericResponse = {
        message: 'If that email is registered, a reset link has been sent.'
    };

    try {
        const user = db.prepare('SELECT id, email FROM users WHERE email = ?').get(email);
        if (!user) {
            return res.json(genericResponse);
        }

        // Invalidate any previous unused tokens for this user.
        db.prepare(
            'UPDATE password_resets SET usedAt = CURRENT_TIMESTAMP WHERE userId = ? AND usedAt IS NULL'
        ).run(user.id);

        // Raw token goes to the user; only the hash is stored.
        const rawToken = crypto.randomBytes(32).toString('hex');
        const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
        const expiresAt = new Date(Date.now() + PASSWORD_RESET_TTL_MS).toISOString();

        db.prepare(
            'INSERT INTO password_resets (userId, tokenHash, expiresAt) VALUES (?, ?, ?)'
        ).run(user.id, tokenHash, expiresAt);

        const resetUrl = `${FRONTEND_URL}/reset-password?token=${rawToken}`;

        if (NODE_ENV !== 'production') {
            console.log('\n===== PASSWORD RESET LINK =====');
            console.log(resetUrl);
            console.log('===============================\n');
        } else {
            // TODO: integrate an email provider (SendGrid, SES, Postmark, etc.)
            // await sendEmail({
            //     to: user.email,
            //     subject: 'Reset your Bible Quiz password',
            //     html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. Link expires in 1 hour.</p>`
            // });
        }

        res.json(genericResponse);
    } catch (error) {
        res.status(500).json({ message: 'Request failed', error: error.message });
    }
};

// ============================================================
// Reset password (public, uses token)
// ============================================================
const resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;

    try {
        const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
        const record = db.prepare(
            'SELECT * FROM password_resets WHERE tokenHash = ? AND usedAt IS NULL'
        ).get(tokenHash);

        if (!record) {
            return res.status(400).json({ message: 'Invalid or expired reset token' });
        }

        if (new Date(record.expiresAt) < new Date()) {
            return res.status(400).json({ message: 'Reset token has expired' });
        }

        const hashed = await bcrypt.hash(newPassword, 10);

        const tx = db.transaction(() => {
            db.prepare('UPDATE users SET password = ? WHERE id = ?').run(hashed, record.userId);
            db.prepare('UPDATE password_resets SET usedAt = CURRENT_TIMESTAMP WHERE id = ?').run(record.id);
        });
        tx();

        res.json({ message: 'Password has been reset. You can now log in.' });
    } catch (error) {
        res.status(500).json({ message: 'Reset failed', error: error.message });
    }
};

module.exports = {
    register,
    login,
    logout,
    changePassword,
    requestPasswordReset,
    resetPassword
};