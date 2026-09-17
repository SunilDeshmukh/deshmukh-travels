const router      = require('express').Router();
const authService = require('../services/authService');
const { success, created } = require('../lib/response');

// POST /api/auth/register
router.post('/register', async (req, res, next) => {
  try {
    const result = await authService.register(req.body);
    created(res, result, 'Registration successful');
  } catch (err) { next(err); }
});

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const result = await authService.login(req.body);
    success(res, result, 'Login successful');
  } catch (err) { next(err); }
});

// GET /api/auth/me
router.get('/me', async (req, res, next) => {
  try {
    success(res, req.user, 'User fetched');
  } catch (err) { next(err); }
});

module.exports = router;