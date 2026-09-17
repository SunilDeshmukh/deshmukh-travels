// Only job: run database queries for bookings. No business logic here.
const prisma = require('../lib/prisma');

// Check if a cab is already booked for overlapping dates
// Used before creating a new booking
const findConflict = async (cabId, start, end) => {
  return prisma.booking.findFirst({
    where: {
      cabId,
      status: { in: ['pending', 'confirmed'] },
      AND: [
        { journeyDate: { lt: end   } }, // existing booking starts before new end
        { returnDate:  { gt: start } }, // existing booking ends after new start
      ],
    },
  });
};

// Create a new booking
const create = async (data) => {
  return prisma.booking.create({ data });
};

// Get all bookings for a customer — their booking history
const findByCustomer = async (customerId) => {
  return prisma.booking.findMany({
    where:   { customerId },
    include: {
      cab:    { select: { name: true, type: true, imageUrl: true } },
      review: true, // show if customer already left a review
    },
    orderBy: { journeyDate: 'desc' },
  });
};

// Get all bookings for a specific cab — owner uses this
const findByCab = async (cabId) => {
  return prisma.booking.findMany({
    where:   { cabId },
    include: { customer: { select: { name: true, phone: true, email: true } } },
    orderBy: { journeyDate: 'asc' },
  });
};

// Find a single booking by id
const findById = async (id) => {
  return prisma.booking.findUnique({ where: { id } });
};

// Update booking status
const updateStatus = async (id, status) => {
  return prisma.booking.update({ where: { id }, data: { status } });
};

module.exports = { findConflict, create, findByCustomer, findByCab, findById, updateStatus };