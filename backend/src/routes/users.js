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
  const { role, q, page = 1, limit = 20 } = req.query;
  
  let where = [];
  const params = [];

  if (role) {
    where.push('role = ?');
    params.push(role);
  }

  if (q) {
    where.push('(name LIKE ? OR email LIKE ? OR department LIKE ?)');
    const searchParam = `%${q}%`;
    params.push(searchParam, searchParam, searchParam);
  }

  const whereClause = where.length ? ' WHERE ' + where.join(' AND ') : '';
  const offset = (Number(page) - 1) * Number(limit);

  const total = db.prepare(`SELECT COUNT(*) as c FROM users ${whereClause}`).get(...params).c;
  
  const query = `
    SELECT id, name, email, role, department, active, created_at 
    FROM users 
    ${whereClause} 
    ORDER BY role, name 
    LIMIT ? OFFSET ?
  `;
  
  const users = db.prepare(query).all(...params, Number(limit), offset);
  
  res.json({ users, total, page: Number(page), limit: Number(limit) });
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

  const { name, email, role, department, active, password } = req.body;
  const updates = {};
  if (name)       updates.name       = name;
  if (email) {
    const emailLower = email.toLowerCase();
    const taken = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(emailLower, user.id);
    if (taken) return res.status(409).json({ error: 'Bu e-posta adresi zaten kullanılıyor' });
    updates.email = emailLower;
  }
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
  if (email)      changes.push(`E-posta: ${email}`);
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

// DELETE /api/users/:id  — kullanıcıyı tüm verileriyle sil (sadece admin)
router.delete('/:id', requireRole('admin'), (req, res) => {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
  if (!user) return res.status(404).json({ error: 'Kullanıcı bulunamadı' });

  // Admin kendisini silemez
  if (user.id === req.user.id) {
    return res.status(400).json({ error: 'Kendi hesabınızı silemezsiniz' });
  }

  try {
    // Tüm silme işlemlerini tek transaction içinde yap
    db.transaction(() => {
      const uid = user.id;

      // 1. Başka biletlere ait yorumlardaki user_id bağımlılığını kaldır
      //    (comments.user_id NOT NULL olduğu için yorum satırını siliyoruz)
      db.prepare('DELETE FROM comments WHERE user_id = ?').run(uid);

      // 2. Başka biletlere ait dosya eklerindeki user_id bağımlılığını kaldır
      db.prepare('DELETE FROM attachments WHERE user_id = ?').run(uid);

      // 3. Başka biletlere ait ticket_logs içindeki user_id'yi NULL yap (nullable)
      db.prepare('UPDATE ticket_logs SET user_id = NULL WHERE user_id = ?').run(uid);

      // 4. Atanan biletleri serbest bırak (assigned_to nullable)
      db.prepare('UPDATE tickets SET assigned_to = NULL WHERE assigned_to = ?').run(uid);

      // 5. Kullanıcının oluşturduğu biletleri sil
      //    (ON DELETE CASCADE ile ticket_logs, comments, attachments otomatik temizlenir)
      db.prepare('DELETE FROM tickets WHERE created_by = ?').run(uid);

      // 6. Sistem loglarını sil
      db.prepare('DELETE FROM system_logs WHERE actor_id = ?').run(uid);

      // 7. Kullanıcıyı sil (notifications ON DELETE CASCADE ile otomatik silinir)
      db.prepare('DELETE FROM users WHERE id = ?').run(uid);
    })();

    sysLog({
      actorId:   req.user.id,
      actorName: req.user.name,
      action:    'delete_user',
      target:    `${user.email} (${user.role})`,
      detail:    `Kullanıcı kalıcı olarak silindi: ${user.name}`,
      ip:        req.ip,
    });

    res.json({ success: true, message: `${user.name} başarıyla silindi` });
  } catch (e) {
    console.error('Kullanıcı silme hatası:', e);
    res.status(500).json({ error: 'Kullanıcı silinirken bir hata oluştu: ' + e.message });
  }
});

// GET /api/users/notifications  — okunmamış bildirimler
router.get('/notifications', (req, res) => {
  const db = getDb();
  const notifications = db.prepare(`
    SELECT * FROM notifications 
    WHERE user_id = ? AND is_read = 0 
    ORDER BY created_at DESC LIMIT 50
  `).all(req.user.id);
  res.json({ notifications });
});

// PATCH /api/users/notifications/read-all  — tümünü okundu işaretle
router.patch('/notifications/read-all', (req, res) => {
  const db = getDb();
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user.id);
  res.json({ success: true });
});

// PATCH /api/users/notifications/:id/read  — tekili okundu işaretle
router.patch('/notifications/:id/read', (req, res) => {
  const db = getDb();
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?').run(req.params.id, req.user.id);
  res.json({ success: true });
});

module.exports = router;
