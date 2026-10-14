// backend/src/middleware/requestLogger.js
const logger = require('../config/logger');

function requestLogger(req, res, next) {
    const start = Date.now();

    res.on('finish', () => {
        const duration = Date.now() - start;
        const level = res.statusCode >= 500 ? 'error'
            : res.statusCode >= 400 ? 'warn'
            : 'info';

        logger.log(level, 'http_request', {
            method: req.method,
            url: req.originalUrl,
            status: res.statusCode,
            durationMs: duration,
            ip: req.ip,
            userAgent: req.headers['user-agent'],
            userId: req.user?.id || null
        });
    });

    next();
}

module.exports = requestLogger;