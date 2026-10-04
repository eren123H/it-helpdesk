# 🎫 IT Help Desk System

A full-stack web-based IT support and ticket management system developed during my Information Technology internship.

The application was designed around an internal corporate IT support use case, allowing employees to submit technical support requests while enabling IT staff and administrators to manage the entire support process through a centralized platform.

---

## 📌 Project Overview

IT Help Desk provides a structured environment for managing internal technical support requests.

Instead of handling support requests through scattered communication channels, the system centralizes ticket creation, assignment, prioritization, communication, resolution, and reporting.

The project was developed during my IT internship and prepared for real-world internal use.

The application supports different user roles and provides dedicated capabilities for employees, IT staff, and administrators.

---

## ✨ Key Features

- 🎫 Create and manage IT support tickets
- 👥 Role-based access control
- 🔐 JWT-based authentication
- 🔒 Password hashing with bcrypt
- 🔎 Search, filter, sort, and prioritize tickets
- 👨‍💻 Assign tickets to IT staff
- 💬 Ticket comments
- 📝 Internal IT staff notes
- 📎 File attachments
- 🔔 In-app notifications
- 🔀 Merge related tickets
- ⭐ Customer Satisfaction (CSAT) ratings
- ⏱️ SLA performance tracking
- 📊 IT staff workload reporting
- 📈 Resolution-time statistics
- 📝 Ticket and system activity logs
- 💾 Automatic SQLite database backups
- 📱 Responsive web interface

---

## 👥 User Roles

### 👤 User

Employees can:

- Create new support requests
- View their own tickets
- Track ticket status
- Add comments
- Upload attachments
- Follow the resolution process
- Rate resolved tickets

### 🧑‍💻 IT Staff

IT personnel can:

- View support requests
- Work with assigned tickets
- Update ticket status
- Change priority
- Add comments
- Add internal notes
- Manage the ticket resolution process
- Review operational information

### 🛡️ Administrator

Administrators have access to additional management capabilities such as:

- User management
- Ticket assignment
- Ticket merging
- SLA monitoring
- CSAT reporting
- IT staff workload analysis
- Resolution-time reports
- System logs
- Operational reporting

---

## 🛠️ Tech Stack

### Frontend

- React
- Vite
- React Router
- Axios
- Lucide React

### Backend

- Node.js
- Express.js
- REST API
- JWT
- bcrypt

### Database

- SQLite
- better-sqlite3

### Other Tools & Technologies

- Multer
- PM2
- Git
- GitHub

---

## 🏗️ Architecture

The application follows a client-server architecture.

