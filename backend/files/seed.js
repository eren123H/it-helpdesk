const bcrypt = require('bcryptjs');
const { getDb } = require('./database');

function seed() {
  const db = getDb();

  const existingUsers = db.prepare('SELECT COUNT(*) as c FROM users').get();
  if (existingUsers.c > 0) {
    console.log('Veritabanı zaten dolu, seed atlanıyor.');
    return;
  }

  console.log('Demo veriler yükleniyor...');

  const hash = (pw) => bcrypt.hashSync(pw, 10);

  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password, role, department)
    VALUES (@name, @email, @password, @role, @department)
  `);

  const users = [
    { name: 'Admin Kullanıcı',  email: 'admin@helpdesk.local',  password: hash('Admin123!'), role: 'admin',  department: 'IT' },
    { name: 'Ali Tekin',        email: 'ali@helpdesk.local',     password: hash('Staff123!'), role: 'staff',  department: 'IT' },
    { name: 'Zeynep Ak',        email: 'zeynep@helpdesk.local',  password: hash('Staff123!'), role: 'staff',  department: 'IT' },
    { name: 'Mehmet Yılmaz',    email: 'mehmet@sirket.local',    password: hash('User123!'),  role: 'user',   department: 'Muhasebe' },
    { name: 'Ayşe Kara',        email: 'ayse@sirket.local',      password: hash('User123!'),  role: 'user',   department: 'Satış' },
    { name: 'Fatih Demir',      email: 'fatih@sirket.local',     password: hash('User123!'),  role: 'user',   department: 'İK' },
    { name: 'Selin Çelik',      email: 'selin@sirket.local',     password: hash('User123!'),  role: 'user',   department: 'Operasyon' },
    { name: 'Sercan Yıldız',    email: 'sercan@sirket.local',    password: hash('User123!'),  role: 'user',   department: 'Operasyon' },
  ];

  const insertMany = db.transaction((list) => {
    for (const u of list) insertUser.run(u);
  });
  insertMany(users);

  const counter = { n: 1 };
  const insertTicket = db.prepare(`
    INSERT INTO tickets (ticket_no, title, description, category, priority, status, impact, created_by, assigned_to, created_at, updated_at)
    VALUES (@ticket_no, @title, @description, @category, @priority, @status, @impact, @created_by, @assigned_to, @created_at, @updated_at)
  `);
  const insertLog = db.prepare(`
    INSERT INTO ticket_logs (ticket_id, user_id, action, detail, created_at)
    VALUES (@ticket_id, @user_id, @action, @detail, @created_at)
  `);

  const tickets = [
    {
      title: 'Bilgisayar açılmıyor', category: 'Donanım', priority: 'Kritik', status: 'open',
      impact: 'Sadece ben etkileniyorum', created_by: 4, assigned_to: null,
      description: 'Sabahtan beri bilgisayarım hiç açılmıyor. Güç düğmesine basıyorum ama herhangi bir ışık yanmıyor.',
      created_at: '2026-04-17 08:31:00',
      logs: [
        { user_id: 4, action: 'created',  detail: 'Talep oluşturuldu', at: '2026-04-17 08:31:00' },
        { user_id: 1, action: 'priority', detail: 'Öncelik Kritik olarak atandı', at: '2026-04-17 08:45:00' },
      ]
    },
    {
      title: 'VPN bağlantısı kurulamıyor', category: 'Ağ / İnternet', priority: 'Yüksek', status: 'progress',
      impact: 'Birkaç kişi etkileniyor', created_by: 5, assigned_to: 2,
      description: 'Uzaktan çalışırken VPN bağlantısı kurulamıyor. Kimlik doğrulama başarısız hatası alıyorum.',
      created_at: '2026-04-17 09:15:00',
      logs: [
        { user_id: 5, action: 'created',  detail: 'Talep oluşturuldu', at: '2026-04-17 09:15:00' },
        { user_id: 2, action: 'assigned', detail: 'Ali Tekin talebi aldı', at: '2026-04-17 09:22:00' },
        { user_id: 2, action: 'status',   detail: 'Durum: İşlemde', at: '2026-04-17 09:45:00' },
      ]
    },
    {
      title: 'Outlook açılmıyor, uygulama çöküyor', category: 'Yazılım', priority: 'Orta', status: 'progress',
      impact: 'Sadece ben etkileniyorum', created_by: 6, assigned_to: 3,
      description: 'Outlook açmaya çalıştığımda hata vererek kapanıyor. Windows güncellemesi sonrası başladı.',
      created_at: '2026-04-16 16:10:00',
      logs: [
        { user_id: 6, action: 'created',  detail: 'Talep oluşturuldu', at: '2026-04-16 16:10:00' },
        { user_id: 3, action: 'assigned', detail: 'Zeynep Ak atandı', at: '2026-04-16 16:20:00' },
      ]
    },
    {
      title: 'Yazıcı ağda görünmüyor', category: 'Yazıcı', priority: 'Düşük', status: 'open',
      impact: 'Birkaç kişi etkileniyor', created_by: 7, assigned_to: null,
      description: '3. kattaki yazıcı ağdan düştü. Bölümdeki 5 kişi de yazdıramıyor.',
      created_at: '2026-04-16 11:30:00',
      logs: [
        { user_id: 7, action: 'created', detail: 'Talep oluşturuldu', at: '2026-04-16 11:30:00' },
      ]
    },
    {
      title: 'İnternet son derece yavaş (3. kat)', category: 'Ağ / İnternet', priority: 'Kritik', status: 'open',
      impact: 'Tüm departman etkileniyor', created_by: 8, assigned_to: null,
      description: '3. katta internet neredeyse kullanılamaz. Tüm departman etkileniyor, video toplantı yapılamıyor.',
      created_at: '2026-04-17 10:50:00',
      logs: [
        { user_id: 8, action: 'created',  detail: 'Talep oluşturuldu', at: '2026-04-17 10:50:00' },
        { user_id: 1, action: 'priority', detail: 'Kritik öncelik, SLA başladı', at: '2026-04-17 10:51:00' },
      ]
    },
    {
      title: 'Şifre sıfırlama işlemi yapılamıyor', category: 'Erişim / Şifre', priority: 'Yüksek', status: 'resolved',
      impact: 'Sadece ben etkileniyorum', created_by: 5, assigned_to: 2,
      description: 'Şifremi unuttum, sıfırlama e-postası gelmiyor. LDAP hesabı kilitlenmiş olabilir.',
      created_at: '2026-04-15 14:22:00',
      logs: [
        { user_id: 5, action: 'created',  detail: 'Talep oluşturuldu', at: '2026-04-15 14:22:00' },
        { user_id: 2, action: 'assigned', detail: 'Ali Tekin ilgileniyor', at: '2026-04-15 14:30:00' },
        { user_id: 2, action: 'resolved', detail: 'AD hesabı kilidi açıldı, çözümlendi', at: '2026-04-15 15:05:00' },
      ]
    },
  ];

  const seedTickets = db.transaction(() => {
    for (const t of tickets) {
      const no = 'HD-' + String(counter.n++).padStart(3, '0');
      const res = insertTicket.run({
        ticket_no: no, title: t.title, description: t.description,
        category: t.category, priority: t.priority, status: t.status,
        impact: t.impact, created_by: t.created_by, assigned_to: t.assigned_to || null,
        created_at: t.created_at, updated_at: t.created_at,
      });
      for (const log of t.logs) {
        insertLog.run({ ticket_id: res.lastInsertRowid, user_id: log.user_id, action: log.action, detail: log.detail, created_at: log.at });
      }
    }
  });
  seedTickets();

  console.log('✅ Demo veriler yüklendi!');
  console.log('');
  console.log('Giriş bilgileri:');
  console.log('  Admin   → admin@helpdesk.local   / Admin123!');
  console.log('  Staff   → ali@helpdesk.local      / Staff123!');
  console.log('  User    → mehmet@sirket.local     / User123!');
}

seed();
