const { getDb } = require('./database');

/**
 * Sistem loguna kayıt ekler.
 * @param {object} opts
 * @param {number|null} opts.actorId    - İşlemi yapan kullanıcı ID
 * @param {string|null} opts.actorName  - İşlemi yapan kullanıcı adı
 * @param {string}      opts.action     - İşlem türü (login, create_user, update_user, ...)
 * @param {string|null} opts.target     - Etkilenen nesne (ör: "Kullanıcı: ali@helpdesk.local")
 * @param {string|null} opts.detail     - Detay açıklama
 * @param {string|null} opts.ip         - İstek IP adresi
 */
function sysLog({ actorId = null, actorName = null, action, target = null, detail = null, ip = null }) {
  try {
    const db = getDb();
    db.prepare(`
      INSERT INTO system_logs (actor_id, actor_name, action, target, detail, ip)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(actorId, actorName, action, target, detail, ip);
  } catch (e) {
    // Loglama hatası ana akışı kesmemeli
    console.error('sysLog hatası:', e.message);
  }
}

module.exports = { sysLog };
