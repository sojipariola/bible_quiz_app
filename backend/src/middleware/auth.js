// backend/src/middleware/auth.js
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/env');

const authenticate = (req, res, next) => {
    const header = req.headers['authorization'];
    const token = header && header.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Access token required' });
    }

    try {
        req.user = jwt.verify(token, JWT_SECRET, { algorithms: ['HS256'] });
        next();
    } catch {
        return res.status(403).json({ message: 'Invalid or expired token' });
    }
};

const requireAdmin = (req, res, next) => {
    const adminRoles = ['admin', 'manager', 'editor'];
    if (!adminRoles.includes(req.user?.role)) {
        return res.status(403).json({ message: 'Admin access required' });
    }
    next();
};

const requireRole = (...allowedRoles) => (req, res, next) => {
    if (!allowedRoles.includes(req.user?.role)) {
        return res.status(403).json({
            message: `Role '${req.user?.role}' not permitted`
        });
    }
    next();
};

module.exports = { authenticate, requireAdmin, requireRole };