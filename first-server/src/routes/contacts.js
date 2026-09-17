const router         = require('express').Router();
const { protect, ownerOnly, customerOnly } = require('../middleware/auth');
const contactService = require('../services/contactService');
const { success, created } = require('../lib/response');

// POST /api/contacts
router.post('/', protect, customerOnly, async (req, res, next) => {
  try {
    // customerId comes from token — not body — more secure
    const contact = await contactService.sendContact(req.body, req.user.id);
    created(res, contact, 'Contact request sent');
  } catch (err) { next(err); }
});

// GET /api/contacts/received
router.get('/received', protect, ownerOnly, async (req, res, next) => {
  try {
    const contacts = await contactService.getReceivedContacts(req.user.id);
    success(res, contacts, 'Received contacts fetched');
  } catch (err) { next(err); }
});

// GET /api/contacts/sent
router.get('/sent', protect, customerOnly, async (req, res, next) => {
  try {
    const contacts = await contactService.getSentContacts(req.user.id);
    success(res, contacts, 'Sent contacts fetched');
  } catch (err) { next(err); }
});

// PUT /api/contacts/:id/status
router.put('/:id/status', protect, ownerOnly, async (req, res, next) => {
  try {
    const contact = await contactService.updateContactStatus(req.params.id, req.body.status);
    success(res, contact, 'Contact status updated');
  } catch (err) { next(err); }
});

module.exports = router;