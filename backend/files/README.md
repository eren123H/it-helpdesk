# 🛡️ IT HelpDesk — Kurulum ve Çalıştırma

## Gereksinimler
- Node.js 18+
- npm 9+

---

## 1. Kurulum

```bash
# Backend bağımlılıkları
cd backend
npm install

# Frontend bağımlılıkları
cd ../frontend
npm install
```

---

## 2. Backend Yapılandırması

```bash
cd backend
cp .env.example .env
# .env dosyasını düzenle (JWT_SECRET'i mutlaka değiştir!)
```

---

## 3. Demo Verileri Yükle

```bash
cd backend
npm run seed
```

Çıktıda giriş bilgilerini göreceksin:
```
Admin   → admin@helpdesk.local  / Admin123!
Staff   → ali@helpdesk.local    / Staff123!
User    → mehmet@sirket.local   / User123!
```

---

## 4. Geliştirme Modunda Çalıştır (2 terminal)

**Terminal 1 — Backend:**
```bash
cd backend
npm run dev
# → http://localhost:3001
```

**Terminal 2 — Frontend:**
```bash
cd frontend
npm run dev
# → http://localhost:5173
```

Tarayıcıda `http://localhost:5173` aç.

---

## 5. Production Build (Tek Port)

```bash
# Frontend'i build et (backend/public klasörüne çıkar)
cd frontend
npm run build

# Sadece backend çalıştır, frontend'i de serve eder
cd ../backend
node src/app.js
# → http://0.0.0.0:3001
```

`app.js` içine şunu ekle (routes'lardan önce):
```js
const path = require('path');
app.use(express.static(path.join(__dirname, '../public')));
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, '../public/index.html'));
  }
});
```

---

## Rol Yetkileri

| Özellik              | Kullanıcı | IT Personeli | Admin |
|----------------------|:---------:|:------------:|:-----:|
| Kendi taleplerini gör | ✅       | ✅           | ✅    |
| Tüm talepleri gör    | ❌        | ✅           | ✅    |
| Talep oluştur        | ✅        | ✅           | ✅    |
| Durum güncelle       | ❌        | ✅           | ✅    |
| Talep ata            | ❌        | ✅           | ✅    |
| İç not ekle          | ❌        | ✅           | ✅    |
| Kullanıcı yönetimi   | ❌        | ❌           | ✅    |
| SLA raporları        | ❌        | ❌           | ✅    |
| Dashboard istatistik | ❌        | ✅           | ✅    |

---

## API Endpoint'leri

```
POST   /api/auth/login
GET    /api/auth/me

GET    /api/tickets              ?status=&priority=&q=&page=&limit=
POST   /api/tickets
GET    /api/tickets/stats
GET    /api/tickets/:id
PATCH  /api/tickets/:id/status
PATCH  /api/tickets/:id/assign
POST   /api/tickets/:id/comments

GET    /api/users
POST   /api/users
PATCH  /api/users/:id

GET    /api/admin/sla
GET    /api/admin/report

GET    /api/health
```

---

## Proje Yapısı

```
it-helpdesk/
├── backend/
│   ├── src/
│   │   ├── db/
│   │   │   ├── database.js     ← SQLite tablolar
│   │   │   └── seed.js         ← Demo veri
│   │   ├── middleware/
│   │   │   └── auth.js         ← JWT + rol kontrolü
│   │   ├── routes/
│   │   │   ├── auth.js
│   │   │   ├── tickets.js
│   │   │   ├── users.js
│   │   │   └── admin.js
│   │   └── app.js              ← Express sunucu
│   ├── data/
│   │   └── helpdesk.db         ← SQLite veritabanı (otomatik oluşur)
│   └── package.json
└── frontend/
    ├── src/
    │   ├── api/client.js       ← Axios + JWT interceptor
    │   ├── context/AuthContext.jsx
    │   └── components/
    │       ├── Login.jsx
    │       ├── Dashboard.jsx
    │       ├── TicketList.jsx
    │       ├── TicketDetail.jsx
    │       ├── NewTicket.jsx
    │       └── AdminPanel.jsx
    ├── App.jsx                 ← Router + Layout
    └── main.jsx
```
