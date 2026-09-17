// Only job: business logic for auth. No req/res here.
const bcrypt  = require('bcrypt');
const jwt     = require('jsonwebtoken');
const userRepository           = require('../repositories/userRepository');
const { badRequest, unauthorized } = require('../lib/AppError');

// Helper — signs a JWT token with user's id, email, role
const signToken = (user) => jwt.sign(
  { id: user.id, email: user.email, role: user.role },
  process.env.JWT_SECRET,
  { expiresIn: '7d' }
);

const register = async ({ name, email, password, role, phone }) => {
  // Business rule — all required fields must be present
  if (!name || !email || !password || !role)
    throw badRequest('name, email, password, role required');

  // Business rule — role must be valid
  if (!['customer', 'owner'].includes(role))
    throw badRequest('role must be customer or owner');

  // Business rule — email must be unique
  const existing = await userRepository.findByEmail(email);
  if (existing) throw badRequest('Email already registered');

  // Hash password — NEVER store plain text
  const hashed = await bcrypt.hash(password, 10);

  // Create user
  const user  = await userRepository.create({ name, email, password: hashed, role, phone });
  const token = signToken(user);

  return { user, token };
};

const login = async ({ email, password }) => {
  // Business rule — both fields required
  if (!email || !password) throw badRequest('email and password required');

  // Find user — include password for comparison
  const user = await userRepository.findByEmail(email);
  if (!user) throw unauthorized('Invalid credentials');

  // Compare password
  const match = await bcrypt.compare(password, user.password);
  if (!match) throw unauthorized('Invalid credentials');

  // Remove password from response
  const { password: _, ...safeUser } = user;
  const token = signToken(safeUser);

  return { user: safeUser, token };
};

module.exports = { register, login };