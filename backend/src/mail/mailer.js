const nodemailer = require('nodemailer');

// Transporter'ı bir kez oluştur, her istekte yeniden oluşturma
const transporter = nodemailer.createTransport({
  host:   process.env.MAIL_HOST || 'smtp.gmail.com',
  port:   587,
  secure: false, // STARTTLS
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

/**
 * Yeni ticket açıldığında admin ve staff'lara bildirim maili gönderir.
 * Ana akışı kesmemesi için async, hata yakalama içeride yapılır.
 *
 * @param {object} ticket   - Oluşturulan ticket nesnesi (creator_name dahil)
 * @param {string[]} emails - Bildirim gönderilecek e-posta listesi
 */
async function sendNewTicketMail(ticket, emails) {
  if (!process.env.MAIL_USER || !process.env.MAIL_PASS) {
    console.warn('[Mail] MAIL_USER veya MAIL_PASS tanimlanmamis, mail atlamasinda.');
    return;
  }
  if (!emails || emails.length === 0) return;

  const priorityLabel = {
    Kritik: '🔴 Kritik',
    Yüksek: '🟠 Yüksek',
    Orta:   '🟡 Orta',
    Düşük:  '🟢 Düşük',
  }[ticket.priority] || ticket.priority;

  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3001';
  const ticketUrl = `${baseUrl}/tickets/${ticket.id}`;

  const subject = `[Yeni Talep] #${ticket.ticket_no} — ${ticket.title}`;

  const html = `
    <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9;border-radius:8px;overflow:hidden;">
      <div style="background:#1a1f2e;padding:20px 28px;">
        <h2 style="color:#4f8ef7;margin:0;font-size:1.1rem;">IT HelpDesk — Yeni Destek Talebi</h2>
      </div>
      <div style="padding:24px 28px;background:#ffffff;">
        <table style="width:100%;border-collapse:collapse;font-size:.9rem;">
          <tr><td style="padding:8px 0;color:#666;width:130px;">Talep No</td>
              <td style="padding:8px 0;font-weight:600;color:#222;">#${ticket.ticket_no}</td></tr>
          <tr><td style="padding:8px 0;color:#666;">Başlık</td>
              <td style="padding:8px 0;font-weight:600;color:#222;">${ticket.title}</td></tr>
          <tr><td style="padding:8px 0;color:#666;">Açan</td>
              <td style="padding:8px 0;color:#222;">${ticket.creator_name || '—'}</td></tr>
          <tr><td style="padding:8px 0;color:#666;">Kategori</td>
              <td style="padding:8px 0;color:#222;">${ticket.category}</td></tr>
          <tr><td style="padding:8px 0;color:#666;">Öncelik</td>
              <td style="padding:8px 0;color:#222;">${priorityLabel}</td></tr>
          <tr><td style="padding:8px 0;color:#666;vertical-align:top;">Açıklama</td>
              <td style="padding:8px 0;color:#222;">${ticket.description.slice(0, 300)}${ticket.description.length > 300 ? '...' : ''}</td></tr>
        </table>
        <div style="margin-top:24px;">
          <a href="${ticketUrl}"
             style="display:inline-block;background:#4f8ef7;color:#fff;padding:10px 22px;border-radius:6px;text-decoration:none;font-weight:600;font-size:.9rem;">
            Talebe Git →
          </a>
        </div>
      </div>
      <div style="padding:12px 28px;background:#f0f0f0;font-size:.75rem;color:#999;">
        Bu mail IT HelpDesk sistemi tarafindan otomatik olarak gonderilmistir.
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from:    `"IT HelpDesk" <${process.env.MAIL_FROM || process.env.MAIL_USER}>`,
      to:      emails.join(', '),
      subject,
      html,
    });
    console.log(`[Mail] Yeni talep maili gonderildi: ${ticket.ticket_no} -> ${emails.length} alici`);
  } catch (err) {
    console.error('[Mail] Gonderim hatasi:', err.message);
  }
}

module.exports = { sendNewTicketMail };
