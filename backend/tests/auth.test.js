// backend/tests/auth.test.js
const { resetTestDb, cleanupTestDb } = require('./helpers/db');
resetTestDb(); // Must run before app/db require

const request = require('supertest');
const app = require('../src/app');
const db = require('../src/config/db');

describe('Auth API', () => {
    afterAll(() => {
        db.close();
        cleanupTestDb();
    });

    beforeEach(() => {
        db.prepare('DELETE FROM users').run();
    });

    describe('POST /api/user/register', () => {
        it('creates a user with valid data', async () => {
            const res = await request(app)
                .post('/api/user/register')
                .send({ username: 'soji', email: 'soji@test.com', password: 'secret12345' });

            expect(res.status).toBe(201);
            expect(res.body.user.username).toBe('soji');
            expect(res.body.user.role).toBe('user');

            const dbUser = db.prepare('SELECT * FROM users WHERE username = ?').get('soji');
            expect(dbUser).toBeTruthy();
            expect(dbUser.password).not.toBe('secret12345'); // Hashed
        });

        it('rejects invalid email', async () => {
            const res = await request(app)
                .post('/api/user/register')
                .send({ username: 'testuser', email: 'bad', password: 'secret12345' });

            expect(res.status).toBe(400);
            expect(res.body.errors).toEqual(
                expect.arrayContaining([expect.objectContaining({ field: 'email' })])
            );
        });

        it('rejects short password', async () => {
            const res = await request(app)
                .post('/api/user/register')
                .send({ username: 'testuser', email: 'test@test.com', password: 'short' });

            expect(res.status).toBe(400);
            expect(res.body.errors).toEqual(
                expect.arrayContaining([expect.objectContaining({ field: 'password' })])
            );
        });

        it('rejects duplicate email', async () => {
            await request(app)
                .post('/api/user/register')
                .send({ username: 'usera', email: 'dup@test.com', password: 'secret12345' });

            const res = await request(app)
                .post('/api/user/register')
                .send({ username: 'userb', email: 'dup@test.com', password: 'secret12345' });

            expect(res.status).toBe(409);
        });

        it('rejects duplicate username', async () => {
            await request(app)
                .post('/api/user/register')
                .send({ username: 'dupeuser', email: 'first@test.com', password: 'secret12345' });

            const res = await request(app)
                .post('/api/user/register')
                .send({ username: 'dupeuser', email: 'second@test.com', password: 'secret12345' });

            expect(res.status).toBe(409);
        });
    });

    describe('POST /api/user/login', () => {
        beforeEach(async () => {
            await request(app)
                .post('/api/user/register')
                .send({ username: 'soji', email: 'soji@test.com', password: 'secret12345' });
        });

        it('returns a token for valid credentials', async () => {
            const res = await request(app)
                .post('/api/user/login')
                .send({ email: 'soji@test.com', password: 'secret12345' });

            expect(res.status).toBe(200);
            expect(res.body.token).toBeDefined();
            expect(res.body.user.role).toBe('user');
        });

        it('rejects wrong password', async () => {
            const res = await request(app)
                .post('/api/user/login')
                .send({ email: 'soji@test.com', password: 'wrongpassword' });

            expect(res.status).toBe(401);
        });

        it('rejects non-existent email', async () => {
            const res = await request(app)
                .post('/api/user/login')
                .send({ email: 'none@test.com', password: 'secret12345' });

            expect(res.status).toBe(401);
        });
    });

    describe('GET /api/health', () => {
        it('returns ok with database connected', async () => {
            const res = await request(app).get('/api/health');
            expect(res.status).toBe(200);
            expect(res.body.status).toBe('ok');
            expect(res.body.database).toBe('connected');
        });
    });
});