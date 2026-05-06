const path = require('path');
const fs   = require('fs');
const { getDb } = require('./database');

const BACKUP_DIR    = path.join(__dirname, '../../data/backups');
const KEEP_COUNT    = 14;           // Son 14 yedek saklanır (~28 gün)
const INTERVAL_MS   = 48 * 60 * 60 * 1000; // 2 günde bir

function getTimestamp() {
  const now = new Date();
  const pad = n => String(n).padStart(2, '0');
  return `${now.getFullYear()}-${pad(now.getMonth()+1)}-${pad(now.getDate())}_${pad(now.getHours())}-${pad(now.getMinutes())}`;
}

async function runBackup() {
  try {
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }

    const db   = getDb();
    const dest = path.join(BACKUP_DIR, `helpdesk_${getTimestamp()}.db`);

    await db.backup(dest);
    console.log(`[Backup] Yedekleme tamamlandi: ${path.basename(dest)}`);

    // Eski yedekleri temizle — en eski KEEP_COUNT sonrasini sil
    const files = fs.readdirSync(BACKUP_DIR)
      .filter(f => f.startsWith('helpdesk_') && f.endsWith('.db'))
      .sort(); // alfabetik = kronolojik (tarih formatimiz sayesinde)

    if (files.length > KEEP_COUNT) {
      const toDelete = files.slice(0, files.length - KEEP_COUNT);
      toDelete.forEach(f => {
        fs.unlinkSync(path.join(BACKUP_DIR, f));
        console.log(`[Backup] Eski yedek silindi: ${f}`);
      });
    }
  } catch (err) {
    console.error('[Backup] Hata:', err.message);
  }
}

function startBackupScheduler() {
  // Sunucu baslarken bir kez calistir
  runBackup();

  // Sonra her 2 günde bir tekrarla
  setInterval(runBackup, INTERVAL_MS);
  console.log(`[Backup] Zamanlayici baslatildi — her 48 saatte bir calisacak.`);
}

module.exports = { startBackupScheduler };
