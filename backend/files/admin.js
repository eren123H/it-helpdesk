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
        SUM(CASE WHEN t.status = 'resolved' THEN 1 ELSE 0 END) as resolved
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

    tickets_last_30: db.prepare(`
      SELECT date(created_at) as day, COUNT(*) as c
      FROM tickets
      WHERE created_at >= datetime('now','-30 days','localtime')
      GROUP BY day ORDER BY day
    `).all(),
  };

  res.json(report);
});

module.exports = router;
