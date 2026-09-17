// Only job: run database queries for users. No business logic here.
const prisma = require('../lib/prisma');

const safeSelect = {
  id: true, name: true, email: true,
  phone: true, role: true, createdAt: true
};

// Find a user by email — used in auth (login + register check)
const findByEmail = async (email) => {
  return prisma.user.findUnique({ where: { email } });
};

// Find a user by id — excludes password by default
const findById = async (id) => {
  return prisma.user.findUnique({
    where:  { id },
    select: safeSelect,
  });
};

// Get all users
const findAll = async () => {
  return prisma.user.findMany({ select: safeSelect });
};

// Get all owners with their cabs
const findAllOwners = async () => {
  return prisma.user.findMany({
    where:  { role: 'owner' },
    select: {
      id: true, name: true, phone: true,
      cabs: { select: { id: true, name: true, type: true,
                        pricePerKm: true, isAvailable: true } },
    },
  });
};

// Create a new user — caller passes already-hashed password
const create = async (data) => {
  return prisma.user.create({
    data,
    select: safeSelect,
  });
};

// Update name and phone only — email and role never change here
const update = async (id, data) => {
  return prisma.user.update({
    where:  { id },
    data,
    select: safeSelect,
  });
};

// Delete a user
const remove = async (id) => {
  return prisma.user.delete({ where: { id } });
};

module.exports = { findByEmail, findById, findAll, findAllOwners, create, update, remove };