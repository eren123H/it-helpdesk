const express = require('express');
const { getDb } = require('../db/database');
const { authMiddleware, requireRole } = require('../middleware/auth');

const router = express.Router();
router.use(authMiddleware, requireRole('admin'));

// GET /api/admin/sla  — SLA performans raporu
router.get('/sla', (req, res) => {
  const db = getDb();

  // SLA hedefleri (saat cinsinden)
  const slaTargets = { Kritik: 4, Yüksek: 8, Orta: 24, Düşük: 72 };

  const results = {};
  for (const [priority, hours] of Object.entries(slaTargets)) {
    const total = db.prepare(
      "SELECT COUNT(*) as c FROM tickets WHERE priority = ?"
    ).get(priority).c;

    const withinSla = db.prepare(`
      SELECT COUNT(*) as c FROM tickets
      WHERE priority = ?
        AND status IN ('resolved', 'closed')
        AND (julianday(resolved_at) - julianday(created_at)) * 24 <= ?
    `).get(priority, hours).c;

    const breached = db.prepare(`
      SELECT COUNT(*) as c FROM tickets
      WHERE priority = ?
        AND status NOT IN ('resolved', 'closed')
        AND (julianday('now') - julianday(created_at)) * 24 > ?
    `).get(priority, hours).c;

    results[priority] = { total, withinSla, breached, targetHours: hours };
  }

  res.json({ sla: results });
});

// GET /api/admin/report  — özet rapor
router.get('/report', (req, res) => {
  const db = getDb();

  const report = {
    staff_workload: db.prepare(`
      SELECT u.name, u.id,
        COUNT(t.id) as total,
        SUM(CASE WHEN t.status = 'open' THEN 1 ELSE 0 END) as open,
        SUM(CASE WHEN t.status = 'progress' THEN 1 ELSE 0 END) as progress,
        SUM(CASE WHEN t.status = 'resolved' THEN 1 ELSE 0 END) as resolved,
        ROUND(AVG(t.rating), 1) as avg_rating
      FROM users u
      LEFT JOIN tickets t ON t.assigned_to = u.id
      WHERE u.role IN ('staff','admin') AND u.active = 1
      GROUP BY u.id ORDER BY total DESC
    `).all(),

    avg_resolution_hours: db.prepare(`
      SELECT priority,
        ROUND(AVG((julianday(resolved_at) - julianday(created_at)) * 24), 1) as avg_hours
      FROM tickets WHERE status IN ('resolved','closed') AND resolved_at IS NOT NULL
      GROUP BY priority
    `).all(),

    csat: db.prepare(`
      SELECT 
        ROUND(AVG(rating), 1) as average_rating,
        COUNT(rating) as total_ratings,
        SUM(CASE WHEN rating >= 4 THEN 1 ELSE 0 END) as positive_ratings
      FROM tickets
      WHERE rating IS NOT NULL
    `).get(),

    tickets_last_30: db.prepare(`
      SELECT date(created_at) as day, COUNT(*) as c
      FROM tickets
      WHERE created_at >= datetime('now','-30 days','localtime')
      GROUP BY day ORDER BY day
    `).all(),
  };

  res.json(report);
});


// GET /api/admin/logs  — sistem log kayıtları
router.get('/logs', (req, res) => {
  const db = getDb();
  const { action, page = 1, limit = 50 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  let where = [];
  let params = [];
  if (action) { where.push('action = ?'); params.push(action); }

  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

  const total = db.prepare(`SELECT COUNT(*) as c FROM system_logs ${whereClause}`).get(...params).c;
  const logs  = db.prepare(`
    SELECT * FROM system_logs ${whereClause}
    ORDER BY created_at DESC LIMIT ? OFFSET ?
  `).all(...params, Number(limit), offset);

  // Mevcut action tiplerini döndür (filtre için)
  const actions = db.prepare(`SELECT DISTINCT action FROM system_logs ORDER BY action`).all().map(r => r.action);

  res.json({ total, page: Number(page), limit: Number(limit), logs, actions });
});

module.exports = router;

