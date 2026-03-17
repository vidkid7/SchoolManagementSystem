# 🔐 Railway Deployment Credentials

> **Environment:** Production
> **Last Updated:** March 2026

---

## 🌐 Service URLs

| Service | URL |
|---------|-----|
| **Backend API** | `https://schoolmanagementsystem-production-4bb7.up.railway.app` |
| **API Base Path** | `https://schoolmanagementsystem-production-4bb7.up.railway.app/api/v1` |
| **Health Check** | `https://schoolmanagementsystem-production-4bb7.up.railway.app/health` |

---

## 👤 Login Credentials (All Roles)

| # | Role | Username | Password | Portal Path | Access |
|---|------|----------|----------|-------------|--------|
| 1 | **School Admin** | `admin_school` | `Admin@123` | `/KMC/dashboard` | Full school management — students, staff, finance, library, exams, settings, users, audit, reports, certificates, documents, backup |
| 2 | **Class Teacher** | `ct_school` | `Teacher@123` | `/KMC/portal/class-teacher` | Manage assigned class — attendance, behavior tracking, class roster, parent communication, assignments, lesson plans |
| 3 | **Subject Teacher** | `st_school` | `Teacher@123` | `/KMC/teacher/dashboard` | Subject-specific — mark attendance, enter grades, create assignments, lesson plans for assigned subjects/classes |
| 4 | **Department Head** | `dh_school` | `DeptHead@123` | `/KMC/portal/department-head` | Department oversight — review lesson plans, monitor teacher performance, department reports, curriculum tracking |
| 5 | **ECA Coordinator** | `eca_school` | `ECACoord@123` | `/KMC/portal/eca-coordinator` | Extracurricular activities — create clubs, enroll students, organize events, record achievements |
| 6 | **Sports Coordinator** | `sc_school` | `SportsCoord@123` | `/KMC/portal/sports-coordinator` | Sports program — manage teams, tournaments, enroll athletes, record match results, achievements |
| 7 | **Librarian** | `lib_school` | `Librarian@123` | `/KMC/portal/librarian` | Library — book catalog, issue/return books, manage categories, collect fines, circulation reports |
| 8 | **Accountant** | `acc_school` | `Accountant@123` | `/KMC/portal/accountant` | Finance — fee structures, invoices, payments, refunds, payment gateways (eSewa, Khalti, IME Pay), financial reports |
| 9 | **Transport Manager** | `tm_school` | `Transport@123` | `/KMC/portal/transport` | Transport — vehicles, routes, driver assignment, student assignment, maintenance, safety compliance |
| 10 | **Hostel Warden** | `hw_school` | `Hostel@123` | `/KMC/portal/hostel` | Hostel — room assignment, hostel attendance, leave processing, discipline, visitor registration, maintenance |
| 11 | **Non-Teaching Staff** | `nts_school` | `Staff@123` | `/KMC/portal/non-teaching-staff` | Personal — own attendance, leave applications, assigned tasks, maintenance requests, announcements |
| 12 | **Municipality Admin** | `municipalityadmin` | `Municipality@123` | `/KMC/municipality` | Multi-school — view all schools, create schools, assign admins, municipality reports, incidents |
| 13 | **Student** | `student_0001` | `Student@123` | `/KMC/portal/student` | Personal academics — attendance, grades, timetable, assignments, library search, ECA/sports enrollment |
| 14 | **Parent** | `parent_0001` | `Parent@123` | `/KMC/portal/parent` | Child monitoring — attendance, grades, fees, assignments, message teacher, apply for leave, pay fees |

---

## 📊 Bulk Accounts

| Role | Username Pattern | Count | Password |
|------|-----------------|-------|----------|
| Student | `student_0001` to `student_0150` | 150 | `Student@123` |
| Parent | `parent_0001` to `parent_0150` | 50 | `Parent@123` |

> **Note:** Every 3rd student has a linked parent account.

---

## 🔧 Technical Details

### Database

| Setting | Value |
|---------|-------|
| Type | MySQL 8.0 |
| Connection | Via `DATABASE_URL` environment variable on Railway |
| ORM | Sequelize |

### Authentication

