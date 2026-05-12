const { getDb } = require('../db/database');
const { sendToUsers } = require('../ws/wsServer');

const SLA_HOURS = {
  'Kritik': 4,
  'Yüksek': 8,
  'Orta': 24,
  'Düşük': 48,
};

function checkSLA() {
  const db = getDb();
  // Açık ve henüz SLA ihlali kaydedilmemiş biletleri al
  const tickets = db.prepare(`
    SELECT id, ticket_no, title, priority, created_at, created_by 
    FROM tickets 
    WHERE status = 'open' AND sla_breached = 0
  `).all();

  if (tickets.length === 0) return;

  const now = new Date();
  const admins = db.prepare("SELECT id FROM users WHERE role = 'admin'").all();
  const adminIds = admins.map(a => a.id);
  
  const updateStmt = db.prepare("UPDATE tickets SET sla_breached = 1 WHERE id = ?");
  const notifStmt = db.prepare("INSERT INTO notifications (user_id, ticket_id, message) VALUES (?, ?, ?)");

  db.transaction(() => {
    for (const ticket of tickets) {
      const createdAt = new Date(ticket.created_at);
      const hoursLimit = SLA_HOURS[ticket.priority] || 24;
      
      // SLA Süresini saat bazında hesapla
      const limitMs = hoursLimit * 60 * 60 * 1000;
      const elapsedMs = now - createdAt;

      if (elapsedMs > limitMs) {
        // İhlal tespit edildi
        updateStmt.run(ticket.id);

        const msg = `SLA İHLALİ: #${ticket.ticket_no} - ${ticket.priority} öncelikli talep süresini aştı!`;
        
        for (const admin of adminIds) {
          notifStmt.run(admin, ticket.id, msg);
        }

        // Web socket bildirimi gönder
        if (adminIds.length > 0) {
          sendToUsers(adminIds, {
            type: 'new_notification',
            message: msg,
            ticket_id: ticket.id,
            urgent: true
          });
        }
      }
    }
  })();
}

function startSlaChecker() {
  // Her 5 dakikada bir kontrol et
  setInterval(checkSLA, 5 * 60 * 1000);
  console.log('⏱️  SLA Takip Servisi başlatıldı (5 dakikada bir kontrol).');
}

module.exports = { startSlaChecker, checkSLA };
