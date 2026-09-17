// Only job: run database queries for cabs. No business logic here.
const prisma = require('../lib/prisma');

// Get all cabs with optional filters
// filters is a Prisma where object built by the service
const findMany = async (filters = {}) => {
  return prisma.cab.findMany({
    where:   filters,
    include: { owner: { select: { id: true, name: true, phone: true } } },
    orderBy: { createdAt: 'desc' },
  });
};

// Get owner's own cabs with booking summary
const findByOwner = async (ownerId) => {
  return prisma.cab.findMany({
    where:   { ownerId },
    include: { bookings: { select: { id: true, status: true, journeyDate: true } } },
    orderBy: { createdAt: 'desc' },
  });
};

// Get one cab with owner and reviews
const findById = async (id) => {
  return prisma.cab.findUnique({
    where:   { id },
    include: {
      owner:   { select: { id: true, name: true, phone: true } },
      reviews: {
        include: { customer: { select: { name: true } } },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
};

// Create a new cab
const create = async (data) => {
  return prisma.cab.create({ data });
};

// Update a cab — only pass fields that exist
const update = async (id, data) => {
  return prisma.cab.update({ where: { id }, data });
};

// Delete a cab
const remove = async (id) => {
  return prisma.cab.delete({ where: { id } });
};

module.exports = { findMany, findByOwner, findById, create, update, remove };