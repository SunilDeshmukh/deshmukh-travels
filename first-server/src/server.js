// Step 1: Load Express
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');


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

// ── Global error handler ──────────────────────
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong' });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});