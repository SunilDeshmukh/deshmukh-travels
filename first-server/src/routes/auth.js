const router = require('express').Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const prisma = require('../lib/prisma');


// Helper — sign a token with user's id, email, role
const signToken = (user) => jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }         // token expires in 7 days
);

// ── POST /api/auth/register 
router.post('/register', async(req, res) => {
    const { name, email, password, role, phone } = req.body;

    // 1. Validate required fields
    if ( !name || !email || !password || !role)
        return res.status(400).json({ error: 'name, email, password, role required' });
    
    if (!['customer', 'owner'].includes(role))
        return res.status(400).json({ error: 'role must be customer or owner' });

    try {
        // 2. Check email not already taken
        const existing = await prisma.user.findUnique({ 
            where: { email }
        });
        if (existing) return res.status(400).json({ error: 'Email already registered' });

        // 3. Hash the password — NEVER store plain text
        const hashed = await bcrypt.hash(password, 10);

        // 4. Save user with hashed password
        const user = await prisma.user.create({
            data: {name, email, password: hashed, role, phone},
            select: { id: true, name: true, email: true, role: true, phone: true }
        });

        // 5. Sign token and return user + token
        const token = signToken(user);
        res.status(201).json({ user, token });

    } catch (err) {
        res.status(500).json({ error: 'Registration failed' });
    }
});

// ── POST /api/auth/login
router.post('/login', async(req, res) => {
    
    const { email, password } = req.body;
    if (!email || !password)
        return res.status(400).json({ error: 'email and password required' });
    
    try {
        
        // 1. Find user — include password this time (needed for compare)
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) return res.status(401).json({ error: 'Invalid credentials' });
        
        // 2. Compare password against hash — bcrypt handles it
        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ error: 'Invalid credentials' });
        
        // 3. Sign token and return (exclude password from response)
        const token = signToken(user);
        const { password: _, ...safeUser } = user; // remove password from object
        res.json({ user: safeUser, token });

    } catch (err) {
        res.status(500).json({ error: 'Login failed' });
    }

});

// ── GET /api/auth/me — get logged-in user's profile ────────────
// (protect middleware added in Step 6 — placeholder for now)
router.get('/me', async (req, res) => {
  res.json({ message: 'protect middleware will be added here in Step 6' });
});

module.exports = router;