process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'jest-test-secret-key-do-not-use-in-production';
process.env.SQLITE_DB_PATH = ':memory:';

// .env içindeki SMTP ile gerçek/async mail tetiklenmesin (Jest açık handle bırakmasın).
process.env.MAIL_USER = '';
process.env.MAIL_PASS = '';
process.env.MAIL_NOTIFY = '';
