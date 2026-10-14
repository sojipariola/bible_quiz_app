const db = require('../config/db');

const getSummary = (req, res) => {
    const usersCount = db.prepare('SELECT COUNT(*) AS count FROM users').get().count;
    const bibleQuanesCount = db.prepare('SELECT COUNT(*) AS count FROM bible_quanes').get().count;
    res.json({ usersCount, bible_quanesCount: bibleQuanesCount });
};

const getUsersReport = (req, res) => {
    const rows = db.prepare(
        'SELECT id, username, email, role, createdAt FROM users ORDER BY createdAt DESC'
    ).all();
    res.json(rows);
};

const getBibleQuanesReport = (req, res) => {
    const rows = db.prepare(
        'SELECT * FROM bible_quanes ORDER BY createdAt DESC'
    ).all();
    res.json(rows);
};

module.exports = {
    getSummary,
    getUsersReport,
    getBibleQuanesReport
};