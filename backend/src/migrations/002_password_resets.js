// backend/src/migrations/002_password_resets.js
module.exports = {
    up(db) {
        db.exec(`
            CREATE TABLE IF NOT EXISTS password_resets (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                userId     INTEGER NOT NULL,
                tokenHash  TEXT    NOT NULL,
                expiresAt  DATETIME NOT NULL,
                usedAt     DATETIME,
                createdAt  DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
            );

            CREATE INDEX IF NOT EXISTS idx_password_resets_tokenHash
                ON password_resets(tokenHash);

            CREATE INDEX IF NOT EXISTS idx_password_resets_userId
                ON password_resets(userId);
        `);
    },

    down(db) {
        db.exec(`
            DROP TABLE IF EXISTS password_resets;
        `);
    }
};