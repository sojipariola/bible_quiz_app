// backend/src/app.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { NODE_ENV, TRUST_PROXY } = require('./config/env');
const { corsOptionsDelegate } = require('./config/cors');
const logger = require('./config/logger');
const requestLogger = require('./middleware/requestLogger');

const app = express();

app.disable('x-powered-by');
if (TRUST_PROXY) app.set('trust proxy', TRUST_PROXY);
app.use(helmet());
app.use(cors(corsOptionsDelegate));
app.use(express.json({ limit: '100kb' }));

if (NODE_ENV !== 'test') {
    app.use(requestLogger);
}

// Routes
const userRoutes = require('./routes/userRoutes');
const usersRoutes = require('./routes/usersRoutes.js');
const bibleQuanesRoutes = require('./routes/bibleQuanesRoutes.js');
const reportRoutes = require('./routes/reportRoutes');
const quizRoutes = require('./routes/quizRoutes');
const kjvRoutes = require('./routes/kjvRoutes');
const reviewRoutes = require('./routes/reviewRoutes');


app.use('/api/user', userRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/bible_quanes', bibleQuanesRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/kjv', kjvRoutes);
app.use('/api/review', reviewRoutes);


// Health check
app.get('/api/health', (req, res) => {
    try {
        const db = require('./config/db');
        db.prepare('SELECT 1').get();
        res.json({
            status: 'ok',
            database: 'connected',
            timestamp: new Date().toISOString()
        });
    } catch (err) {
        res.status(503).json({
            status: 'degraded',
            database: 'unavailable',
            ...(NODE_ENV === 'production' ? {} : { error: err.message })
        });
    }
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Not found' });
});

// Global error handler
app.use((err, req, res, next) => {
    if (err.message === 'Not allowed by CORS policy') {
        return res.status(403).json({ message: 'CORS policy violation' });
    }

    logger.error('unhandled_error', {
        message: err.message,
        stack: err.stack,
        url: req.originalUrl,
        method: req.method
    });

    res.status(err.status || 500).json({
        message: NODE_ENV === 'production' ? 'Internal server error' : err.message
    });
});

module.exports = app;