```text
┌─────────────────────┐
│   React Frontend    │
│       (Vite)        │
└──────────┬──────────┘
           │
           │ REST API
           ▼
┌─────────────────────┐
│ Node.js / Express   │
│      Backend        │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│       SQLite        │
│      Database       │
└─────────────────────┘

The React frontend communicates with the Node.js / Express backend through REST API endpoints.
Authentication is handled using JWT, while passwords are protected using hashing.
🔄 Ticket Workflow
A typical support request follows this process:
Employee
   │
   ▼
Creates Ticket
   │
   ▼
Ticket Submitted
   │
   ▼
IT Staff / Admin
   │
   ▼
Assignment & Prioritization
   │
   ▼
Investigation
   │
   ▼
Comments / Internal Notes
   │
   ▼
Resolution
   │
   ▼
Ticket Closed
   │
   ▼
CSAT Feedback

This structure allows support requests to be tracked throughout their lifecycle.
📊 Reporting & Monitoring
The system includes reporting and monitoring functionality for internal IT operations.
Examples include:
- SLA performance
- Ticket resolution times
- IT staff workload
- User satisfaction (CSAT)
- Ticket activity
- System activity logs
These features help provide visibility into the support process instead of using the application only as a basic ticket list.
🔐 Authentication & Authorization
Authentication is implemented using JWT.
Passwords are protected using bcrypt hashing.
The application uses role-based authorization to separate functionality between:
User
IT Staff
Admin

This prevents users from accessing functionality outside their assigned role.
📎 File Attachments
Users can attach files to support requests when additional information is required.
File upload handling is implemented using Multer on the backend.
This can be used for content such as:
- Screenshots
- Error messages
- Supporting documents
- Other ticket-related files
🔔 Notifications
The application includes an in-app notification system.
Notifications help users and IT staff follow relevant changes in the ticket management process.
⭐ CSAT — Customer Satisfaction
After the support process is completed, users can provide satisfaction feedback.
CSAT data can then be used as part of the reporting process to evaluate support quality.
⏱️ SLA Tracking
The system includes SLA-related monitoring functionality.
This provides additional visibility into support performance and ticket resolution processes.
💾 Database Backup
The application includes automatic backup functionality for the SQLite database.
This was included to provide additional protection for application data during internal use.
📂 Project Structure
it-helpdesk/
│
├── frontend/
│   ├── src/
│   ├── public/
│   └── package.json
│
├── backend/
│   ├── src/
│   ├── data/
│   └── package.json
│
├── .gitignore
└── README.md

The project separates frontend and backend responsibilities to keep the application structure maintainable.
🚀 Running the Project
1. Clone the repository
git clone https://github.com/eren123H/it-helpdesk.git
cd it-helpdesk

2. Install Backend Dependencies
cd backend
npm install

3. Install Frontend Dependencies
Open another terminal:
cd frontend
npm install

4. Start the Backend
From the backend directory:
npm start

5. Start the Frontend
From the frontend directory:
npm run dev

Depending on the deployment environment, additional configuration may be required.

📸 Screenshots
Application screenshots will be added to this section.
Planned screenshots:
- Login Page
- User Dashboard
- Ticket Creation
- Ticket Detail
- IT Staff Dashboard
- Admin Panel
- Reports
💡 What I Learned
Developing this project gave me practical experience in several areas of software development and IT operations:
- Full-stack web application development
- React frontend development
- Node.js and Express backend development
- REST API design
- Authentication and authorization
- Role-based access control
- Relational database operations
- Ticket workflow design
- File upload handling
- Reporting and operational dashboards
- Application logging
- Database backup processes
- Git and version control
- Working on a software solution based on a real internal IT support use case
🎯 Project Background
This project was developed during my Information Technology internship.
The main objective was to create a centralized web-based system for managing internal IT support requests and provide different capabilities for employees, IT personnel, and administrators.
Working on the project allowed me to combine software development with the IT support processes I encountered during my internship.
🔮 Future Improvements
Possible future improvements include:
- Email notifications
- Advanced analytics dashboards
- Additional reporting capabilities
- Improved automated testing
- Docker-based deployment
- Additional security improvements


👨‍💻 Developer
Eren Uçar
Management Information Systems Graduate
Focus Areas: IT • Software Development • Data Analytics
- GitHub: github.com/eren123H
- Portfolio: eren123h.github.io/portfolio








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

`.env` dosyasini ac ve kendi sunucu bilgilerini gir (`JWT_SECRET` degerini **mutlaka** degistir):

```env
PORT=3001
JWT_SECRET=SirketineOzelGucluBirSifreyiYazBuraya!
FRONTEND_URL=http://localhost:5173

# ── Mail (Gmail SMTP) ──
MAIL_HOST=smtp.gmail.com
MAIL_USER=senin-mailin@gmail.com
MAIL_PASS=uygulama-sifresi
MAIL_FROM=senin-mailin@gmail.com
MAIL_NOTIFY=it-departmani@sirket.local
```

### 3. Veritabanini Olustur

```bash
# Once data klasorunu olustur (git tarafindan izlenmedigi icin manuel olusturman gerekir!)
mkdir data

# Ardindan veritabanini olustur
npm run seed
```

Bu komut `backend/data/helpdesk.db` dosyasini olusturur ve sistemi baslatabilmen icin sadece **tek bir Admin hesabi** ekler (sistemi temiz baslatmak icindir, gereksiz demo veri icermez):

| Rol | E-posta | Varsayilan Sifre |
|-----|---------|-----------------|
| Admin | admin@helpdesk.local | Admin123! |

> Ilk giristen sonra sifreyi **Yonetim Paneli -> Kullanicilar -> Duzenle** uzerinden **mutlaka** degistir. Diger personel ve kullanicilari bu panelden manuel olarak ekleyebilirsin.

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

### Yedek Alma (Otomatik & Manuel)

Sistem, sunucu baslatildiginda ve ardindan **her 48 saatte bir otomatik olarak** veritabani yedegi alir.
- Yedekler `backend/data/backups/` klasorunde saklanir.
- Otomatik olarak **son 14 yedek** (~28 gunluk) tutulur, daha eskiler otomatik silinir.

Manuel yedek almak istersen, sadece tek dosyayi kopyalaman yeterlidir:
```bash
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
DELETE /api/users/:id               Kullaniciyi (ve bagli log/yorumlari) kalici olarak sil (sadece admin)
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
