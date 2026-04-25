const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes   = require('./routes/auth');
const ticketRoutes = require('./routes/tickets');
const userRoutes   = require('./routes/users');
const adminRoutes  = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3001;

// ── Middleware ──
// CORS: dev'de tüm originlere izin ver (LAN erişimi için)
app.use(cors({
  origin: true,
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Request logger (dev) ──
app.use((req, _res, next) => {
  console.log(`${new Date().toLocaleTimeString('tr-TR')} ${req.method} ${req.path}`);
  next();
});

// ── Routes ──
app.use('/api/auth',    authRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/users',   userRoutes);
app.use('/api/admin',   adminRoutes);

// ── Health check ──
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ── Frontend static dosyaları (build sonrası) ──
const publicDir = path.join(__dirname, '../public');
const uploadsDir = path.join(__dirname, '../uploads');
const fs = require('fs');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));
if (fs.existsSync(publicDir)) {
  app.use(express.static(publicDir));
  // SPA: tüm bilinmeyen route'ları index.html'e yönlendir
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api')) {
      res.sendFile(path.join(publicDir, 'index.html'));
    } else {
      res.status(404).json({ error: 'Endpoint bulunamadı' });
    }
  });
} else {
  // Build yoksa sadece API 404
  app.use((_req, res) => {
    res.status(404).json({ error: 'Endpoint bulunamadı' });
  });
}

// ── Error handler ──
app.use((err, _req, res, _next) => {
  console.error('Sunucu hatası:', err);
  res.status(500).json({ error: 'Sunucu hatası' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n🛡️  IT HelpDesk API çalışıyor → http://0.0.0.0:${PORT}`);
  console.log(`   Health: http://localhost:${PORT}/api/health\n`);
});

module.exports = app;
