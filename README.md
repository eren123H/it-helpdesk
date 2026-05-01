# IT HelpDesk — Sirket Ici Destek Talep Yonetim Sistemi

Node.js + SQLite tabanli, kurulum gerektirmeyen hafif bir IT destek talep yonetim sistemi.
Ayni agdaki herkes tarayicidan erisir, sunucu kurulumu icin tek bir komut yeterlidir.

---

## One Cikan Ozellikler

- **Rol Tabanli Erisim:** Admin, IT Personeli ve Kullanici icin ozel yetki matrisi
- **Canli Bildirim Sistemi:** Yeni yorumlarda ve bilet atamalarinda sayfayi yenilemeden sag ustte anlik bildirimler (10 sn polling)
- **SLA & Is Yuku Raporlari:** Admin panelinde personel is yuku, ortalama cozum sureleri ve SLA ihlal riskleri
- **Personel Memnuniyeti (CSAT):** Cozumlenen biletlere kullanicilarin verdigi 5 yildizli degerlendirmelerin genel ve personel bazli raporlanmasi
- **Akilli Listeleme:** Oncelik, durum, kategori, arama ve siralama destekli filtreleme (En Yeni / En Eski / Oncelik)
- **Dosya Ekleri:** Biletlere gorsel, PDF, TXT, DOCX yukleme (maks. 1 MB)
- **Ic Notlar:** Personeller arasi "Kullanicinin gormedigi" ic notlasma sistemi
- **Bilet Birlestirme:** Admin tarafindan birden fazla bileti tek bilete birlestirme
- **Oncelik Degistirme:** Staff/Admin tarafindan bilet onceligi guncelleme
- **Modern UI:** Lucide-react ikonlari, dark tema, profesyonel sidebar ve glassmorphism efektleri

---

## Gereksinimler

- **Node.js 20 LTS** (onerilen: nvm ile kurulum)
- **npm 10+**

```bash
# nvm ile Node 20 kurulumu (onerilir)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc
nvm install 20 && nvm use 20
```

---

## Ilk Kurulum (Bir Kez Yapilir)

### 1. Backend Bagimliliklarini Yukle

```bash
cd backend
npm install
```

### 2. Ortam Degiskenlerini Ayarla

```bash
cp .env.example .env
```

`.env` dosyasini ac ve `JWT_SECRET` degerini **mutlaka** degistir:

```env
PORT=3001
JWT_SECRET=SirketineOzelGucluBirSifreyiYazBuraya!
FRONTEND_URL=http://localhost:5173
```

### 3. Veritabanini Olustur

```bash
npm run seed
```

Bu komut `backend/data/helpdesk.db` dosyasini olusturur ve ilk kullanicilari ekler:

| Rol | E-posta | Varsayilan Sifre |
|-----|---------|-----------------|
| Admin | admin@helpdesk.local | Admin123! |
| IT Personeli | ali@helpdesk.local | Staff123! |
| Kullanici | mehmet@sirket.local | User123! |

> Ilk giristen sonra sifreleri **Yonetim Paneli -> Kullanicilar -> Duzenle** uzerinden degistir.

### 4. Frontend'i Derle

```bash
cd ../frontend
npm install
npm run build
```

Bu komut uretim icin hazir dosyalari `backend/public/` klasorune cikarir.

---

## Sunucuyu Baslat

```bash
cd backend
node src/app.js
```

Cikti soyle gorunmeli:
```
IT HelpDesk API calisiyor -> http://0.0.0.0:3001
   Health: http://localhost:3001/api/health
```

Artik:
- **Kendi bilgisayarindan:** `http://localhost:3001`
- **Ayni agdaki herhangi bir cihazdan:** `http://[Sunucu-IP]:3001`

---

## Sunucu Kapanmasin (Production)

Terminali kapattiginda uygulama da kapanir. Surekli calismasi icin **PM2** kullan:

```bash
# PM2 kur (bir kez)
npm install -g pm2

# Uygulamayi baslat
pm2 start src/app.js --name "helpdesk"

# Sunucu yeniden baslainca otomatik acilsin
pm2 startup
pm2 save
```

**Faydali PM2 komutlari:**

```bash
pm2 status          # Uygulama durumunu gor
pm2 logs helpdesk   # Canli log takibi
pm2 restart helpdesk
pm2 stop helpdesk
```

---

## Gelistirme Modu (2 Terminal)

Kod degisikliklerinde otomatik yeniden baslatma icin:

```bash
# Terminal 1 — Backend (nodemon ile)
cd backend
npm run dev        # -> http://localhost:3001

# Terminal 2 — Frontend (Vite ile)
cd frontend
npm run dev        # -> http://localhost:5173
```

> Gelistirme modunda Vite, `/api` isteklerini otomatik olarak `localhost:3001`'e proxy'ler.

---

## Veritabani Semasi

