# School Management System - System Documentation

**Version:** 1.0.0  
**Developed by:** Nepex Creation  
**Last Updated:** February 2026

---

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Installation & Setup](#installation--setup)
5. [Configuration](#configuration)
6. [Database Schema](#database-schema)
7. [API Documentation](#api-documentation)
8. [Security](#security)
9. [Deployment](#deployment)
10. [Maintenance](#maintenance)
11. [Troubleshooting](#troubleshooting)

---

## System Overview

The School Management System is a comprehensive web-based application designed specifically for Nepal's education system. It provides complete management of academic, administrative, and financial operations for schools.

### Key Features

- **Multi-language Support**: English and Nepali (नेपाली)
- **Bikram Sambat Calendar**: Native support for BS dates
- **Role-based Access Control**: Admin, Teacher, Student, Parent portals
- **Offline Capability**: PWA with offline data sync
- **Real-time Communication**: Socket.IO for live updates
- **Payment Integration**: eSewa, Khalti, IME Pay support
- **Document Management**: Secure file storage and versioning
- **Certificate Generation**: Automated certificate creation with QR verification
- **Audit Logging**: Complete activity tracking
- **Backup System**: Automated database backups

---

## Architecture

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Client Layer                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Browser    │  │    Mobile    │  │   Tablet     │      │
│  │   (React)    │  │    (PWA)     │  │    (PWA)     │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   Application Layer                          │
│  ┌──────────────────────────────────────────────────────┐   │
│  │              Node.js + Express API                   │   │
│  │  ┌────────────┐  ┌────────────┐  ┌────────────┐    │   │
│  │  │   Auth     │  │  Business  │  │  Socket.IO │    │   │
│  │  │ Middleware │  │   Logic    │  │   Server   │    │   │
│  │  └────────────┘  └────────────┘  └────────────┘    │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Data Layer                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │    MySQL     │  │    Redis     │  │  File System │      │
│  │   Database   │  │    Cache     │  │   Storage    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

### Frontend Architecture

- **Framework**: React 18 with TypeScript
- **State Management**: Redux Toolkit
- **Routing**: React Router v6
- **UI Library**: Material-UI (MUI) v5
- **Forms**: React Hook Form + Yup validation
- **Charts**: Recharts
- **Date Handling**: date-fns + nepali-date-converter
- **Internationalization**: i18next
- **PWA**: Workbox for service workers

### Backend Architecture

- **Framework**: Node.js + Express + TypeScript
- **ORM**: Sequelize
- **Authentication**: JWT (Access + Refresh tokens)
- **Real-time**: Socket.IO
- **Validation**: Express Validator
- **Documentation**: Swagger/OpenAPI
- **Testing**: Jest + Supertest

---

## Technology Stack

### Frontend
```json
{
  "react": "^18.2.0",
  "typescript": "^5.0.0",
  "@mui/material": "^5.14.0",
  "@reduxjs/toolkit": "^1.9.5",
  "react-router-dom": "^6.14.0",
  "axios": "^1.4.0",
  "i18next": "^23.2.0",
  "recharts": "^2.7.0",
  "vite": "^5.0.0"
}
```

### Backend
```json
{
  "express": "^4.18.2",
  "typescript": "^5.0.0",
  "sequelize": "^6.32.0",
  "mysql2": "^3.5.0",
  "jsonwebtoken": "^9.0.1",
  "socket.io": "^4.7.0",
  "bcrypt": "^5.1.0",
  "winston": "^3.10.0"
}
```

---

## Installation & Setup

### Prerequisites

- Node.js >= 18.x
- MySQL >= 8.0
- Redis >= 6.0 (optional, for caching)
- npm or yarn

### Backend Setup

```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Copy environment file
copy .env.example .env

# Configure database credentials in .env
# DB_HOST=localhost
# DB_PORT=3306
# DB_NAME=school_management_system
# DB_USER=root
# DB_PASSWORD=your_password

# Run migrations
npm run migrate

# Seed database with default data
npm run seed

# Start development server
npm run dev
```

### Frontend Setup

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

### Access the Application

- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- API Documentation: http://localhost:3000/api/v1/docs

### Default Credentials

```
Admin:
  Username: admin
  Password: Admin@123

Teacher:
  Username: teacher1
  Password: Teacher@123

Student:
  Username: student1
  Password: Student@123

Parent:
  Username: parent1
  Password: Parent@123
```

---

## Configuration

### Environment Variables

#### Backend (.env)

```env
# Application
NODE_ENV=development
PORT=3000
API_BASE_URL=http://localhost:3000/api/v1

# Database
DB_HOST=localhost
DB_PORT=3306
DB_NAME=school_management_system
DB_USER=root
DB_PASSWORD=your_password

# Redis (Optional)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=

# Security
JWT_SECRET=your_jwt_secret_min_32_chars
JWT_REFRESH_SECRET=your_refresh_secret_min_32_chars
JWT_ACCESS_EXPIRY=30m
JWT_REFRESH_EXPIRY=7d
ENCRYPTION_KEY=your_64_char_hex_encryption_key

# CORS
ALLOWED_ORIGINS=http://localhost:3000,http://localhost:5173

# Payment Gateways (Nepal)
ESEWA_MERCHANT_ID=your_esewa_merchant_id
ESEWA_SECRET_KEY=your_esewa_secret
KHALTI_PUBLIC_KEY=your_khalti_public_key
KHALTI_SECRET_KEY=your_khalti_secret_key

# SMS Gateway (Nepal)
SMS_PROVIDER=sparrow
SPARROW_SMS_TOKEN=your_sparrow_token

# Backup
BACKUP_ENABLED=true
BACKUP_SCHEDULE=0 2 * * *
BACKUP_RETENTION_DAYS=30
```

#### Frontend (.env)

```env
VITE_API_URL=http://localhost:3000/api/v1
VITE_SOCKET_URL=http://localhost:3000
VITE_APP_NAME=School Management System
```

---

## Database Schema

### Core Tables

#### users
- id, username, password_hash, email, role
- first_name, last_name, phone
- is_active, last_login
- password_reset_token, password_reset_expires
- created_at, updated_at

#### students
- id, user_id, student_id, roll_number
- class_id, section_id, admission_date
- date_of_birth, gender, blood_group
- address, guardian_name, guardian_phone
- status (active/inactive/transferred/graduated)

#### staff
- id, user_id, staff_id, designation
- department, qualification, experience
- joining_date, salary, status

#### classes
- id, name, grade_level, section
- class_teacher_id, room_number
- academic_year_id

#### subjects
- id, name, code, credit_hours
- class_id, teacher_id

#### attendance
- id, student_id, class_id, date
- status (present/absent/late/excused)
- marked_by, remarks

#### examinations
- id, name, exam_type, class_id
- start_date, end_date, total_marks
- academic_year_id

#### grades
- id, exam_id, student_id, subject_id
- obtained_marks, grade, gpa

#### fee_structure
- id, class_id, fee_type, amount
- due_date, academic_year_id

#### invoices
- id, student_id, fee_structure_id
- amount, due_date, status

#### payments
- id, invoice_id, amount, payment_date
- payment_method, transaction_id
- receipt_number

#### certificates
- id, student_id, certificate_type
- certificate_number, issued_date
- qr_code, status, issued_by

#### audit_logs
- id, user_id, action, entity_type
- entity_id, old_values, new_values
- ip_address, user_agent, timestamp

---

## API Documentation

### Authentication Endpoints

```
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
POST   /api/v1/auth/refresh
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password
GET    /api/v1/auth/me
```

### Student Endpoints

```
GET    /api/v1/students
POST   /api/v1/students
GET    /api/v1/students/:id
PUT    /api/v1/students/:id
DELETE /api/v1/students/:id
GET    /api/v1/students/:id/attendance
GET    /api/v1/students/:id/grades
GET    /api/v1/students/:id/fees
```

### Staff Endpoints

```
GET    /api/v1/staff
POST   /api/v1/staff
GET    /api/v1/staff/:id
PUT    /api/v1/staff/:id
DELETE /api/v1/staff/:id
```

### Attendance Endpoints

```
GET    /api/v1/attendance
POST   /api/v1/attendance/mark
GET    /api/v1/attendance/report
GET    /api/v1/attendance/class/:classId
```

### Examination Endpoints

```
GET    /api/v1/examinations
POST   /api/v1/examinations
GET    /api/v1/examinations/:id
PUT    /api/v1/examinations/:id
POST   /api/v1/examinations/:id/grades
GET    /api/v1/examinations/:id/report-card/:studentId
```

### Finance Endpoints

```
GET    /api/v1/finance/invoices
POST   /api/v1/finance/invoices
GET    /api/v1/finance/payments
POST   /api/v1/finance/payments
GET    /api/v1/finance/reports
```

### Certificate Endpoints

```
GET    /api/v1/certificates
POST   /api/v1/certificates/generate
POST   /api/v1/certificates/bulk-generate
GET    /api/v1/certificates/:id
GET    /api/v1/certificates/verify/:certificateNumber
```

For complete API documentation, visit: http://localhost:3000/api/v1/docs

---

## Security

### Authentication & Authorization

- **JWT-based authentication** with access and refresh tokens
- **Role-based access control** (RBAC) with permissions
- **Password hashing** using bcrypt (10 rounds)
- **Password policies**: Minimum 8 characters, complexity requirements
- **Session management**: Refresh token rotation
- **Account lockout**: After 5 failed login attempts

### Data Security

- **Encryption at rest**: Sensitive data encrypted using AES-256
- **Encryption in transit**: HTTPS/TLS for all communications
- **SQL injection prevention**: Parameterized queries via Sequelize
- **XSS protection**: Input sanitization and output encoding
- **CSRF protection**: CSRF tokens for state-changing operations
- **Rate limiting**: API rate limits to prevent abuse

### Audit & Compliance

- **Audit logging**: All critical operations logged
- **Data retention**: Configurable retention policies
- **Backup encryption**: Encrypted database backups
- **Access logs**: Complete access history tracking

---

## Deployment

### Production Deployment

#### Using PM2 (Recommended)

```bash
# Install PM2 globally
npm install -g pm2

# Backend deployment
cd backend
npm run build
pm2 start dist/server.js --name school-api

# Frontend deployment
cd frontend
npm run build
# Serve build folder using nginx or apache
```

#### Using Docker

```bash
# Build and run with Docker Compose
docker-compose up -d
```

### Nginx Configuration

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    # Frontend
    location / {
        root /var/www/school-frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Socket.IO
    location /socket.io {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

---

## Maintenance

### Database Backups

Automated backups run daily at 2 AM (configurable):

```bash
# Manual backup
npm run backup

# Restore from backup
npm run restore -- --file=backup-2026-02-15.sql
```

### Log Management

Logs are stored in `backend/logs/`:
- `combined.log`: All logs
- `error.log`: Error logs only
- `security-audit.log`: Security events

### Updates & Patches

```bash
# Check for updates
npm outdated

# Update dependencies
npm update

# Run tests after updates
npm test
```

---

## Troubleshooting

### Common Issues

#### Database Connection Failed

```
Error: ER_ACCESS_DENIED_ERROR
```

**Solution**: Check database credentials in `.env` file

#### Redis Connection Warning

```
Redis not available for rate limiting, using memory store
```

**Solution**: This is a warning, not an error. Install and start Redis if needed:
```bash
# Windows (using Chocolatey)
choco install redis-64
redis-server
```

#### Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::3000
```

**Solution**: Kill the process using the port or change PORT in `.env`

#### CORS Errors

```
Access to XMLHttpRequest blocked by CORS policy
```

**Solution**: Add frontend URL to `ALLOWED_ORIGINS` in backend `.env`

### Performance Optimization

1. **Enable Redis caching** for frequently accessed data
2. **Database indexing** on commonly queried fields
3. **Image optimization** before upload
4. **CDN usage** for static assets in production
5. **Database query optimization** using explain plans

### Support

For technical support:
- Email: support@nepexcreation.com
- Documentation: https://docs.nepexcreation.com
- GitHub Issues: https://github.com/nepexcreation/school-system/issues

---

## License

Copyright © 2026 Nepex Creation. All rights reserved.

---

**Document Version**: 1.0.0  
**Last Updated**: February 15, 2026
