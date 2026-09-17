const router      = require('express').Router();
const userService = require('../services/userService');
const { success, created } = require('../lib/response');

// GET /api/users
router.get('/', async (req, res, next) => {
  try {
    const users = await userService.getAllUsers();
    success(res, users, 'Users fetched');
  } catch (err) { next(err); }
});

// GET /api/users/owners
router.get('/owners', async (req, res, next) => {
  try {
    const owners = await userService.getAllOwners();
    success(res, owners, 'Owners fetched');
  } catch (err) { next(err); }
});

// GET /api/users/:id
router.get('/:id', async (req, res, next) => {
  try {
    const user = await userService.getUserById(+req.params.id);
    success(res, user, 'User fetched');
  } catch (err) { next(err); }
});

// PUT /api/users/:id
router.put('/:id', async (req, res, next) => {
  try {
    const user = await userService.updateUser(+req.params.id, req.body);
    success(res, user, 'User updated');
  } catch (err) { next(err); }
});

// DELETE /api/users/:id
router.delete('/:id', async (req, res, next) => {
  try {
    await userService.deleteUser(+req.params.id);
    success(res, null, 'Account deleted');
  } catch (err) { next(err); }
});

module.exports = router;