// ── Deshmukh Travels — Bookings Route ──────────────────────────
const router = require('express').Router();
const prisma = require('../lib/prisma');
const { protect, ownerOnly, customerOnly } = require('../middleware/auth');
const { sendBookingNotification, sendWhatsAppNotification } = require('../lib/mailer');

// ── POST /api/bookings — customer books a cab ──────────────────
router.post('/', protect, customerOnly, async (req, res) => {
  const { fromLocation, toLocation, journeyDate, returnDate, cabId, totalPrice } = req.body;
  const customerId = req.user.id;

  // ── Validate ──────────────────────────────────────────────────
  if (!fromLocation || !toLocation || !journeyDate || !returnDate || !cabId)
    return res.status(400).json({ error: 'fromLocation, toLocation, journeyDate, returnDate, cabId required' });

  const start = new Date(journeyDate);
  const end = new Date(returnDate);

  if (end <= start)
    return res.status(400).json({ error: 'returnDate must be after journeyDate' });

  try {
    // ── Check cab exists ──────────────────────────────────────
    const cab = await prisma.cab.findUnique({
      where: { id: +cabId },
      include: { owner: { select: { email: true, name: true, phone: true } } }, // ← include owner
    });
    if (!cab) return res.status(404).json({ error: 'Cab not found' });
    if (!cab.isAvailable) return res.status(409).json({ error: 'Cab is not available' });

    // ── Overlap check ─────────────────────────────────────────
    const conflict = await prisma.booking.findFirst({
      where: {
        cabId: +cabId,
        status: { in: ['pending', 'confirmed'] },
        AND: [
          { journeyDate: { lt: end } },
          { returnDate: { gt: start } },
        ],
      },
    });

    if (conflict)
      return res.status(409).json({
        error: `Cab already booked from ${conflict.journeyDate.toDateString()} to ${conflict.returnDate.toDateString()}`
      });

    // Add this after the conflict check, before creating booking
    const customer = await prisma.user.findUnique({
      where: { id: customerId },
      select: { name: true },
    });

    // ── Create booking ────────────────────────────────────────
    const booking = await prisma.booking.create({
      data: {
        fromLocation,
        toLocation,
        journeyDate: start,
        returnDate: end,
        cabId: +cabId,
        customerId,
        totalPrice: totalPrice ? +totalPrice : null,
      },
    });

    // ── Send email to cab owner ───────────────────────────────
    // Fire and forget — don't await, don't fail the booking if email fails
    sendBookingNotification({
      ownerEmail: cab.owner.email,
      ownerName: cab.owner.name,
      customerName: customer.name,   // ← proper name
      booking,
      cabName: cab.name,
    }).catch(err => console.error('Email failed:', err));

    // WhatsApp — fire and forget
    // ── WhatsApp notification — fire and forget ───────────────
    // STATUS: Production-ready, currently skips on trial accounts
    // ACTIVATION: Add TWILIO_CONTENT_SID to server/.env
    // See server/src/lib/mailer.js → sendWhatsAppNotification for full instructions
    //
    // Only runs if owner has a phone number saved (registered with phone field)
    // Phone must include country code e.g. +919876543210
    if (cab.owner.phone) {
      sendWhatsAppNotification({
        ownerPhone: cab.owner.phone,
        customerName: customer.name,
        booking,
        cabName: cab.name,
      }).catch(err => console.error('[WhatsApp] Notification failed:', err.message));
    } else {
      // Owner has no phone number saved — WhatsApp skipped
      // Owner can add phone via profile settings (future feature)
      console.log('[WhatsApp] Skipped — owner has no phone number saved');
    }
    
    res.status(201).json(booking);

  } catch (err) {
    // res.status(500).json({ error: 'Failed to create booking' });
    console.error('BOOKING ERROR:', err); // ← add this
    res.status(500).json({ error: err.message });
  }
});

// ── GET /api/bookings/my — customer's booking history ──────────
router.get('/my', protect, customerOnly, async (req, res) => {
  const customerId = req.user.id; // ← from token, not query param
  try {
    const bookings = await prisma.booking.findMany({
      where: { customerId },
      include: {
        cab: { select: { name: true, type: true, imageUrl: true } },
        review: true
      }, // show if they already reviewed
      orderBy: { journeyDate: 'desc' },
    });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch bookings' });
  }
});


// ── GET /api/bookings/cab/:cabId — owner sees bookings for a cab 
router.get('/cab/:cabId', protect, ownerOnly, async (req, res) => {
  try {
    const bookings = await prisma.booking.findMany({
      where: { cabId: +req.params.cabId },
      include: { customer: { select: { name: true, phone: true, email: true } } },
      orderBy: { journeyDate: 'asc' },
    });
    res.json(bookings);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch cab bookings' });
  }
});


// PUT /:id/status 
router.put('/:id/status', protect, async (req, res) => {
  const { status } = req.body;
  const bookingId = +req.params.id;

  try {
    const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    // ── Owner can confirm or reject ───────────────────────────
    if (req.user.role === 'owner') {
      if (!['confirmed', 'cancelled', 'completed'].includes(status))
        return res.status(400).json({ error: 'Invalid status for owner' });
    }

    // ── Customer can only cancel their own booking ────────────
    else if (req.user.role === 'customer') {
      if (status !== 'cancelled')
        return res.status(403).json({ error: 'Customers can only cancel bookings' });
      if (booking.customerId !== req.user.id)
        return res.status(403).json({ error: 'Not your booking' });
      if (booking.status === 'completed')
        return res.status(400).json({ error: 'Cannot cancel a completed booking' });
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: { status },
    });
    res.json(updated);

  } catch (err) {
    if (err.code === 'P2025') return res.status(404).json({ error: 'Booking not found' });
    res.status(500).json({ error: 'Failed to update booking status' });
  }
});


module.exports = router;