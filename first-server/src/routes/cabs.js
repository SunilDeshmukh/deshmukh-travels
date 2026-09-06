const router = require('express').Router();
const prisma = require('../lib/prisma');
const { protect, ownerOnly } = require('../middleware/auth');

// ── GET /api/cabs — browse all cabs (with optional filters) ─────
// Usage: /api/cabs?location=Pune&type=SUV&available=true
router.get('/', async(req, res) => {
    const { location, type, available } = req.query;
    try {
        const cabs = await prisma.cab.findMany({
            where: {
                ...(location  && { location: { contains: location, mode: 'insensitive' } }),
                ...(type      && { type }),
                ...(available && { isAvailable: available === 'true' }),
            },
            include: { owner: {select: { id: true, name: true, phone: true }}},
            orderBy: { createdAt: 'desc' },
        });
        res.json(cabs);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch cabs' });
    }
});

// ── GET /api/cabs/my/listings — owner's own cabs ───────────────
// Note: must be BEFORE /:id route or Express reads "my" as an id
// Protected — owner only
router.get('/my/listings', protect, ownerOnly, async (req, res) => {
  const ownerId = req.user.id; // ← from token now, not query param
  try {
    const cabs = await prisma.cab.findMany({
      where:   { ownerId },
      include: { bookings: { select: { id: true, status: true, journeyDate: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(cabs);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch your listings' });
  }
});

// ── GET /api/cabs/:id — one cab detail with reviews ────────────
router.get('/:id', async (req, res) => {
  try {
    const cab = await prisma.cab.findUnique({
      where:   { id: +req.params.id },
      include: {
        owner:   { select: { id: true, name: true, phone: true } },
        reviews: { include: { customer: { select: { name: true } } },
                   orderBy: { createdAt: 'desc' } },
      },
    });
    if (!cab) return res.status(404).json({ error: 'Cab not found' });
    res.json(cab);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch cab' });
  }
});

// ── POST /api/cabs — owner lists a new cab ─────────────────────
router.post('/', protect, ownerOnly, async (req, res) => {
  const { name, type, capacity, pricePerKm, location, imageUrl, ownerId } = req.body;
  if (!name || !type || !capacity || !pricePerKm || !location || !ownerId)
    return res.status(400).json({ error: 'name, type, capacity, pricePerKm, location, ownerId required' });
  try {
    const cab = await prisma.cab.create({
      data: { name, type, capacity: +capacity, pricePerKm: +pricePerKm, location, imageUrl, ownerId: +ownerId },
    });
    res.status(201).json(cab);
  } catch (err) {
    res.status(500).json({ error: 'Failed to create cab listing' });
  }
});

// ── PUT /api/cabs/:id — owner updates cab ──────────────────────
router.put('/:id', protect, ownerOnly, async (req, res) => {
  const { name, type, capacity, pricePerKm, location, isAvailable, imageUrl } = req.body;
  try {
    const cab = await prisma.cab.update({
      where: { id: +req.params.id },
      data:  { name, type, capacity: capacity ? +capacity : undefined,
               pricePerKm: pricePerKm ? +pricePerKm : undefined,
               location, isAvailable, imageUrl },
    });
    res.json(cab);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Cab not found' });
    res.status(500).json({ error: 'Failed to update cab' });
  }
});

router.delete('/:id', protect, ownerOnly, async (req, res) => {
  try {
    await prisma.cab.delete({ where: { id: +req.params.id } });
    res.json({ message: 'Cab listing removed' });
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Cab not found' });
    res.status(500).json({ error: 'Failed to delete cab' });
  }
});

module.exports = router;