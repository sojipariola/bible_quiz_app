// backend/tests/bible_quanes.test.js
const { resetTestDb, cleanupTestDb } = require('./helpers/db');
resetTestDb();

const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../src/config/env');

function makeToken(user) {
    return jwt.sign(
        { id: user.id, username: user.username, email: user.email, role: user.role },
        JWT_SECRET,
        { expiresIn: '1h', algorithm: 'HS256' }
    );
}

describe('Bible Quanes API', () => {
    let adminToken;
    let viewerToken;

    beforeAll(() => {
        db.prepare('DELETE FROM users').run();
        db.prepare('DELETE FROM bible_quanes').run();

        const hash = bcrypt.hashSync('secret12345', 10);
        const adminRes = db.prepare(
            'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)'
        ).run('admin', 'admin@test.com', hash, 'admin');
        const viewerRes = db.prepare(
            'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)'
        ).run('viewer', 'viewer@test.com', hash, 'viewer');

        const admin = db.prepare('SELECT * FROM users WHERE id = ?').get(adminRes.lastInsertRowid);
        const viewer = db.prepare('SELECT * FROM users WHERE id = ?').get(viewerRes.lastInsertRowid);

        adminToken = makeToken(admin);
        viewerToken = makeToken(viewer);
    });

    afterAll(() => {
        db.close();
        cleanupTestDb();
    });

    beforeEach(() => {
        db.prepare('DELETE FROM bible_quanes').run();
    });

    describe('POST /api/bible_quanes', () => {
        it('admin can create a question', async () => {
            const res = await request(app)
                .post('/api/bible_quanes')
                .set('Authorization', `Bearer ${adminToken}`)
                .send({
                    book: 'Genesis',
                    chapter: 1,
                    question: 'What did God create first?',
                    answer: 'Light',
                    explanation: 'Genesis 1:3',
                    reference: 'Genesis 1:3-5'
                });

            expect(res.status).toBe(201);
            expect(res.body.id).toBeDefined();
        });

        it('viewer gets 403 on create', async () => {
            const res = await request(app)
                .post('/api/bible_quanes')
                .set('Authorization', `Bearer ${viewerToken}`)
                .send({ book: 'Genesis', question: 'Q', answer: 'A' });

            expect(res.status).toBe(403);
        });

        it('unauthenticated gets 401', async () => {
            const res = await request(app)
                .post('/api/bible_quanes')
                .send({ book: 'Genesis', question: 'Q', answer: 'A' });

            expect(res.status).toBe(401);
        });
    });

    describe('GET /api/bible_quanes', () => {
        beforeEach(() => {
            db.prepare(
                'INSERT INTO bible_quanes (book, chapter, question, answer) VALUES (?, ?, ?, ?)'
            ).run('Genesis', 1, 'Q1', 'A1');
            db.prepare(
                'INSERT INTO bible_quanes (book, chapter, question, answer) VALUES (?, ?, ?, ?)'
            ).run('Exodus', 3, 'Q2', 'A2');
        });

        it('any authenticated role can list', async () => {
            const res = await request(app)
                .get('/api/bible_quanes')
                .set('Authorization', `Bearer ${viewerToken}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveLength(2);
        });
    });

    describe('DELETE /api/bible_quanes/:id', () => {
        it('admin can delete', async () => {
            const insert = db.prepare(
                'INSERT INTO bible_quanes (book, question, answer) VALUES (?, ?, ?)'
            ).run('Genesis', 'Q', 'A');

            const res = await request(app)
                .delete(`/api/bible_quanes/${insert.lastInsertRowid}`)
                .set('Authorization', `Bearer ${adminToken}`);

            expect(res.status).toBe(200);
        });

        it('viewer gets 403 on delete', async () => {
            const insert = db.prepare(
                'INSERT INTO bible_quanes (book, question, answer) VALUES (?, ?, ?)'
            ).run('Genesis', 'Q', 'A');

            const res = await request(app)
                .delete(`/api/bible_quanes/${insert.lastInsertRowid}`)
                .set('Authorization', `Bearer ${viewerToken}`);

            expect(res.status).toBe(403);
        });
    });
});