import rateLimit from 'express-rate-limit';

// ─── GLOBAL ───────────────────────────────────────────────────────────────────
// 100 requests per 15 minutes per IP — applied to all routes

export const globalLimiter = rateLimit({
  windowMs:       15 * 60 * 1000,
  max:            100,
  standardHeaders: true,
  legacyHeaders:  false,
  message: {
    status:     'error',
    statusCode: 429,
    message:    'Too many requests from this IP, please try again after 15 minutes',
  },
});

// ─── AUTH ─────────────────────────────────────────────────────────────────────
// 10 attempts per 15 minutes — login, register, forgot-password, reset-password

export const authLimiter = rateLimit({
  windowMs:       15 * 60 * 1000,
  max:            10,
  standardHeaders: true,
  legacyHeaders:  false,
  message: {
    status:     'error',
    statusCode: 429,
    message:    'Too many authentication attempts, please try again after 15 minutes',
  },
});

// ─── AI POSTER ────────────────────────────────────────────────────────────────
// 20 requests per hour per IP — extra protection for expensive AI endpoints

export const aiPosterLimiter = rateLimit({
  windowMs:       60 * 60 * 1000,
  max:            20,
  standardHeaders: true,
  legacyHeaders:  false,
  message: {
    status:     'error',
    statusCode: 429,
    message:    'Too many AI poster requests, please try again after an hour',
  },
});
