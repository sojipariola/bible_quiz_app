// backend/src/validators/auth.js
const { z } = require('zod');

const registerSchema = z.object({
    username: z.string()
        .min(3, 'Username must be at least 3 characters')
        .max(30, 'Username must be at most 30 characters')
        .regex(/^[a-zA-Z0-9_.-]+$/, 'Username may only contain letters, numbers, and _ . -'),
    email: z.string().email('Invalid email address').max(120),
    password: z.string()
        .min(8, 'Password must be at least 8 characters')
        .max(100, 'Password must be at most 100 characters')
});

const loginSchema = z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required')
});

const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string()
        .min(8, 'New password must be at least 8 characters')
        .max(100, 'New password must be at most 100 characters')
});

const requestResetSchema = z.object({
    email: z.string().email('Invalid email address')
});

const resetPasswordSchema = z.object({
    token: z.string().min(1, 'Reset token is required'),
    newPassword: z.string()
        .min(8, 'Password must be at least 8 characters')
        .max(100, 'Password must be at most 100 characters')
});

module.exports = {
    registerSchema,
    loginSchema,
    changePasswordSchema,
    requestResetSchema,
    resetPasswordSchema
};