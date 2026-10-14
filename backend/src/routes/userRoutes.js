// backend/src/routes/userRoutes.js
const express = require('express');
const rateLimit = require('express-rate-limit');
const {
    register,
    login,
    logout,
    changePassword,
    requestPasswordReset,
    resetPassword
} = require('../controllers/authController');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const {
    registerSchema,
    loginSchema,
    changePasswordSchema,
    requestResetSchema,
    resetPasswordSchema
} = require('../validators/auth');
const { NODE_ENV } = require('../config/env');

const router = express.Router();

// Standard auth rate limiter (login/register/reset-password)
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many attempts, please try again later' },
    skip: () => NODE_ENV === 'test'
});

// Stricter limiter for password-reset *requests* (prevents email spam)
const resetLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message: 'Too many reset requests, try again in an hour' },
    skip: () => NODE_ENV === 'test'
});

// Public auth
router.post('/register', authLimiter, validate(registerSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/logout', logout);

// Authenticated password management
router.put(
    '/change-password',
    authenticate,
    validate(changePasswordSchema),
    changePassword
);

// Public password reset flow
router.post(
    '/request-password-reset',
    resetLimiter,
    validate(requestResetSchema),
    requestPasswordReset
);
router.post(
    '/reset-password',
    authLimiter,
    validate(resetPasswordSchema),
    resetPassword
);

module.exports = router;