// backend/src/config/logger.js
const winston = require('winston');
const path = require('path');
const fs = require('fs');
require('winston-daily-rotate-file');
const { NODE_ENV } = require('./env');

const logDir = path.join(__dirname, '../../logs');

if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

const rotateOptions = {
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    dirname: logDir
};

const logger = winston.createLogger({
    level: NODE_ENV === 'production' ? 'info' : 'debug',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { service: 'bible-quiz-api' },
    transports: [
        new winston.transports.DailyRotateFile({
            ...rotateOptions,
            filename: 'error-%DATE%.log',
            level: 'error'
        }),
        new winston.transports.DailyRotateFile({
            ...rotateOptions,
            filename: 'combined-%DATE%.log'
        })
    ]
});

if (NODE_ENV !== 'production' && NODE_ENV !== 'test') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

module.exports = logger;