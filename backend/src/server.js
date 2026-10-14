// backend/src/server.js
const app = require('./app');
const { PORT, NODE_ENV } = require('./config/env');

const server = app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT} [${NODE_ENV}]`);
    console.log(`Process ID: ${process.pid}`);
});

server.on('error', (err) => {
    console.error('Server error:', err.message);
    process.exit(1);
});

server.on('close', () => {
    console.warn('HTTP server closed unexpectedly');
});

// Keep-alive: prevents the event loop from draining
const keepAlive = setInterval(() => {}, 60_000);

let shuttingDown = false;
const shutdown = (signal) => {
    if (shuttingDown) return;
    shuttingDown = true;

    console.log(`\n${signal} received, shutting down gracefully...`);

    clearInterval(keepAlive);

    server.close(() => {
        console.log('HTTP server closed');
        try {
            const db = require('./config/db');
            db.close();
            console.log('Database connection closed');
        } catch (err) {
            console.error('Error closing DB:', err.message);
        }
        process.exit(0);
    });

    setTimeout(() => {
        console.error('Forced shutdown after timeout');
        process.exit(1);
    }, 10_000).unref();
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGHUP', () => shutdown('SIGHUP'));

process.on('uncaughtException', (err) => {
    console.error('Uncaught exception:', err);
    shutdown('uncaughtException');
});

process.on('unhandledRejection', (reason) => {
    console.error('Unhandled rejection:', reason);
    shutdown('unhandledRejection');
});