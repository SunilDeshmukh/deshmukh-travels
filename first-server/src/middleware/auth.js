const jwt = require('jsonwebtoken');

// ── protect — any logged-in user (customer OR owner)
const protect = (req, res, next) => {

    const header = req.headers.authorization;

    if (!header || !header.startsWith('Bearer '))
        return res.status(401).json({ error: 'No token — please log in' });

    const token = header.split(' ')[1]; // "Bearer abc123" → "abc123"

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded; // { id, email, role, issuedat, expiry }
        next();             // pass control to the route handler
    } catch (err) {
        return res.status(401).json({ error: 'Token invalid or expired — please log in again' });
    }
};

// ── ownerOnly — only cab owners can proceed
const ownerOnly = (req, res, next) => {
    if (req.user?.role !== 'owner')
        return res.status(403).json({ error: 'Owners only — access denied' });
    next();
}

// ── customerOnly — only customers can proceed ───────────────────
const customerOnly = (req, res, next) => {
  if (req.user?.role !== 'customer')
    return res.status(403).json({ error: 'Customers only — access denied' });
  next();
};

module.exports = { protect, ownerOnly, customerOnly };