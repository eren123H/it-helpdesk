const bcrypt = require('bcryptjs');
const { getDb } = require('./database');

function seed() {
  const db = getDb();

  const existingUsers = db.prepare('SELECT COUNT(*) as c FROM users').get();
  if (existingUsers.c > 0) {
    console.log('Veritabanı zaten dolu, seed atlanıyor.');
    return;
  }

  console.log('Kurulum tamamlanıyor, admin kullanıcısı oluşturuluyor...');

  const hash = (pw) => bcrypt.hashSync(pw, 10);

  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password, role, department)
    VALUES (@name, @email, @password, @role, @department)
  `);

  const users = [
    { name: 'Admin Kullanıcı',  email: 'admin@helpdesk.local',  password: hash('Admin123!'), role: 'admin',  department: 'IT' }
  ];

  const insertMany = db.transaction((list) => {
    for (const u of list) insertUser.run(u);
  });
  insertMany(users);

  console.log('✅ Sistem başarıyla kuruldu!');
  console.log('');
  console.log('Giriş bilgileri:');
  console.log('  Admin   → admin@helpdesk.local   / Admin123!');
}

seed();
