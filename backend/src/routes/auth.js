const express = require('express');
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { getDb } = require('../db/database');
const { authMiddleware, JWT_SECRET } = require('../middleware/auth');
const { sysLog } = require('../db/logger');

const router = express.Router();

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'E-posta ve şifre gerekli' });
  }

  const db = getDb();
  const user = db
    .prepare('SELECT * FROM users WHERE email = ? AND active = 1')
    .get(email.toLowerCase().trim());

  if (!user) {
    return res.status(401).json({ error: 'Geçersiz e-posta veya şifre' });
  }

  const valid = bcrypt.compareSync(password, user.password);
  if (!valid) {
    sysLog({ action: 'login_failed', target: email, detail: 'Hatalı şifre', ip: req.ip });
    return res.status(401).json({ error: 'Geçersiz e-posta veya şifre' });
  }

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '8h' });

  sysLog({
    actorId:   user.id,
    actorName: user.name,
    action:    'login',
    target:    user.email,
    detail:    `Rol: ${user.role}`,
    ip:        req.ip,
  });

  res.json({
    token,
    user: {
      id:         user.id,
      name:       user.name,
      email:      user.email,
      role:       user.role,
      department: user.department,
    },
  });
});

// GET /api/auth/me
router.get('/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
