const router     = require('express').Router();
const { protect, ownerOnly } = require('../middleware/auth');
const cabService = require('../services/cabService');
const { success, created } = require('../lib/response');

// GET /api/cabs
router.get('/', async (req, res, next) => {
  try {
    const cabs = await cabService.getAllCabs(req.query);
    success(res, cabs, 'Cabs fetched');
  } catch (err) { next(err); }
});

// GET /api/cabs/my/listings
router.get('/my/listings', protect, ownerOnly, async (req, res, next) => {
  try {
    const cabs = await cabService.getOwnerListings(req.user.id);
    success(res, cabs, 'Your listings fetched');
  } catch (err) { next(err); }
});

// GET /api/cabs/:id
router.get('/:id', async (req, res, next) => {
  try {
    const cab = await cabService.getCabById(+req.params.id);
    success(res, cab, 'Cab fetched');
  } catch (err) { next(err); }
});

// POST /api/cabs
router.post('/', protect, ownerOnly, async (req, res, next) => {
  try {
    // ownerId comes from token — not body — owner can't spoof another id
    const cab = await cabService.createCab(req.body, req.user.id);
    created(res, cab, 'Cab listed successfully');
  } catch (err) { next(err); }
});

// PUT /api/cabs/:id
router.put('/:id', protect, ownerOnly, async (req, res, next) => {
  try {
    const cab = await cabService.updateCab(+req.params.id, req.body);
    success(res, cab, 'Cab updated');
  } catch (err) { next(err); }
});

// DELETE /api/cabs/:id
router.delete('/:id', protect, ownerOnly, async (req, res, next) => {
  try {
    await cabService.deleteCab(+req.params.id);
    success(res, null, 'Cab listing removed');
  } catch (err) { next(err); }
});

module.exports = router;