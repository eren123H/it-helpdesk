# 🛡️ IT HelpDesk — Şirket İçi Destek Sistemi

Node.js + SQLite tabanlı, kurulum gerektirmeyen hafif bir IT destek talep yönetim sistemi.  
Aynı ağdaki herkes tarayıcıdan erişir, sunucu kurulumu için tek bir komut yeterlidir.

---

## 📋 Gereksinimler

- **Node.js 20 LTS** (önerilen: nvm ile kurulum)
- **npm 10+**

```bash
# nvm ile Node 20 kurulumu (önerilir)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20 && nvm use 20
```

---

## 🚀 İlk Kurulum (Bir Kez Yapılır)

### 1. Backend Bağımlılıklarını Yükle

```bash
cd backend
npm install
```

### 2. Ortam Değişkenlerini Ayarla

```bash
cp .env.example .env
```

`.env` dosyasını aç ve `JWT_SECRET` değerini **mutlaka** değiştir:

```env
PORT=3001
JWT_SECRET=SirketineOzelGucluBirSifreyiYazBuraya!
FRONTEND_URL=http://localhost:5173
```

### 3. Veritabanını Oluştur

```bash
npm run seed
```

Bu komut `backend/data/helpdesk.db` dosyasını oluşturur ve ilk kullanıcıları ekler:

| Rol | E-posta | Varsayılan Şifre |
|-----|---------|-----------------|
| Admin | admin@helpdesk.local | Admin123! |
| IT Personeli | ali@helpdesk.local | Staff123! |
| Kullanıcı | mehmet@sirket.local | User123! |

> ⚠️ İlk girişten sonra şifreleri **Yönetim Paneli → Kullanıcılar → Düzenle** üzerinden değiştir.

### 4. Frontend'i Derle

```bash
cd ../frontend
npm install
npm run build
```

Bu komut üretim için hazır dosyaları `backend/public/` klasörüne çıkarır.

---

## ▶️ Sunucuyu Başlat

```bash
cd backend
node src/app.js
```

Çıktı şöyle görünmeli:
```
🛡️  IT HelpDesk API çalışıyor → http://0.0.0.0:3001
   Health: http://localhost:3001/api/health
```

Artık:
- **Kendi bilgisayarından:** `http://localhost:3001`
- **Aynı ağdaki herhangi bir cihazdan:** `http://[Sunucu-IP]:3001`

---

## 🔄 Sunucu Kapanmasın (Production / Şirket Sunucusu)

Terminali kapattığında uygulama da kapanır. Sürekli çalışması için **PM2** kullan:

```bash
# PM2 kur (bir kez)
npm install -g pm2

# Uygulamayı başlat
pm2 start src/app.js --name "helpdesk"

# Sunucu yeniden başlayınca otomatik açılsın
pm2 startup
pm2 save
```

**Faydalı PM2 komutları:**

```bash
pm2 status          # Uygulama durumunu gör
pm2 logs helpdesk   # Canlı log takibi
pm2 restart helpdesk
pm2 stop helpdesk
```

---

## 💻 Geliştirme Modu (2 Terminal)

Kod değişikliklerinde otomatik yeniden başlatma için:

```bash
# Terminal 1 — Backend (nodemon ile)
cd backend
npm run dev        # → http://localhost:3001

# Terminal 2 — Frontend (Vite ile)
cd frontend
npm run dev        # → http://localhost:5173
```

> Geliştirme modunda Vite, `/api` isteklerini otomatik olarak `localhost:3001`'e proxy'ler.

---

## 🗄️ Veritabanı

**Tür:** SQLite (tek dosya, kurulum gerekmez)  
**Konum:** `backend/data/helpdesk.db`

