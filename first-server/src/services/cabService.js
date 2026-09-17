// Only job: business logic for cabs. No req/res here.
const cabRepository          = require('../repositories/cabRepository');
const cache                  = require('../lib/cache');
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
  // Build cache key from query params — different filters = different cache entries
  const cacheKey = `cabs:list:${JSON.stringify(query)}`;

  // Check cache first
  const cached = await cache.get(cacheKey);
  if (cached) {
    console.log('Cache HIT:', cacheKey);
    return cached;
  }

  console.log('Cache MISS:', cacheKey);

  // Cache miss — query database
  const cabs = await cabRepository.findMany(buildFilters(query));

  // Store in cache
  await cache.set(cacheKey, cabs, cache.TTL.CABS_LIST);

  return cabs;

};

const getOwnerListings = async (ownerId) => {
  // Owner listings are personal — don't cache
  return cabRepository.findByOwner(ownerId);
};

const getCabById = async (id) => {
  const cacheKey = `cabs:detail:${id}`;

  const cached = await cache.get(cacheKey);
  if (cached) {
    console.log('Cache HIT:', cacheKey);
    return cached;
  }

  console.log('Cache MISS:', cacheKey);

  const cab = await cabRepository.findById(id);
  if (!cab) throw notFound('Cab not found');

  await cache.set(cacheKey, cab, cache.TTL.CAB_DETAIL);

  return cab;

};

const createCab = async (body, ownerId) => {
  const { name, type, capacity, pricePerKm, location, imageUrl } = body;

  // Business rule — all required fields must be present
  // Note: ownerId comes from the token, not request body — more secure
  if (!name || !type || !capacity || !pricePerKm || !location)
    throw badRequest('name, type, capacity, pricePerKm, location required');

  const cab = await cabRepository.create({
    name, type,
    capacity:   +capacity,
    pricePerKm: +pricePerKm,
    location, imageUrl, ownerId,
  });

  // New cab added — invalidate all cab list caches
  await cache.invalidate('cabs:list:*');

  return cab;

};

const updateCab = async (id, body) => {
  const { name, type, capacity, pricePerKm, location, isAvailable, imageUrl } = body;

  const existing = await cabRepository.findById(id);
  if (!existing) throw notFound('Cab not found');

  const cab = await cabRepository.update(id, {
    name, type,
    capacity:   capacity   ? +capacity   : undefined,
    pricePerKm: pricePerKm ? +pricePerKm : undefined,
    location, isAvailable, imageUrl,
  });

  // Cab updated — clear its detail cache and all list caches
  await cache.del(`cabs:detail:${id}`);
  await cache.invalidate('cabs:list:*');

  return cab;

};

const deleteCab = async (id) => {
  const existing = await cabRepository.findById(id);
  if (!existing) throw notFound('Cab not found');

  await cabRepository.remove(id);

  // Cab deleted — clear its detail cache and all list caches
  await cache.del(`cabs:detail:${id}`);
  await cache.invalidate('cabs:list:*');
  
};

module.exports = { getAllCabs, getOwnerListings, getCabById, createCab, updateCab, deleteCab };