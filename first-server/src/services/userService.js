// Only job: business logic for users. No req/res here.
const userRepository           = require('../repositories/userRepository');
const { notFound, badRequest } = require('../lib/AppError');

const getAllUsers = async () => {
  return userRepository.findAll();
};

const getAllOwners = async () => {
  return userRepository.findAllOwners();
};

const getUserById = async (id) => {
  const user = await userRepository.findById(id);
  if (!user) throw notFound('User not found');
  return user;
};

const updateUser = async (id, { name, phone }) => {
  // Business rule — check user exists first
  const existing = await userRepository.findById(id);
  if (!existing) throw notFound('User not found');

  return userRepository.update(id, { name, phone });
};

const deleteUser = async (id) => {
  const existing = await userRepository.findById(id);
  if (!existing) throw notFound('User not found');
  return userRepository.remove(id);
};

module.exports = { getAllUsers, getAllOwners, getUserById, updateUser, deleteUser };