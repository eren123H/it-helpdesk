const bcrypt = require('bcryptjs');
const { getDb } = require('../../src/db/database');

function clearAllRows(db) {
  db.exec(`
    DELETE FROM notifications;
    DELETE FROM attachments;
    DELETE FROM comments;
    DELETE FROM ticket_logs;
    DELETE FROM system_logs;
    DELETE FROM tickets;
    DELETE FROM users;
  `);
}

function seedTestUsers() {
  const db = getDb();
  clearAllRows(db);

  const insertUser = db.prepare(`
    INSERT INTO users (name, email, password, role, department)
    VALUES (@name, @email, @password, @role, @department)
  `);

  const hash = (pw) => bcrypt.hashSync(pw, 4);

  const users = [
    { name: 'Test Admin', email: 'admin@test.local', password: hash('Admin123!'), role: 'admin', department: 'IT' },
    { name: 'Test Staff', email: 'staff@test.local', password: hash('Staff123!'), role: 'staff', department: 'IT' },
    { name: 'Test User', email: 'user@test.local', password: hash('User123!'), role: 'user', department: 'HR' },
  ];

  const tx = db.transaction((rows) => {
    for (const u of users) insertUser.run(u);
  });
  tx(users);
}

module.exports = { seedTestUsers };
