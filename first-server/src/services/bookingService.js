// Only job: business logic for bookings. No req/res here.
const bookingRepository                    = require('../repositories/bookingRepository');
const cabRepository                        = require('../repositories/cabRepository');
const { sendBookingNotification }          = require('../lib/mailer');
const { notFound, badRequest, conflict, forbidden } = require('../lib/AppError');

const createBooking = async (body, currentUser) => {
  const { fromLocation, toLocation, journeyDate, returnDate, cabId } = body;

  // Business rule — all fields required
  if (!fromLocation || !toLocation || !journeyDate || !returnDate || !cabId)
    throw badRequest('fromLocation, toLocation, journeyDate, returnDate, cabId required');

  const start = new Date(journeyDate);
  const end   = new Date(returnDate);

  // Business rule — return date must be after journey date
  if (end <= start)
    throw badRequest('returnDate must be after journeyDate');

  // Business rule — cab must exist
  const cab = await cabRepository.findById(+cabId);
  if (!cab) throw notFound('Cab not found');

  // Business rule — no overlapping bookings
  const existing = await bookingRepository.findConflict(+cabId, start, end);
  if (existing) throw conflict('Cab is already booked for these dates');

  // Create booking
  const booking = await bookingRepository.create({
    fromLocation, toLocation,
    journeyDate: start, returnDate: end,
    cabId:      +cabId,
    customerId:  currentUser.id,
  });

  // Fire and forget — email failure must not crash the booking
  sendBookingNotification({
    ownerEmail:   cab.owner.email,
    ownerName:    cab.owner.name,
    customerName: currentUser.name,
    cabName:      cab.name,
    booking,
  }).catch(console.error);

  return booking;
};

const getMyBookings = async (customerId) => {
  return bookingRepository.findByCustomer(customerId);
};

const getCabBookings = async (cabId) => {
  return bookingRepository.findByCab(+cabId);
};

const updateBookingStatus = async (bookingId, status, currentUser) => {
  const booking = await bookingRepository.findById(bookingId);
  if (!booking) throw notFound('Booking not found');

  // Business rule — owner can confirm, reject, or complete
  if (currentUser.role === 'owner') {
    if (!['confirmed', 'cancelled', 'completed'].includes(status))
      throw badRequest('Owner can set: confirmed, cancelled, completed');
  }

  // Business rule — customer can only cancel their own booking
  else if (currentUser.role === 'customer') {
    if (status !== 'cancelled')
      throw forbidden('Customers can only cancel bookings');
    if (booking.customerId !== currentUser.id)
      throw forbidden('Not your booking');
    if (booking.status === 'completed')
      throw badRequest('Cannot cancel a completed booking');
  }

  return bookingRepository.updateStatus(bookingId, status);
};

module.exports = { createBooking, getMyBookings, getCabBookings, updateBookingStatus };