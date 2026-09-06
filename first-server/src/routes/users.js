const router = require('express').Router();
const prisma = require('../lib/prisma');     // shared DB client — never new PrismaClient()

// ── GET /api/users — all users (admin)
router.get('/', async(req, res) => {

    try {
        const users = await prisma.user.findMany({
            select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true}
            // password is excluded from select — never send it to client
        })
        res.json(users);
    } catch (err){
        res.status(500).json({error: 'Failed to fetch users'});
    }
});

// ── GET /api/users/owners — all cab owners (customers browse this) ─
router.get('/owners', async (req, res) => {
    try {
        const owners = await prisma.user.findMany({
            where: { role: 'owner' },
            select: { 
                id: true, name: true, phone: true,
                    cabs: { select: { id: true, name: true, type: true, pricePerKm: true, isAvailable: true }}
            },
        });
        res.json(owners);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch owners' });
    }
});


// ── GET /api/users/:id — one user profile 
router.get('/:id', async (req, res) => {
    try {
        const user = await prisma.user.findUnique({
            where: { id: +req.params.id },
            select: {  id: true, name: true, email: true, phone: true, role: true, createdAt: true }
        });
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.json(user);
    } catch (err) {
        res.status(500).json({ error: 'Failed to fetch user' });
    }
});

// ── POST /api/users — create user (Prisma) ──────────────────────
router.post('/', async (req, res) => {    // ← async added
  const { name, email, password, role } = req.body;  // ← role added
  if (!name || !email || !password || !role)
    return res.status(400).json({ error: 'name, email, password, role required' });
  try {
    const user = await prisma.user.create({  // ← Prisma, not array
      data: { name, email, password, role },
      select: { id: true, name: true, email: true, phone: true, role: true, createdAt: true }
    });
    res.status(201).json(user);
  } catch (err) {
    if (err.code === 'P2002')  // unique email violated
      return res.status(400).json({ error: 'Email already exists' });
    res.status(500).json({ error: 'Failed to create user' });
  }
});

// ── PUT /api/users/:id — update profile
router.put('/:id', async (req, res) =>{
    
    const { name, phone } = req.body;
    try {
        const user = await prisma.user.update({
            where: { id: +req.params.id },
            data: { name, phone },
            select: { id: true, name: true, email: true, phone: true, role: true }
        })
        res.json(user);
    } catch (err) {
        if (err.code === 'P2025') return res.status(404).json({ error: 'User not found' });
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// ── DELETE /api/users/:id ──────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    await prisma.user.delete({ where: { id: +req.params.id } });
    res.json({ message: 'Account deleted' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'User not found' });
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

module.exports = router;
