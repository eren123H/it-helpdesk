const jwt = require('jsonwebtoken');
const { getDb } = require('../db/database');

const JWT_SECRET = process.env.JWT_SECRET || 'helpdesk-secret-key-change-in-production';

function authMiddleware(req, res, next) {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token gerekli' });
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    const db = getDb();
    const user = db.prepare('SELECT id, name, email, role, department, active FROM users WHERE id = ?').get(payload.userId);
    if (!user || !user.active) {
      return res.status(401).json({ error: 'Geçersiz veya pasif kullanıcı' });
    }
    req.user = user;
    next();
  } catch {
    return res.status(401).json({ error: 'Geçersiz token' });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Bu işlem için yetkiniz yok' });
    }
    next();
  };
}

module.exports = { authMiddleware, requireRole, JWT_SECRET };