**Tur:** SQLite (tek dosya, kurulum gerekmez)
**Konum:** `backend/data/helpdesk.db`

### Tablolar

| Tablo | Aciklama |
|-------|----------|
| `users` | Kullanici kayitlari (admin, staff, user rolleri) |
| `tickets` | Destek talepleri (oncelik, durum, atama, CSAT puani) |
| `ticket_logs` | Bilet uzerindeki tum islem gecmisi |
| `comments` | Bilet yorumlari ve ic notlar |
| `attachments` | Biletlere eklenen dosyalar |
| `system_logs` | Sistem geneli admin islem kayitlari |
| `notifications` | Kullaniciya ozel anlık bildirimler |

### Cascade Silme

`ticket_logs`, `comments`, `attachments` ve `notifications` tablolari `ON DELETE CASCADE` ile bagli oldugundan, bir bilet silindiginde iliskili tum veriler otomatik temizlenir.

### Gorsel Arayuz ile (Onerilir)
[DB Browser for SQLite](https://sqlitebrowser.org/dl/) veya [DBeaver](https://dbeaver.io/) ile `helpdesk.db` dosyasini ac.

### Terminal ile Hizli Sorgular

```bash
sqlite3 backend/data/helpdesk.db

# Kullanicilari listele
SELECT id, name, email, role, active FROM users;

# Acik ticketlari gor
SELECT ticket_no, title, priority, status FROM tickets WHERE status='open';

# Cik
.quit
```

### Yedek Alma

```bash
# Sadece tek dosyayi kopyalamak yeterli
cp backend/data/helpdesk.db backup_$(date +%Y%m%d).db
```

---

## Rol Yetkileri

| Ozellik | Kullanici | IT Personeli | Admin |
|---------|:---------:|:------------:|:-----:|
| Kendi taleplerini gor | + | + | + |
| Tum talepleri gor | - | + | + |
| Talep olustur | + | + | + |
| Talep detayi & Dosya Yukleme | + | + | + |
| Cozumlenen bileti puanla (CSAT) | + | - | - |
| Durum guncelle | - | + | + |
| Oncelik guncelle | - | + | + |
| Talep ata (Sadece kendine) | - | + | - |
| Talep ata (Herkese) | - | - | + |
| Bileti tamamen kapat | - | - | + |
| Bilet birlestir | - | - | + |
| Ic not ekle | - | + | + |
| Dashboard & istatistik | - | + | + |
| Kullanici olustur/duzenle | - | - | + |
| Kullanici aktif/pasif | - | - | + |
| SLA ve CSAT raporlari | - | - | + |
| Personel is yuku raporu | - | - | + |
| Sistem loglari | - | - | + |

---

## API Endpoint'leri

### Kimlik Dogrulama
```
POST   /api/auth/login              Giris yap (email + sifre -> JWT token)
GET    /api/auth/me                 Oturumdaki kullanici bilgisi
```

### Destek Talepleri
```
GET    /api/tickets                 Talep listesi (filtre: status, priority, category, assigned_to, exclude_status, q, sort, page, limit)
POST   /api/tickets                 Yeni talep olustur (title, description, category, priority, impact)
GET    /api/tickets/stats           Dashboard istatistikleri (staff/admin)
GET    /api/tickets/:id             Talep detayi (loglar, yorumlar, ekler dahil)
PATCH  /api/tickets/:id/status      Durum guncelle (open, progress, resolved, closed)
PATCH  /api/tickets/:id/priority    Oncelik guncelle (Kritik, Yuksek, Orta, Dusuk)
PATCH  /api/tickets/:id/assign      Personel ata / atamayi kaldir
POST   /api/tickets/:id/comments    Yorum veya ic not ekle
POST   /api/tickets/:id/attachments Dosya yukle (multipart/form-data, maks 1MB)
PATCH  /api/tickets/:id/rate        CSAT degerlendirmesi (1-5 yildiz, sadece user)
POST   /api/tickets/merge           Biletleri birlestir (sadece admin)
```

### Kullanici Yonetimi
```
GET    /api/users                   Kullanici listesi (staff/admin gorebilir, filtre: role)
GET    /api/users/me                Kendi profili
POST   /api/users                   Yeni kullanici olustur (sadece admin)
PATCH  /api/users/:id               Kullanici guncelle: name, role, department, active, password (sadece admin)
```

### Bildirimler
```
GET    /api/users/notifications           Okunmamis bildirimler (maks 50)
PATCH  /api/users/notifications/:id/read  Tekli okundu isareti
PATCH  /api/users/notifications/read-all  Tumunu okundu isaretle
```

### Yonetim Raporlari (Sadece Admin)
```
GET    /api/admin/sla               SLA performans raporu (Kritik: 4s, Yuksek: 8s, Orta: 24s, Dusuk: 72s)
GET    /api/admin/report            Ozet rapor (is yuku, ort. cozum suresi, CSAT, son 30 gun trendi)
GET    /api/admin/logs              Sistem log kayitlari (filtre: action, page, limit)
```

### Sistem
```
GET    /api/health                  Saglik kontrolu
```

---

## Desteklenen Dosya Turleri

| Tur | MIME |
|-----|------|
| JPEG | image/jpeg |
| PNG | image/png |
| GIF | image/gif |
| WebP | image/webp |
| PDF | application/pdf |
| TXT | text/plain |
| DOCX | application/vnd.openxmlformats-officedocument.wordprocessingml.document |
| DOC | application/msword |

Maksimum dosya boyutu: **1 MB**

---

## Proje Yapisi

```
TicketProje/
├── README.md
├── .gitignore
├── backend/
│   ├── .env.example              <- Ortam degiskenleri sablonu
│   ├── .env                      <- Gercek ayarlar (git'e ekleme!)
│   ├── package.json              <- bcryptjs, better-sqlite3, cors, express, jsonwebtoken, multer
│   ├── data/
│   │   └── helpdesk.db           <- SQLite veritabani (otomatik olusur)
│   ├── uploads/                  <- Yuklenen dosyalar (otomatik olusur)
│   └── src/
│       ├── app.js                <- Express sunucu + static serve + SPA fallback
│       ├── db/
│       │   ├── database.js       <- Tablo tanimlari + index'ler (7 tablo)
│       │   ├── seed.js           <- Ilk kullanicilar ve demo verisi
│       │   └── logger.js         <- Sistem log yardimci fonksiyonu (sysLog)
│       ├── middleware/
│       │   ├── auth.js           <- JWT dogrulama + requireRole kontrol
│       │   └── upload.js         <- Multer dosya yukleme (1MB limit, MIME filtre)
│       └── routes/
│           ├── auth.js           <- POST /login, GET /me
│           ├── tickets.js        <- Ticket CRUD + yorum + atama + birlestirme + CSAT
│           ├── users.js          <- Kullanici yonetimi + bildirimler
│           └── admin.js          <- SLA + rapor + sistem loglari
└── frontend/
    ├── index.html                <- Vite giris noktasi
    ├── vite.config.js            <- Proxy (/api -> :3001) + build ayarlari
    ├── package.json              <- react, react-dom, react-router-dom, axios, lucide-react
    └── src/
        ├── App.jsx               <- Router + Layout (sidebar + header + bildirimler)
        ├── main.jsx              <- React entry point
        ├── api/
        │   └── client.js         <- Axios instance + JWT interceptor + 401 auto-logout
        ├── context/
        │   └── AuthContext.jsx   <- Kimlik dogrulama context provider
        └── components/
            ├── Login.jsx         <- Giris ekrani
            ├── Dashboard.jsx     <- Istatistik kartlari + haftalik trend grafigi
            ├── TicketList.jsx    <- Filtreli & siralanabilir talep listesi
            ├── TicketDetail.jsx  <- Talep detay + yorumlar + dosyalar + CSAT + atama
            ├── NewTicket.jsx     <- Yeni talep formu (ikon secimli kategori, oncelik)
            └── AdminPanel.jsx    <- Kullanici yonetimi + SLA + CSAT + is yuku + loglar
```

---

## Teknoloji Yigini

### Backend
| Paket | Versiyon | Aciklama |
|-------|----------|----------|
| express | ^4.18.2 | HTTP sunucu |
| better-sqlite3 | ^9.4.3 | SQLite veritabani (senkron, hizli) |
| jsonwebtoken | ^9.0.2 | JWT token olusturma / dogrulama |
| bcryptjs | ^2.4.3 | Sifre hashleme |
| multer | ^2.1.1 | Dosya yukleme |
| cors | ^2.8.5 | Cross-origin istek izinleri |
| nodemon | ^3.1.0 | Gelistirme: otomatik yeniden baslatma |

### Frontend
| Paket | Versiyon | Aciklama |
|-------|----------|----------|
| react | ^18.2.0 | UI kutuphanesi |
| react-dom | ^18.2.0 | React DOM renderer |
| react-router-dom | ^6.22.1 | SPA routing |
| axios | ^1.6.7 | HTTP istemcisi |
| lucide-react | ^1.11.0 | Vektor ikon kutuphanesi |
| vite | ^5.1.3 | Build araci + dev sunucu |

---

## Sistem Gereksinimleri (Sirket Sunucusu)

| Kriter | Minimum | Onerilen |
|--------|---------|----------|
| RAM | 512 MB | 1-2 GB |
| Disk | 1 GB | 5-10 GB |
| Isletim Sistemi | Ubuntu 20+ / Windows Server | Ubuntu 22 LTS |
| Node.js | v20 LTS | v20 LTS |

> SQLite tabanli oldugundan PostgreSQL/MySQL gibi ayri bir veritabani sunucusu **gerekmez.**
