const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.ADMIN_JWT_SECRET || 'fallback_dev_secret';

function requireAdmin(req, res, next) {
  const token = req.cookies?.adminToken || req.headers['x-admin-token'];
  if (!token) return res.status(401).json({ error: 'Unauthorized' });
  try {
    req.admin = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '8h' });
}

module.exports = { requireAdmin, generateToken };
