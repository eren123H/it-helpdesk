const express = require('express');
const path    = require('path');
const { getDb } = require('../db/database');
const { authMiddleware, requireRole } = require('../middleware/auth');
const { upload } = require('../middleware/upload');
const { sendNewTicketMail, sendTicketResolvedMail } = require('../mail/mailer');

const router = express.Router();
router.use(authMiddleware);

const TICKET_SELECT = `
  SELECT
    t.*,
    creator.name  AS creator_name,
    creator.email AS creator_email,
    creator.department AS creator_department,
    assignee.name AS assignee_name,
    assignee.email AS assignee_email
  FROM tickets t
  LEFT JOIN users creator  ON t.created_by  = creator.id
  LEFT JOIN users assignee ON t.assigned_to = assignee.id
`;

// GET /api/tickets  — liste (filtre destekli)
router.get('/', (req, res) => {
  const db = getDb();
  const { status, priority, category, assigned_to, exclude_status, q, sort = 'priority', page = 1, limit = 20 } = req.query;

  let where = [];
  let params = [];

  // Normal kullanıcı sadece kendi taleplerini görür
  if (req.user.role === 'user') {
    where.push('t.created_by = ?');
    params.push(req.user.id);
  }

  if (status)      { where.push('t.status = ?');      params.push(status); }
  if (exclude_status) {
    const statuses = exclude_status.split(',');
    where.push(`t.status NOT IN (${statuses.map(() => '?').join(',')})`);
    params.push(...statuses);
  }
  if (priority)    { where.push('t.priority = ?');    params.push(priority); }
  if (category)    { where.push('t.category = ?');    params.push(category); }
  if (assigned_to) { where.push('t.assigned_to = ?'); params.push(assigned_to); }
  if (q) {
    where.push('(t.title LIKE ? OR t.description LIKE ? OR t.ticket_no LIKE ?)');
    params.push(`%${q}%`, `%${q}%`, `%${q}%`);
  }

  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';
  const offset = (Number(page) - 1) * Number(limit);

  const total = db.prepare(`SELECT COUNT(*) as c FROM tickets t ${whereClause}`).get(...params).c;
  
  let orderBy = "CASE t.priority WHEN 'Kritik' THEN 1 WHEN 'Yüksek' THEN 2 WHEN 'Orta' THEN 3 ELSE 4 END, t.created_at DESC";
  if (sort === 'time_desc') orderBy = "t.created_at DESC";
  else if (sort === 'time_asc') orderBy = "t.created_at ASC";

  const rows  = db.prepare(`${TICKET_SELECT} ${whereClause} ORDER BY ${orderBy} LIMIT ? OFFSET ?`).all(...params, Number(limit), offset);

  res.json({ total, page: Number(page), limit: Number(limit), tickets: rows });
});

// GET /api/tickets/stats  — dashboard için
router.get('/stats', requireRole('staff', 'admin'), (req, res) => {
  const db = getDb();
  const stats = {
    total:    db.prepare("SELECT COUNT(*) as c FROM tickets").get().c,
    open:     db.prepare("SELECT COUNT(*) as c FROM tickets WHERE status = 'open'").get().c,
    progress: db.prepare("SELECT COUNT(*) as c FROM tickets WHERE status = 'progress'").get().c,
    resolved: db.prepare("SELECT COUNT(*) as c FROM tickets WHERE status = 'resolved'").get().c,
    closed:   db.prepare("SELECT COUNT(*) as c FROM tickets WHERE status = 'closed'").get().c,
    critical: db.prepare("SELECT COUNT(*) as c FROM tickets WHERE priority = 'Kritik' AND status NOT IN ('resolved','closed')").get().c,
    by_category: db.prepare("SELECT category, COUNT(*) as c FROM tickets GROUP BY category ORDER BY c DESC").all(),
    by_priority: db.prepare("SELECT priority, COUNT(*) as c FROM tickets GROUP BY priority").all(),
    daily_last7: db.prepare(`
      SELECT date(created_at) as day, COUNT(*) as c
      FROM tickets
      WHERE created_at >= datetime('now','-7 days','localtime')
      GROUP BY day ORDER BY day
    `).all(),
  };
  res.json(stats);
});

