// ── Deshmukh Travels — Contact Requests Route ──────────────────
const router = require('express').Router();
const prisma = require('../lib/prisma');
const { protect, ownerOnly, customerOnly } = require('../middleware/auth');

// ── POST /api/contacts — customer contacts a cab owner ─────────
router.post('/', protect, customerOnly, async (req, res) => {
  const { message, tripDetails, customerId, ownerId, cabId } = req.body;
  if (!message || !customerId || !ownerId || !cabId)
    return res.status(400).json({ error: 'message, customerId, ownerId, cabId required' });
  try {
    const contact = await prisma.contactRequest.create({
      data: { message, tripDetails, customerId: +customerId, ownerId: +ownerId, cabId: +cabId },
      include: { cab: { select: { name: true } }, owner: { select: { name: true, phone: true } } },
    });
    res.status(201).json(contact);
  } catch (err) {
    res.status(500).json({ error: 'Failed to send contact request' });
  }
});


// ── GET /api/contacts/received — owner's inbox ─────────────────
router.get('/received', protect, ownerOnly, async (req, res) => {
  const ownerId = req.user.id;   // ← from token
  try {
    const contacts = await prisma.contactRequest.findMany({
      where:   { ownerId },
      include: { customer: { select: { name: true, phone: true, email: true } },
                 cab: { select: { name: true, type: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch received contacts' });
  }
});


// ── GET /api/contacts/sent — customer's sent inquiries ─────────
router.get('/sent', protect, customerOnly, async (req, res) => {
  const customerId = req.user.id; // ← from token
  try {
    const contacts = await prisma.contactRequest.findMany({
      where:   { customerId },
      include: { owner: { select: { name: true, phone: true } },
                 cab:   { select: { name: true, type: true, imageUrl: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch sent contacts' });
  }
});


// ── PUT /api/contacts/:id/status — owner responds ──────────────
router.put('/:id/status', async (req, res) => {
  const { status } = req.body; // "accepted" | "rejected" | "pending"
  const allowed = ['pending', 'accepted', 'rejected'];
  if (!allowed.includes(status))
    return res.status(400).json({ error: 'status must be pending|accepted|rejected' });
  try {
    const contact = await prisma.contactRequest.update({
      where: { id: +req.params.id },
      data:  { status },
    });
    res.json(contact);
  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Contact request not found' });
    res.status(500).json({ error: 'Failed to update contact status' });
  }
});

module.exports = router;