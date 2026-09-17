// Only job: business logic for cabs. No req/res here.
const cabRepository          = require('../repositories/cabRepository');
const { notFound, badRequest } = require('../lib/AppError');

// Build Prisma where object from query params
// Kept in service because it's business logic — what counts as a valid filter
const buildFilters = ({ location, type, available }) => {
  const filters = {};
  if (location)  filters.location    = { contains: location, mode: 'insensitive' };
  if (type)      filters.type        = type;
  if (available) filters.isAvailable = available === 'true';
  return filters;
};

const getAllCabs = async (query) => {
  return cabRepository.findMany(buildFilters(query));
};

const getOwnerListings = async (ownerId) => {
  return cabRepository.findByOwner(ownerId);
};

const getCabById = async (id) => {
  const cab = await cabRepository.findById(id);
  if (!cab) throw notFound('Cab not found');
  return cab;
};

const createCab = async (body, ownerId) => {
  const { name, type, capacity, pricePerKm, location, imageUrl } = body;

  // Business rule — all required fields must be present
  // Note: ownerId comes from the token, not request body — more secure
  if (!name || !type || !capacity || !pricePerKm || !location)
    throw badRequest('name, type, capacity, pricePerKm, location required');

  return cabRepository.create({
    name,
    type,
    capacity:   +capacity,
    pricePerKm: +pricePerKm,
    location,
    imageUrl,
    ownerId,    // always from token — owner can't spoof another ownerId
  });
};

const updateCab = async (id, body) => {
  const { name, type, capacity, pricePerKm, location, isAvailable, imageUrl } = body;

  const existing = await cabRepository.findById(id);
  if (!existing) throw notFound('Cab not found');

  return cabRepository.update(id, {
    name,
    type,
    capacity:   capacity   ? +capacity   : undefined,
    pricePerKm: pricePerKm ? +pricePerKm : undefined,
    location,
    isAvailable,
    imageUrl,
  });
};

const deleteCab = async (id) => {
  const existing = await cabRepository.findById(id);
  if (!existing) throw notFound('Cab not found');
  return cabRepository.remove(id);
};

module.exports = { getAllCabs, getOwnerListings, getCabById, createCab, updateCab, deleteCab };