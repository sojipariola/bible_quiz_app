// backend/src/config/env.js
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET || JWT_SECRET === 'change_me' || JWT_SECRET === 'change_me_in_production') {
    throw new Error(
        'JWT_SECRET must be set to a strong, random value (not the default). ' +
        'Generate one with: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"'
    );
}
if (JWT_SECRET.length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters long');
}

const NODE_ENV = process.env.NODE_ENV || 'development';

// Base URL of the frontend, used to build password-reset links.
const FRONTEND_URL = (process.env.FRONTEND_URL ||
    (NODE_ENV === 'production' ? '' : 'http://localhost:5173')).replace(/\/+$/, '');
if (NODE_ENV === 'production' && !FRONTEND_URL) {
    throw new Error('FRONTEND_URL must be set in production (e.g. https://quiz.example.com)');
}

// Number of reverse proxies in front of the app (nginx, Render, Railway, Fly...).
// Needed so req.ip and the rate limiters see the real client IP.
// Defaults to 1 in production, 0 (off) elsewhere. Set TRUST_PROXY=0 if nothing sits in front.
const TRUST_PROXY = process.env.TRUST_PROXY !== undefined
    ? parseInt(process.env.TRUST_PROXY, 10) || 0
    : (NODE_ENV === 'production' ? 1 : 0);

module.exports = {
    NODE_ENV,
    FRONTEND_URL,
    TRUST_PROXY,
    PORT: parseInt(process.env.PORT, 10) || 7000,
    DB_FILE: process.env.DB_FILE || './bible_quiz_db.db',
    JWT_SECRET,
    DEFAULT_ROLE: process.env.DEFAULT_ROLE || 'user'
};