// GET /api/tickets/:id
router.get('/:id', (req, res) => {
  const db = getDb();
  const ticket = db.prepare(`${TICKET_SELECT} WHERE t.id = ?`).get(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Talep bulunamadı' });

  // Normal kullanıcı başkasının talebine giremez
  if (req.user.role === 'user' && ticket.created_by !== req.user.id) {
    return res.status(403).json({ error: 'Bu talebe erişim yetkiniz yok' });
  }

  const logs = db.prepare(`
    SELECT l.*, u.name as user_name FROM ticket_logs l
    LEFT JOIN users u ON l.user_id = u.id
    WHERE l.ticket_id = ? ${req.user.role === 'user' ? "AND l.detail != 'İç not eklendi'" : ""}
    ORDER BY l.created_at ASC
  `).all(ticket.id);

  const comments = db.prepare(`
    SELECT c.*, u.name as user_name, u.role as user_role FROM comments c
    JOIN users u ON c.user_id = u.id
    WHERE c.ticket_id = ? ${req.user.role === 'user' ? 'AND c.internal = 0' : ''}
    ORDER BY c.created_at ASC
  `).all(ticket.id);

  const attachments = db.prepare(`
    SELECT a.*, u.name as uploader_name FROM attachments a
    JOIN users u ON a.user_id = u.id
    WHERE a.ticket_id = ? ORDER BY a.created_at ASC
  `).all(ticket.id);

  res.json({ ticket, logs, comments, attachments });
});

// POST /api/tickets/merge  — bilet birleştirme
router.post('/merge', requireRole('admin'), (req, res) => {
  const { target_id, ticket_ids } = req.body;
  if (!target_id || !Array.isArray(ticket_ids) || ticket_ids.length === 0) {
    return res.status(400).json({ error: 'Geçersiz parametreler' });
  }

  const db = getDb();
  const target = db.prepare('SELECT id, ticket_no FROM tickets WHERE id = ?').get(target_id);
  if (!target) return res.status(404).json({ error: 'Ana bilet bulunamadı' });

  let mergedCount = 0;
  for (const tid of ticket_ids) {
    if (tid === target_id) continue;
    
    const t = db.prepare('SELECT id, ticket_no FROM tickets WHERE id = ?').get(tid);
    if (t) {
      db.prepare(`UPDATE tickets SET status = 'closed', merged_into = ?, updated_at = datetime('now','localtime') WHERE id = ?`).run(target_id, tid);
      
      // Kapattığımız bilete not
      db.prepare(`INSERT INTO comments (ticket_id, user_id, body, internal) VALUES (?, ?, ?, 1)`).run(tid, req.user.id, `Bu bilet #${target.ticket_no} ile birleştirilerek kapatıldı.`);
      db.prepare(`INSERT INTO ticket_logs (ticket_id, user_id, action, detail) VALUES (?, ?, 'merged', ?)`).run(tid, req.user.id, `#${target.ticket_no} içerisine birleştirildi`);
      
      // Ana bilete not
      db.prepare(`INSERT INTO comments (ticket_id, user_id, body, internal) VALUES (?, ?, ?, 1)`).run(target_id, req.user.id, `#${t.ticket_no} numaralı bilet bu bilete birleştirildi.`);
      
      mergedCount++;
    }
  }

  res.json({ success: true, mergedCount });
});

// POST /api/tickets  — yeni talep
router.post('/', (req, res) => {
  const { title, description, category, priority, impact } = req.body;
  if (!title || !description || !category || !priority) {
    return res.status(400).json({ error: 'Zorunlu alanlar eksik' });
  }

  const db = getDb();
  const max = db.prepare('SELECT IFNULL(MAX(id), 0) as m FROM tickets').get().m;
  const ticket_no = 'HD-' + String(max + 1).padStart(3, '0');

  const result = db.prepare(`
    INSERT INTO tickets (ticket_no, title, description, category, priority, impact, created_by, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now','localtime'))
  `).run(ticket_no, title, description, category, priority, impact || null, req.user.id);

  db.prepare(`
    INSERT INTO ticket_logs (ticket_id, user_id, action, detail)
    VALUES (?, ?, 'created', 'Talep oluşturuldu')
  `).run(result.lastInsertRowid, req.user.id);

  const ticket = db.prepare(`${TICKET_SELECT} WHERE t.id = ?`).get(result.lastInsertRowid);
  
  // Yeni talepte tüm adminlere bildirim gönder
  const admins = db.prepare("SELECT id FROM users WHERE role = 'admin'").all();
  const stmt = db.prepare("INSERT INTO notifications (user_id, ticket_id, message) VALUES (?, ?, ?)");
  for (const a of admins) {
    if (a.id !== req.user.id) {
      stmt.run(a.id, ticket.id, `Yeni talep açıldı: #${ticket_no}`);
    }
  }

  // Sabit bildirim adresine mail gönder (MAIL_NOTIFY .env'de tanımlı)
  if (process.env.MAIL_NOTIFY) {
    sendNewTicketMail(ticket, [process.env.MAIL_NOTIFY]);
  }

  res.status(201).json({ ticket });
});

// PATCH /api/tickets/:id/status  — durum güncelle
router.patch('/:id/status', requireRole('staff', 'admin'), (req, res) => {
  const { status } = req.body;
  const validStatuses = ['open', 'progress', 'resolved', 'closed'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Geçersiz durum' });
  }

  // Sadece adminler bileti kapatabilir
  if (status === 'closed' && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Bileti yalnızca Adminler kapatabilir' });
  }

  const db = getDb();
  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Talep bulunamadı' });

  // Atama olmadan çözümlendi yapılamaz (Admin hariç)
  if (status === 'resolved' && req.user.role !== 'admin' && !ticket.assigned_to) {
    return res.status(403).json({ error: 'Atama yapılmadan bilet çözümlenemez' });
  }

  const labelMap = { open: 'Açıldı', progress: 'İşleme alındı', resolved: 'Çözümlendi', closed: 'Kapatıldı' };
  const resolvedAt = status === 'resolved' ? "datetime('now','localtime')" : 'NULL';

  db.prepare(`
    UPDATE tickets SET status = ?, updated_at = datetime('now','localtime'),
    resolved_at = ${resolvedAt} WHERE id = ?
  `).run(status, ticket.id);

  db.prepare(`
    INSERT INTO ticket_logs (ticket_id, user_id, action, detail)
    VALUES (?, ?, 'status', ?)
  `).run(ticket.id, req.user.id, `Durum güncellendi: ${labelMap[status]}`);

  const updated = db.prepare(`${TICKET_SELECT} WHERE t.id = ?`).get(ticket.id);

  if (status === 'resolved' && process.env.MAIL_NOTIFY) {
    sendTicketResolvedMail(updated, [process.env.MAIL_NOTIFY]);
  }

  res.json({ ticket: updated });
});

// PATCH /api/tickets/:id/priority  — öncelik güncelle (staff/admin)
router.patch('/:id/priority', requireRole('staff', 'admin'), (req, res) => {
  const { priority } = req.body;
  const validPriorities = ['Kritik', 'Yüksek', 'Orta', 'Düşük'];
  if (!validPriorities.includes(priority)) {
    return res.status(400).json({ error: 'Geçersiz öncelik' });
  }

  const db = getDb();
  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Talep bulunamadı' });

  db.prepare(`UPDATE tickets SET priority = ?, updated_at = datetime('now','localtime') WHERE id = ?`)
    .run(priority, ticket.id);

  db.prepare(`INSERT INTO ticket_logs (ticket_id, user_id, action, detail) VALUES (?, ?, 'priority', ?)`)
    .run(ticket.id, req.user.id, `Öncelik güncellendi: ${ticket.priority} → ${priority}`);

  const updated = db.prepare(`${TICKET_SELECT} WHERE t.id = ?`).get(ticket.id);
  res.json({ ticket: updated });
});

// PATCH /api/tickets/:id/assign  — atama
router.patch('/:id/assign', requireRole('staff', 'admin'), (req, res) => {
  const { user_id } = req.body;

  // Personel (staff) sadece kendi üzerine atama yapabilir
  if (req.user.role === 'staff' && user_id && user_id !== req.user.id) {
    return res.status(403).json({ error: 'Sadece kendi üzerinize atama yapabilirsiniz' });
  }

  const db = getDb();
  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Talep bulunamadı' });

  const assignee = user_id ? db.prepare("SELECT * FROM users WHERE id = ? AND role IN ('staff','admin')").get(user_id) : null;
  if (user_id && !assignee) return res.status(400).json({ error: 'Geçersiz personel' });

  db.prepare('UPDATE tickets SET assigned_to = ?, updated_at = datetime(\'now\',\'localtime\') WHERE id = ?')
    .run(user_id || null, ticket.id);

  db.prepare(`INSERT INTO ticket_logs (ticket_id, user_id, action, detail) VALUES (?, ?, 'assigned', ?)`)
    .run(ticket.id, req.user.id, assignee ? `${assignee.name} atandı` : 'Atama kaldırıldı');

  const updated = db.prepare(`${TICKET_SELECT} WHERE t.id = ?`).get(ticket.id);
  res.json({ ticket: updated });
});

// POST /api/tickets/:id/comments  — yorum ekle
router.post('/:id/comments', (req, res) => {
  const { body, internal = false } = req.body;
  if (!body?.trim()) return res.status(400).json({ error: 'Yorum boş olamaz' });

  const isInternal = Boolean(internal) && req.user.role !== 'user';
  const db = getDb();
  const ticket = db.prepare('SELECT id, ticket_no, created_by, assigned_to FROM tickets WHERE id = ?').get(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Talep bulunamadı' });

  if (req.user.role === 'user' && ticket.created_by !== req.user.id) {
    return res.status(403).json({ error: 'Yetki yok' });
  }

  const result = db.prepare(`
    INSERT INTO comments (ticket_id, user_id, body, internal) VALUES (?, ?, ?, ?)
  `).run(ticket.id, req.user.id, body.trim(), isInternal ? 1 : 0);

  db.prepare(`INSERT INTO ticket_logs (ticket_id, user_id, action, detail) VALUES (?, ?, 'comment', ?)`)
    .run(ticket.id, req.user.id, isInternal ? 'İç not eklendi' : 'Yorum eklendi');

  db.prepare("UPDATE tickets SET updated_at = datetime('now','localtime') WHERE id = ?").run(ticket.id);

  // Bildirim gönderimi (İç not değilse ve kendine yorum atmıyorsa)
  if (!isInternal) {
    let notifyUserId = null;
    let message = '';
    
    if (req.user.role === 'user') {
      if (ticket.assigned_to) {
        notifyUserId = ticket.assigned_to;
        message = `#${ticket.ticket_no} numaralı talebe kullanıcı yanıt ekledi.`;
      } else {
        // Atanmamışsa adminlere bildir
        const admins = db.prepare("SELECT id FROM users WHERE role = 'admin'").all();
        const stmt = db.prepare("INSERT INTO notifications (user_id, ticket_id, message) VALUES (?, ?, ?)");
        for (const a of admins) {
          stmt.run(a.id, ticket.id, `#${ticket.ticket_no} numaralı atanmamış talebe yanıt geldi.`);
        }
      }
    } else if (ticket.created_by !== req.user.id) {
      notifyUserId = ticket.created_by;
      message = `#${ticket.ticket_no} numaralı talebinize yeni bir yanıt geldi.`;
    }

    if (notifyUserId) {
      db.prepare(`INSERT INTO notifications (user_id, ticket_id, message) VALUES (?, ?, ?)`).run(notifyUserId, ticket.id, message);
    }
  }

  const comment = db.prepare(`
    SELECT c.*, u.name as user_name, u.role as user_role FROM comments c
    JOIN users u ON c.user_id = u.id WHERE c.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json({ comment });
});

// POST /api/tickets/:id/attachments  — dosya yükle
router.post('/:id/attachments', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'Dosya bulunamadı' });

  const db = getDb();
  const ticket = db.prepare('SELECT id, created_by FROM tickets WHERE id = ?').get(req.params.id);
  if (!ticket) return res.status(404).json({ error: 'Talep bulunamadı' });

  // Kullanıcı sadece kendi ticketarına dosya yükleyebilir
  if (req.user.role === 'user' && ticket.created_by !== req.user.id) {
    return res.status(403).json({ error: 'Yetki yok' });
  }

  const result = db.prepare(`
    INSERT INTO attachments (ticket_id, user_id, original_name, stored_name, mimetype, size)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(ticket.id, req.user.id, req.file.originalname, req.file.filename, req.file.mimetype, req.file.size);

  db.prepare("UPDATE tickets SET updated_at = datetime('now','localtime') WHERE id = ?")
    .run(ticket.id);

  db.prepare(`INSERT INTO ticket_logs (ticket_id, user_id, action, detail) VALUES (?, ?, 'attachment', ?)`)
    .run(ticket.id, req.user.id, `Dosya eklendi: ${req.file.originalname}`);

  const attachment = db.prepare(`
    SELECT a.*, u.name as uploader_name FROM attachments a
    JOIN users u ON a.user_id = u.id WHERE a.id = ?
  `).get(result.lastInsertRowid);

  res.status(201).json({ attachment });
});

// PATCH /api/tickets/:id/rate — kullanıcı değerlendirmesi (yıldız)
router.patch('/:id/rate', requireRole('user'), (req, res) => {
  const { rating } = req.body;
  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ error: 'Geçersiz puanlama' });
  }

  const db = getDb();
  const ticket = db.prepare('SELECT * FROM tickets WHERE id = ?').get(req.params.id);
  
  if (!ticket) return res.status(404).json({ error: 'Talep bulunamadı' });
  if (ticket.created_by !== req.user.id) return res.status(403).json({ error: 'Sadece kendi talebinizi değerlendirebilirsiniz' });
  if (ticket.status !== 'resolved' && ticket.status !== 'closed') {
    return res.status(400).json({ error: 'Sadece çözümlenen talepler değerlendirilebilir' });
  }
  if (ticket.rating) {
    return res.status(400).json({ error: 'Bu talep zaten değerlendirilmiş' });
  }

  db.prepare(`UPDATE tickets SET rating = ?, updated_at = datetime('now','localtime') WHERE id = ?`)
    .run(rating, ticket.id);

  db.prepare(`INSERT INTO ticket_logs (ticket_id, user_id, action, detail) VALUES (?, ?, 'rate', ?)`)
    .run(ticket.id, req.user.id, `Kullanıcı değerlendirmesi: ${rating} Yıldız`);

  const updated = db.prepare(`${TICKET_SELECT} WHERE t.id = ?`).get(ticket.id);
  res.json({ ticket: updated });
});

// Multer hata yönetimi
router.use((err, _req, res, _next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ error: 'Dosya boyutu 1 MB\'yı aşamaz' });
  }
  res.status(400).json({ error: err.message });
});

module.exports = router;
