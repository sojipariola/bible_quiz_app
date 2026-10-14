// backend/src/config/cors.js
const { NODE_ENV } = require('./env');
const logger = require('./logger');

const DEV_ORIGINS = [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173'
];

const PROD_ORIGINS = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

const allowedOrigins = NODE_ENV === 'production' ? PROD_ORIGINS : DEV_ORIGINS;

function corsOptionsDelegate(req, callback) {
    const origin = req.header('Origin');
    const referer = req.header('Referer');

    // Allow requests with no Origin (curl, Postman, server-to-server)
    if (!origin) {
        return callback(null, { origin: true, credentials: true });
    }

    if (allowedOrigins.includes(origin)) {
        return callback(null, {
            origin: true,
            credentials: true,
            methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization'],
            exposedHeaders: ['Content-Length'],
            maxAge: 86400
        });
    }

    logger.warn('cors_rejected', { origin, referer });
    return callback(new Error('Not allowed by CORS policy'));
}

module.exports = { corsOptionsDelegate, allowedOrigins };