### Görsel Arayüz ile (Önerilir)
[DB Browser for SQLite](https://sqlitebrowser.org/dl/) veya [DBeaver](https://dbeaver.io/) ile `helpdesk.db` dosyasını aç.

### Terminal ile Hızlı Sorgular

```bash
sqlite3 backend/data/helpdesk.db

# Kullanıcıları listele
SELECT id, name, email, role, active FROM users;

# Açık ticketları gör
SELECT ticket_no, title, priority, status FROM tickets WHERE status='open';

# Çık
.quit
```

### Yedek Alma

```bash
# Sadece tek dosyayı kopyalamak yeterli
cp backend/data/helpdesk.db backup_$(date +%Y%m%d).db
```

---

## 👥 Rol Yetkileri

| Özellik | Kullanıcı | IT Personeli | Admin |
|---------|:---------:|:------------:|:-----:|
| Kendi taleplerini gör | ✅ | ✅ | ✅ |
| Tüm talepleri gör | ❌ | ✅ | ✅ |
| Talep oluştur | ✅ | ✅ | ✅ |
| Talep detayı | ✅ | ✅ | ✅ |
| Durum güncelle | ❌ | ✅ | ✅ |
| Talep ata | ❌ | ✅ | ✅ |
| İç not ekle | ❌ | ✅ | ✅ |
| Dashboard & istatistik | ❌ | ✅ | ✅ |
| Kullanıcı oluştur/düzenle | ❌ | ❌ | ✅ |
| Kullanıcı aktif/pasif | ❌ | ❌ | ✅ |
| SLA raporları | ❌ | ❌ | ✅ |
| Personel iş yükü raporu | ❌ | ❌ | ✅ |

---

## 🌐 API Endpoint'leri

```
POST   /api/auth/login
GET    /api/auth/me

GET    /api/tickets          ?status=&priority=&exclude_status=&q=&page=&limit=
POST   /api/tickets
GET    /api/tickets/stats
GET    /api/tickets/:id
PATCH  /api/tickets/:id/status
PATCH  /api/tickets/:id/assign
POST   /api/tickets/:id/comments

GET    /api/users            ?role=
POST   /api/users
PATCH  /api/users/:id        (name, role, department, active, password)

GET    /api/admin/sla
GET    /api/admin/report

GET    /api/health
```

---

## 📁 Proje Yapısı

```
TicketProje/
├── README.md
├── backend/
│   ├── .env.example          ← Ortam değişkenleri şablonu
│   ├── .env                  ← Gerçek ayarlar (git'e ekleme!)
│   ├── package.json
│   ├── data/
│   │   └── helpdesk.db       ← SQLite veritabanı (otomatik oluşur)
│   └── src/
│       ├── app.js            ← Express sunucu + static serve
│       ├── db/
│       │   ├── database.js   ← Tablo tanımları (SQLite)
│       │   └── seed.js       ← İlk kullanıcı ve demo verisi
│       ├── middleware/
│       │   └── auth.js       ← JWT doğrulama + rol kontrolü
│       └── routes/
│           ├── auth.js       ← Login, /me
│           ├── tickets.js    ← Ticket CRUD + yorum + atama
│           ├── users.js      ← Kullanıcı yönetimi
│           └── admin.js      ← SLA + raporlar
└── frontend/
    ├── index.html            ← Vite giriş noktası
    ├── vite.config.js        ← Proxy + build ayarları
    ├── package.json
    └── src/
        ├── App.jsx           ← Router + Layout + NavBar
        ├── main.jsx          ← React entry point
        ├── api/
        │   └── client.js     ← Axios + JWT interceptor
        ├── context/
        │   └── AuthContext.jsx
        └── components/
            ├── Login.jsx
            ├── Dashboard.jsx     ← İstatistik + grafikler
            ├── TicketList.jsx    ← Filtreli ticket listesi
            ├── TicketDetail.jsx  ← Ticket detay + yorumlar
            ├── NewTicket.jsx     ← Yeni talep formu
            └── AdminPanel.jsx    ← Kullanıcı yönetimi + SLA + raporlar
```

---

## ⚙️ Sistem Gereksinimleri (Şirket Sunucusu)

| Kriter | Minimum | Önerilen |
|--------|---------|----------|
| RAM | 512 MB | 1-2 GB |
| Disk | 1 GB | 5-10 GB |
| İşletim Sistemi | Ubuntu 20+ / Windows Server | Ubuntu 22 LTS |
| Node.js | v20 LTS | v20 LTS |

> 💡 SQLite tabanlı olduğundan PostgreSQL/MySQL gibi ayrı bir veritabanı sunucusu **gerekmez.**
