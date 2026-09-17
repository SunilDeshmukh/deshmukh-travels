const router         = require('express').Router();
const { protect, ownerOnly, customerOnly } = require('../middleware/auth');
const bookingService = require('../services/bookingService');
const { success, created } = require('../lib/response');

// POST /api/bookings
router.post('/', protect, customerOnly, async (req, res, next) => {
  try {
    const booking = await bookingService.createBooking(req.body, req.user);
    created(res, booking, 'Booking created successfully');
  } catch (err) { next(err); }
});

// GET /api/bookings/my
router.get('/my', protect, customerOnly, async (req, res, next) => {
  try {
    const bookings = await bookingService.getMyBookings(req.user.id);
    success(res, bookings, 'Bookings fetched');
  } catch (err) { next(err); }
});

// GET /api/bookings/cab/:cabId
router.get('/cab/:cabId', protect, ownerOnly, async (req, res, next) => {
  try {
    const bookings = await bookingService.getCabBookings(req.params.cabId);
    success(res, bookings, 'Cab bookings fetched');
  } catch (err) { next(err); }
});

// PUT /api/bookings/:id/status
router.put('/:id/status', protect, async (req, res, next) => {
  try {
    const booking = await bookingService.updateBookingStatus(
      +req.params.id,
      req.body.status,
      req.user
    );
    success(res, booking, 'Booking status updated');
  } catch (err) { next(err); }
});

module.exports = router;