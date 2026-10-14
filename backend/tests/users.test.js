// backend/tests/users.test.js
// Role checks for user management and the users report.
const { resetTestDb, cleanupTestDb } = require('./helpers/db');
resetTestDb(); // Must run before app/db require

const request = require('supertest');
const jwt = require('jsonwebtoken');
const app = require('../src/app');
const db = require('../src/config/db');

const insertUser = (username, role) => {
    const r = db.prepare(
        'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)'
    ).run(username, `${username}@test.com`, 'x', role);
    return { id: r.lastInsertRowid, username, email: `${username}@test.com`, role };
};

const tokenFor = (user) =>
    jwt.sign(user, process.env.JWT_SECRET, { expiresIn: '1h', algorithm: 'HS256' });

const auth = (user) => ({ Authorization: `Bearer ${tokenFor(user)}` });

describe('User management permissions', () => {
    let admin, manager, editor, user, other;

    afterAll(() => {
        db.close();
        cleanupTestDb();
    });

    beforeEach(() => {
        db.prepare('DELETE FROM users').run();
        admin = insertUser('admin1', 'admin');
        manager = insertUser('manager1', 'manager');
        editor = insertUser('editor1', 'editor');
        user = insertUser('user1', 'user');
        other = insertUser('user2', 'user');
    });

    describe('POST /api/users', () => {
        const newAdmin = { username: 'sneaky', email: 'sneaky@test.com', password: 'secret12345', role: 'admin' };

        it('rejects a regular user creating an admin', async () => {
            const res = await request(app).post('/api/users').set(auth(user)).send(newAdmin);
            expect(res.status).toBe(403);
            expect(db.prepare('SELECT * FROM users WHERE username = ?').get('sneaky')).toBeUndefined();
        });

        it.each(['manager', 'editor', 'viewer'])('rejects %s creating users', async (role) => {
            const actor = role === 'viewer' ? insertUser('viewer1', 'viewer') : { manager, editor }[role];
            const res = await request(app).post('/api/users').set(auth(actor)).send(newAdmin);
            expect(res.status).toBe(403);
        });

        it('allows an admin to create users', async () => {
            const res = await request(app).post('/api/users').set(auth(admin)).send(newAdmin);
            expect(res.status).toBe(201);
        });
    });

    describe('reading users', () => {
        it('rejects a regular user listing users', async () => {
            const res = await request(app).get('/api/users').set(auth(user));
            expect(res.status).toBe(403);
        });

        it('rejects a regular user fetching another user', async () => {
            const res = await request(app).get(`/api/users/${other.id}`).set(auth(user));
            expect(res.status).toBe(403);
        });

        it('rejects a regular user reading the users report', async () => {
            const res = await request(app).get('/api/reports/users').set(auth(user));
            expect(res.status).toBe(403);
        });

        it('allows admin and manager to list users', async () => {
            for (const actor of [admin, manager]) {
                const res = await request(app).get('/api/users').set(auth(actor));
                expect(res.status).toBe(200);
                expect(res.body.data.length).toBe(5);
                expect(res.body.data[0]).not.toHaveProperty('password');
            }
        });

        it('requires a token', async () => {
            const res = await request(app).get('/api/users');
            expect(res.status).toBe(401);
        });
    });

    describe('PUT /api/users/:id', () => {
        const roleOf = (id) => db.prepare('SELECT role FROM users WHERE id = ?').get(id).role;

        it('rejects an editor promoting anyone', async () => {
            const res = await request(app).put(`/api/users/${editor.id}`).set(auth(editor)).send({ role: 'admin' });
            expect(res.status).toBe(403);
            expect(roleOf(editor.id)).toBe('editor');
        });

        it('rejects a regular user promoting themselves', async () => {
            const res = await request(app).put(`/api/users/${user.id}`).set(auth(user)).send({ role: 'admin' });
            expect(res.status).toBe(403);
            expect(roleOf(user.id)).toBe('user');
        });

        it('rejects a manager changing roles', async () => {
            const res = await request(app).put(`/api/users/${other.id}`).set(auth(manager)).send({ role: 'manager' });
            expect(res.status).toBe(403);
            expect(roleOf(other.id)).toBe('user');
        });

        it('rejects a manager editing an admin account', async () => {
            const res = await request(app).put(`/api/users/${admin.id}`).set(auth(manager)).send({ password: 'hijacked123' });
            expect(res.status).toBe(403);
        });

        it('allows a manager to edit a non-admin without changing role', async () => {
            const res = await request(app).put(`/api/users/${other.id}`).set(auth(manager)).send({ username: 'renamed' });
            expect(res.status).toBe(200);
            expect(db.prepare('SELECT username FROM users WHERE id = ?').get(other.id).username).toBe('renamed');
        });

        it('allows an admin to change roles', async () => {
            const res = await request(app).put(`/api/users/${other.id}`).set(auth(admin)).send({ role: 'editor' });
            expect(res.status).toBe(200);
            expect(roleOf(other.id)).toBe('editor');
        });

        it('rejects an invalid role', async () => {
            const res = await request(app).put(`/api/users/${other.id}`).set(auth(admin)).send({ role: 'superuser' });
            expect(res.status).toBe(400);
        });

        it('stops an admin demoting themselves', async () => {
            const res = await request(app).put(`/api/users/${admin.id}`).set(auth(admin)).send({ role: 'user' });
            expect(res.status).toBe(400);
            expect(roleOf(admin.id)).toBe('admin');
        });
    });

    describe('DELETE /api/users/:id', () => {
        it('rejects a regular user deleting someone', async () => {
            const res = await request(app).delete(`/api/users/${other.id}`).set(auth(user));
            expect(res.status).toBe(403);
        });

        it('rejects a manager deleting an admin', async () => {
            const res = await request(app).delete(`/api/users/${admin.id}`).set(auth(manager));
            expect(res.status).toBe(403);
        });

        it('allows a manager to delete a regular user', async () => {
            const res = await request(app).delete(`/api/users/${other.id}`).set(auth(manager));
            expect(res.status).toBe(200);
        });
    });
});