| Setting | Value |
|---------|-------|
| Method | JWT (JSON Web Tokens) |
| Access Token Expiry | 7 days |
| Refresh Token Expiry | 30 days |
| Password Hashing | bcrypt (10 rounds) |

### Rate Limiting

| Setting | Value |
|---------|-------|
| Login attempts | 5 per 15 minutes per IP |
| API requests | Configurable per endpoint |
| Lockout | `failed_login_attempts` column in `users` table |

### Environment Variables (Railway Backend)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | MySQL connection string (auto-provided by Railway) |
| `JWT_SECRET` | Secret key for signing access tokens |
| `JWT_REFRESH_SECRET` | Secret key for signing refresh tokens |
| `NODE_ENV` | `production` |
| `PORT` | Auto-assigned by Railway |
| `REDIS_URL` | Redis connection (if configured) |
| `ENCRYPTION_KEY` | 32-byte hex key for data encryption |
| `ENCRYPTION_IV` | 16-byte hex IV for data encryption |

### Environment Variables (Railway Frontend)

| Variable | Description |
|----------|-------------|
| `VITE_API_BASE_URL` | Points to backend API base URL |
| `VITE_API_URL` | Points to backend root URL |
| `NODE_ENV` | `production` |

---

## 🚀 Deployment Architecture

```
GitHub (main branch)
       │
       ▼  (auto-deploy on push)
┌──────────────────────────────────────────────┐
│                  Railway                      │
│                                               │
│  ┌─────────────┐  ┌──────────────────────┐   │
│  │   Frontend   │  │      Backend         │   │
│  │   (Nginx)    │  │   (Node.js/Express)  │   │
│  │   Port: 80   │  │   Port: 3000         │   │
│  └─────────────┘  └──────────┬───────────┘   │
│                               │               │
│                    ┌──────────▼───────────┐   │
│                    │    MySQL Database     │   │
│                    │    (Railway Plugin)   │   │
│                    └──────────────────────┘   │
└──────────────────────────────────────────────┘
```

### Auto-Deploy Flow

1. Push code to `main` branch on GitHub
2. Railway detects the push automatically
3. Backend builds via `backend/Dockerfile` (multi-stage: build TypeScript → production image)
4. Frontend builds via `frontend/Dockerfile` (multi-stage: Vite build → Nginx serve)
5. Backend runs `railway-entrypoint.sh` on startup:
   - Waits for database connection
   - Runs migrations
   - Fixes missing columns
   - Seeds initial data (if empty)
   - Starts the Node.js server
6. Frontend serves via Nginx with SPA routing
7. `inject-env.sh` replaces `config.js` at runtime with production API URLs

---

## 🧪 Quick API Test Commands

### Health Check
```bash
curl https://schoolmanagementsystem-production-4bb7.up.railway.app/health
```

### Login (School Admin)
```bash
curl -X POST https://schoolmanagementsystem-production-4bb7.up.railway.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin_school","password":"Admin@123"}'
```

### Get Users (with token)
```bash
TOKEN="<access_token_from_login>"
curl https://schoolmanagementsystem-production-4bb7.up.railway.app/api/v1/users?limit=10 \
  -H "Authorization: Bearer $TOKEN"
```

### Get Students
```bash
curl https://schoolmanagementsystem-production-4bb7.up.railway.app/api/v1/students?limit=10 \
  -H "Authorization: Bearer $TOKEN"
```

---

## ⚠️ Important Notes

1. **Do NOT commit secrets** — JWT secrets, encryption keys, and database URLs are stored in Railway environment variables, never in source code.
2. **Rate limiting** — After 5 failed login attempts, the account is locked for 15 minutes. If this happens, wait or reset `failed_login_attempts` in the database.
3. **Municipality slug** — All authenticated routes are prefixed with the municipality code (e.g., `/KMC/`). This is determined by the user's `municipalityCode` field.
4. **Password policy** — Passwords must be at least 8 characters with uppercase, lowercase, number, and special character.
5. **Session handling** — If the access token expires, the frontend automatically uses the refresh token to get a new one. If both expire, the user is redirected to the login page.

---

*Generated from Railway production database — all credentials verified active.*
