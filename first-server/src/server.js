// Step 1: Load Express
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const { AppError } = require('./lib/AppError');


// Step 2: Create your app instance
const app = express();
const PORT = process.env.PORT || 3000;

// Step 3: Register middleware (in order!)
app.use(cors({
  origin: [
    'https://deshmukh-travels.vercel.app',
    'http://localhost:5173',
  ],
  credentials: true,
}));
app.use(express.json());
app.use(helmet());          // adds 14 security headers automatically
app.set('trust proxy', 1); // trust first proxy — Railway, Vercel, Nginx etc.

// ── Rate limiters ─────────────────────────────────────────────

// General limiter — applies to every route
const generalLimiter = rateLimit({
  windowMs:        15 * 60 * 1000, // 15 minutes
  max:             100,             // 100 requests per IP per 15 min
  message:         { error: 'Too many requests, please try again later' },
  standardHeaders: true,           // sends RateLimit headers in response
  legacyHeaders:   false,
});

// Strict limiter — auth routes only
const authLimiter = rateLimit({
  windowMs:        15 * 60 * 1000, // 15 minutes
  max:             5,              // only 5 attempts per IP per 15 min
  message:         { error: 'Too many login attempts, please try again in 15 minutes' },
  standardHeaders: true,
  legacyHeaders:   false,
});

// Apply general limiter to ALL routes
app.use(generalLimiter);

// Apply strict limiter to auth routes only
// This runs IN ADDITION to generalLimiter — auth gets both
app.use('/api/auth', authLimiter);

// ── Routes — Deshmukh Travels ───────────────────────────────────
app.use('/api/users',    require('./routes/users'));
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/cabs',     require('./routes/cabs'));
app.use('/api/bookings', require('./routes/bookings'));
app.use('/api/contacts', require('./routes/contacts'));

// ── Health check ──────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'API is running' });
});

// ── 404 handler ───────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ── Global error handler ──────────────────────────────────────
app.use((err, req, res, next) => {

  // Log every error with context
  console.error({
    message:    err.message,
    statusCode: err.statusCode,
    url:        req.url,
    method:     req.method,
    timestamp:  new Date().toISOString(),
  });

  // Known operational error — throw by our services intentionally
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      success: false,
      error:   err.message,
      code:    err.statusCode,
    });
  }

  // Prisma unique constraint — e.g. duplicate email
  if (err.code === 'P2002') {
    return res.status(400).json({ success: false, error: 'This value already exists', code: 400 });
  }

  // Prisma record not found
  if (err.code === 'P2025') {
    return res.status(404).json({ success: false, error: 'Record not found', code: 404 });
  }

  // Unknown bug — never expose details to client
  console.error('UNEXPECTED ERROR:', err);
  res.status(500).json({ success: false, error: 'Something went wrong', code: 500 });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});