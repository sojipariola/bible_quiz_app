// backend/src/migrations/003_add_difficulty.js
module.exports = {
    up(db) {
        // SQLite supports ADD COLUMN, but CHECK constraints require table rebuild.
        // We use a TEXT column with a default and validate in code.
        db.exec(`
            ALTER TABLE bible_quanes
                ADD COLUMN difficulty TEXT NOT NULL DEFAULT 'basic';
        `);

        db.exec(`
            CREATE INDEX IF NOT EXISTS idx_bible_quanes_difficulty
                ON bible_quanes(difficulty);
        `);
    },

    down(db) {
        // SQLite cannot drop a column directly before 3.35; instead, rebuild.
        // For dev-only rollback, this is acceptable.
        db.exec(`
            DROP INDEX IF EXISTS idx_bible_quanes_difficulty;
        `);
    }
};