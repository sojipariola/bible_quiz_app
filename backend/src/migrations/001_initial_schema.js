// backend/src/migrations/001_initial_schema.js
module.exports = {
    up(db) {
        db.exec(`
            CREATE TABLE IF NOT EXISTS users (
                id         INTEGER  PRIMARY KEY AUTOINCREMENT,
                username   TEXT     NOT NULL UNIQUE,
                email      TEXT     UNIQUE NOT NULL,
                password   TEXT     NOT NULL,
                role       TEXT     NOT NULL DEFAULT 'user',
                createdAt  DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE TABLE IF NOT EXISTS bible_quanes (
                id          INTEGER  PRIMARY KEY AUTOINCREMENT,
                book        TEXT     NOT NULL,
                chapter     INTEGER,
                question    TEXT     NOT NULL,
                answer      TEXT     NOT NULL,
                explanation TEXT,
                reference   TEXT,
                createdAt   DATETIME DEFAULT CURRENT_TIMESTAMP
            );

            CREATE INDEX IF NOT EXISTS idx_users_createdAt ON users(createdAt);
            CREATE INDEX IF NOT EXISTS idx_bible_quanes_createdAt ON bible_quanes(createdAt);
            CREATE INDEX IF NOT EXISTS idx_bible_quanes_book_chapter ON bible_quanes(book, chapter);
        `);
    },

    down(db) {
        db.exec(`
            DROP TABLE IF EXISTS bible_quanes;
            DROP TABLE IF EXISTS users;
        `);
    }
};