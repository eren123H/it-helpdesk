const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = path.join(__dirname, '../../data/helpdesk.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initTables();
  }
  return db;
}

function initTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      email       TEXT    NOT NULL UNIQUE,
      password    TEXT    NOT NULL,
      role        TEXT    NOT NULL DEFAULT 'user'
                          CHECK(role IN ('user','staff','admin')),
      department  TEXT,
      active      INTEGER NOT NULL DEFAULT 1,
      created_at  TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_no   TEXT    NOT NULL UNIQUE,
      title       TEXT    NOT NULL,
      description TEXT    NOT NULL,
      category    TEXT    NOT NULL,
      priority    TEXT    NOT NULL
                          CHECK(priority IN ('Kritik','Yüksek','Orta','Düşük')),
      status      TEXT    NOT NULL DEFAULT 'open'
                          CHECK(status IN ('open','progress','resolved','closed')),
      impact      TEXT,
      created_by  INTEGER NOT NULL REFERENCES users(id),
      assigned_to INTEGER REFERENCES users(id),
      created_at  TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
      updated_at  TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
      resolved_at TEXT,
      rating      INTEGER CHECK(rating >= 1 AND rating <= 5),
      rating_comment TEXT
    );

    CREATE TABLE IF NOT EXISTS ticket_logs (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id  INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
      user_id    INTEGER REFERENCES users(id),
      action     TEXT    NOT NULL,
      detail     TEXT,
      created_at TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS comments (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id  INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
      user_id    INTEGER NOT NULL REFERENCES users(id),
      body       TEXT    NOT NULL,
      internal   INTEGER NOT NULL DEFAULT 0,
      created_at TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE TABLE IF NOT EXISTS attachments (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id     INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
      user_id       INTEGER NOT NULL REFERENCES users(id),
      original_name TEXT    NOT NULL,
      stored_name   TEXT    NOT NULL,
      mimetype      TEXT    NOT NULL,
      size          INTEGER NOT NULL,
      created_at    TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE INDEX IF NOT EXISTS idx_attachments_ticket ON attachments(ticket_id);

    CREATE INDEX IF NOT EXISTS idx_tickets_status   ON tickets(status);
    CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);
    CREATE INDEX IF NOT EXISTS idx_tickets_created  ON tickets(created_at);
    CREATE INDEX IF NOT EXISTS idx_logs_ticket      ON ticket_logs(ticket_id);

    CREATE TABLE IF NOT EXISTS system_logs (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      actor_id   INTEGER REFERENCES users(id),
      actor_name TEXT,
      action     TEXT    NOT NULL,
      target     TEXT,
      detail     TEXT,
      ip         TEXT,
      created_at TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE INDEX IF NOT EXISTS idx_syslogs_created ON system_logs(created_at);
    CREATE INDEX IF NOT EXISTS idx_syslogs_action  ON system_logs(action);

    CREATE TABLE IF NOT EXISTS notifications (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      ticket_id  INTEGER REFERENCES tickets(id) ON DELETE CASCADE,
      message    TEXT    NOT NULL,
      is_read    INTEGER NOT NULL DEFAULT 0,
      created_at TEXT    NOT NULL DEFAULT (datetime('now','localtime'))
    );

    CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
    CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id, is_read);
  `);

  try {
    db.exec(`ALTER TABLE tickets ADD COLUMN sla_breached INTEGER NOT NULL DEFAULT 0;`);
  } catch (e) {
    // Sütun zaten varsa hata verir, görmezden gel
  }
}

module.exports = { getDb };
