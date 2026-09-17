// Only job: business logic for contact requests. No req/res here.
const contactRepository          = require('../repositories/contactRepository');
const { badRequest, notFound }   = require('../lib/AppError');

const VALID_STATUSES = ['pending', 'accepted', 'rejected'];

const sendContact = async (body, customerId) => {
  const { message, tripDetails, ownerId, cabId } = body;

  // Business rule — required fields
  // Note: customerId comes from token — not body — more secure
  if (!message || !ownerId || !cabId)
    throw badRequest('message, ownerId, cabId required');

  return contactRepository.create({
    message,
    tripDetails,
    customerId: +customerId,
    ownerId:    +ownerId,
    cabId:      +cabId,
  });
};

const getReceivedContacts = async (ownerId) => {
  return contactRepository.findByOwner(ownerId);
};

const getSentContacts = async (customerId) => {
  return contactRepository.findByCustomer(customerId);
};

const updateContactStatus = async (id, status) => {
  // Business rule — status must be valid
  if (!VALID_STATUSES.includes(status))
    throw badRequest('status must be pending, accepted, or rejected');

  return contactRepository.updateStatus(+id, status);
};

module.exports = { sendContact, getReceivedContacts, getSentContacts, updateContactStatus };