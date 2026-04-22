const express = require('express');
const bcrypt = require('bcryptjs');
const { getDb } = require('../db/database');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { sysLog } = require('../db/logger');

const router = express.Router();
router.use(authMiddleware);

// GET /api/users  — staff listesi (staff + admin görebilir)
router.get('/', requireRole('staff', 'admin'), (req, res) => {
  const db = getDb();
  const { role } = req.query;
  let query = 'SELECT id, name, email, role, department, active, created_at FROM users';
  const params = [];
  if (role) { query += ' WHERE role = ?'; params.push(role); }
  query += ' ORDER BY role, name';
  res.json({ users: db.prepare(query).all(...params) });
});

// GET /api/users/me  — kendi profili
router.get('/me', (req, res) => {
  res.json({ user: req.user });
});

// POST /api/users  — yeni kullanıcı oluştur (sadece admin)
router.post('/', requireRole('admin'), (req, res) => {
  const { name, email, password, role = 'user', department } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Ad, email ve şifre zorunlu' });
  }
  if (!['user', 'staff', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Geçersiz rol' });
  }

  const db = getDb();
  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (exists) return res.status(409).json({ error: 'Bu email zaten kayıtlı' });

  const hash = bcrypt.hashSync(password, 10);
  const result = db.prepare(`
    INSERT INTO users (name, email, password, role, department) VALUES (?, ?, ?, ?, ?)
  `).run(name, email.toLowerCase(), hash, role, department || null);

  const user = db.prepare('SELECT id, name, email, role, department, active, created_at FROM users WHERE id = ?').get(result.lastInsertRowid);

  sysLog({
    actorId:   req.user.id,
    actorName: req.user.name,
    action:    'create_user',
    target:    `${email} (${role})`,
    detail:    `Yeni kullanıcı oluşturuldu: ${name}`,
    ip:        req.ip,
  });

  res.status(201).json({ user });
});

// PATCH /api/users/:id  — güncelle (admin)
router.patch('/:id', requireRole('admin'), (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });

  const { name, role, department, active, password } = req.body;
  const updates = {};
  if (name)       updates.name       = name;
  if (role)       updates.role       = role;
  if (department) updates.department = department;
  if (active !== undefined) updates.active = active ? 1 : 0;
  if (password)   updates.password   = bcrypt.hashSync(password, 10);

  if (!Object.keys(updates).length) return res.status(400).json({ error: 'Güncellenecek alan yok' });

  const setClauses = Object.keys(updates).map(k => `${k} = ?`).join(', ');
  db.prepare(`UPDATE users SET ${setClauses} WHERE id = ?`).run(...Object.values(updates), user.id);

  const updated = db.prepare('SELECT id, name, email, role, department, active, created_at FROM users WHERE id = ?').get(user.id);

  // Nelerin değiştiğini kaydet
  const changes = [];
  if (name)       changes.push(`Ad: ${name}`);
  if (role)       changes.push(`Rol: ${role}`);
  if (department) changes.push(`Departman: ${department}`);
  if (password)   changes.push('Şifre değiştirildi');
  if (active !== undefined) changes.push(active ? 'Aktif edildi' : 'Pasif edildi');

  sysLog({
    actorId:   req.user.id,
    actorName: req.user.name,
    action:    active !== undefined ? (active ? 'activate_user' : 'deactivate_user') : 'update_user',
    target:    `${user.email}`,
    detail:    changes.join(', '),
    ip:        req.ip,
  });

  res.json({ user: updated });
});

module.exports = router;
