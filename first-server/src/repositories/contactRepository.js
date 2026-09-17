// Only job: run database queries for contact requests. No business logic here.
const prisma = require('../lib/prisma');

// Customer sends a contact request to an owner about a cab
const create = async (data) => {
  return prisma.contactRequest.create({
    data,
    include: {
      cab:   { select: { name: true } },
      owner: { select: { name: true, phone: true } },
    },
  });
};

// Owner sees all contact requests sent to them
const findByOwner = async (ownerId) => {
  return prisma.contactRequest.findMany({
    where:   { ownerId },
    include: {
      customer: { select: { name: true, phone: true, email: true } },
      cab:      { select: { name: true, type: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

// Customer sees all contact requests they sent
const findByCustomer = async (customerId) => {
  return prisma.contactRequest.findMany({
    where:   { customerId },
    include: {
      owner: { select: { name: true, phone: true } },
      cab:   { select: { name: true, type: true, imageUrl: true } },
    },
    orderBy: { createdAt: 'desc' },
  });
};

// Owner updates status of a contact request
const updateStatus = async (id, status) => {
  return prisma.contactRequest.update({
    where: { id },
    data:  { status },
  });
};

module.exports = { create, findByOwner, findByCustomer, updateStatus };