# Design Document: School Management System (Node.js + React.js)
# Optimized for Nepal Education System (Class 1-12)

## Overview

This design document specifies the technical architecture and implementation details for a comprehensive School Management System built with Node.js (backend) and React.js (frontend). The system is specifically optimized for Nepal's education system, supporting Classes 1-12 with full NEB (National Examination Board) compliance, Bikram Sambat calendar integration, and Nepal-specific payment gateways.

### System Goals

- **NEB Compliance**: Full support for Nepal's grading system, SEE and NEB examinations
- **Offline-First**: Critical operations work without internet connectivity
- **Low-Bandwidth**: Optimized for 2G/3G networks common in Nepal
- **Bilingual**: Complete Nepali and English language support
- **Comprehensive**: 17+ modules covering all school operations
- **Role-Based**: 13 distinct user roles with granular permissions
- **Payment Integration**: eSewa, Khalti, and IME Pay support

### Technology Stack

**Backend:**
- Runtime: Node.js 18+ LTS
- Framework: Express.js 4.x (modular monolith architecture)
- Database: MySQL 8.0+ with InnoDB engine
- Cache: Redis 7.x for sessions and frequently accessed data
- Authentication: JWT with refresh token mechanism
- Real-time: Socket.IO for WebSocket connections
- File Storage: Local filesystem with optional S3-compatible cloud storage
- API Documentation: Swagger/OpenAPI 3.0
- Push Notifications: Firebase Cloud Messaging (FCM)

**Frontend:**
- Framework: React.js 18+ with TypeScript 5.x
- State Management: Redux Toolkit with RTK Query
- UI Framework: Material-UI (MUI) v5 with custom Nepal-focused theme
- Routing: React Router v6 with role-based guards
- API Client: Axios with interceptors
- Real-time: Socket.IO client
- PWA: Service Workers with Workbox
- Forms: React Hook Form with Yup validation
- Charts: Recharts for analytics
- Date Handling: Custom BS/AD calendar library

**DevOps:**
- Containerization: Docker and Docker Compose
- Web Server: Nginx as reverse proxy
- CI/CD: GitHub Actions
- Monitoring: Winston for logging with file rotation
- Hosting: DigitalOcean or local Nepal-based servers


## Architecture

### System Architecture Overview

The system follows a **modular monolith architecture** - a single deployable application organized into domain-specific modules with clear boundaries. This approach provides simplicity of deployment while maintaining code organization and the option for future service extraction if needed.

```
┌─────────────────────────────────────────────────────────────────┐
│                         Client Layer                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │  Admin   │  │ Teacher  │  │ Student  │  │  Parent  │  ...  │
│  │  Portal  │  │  Portal  │  │  Portal  │  │  Portal  │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
│       React.js 18+ with TypeScript (PWA)                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                         HTTPS/WSS
                              │
┌─────────────────────────────────────────────────────────────────┐
│                      API Gateway Layer                           │
│                    Nginx (Reverse Proxy)                         │
│              Rate Limiting, SSL Termination                      │
└─────────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                    Application Layer                             │
│                  Node.js + Express.js                            │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │              Middleware Stack                             │  │
│  │  • Authentication (JWT)                                   │  │
│  │  • Authorization (RBAC)                                   │  │
│  │  • Request Validation                                     │  │
│  │  • Error Handling                                         │  │
│  │  • Logging                                                │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                  Domain Modules                          │   │
│  │  ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐         │   │
│  │  │ Auth │ │Acad. │ │Stud. │ │Staff │ │Attend│  ...    │   │
│  │  └──────┘ └──────┘ └──────┘ └──────┘ └──────┘         │   │
│  │  Each module: Controller → Service → Repository         │   │
│  └─────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        │                     │                     │
┌───────────────┐    ┌────────────────┐    ┌──────────────┐
│  MySQL 8.0+   │    │   Redis 7.x    │    │ File Storage │
│   Database    │    │     Cache      │    │   (Local)    │
└───────────────┘    └────────────────┘    └──────────────┘
```

### Module Organization

Each backend module follows a consistent structure:

```
src/modules/{module-name}/
├── {module}.controller.ts    # HTTP request handlers
├── {module}.service.ts       # Business logic
├── {module}.repository.ts    # Database operations
├── {module}.validation.ts    # Input validation schemas
├── {module}.routes.ts        # Route definitions
├── {module}.types.ts         # TypeScript interfaces
└── __tests__/                # Unit and integration tests
```

### Core Modules

1. **Auth Module**: Authentication, authorization, JWT management, password reset
2. **Academic Module**: Classes, subjects, timetables, syllabus, academic years
3. **Student Module**: Student records, enrollment, admission workflow, promotion
4. **Staff Module**: Staff records, assignments, leave management
5. **Attendance Module**: Student/staff attendance, biometric integration, offline sync
6. **Examination Module**: Exam creation, grading, NEB-compliant report cards
7. **Finance Module**: Fee management, payment processing, Nepal payment gateways
8. **Library Module**: Book catalog, circulation, reservations, fines
9. **Transport Module**: Routes, vehicles, GPS tracking (Phase 3)
10. **Hostel Module**: Room allocation, hostel attendance (Phase 3)
11. **ECA Module**: Extra-curricular activities, participation tracking
12. **Sports Module**: Sports management, tournaments, achievements
13. **Notification Module**: Real-time notifications, SMS, email
14. **Communication Module**: Messaging, announcements
15. **Document Module**: File storage, document management
16. **Certificate Module**: Certificate generation with templates
17. **Report Module**: Dashboard data, analytics, report generation

### Frontend Architecture

The frontend is organized as a Single Page Application (SPA) with role-based routing:

```
src/
├── features/              # Feature-based organization
│   ├── auth/
│   ├── student/
│   ├── attendance/
│   ├── examination/
│   └── ...
├── components/            # Shared components
│   ├── common/
│   ├── forms/
│   ├── layouts/
│   └── charts/
├── store/                 # Redux store configuration
│   ├── slices/
│   └── api/              # RTK Query API definitions
├── hooks/                 # Custom React hooks
├── utils/                 # Utility functions
│   ├── calendar.ts       # BS/AD conversion
│   ├── neb-grading.ts    # NEB grade calculations
│   └── validators.ts
├── services/              # API service layer
├── types/                 # TypeScript type definitions
└── App.tsx
```

### Data Flow

1. **Request Flow**: User Action → React Component → Redux Action → RTK Query → API Call → Backend Controller → Service → Repository → Database
2. **Response Flow**: Database → Repository → Service → Controller → API Response → RTK Query Cache → Redux State → React Component → UI Update
3. **Real-time Flow**: Backend Event → Socket.IO → Frontend Listener → Redux Action → UI Update

### Security Architecture

**Authentication Flow:**
1. User submits credentials
2. Backend validates and generates JWT access token (30 min) + refresh token (7 days)
3. Tokens stored in httpOnly cookies (access) and localStorage (refresh)
4. Every API request includes access token in Authorization header
5. Expired access tokens refreshed using refresh token
6. Logout invalidates both tokens

**Authorization:**
- Role-Based Access Control (RBAC) enforced at API level
- Each endpoint checks user role and permissions
- Frontend routes protected by role guards
- Sensitive operations require additional validation

**Data Protection:**
- All communications over HTTPS/TLS
- Passwords hashed with bcrypt (cost factor 12)
- SQL injection prevention via parameterized queries
- XSS protection via input sanitization and Content Security Policy
- CSRF protection via SameSite cookies and CSRF tokens
- Rate limiting: 100 requests/minute per user


## Components and Interfaces

### Backend API Structure

All API endpoints follow RESTful conventions with consistent patterns:

**Base URL**: `/api/v1`

**Standard Response Format:**
```typescript
// Success Response
{
  success: true,
  data: T,
  message?: string,
  meta?: {
    page: number,
    limit: number,
    total: number,
    totalPages: number
  }
}

// Error Response
{
  success: false,
  error: {
    code: string,
    message: string,
    details?: any
  }
}
```

### Auth Module API

**Endpoints:**

```typescript
POST   /api/v1/auth/login
POST   /api/v1/auth/logout
POST   /api/v1/auth/refresh
POST   /api/v1/auth/forgot-password
POST   /api/v1/auth/reset-password
POST   /api/v1/auth/change-password
GET    /api/v1/auth/me
```

**Key Interfaces:**

```typescript
interface LoginRequest {
  username: string;      // Email or student/staff ID
  password: string;
  rememberMe?: boolean;
}

interface LoginResponse {
  user: User;
  accessToken: string;
  refreshToken: string;
}

interface User {
  id: string;
  username: string;
  email: string;
  role: UserRole;
  permissions: Permission[];
  profile: UserProfile;
}

enum UserRole {
  SCHOOL_ADMIN = 'school_admin',
  SUBJECT_TEACHER = 'subject_teacher',
  CLASS_TEACHER = 'class_teacher',
  DEPARTMENT_HEAD = 'department_head',
  ECA_COORDINATOR = 'eca_coordinator',
  SPORTS_COORDINATOR = 'sports_coordinator',
  STUDENT = 'student',
  PARENT = 'parent',
  LIBRARIAN = 'librarian',
  ACCOUNTANT = 'accountant',
  TRANSPORT_MANAGER = 'transport_manager',
  HOSTEL_WARDEN = 'hostel_warden',
  NON_TEACHING_STAFF = 'non_teaching_staff'
}
```

### Student Module API

**Endpoints:**

```typescript
GET    /api/v1/students                    # List with filters
POST   /api/v1/students                    # Create student
GET    /api/v1/students/:id                # Get student details
PUT    /api/v1/students/:id                # Update student
DELETE /api/v1/students/:id                # Soft delete
POST   /api/v1/students/bulk-import        # Excel import
GET    /api/v1/students/:id/attendance     # Student attendance
GET    /api/v1/students/:id/grades         # Student grades
GET    /api/v1/students/:id/fees           # Fee details
POST   /api/v1/students/:id/promote        # Promote to next class
POST   /api/v1/students/:id/transfer       # Transfer section
GET    /api/v1/students/:id/cv             # Generate CV
POST   /api/v1/students/:id/documents      # Upload documents
```

**Key Interfaces:**

```typescript
interface Student {
  id: string;
  studentId: string;              // School-generated unique ID
  symbolNumber?: string;          // For SEE students
  nebRegistrationNumber?: string; // For Class 11-12
  
  // Personal Information
  firstNameEn: string;
  middleNameEn?: string;
  lastNameEn: string;
  firstNameNp: string;
  middleNameNp?: string;
  lastNameNp: string;
  
  dateOfBirthBS: string;          // YYYY-MM-DD format
  dateOfBirthAD: string;
  gender: 'male' | 'female' | 'other';
  bloodGroup?: string;
  
  // Contact Information
  addressEn: string;
  addressNp: string;
  phone?: string;
  email?: string;
  
  // Guardian Information
  fatherName: string;
  fatherPhone: string;
  fatherCitizenshipNo?: string;
  motherName: string;
  motherPhone: string;
  motherCitizenshipNo?: string;
  localGuardianName?: string;
  localGuardianPhone?: string;
  localGuardianRelation?: string;
  
  // Academic Information
  admissionDate: string;
  admissionClass: number;
  currentClass: number;
  currentSection: string;
  currentShift: 'morning' | 'day' | 'evening';
  rollNumber: number;
  previousSchool?: string;
  
  // Health Information
  allergies?: string;
  medicalConditions?: string;
  emergencyContact: string;
  
  // Status
  status: 'active' | 'inactive' | 'transferred' | 'graduated';
  
  // Metadata
  photoUrl?: string;
  documents: Document[];
  createdAt: Date;
  updatedAt: Date;
}

interface StudentAdmission {
  id: string;
  inquiryDate: Date;
  applicationDate?: Date;
  admissionTestDate?: Date;
  admissionTestScore?: number;
  interviewDate?: Date;
  interviewFeedback?: string;
  status: 'inquiry' | 'applied' | 'test_scheduled' | 'interviewed' | 'admitted' | 'rejected';
  studentData: Partial<Student>;
  documentsVerified: boolean;
  applicationFee?: number;
  applicationFeePaid: boolean;
}
```

### Academic Module API

**Endpoints:**

```typescript
// Academic Years
GET    /api/v1/academic/years
POST   /api/v1/academic/years
GET    /api/v1/academic/years/:id
PUT    /api/v1/academic/years/:id

// Classes
GET    /api/v1/academic/classes
POST   /api/v1/academic/classes
GET    /api/v1/academic/classes/:id
PUT    /api/v1/academic/classes/:id

// Subjects
GET    /api/v1/academic/subjects
POST   /api/v1/academic/subjects
GET    /api/v1/academic/subjects/:id
PUT    /api/v1/academic/subjects/:id

// Timetable
GET    /api/v1/academic/timetable
POST   /api/v1/academic/timetable
GET    /api/v1/academic/timetable/:classId
PUT    /api/v1/academic/timetable/:id

// Syllabus
GET    /api/v1/academic/syllabus/:subjectId
POST   /api/v1/academic/syllabus
PUT    /api/v1/academic/syllabus/:id
```

**Key Interfaces:**

```typescript
interface AcademicYear {
  id: string;
  name: string;                   // e.g., "2081-2082 BS"
  startDateBS: string;
  endDateBS: string;
  startDateAD: string;
  endDateAD: string;
  isCurrent: boolean;
  terms: Term[];
}

interface Term {
  id: string;
  name: string;                   // First Terminal, Second Terminal, Final
  startDate: string;
  endDate: string;
  examStartDate?: string;
  examEndDate?: string;
}

interface Class {
  id: string;
  gradeLevel: number;             // 1-12
  section: string;                // A, B, C, etc.
  shift: 'morning' | 'day' | 'evening';
  classTeacherId: string;
  capacity: number;
  currentStrength: number;
  academicYearId: string;
}

interface Subject {
  id: string;
  code: string;
  nameEn: string;
  nameNp: string;
  type: 'compulsory' | 'optional';
  creditHours: number;
  theoryMarks: number;
  practicalMarks: number;
  passMarks: number;
  fullMarks: number;
  applicableClasses: number[];    // [11, 12] for optional subjects
  stream?: 'science' | 'management' | 'humanities' | 'technical';
}

interface Timetable {
  id: string;
  classId: string;
  dayOfWeek: number;              // 0-6 (Sunday-Saturday)
  periods: Period[];
}

interface Period {
  periodNumber: number;
  startTime: string;              // HH:mm format
  endTime: string;
  subjectId: string;
  teacherId: string;
  roomNumber?: string;
}

interface Syllabus {
  id: string;
  subjectId: string;
  classId: string;
  topics: SyllabusTopic[];
}

interface SyllabusTopic {
  id: string;
  title: string;
  description?: string;
  estimatedHours: number;
  completedHours: number;
  status: 'not_started' | 'in_progress' | 'completed';
  completedDate?: string;
}
```

### Attendance Module API

**Endpoints:**

```typescript
// Student Attendance
POST   /api/v1/attendance/student/mark      # Mark attendance
GET    /api/v1/attendance/student/:classId  # Get class attendance
GET    /api/v1/attendance/student/report    # Attendance report
POST   /api/v1/attendance/student/bulk      # Bulk import
POST   /api/v1/attendance/student/sync      # Offline sync

// Staff Attendance
POST   /api/v1/attendance/staff/mark
GET    /api/v1/attendance/staff/report

// Leave Management
POST   /api/v1/attendance/leave/apply
GET    /api/v1/attendance/leave/pending
PUT    /api/v1/attendance/leave/:id/approve
```

**Key Interfaces:**

```typescript
interface AttendanceRecord {
  id: string;
  studentId: string;
  classId: string;
  date: string;                   // YYYY-MM-DD
  dateBS: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  periodNumber?: number;          // For period-wise attendance
  markedBy: string;               // Teacher ID
  markedAt: Date;
  remarks?: string;
  syncStatus?: 'synced' | 'pending' | 'error';
}

interface AttendanceSummary {
  studentId: string;
  totalDays: number;
  presentDays: number;
  absentDays: number;
  lateDays: number;
  excusedDays: number;
  attendancePercentage: number;
}

interface LeaveApplication {
  id: string;
  studentId: string;
  startDate: string;
  endDate: string;
  reason: string;
  appliedBy: string;              // Student or Parent ID
  appliedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  approvedBy?: string;
  approvedAt?: Date;
  remarks?: string;
}
```

### Examination Module API

**Endpoints:**

```typescript
// Exams
GET    /api/v1/exams
POST   /api/v1/exams
GET    /api/v1/exams/:id
PUT    /api/v1/exams/:id
DELETE /api/v1/exams/:id

// Exam Schedule
POST   /api/v1/exams/:id/schedule
GET    /api/v1/exams/:id/schedule

// Grade Entry
POST   /api/v1/exams/:id/grades
POST   /api/v1/exams/:id/grades/bulk
GET    /api/v1/exams/:id/grades/:studentId

// Report Cards
GET    /api/v1/exams/report-card/:studentId
GET    /api/v1/exams/marksheet/:studentId
GET    /api/v1/exams/aggregate/:studentId    # For Class 11-12

// Online Exams (Phase 2)
POST   /api/v1/exams/online
GET    /api/v1/exams/online/:id/start
POST   /api/v1/exams/online/:id/submit
GET    /api/v1/exams/online/:id/results
```

**Key Interfaces:**

```typescript
interface Exam {
  id: string;
  name: string;
  type: 'unit_test' | 'first_terminal' | 'second_terminal' | 'final' | 'practical' | 'project';
  subjectId: string;
  classId: string;
  academicYearId: string;
  termId: string;
  examDate: string;
  duration: number;               // Minutes
  fullMarks: number;
  passMarks: number;
  theoryMarks: number;
  practicalMarks: number;
  weightage: number;              // Percentage for final grade calculation
  status: 'scheduled' | 'ongoing' | 'completed' | 'cancelled';
}

interface ExamSchedule {
  examId: string;
  subjectId: string;
  date: string;
  startTime: string;
  endTime: string;
  roomNumber: string;
  invigilators: string[];         // Teacher IDs
}

interface Grade {
  id: string;
  examId: string;
  studentId: string;
  theoryMarks?: number;
  practicalMarks?: number;
  totalMarks: number;
  grade: NEBGrade;
  gradePoint: number;
  remarks?: string;
  enteredBy: string;
  enteredAt: Date;
}

enum NEBGrade {
  A_PLUS = 'A+',
  A = 'A',
  B_PLUS = 'B+',
  B = 'B',
  C_PLUS = 'C+',
  C = 'C',
  D = 'D',
  NG = 'NG'
}

interface ReportCard {
  studentId: string;
  academicYearId: string;
  termId: string;
  subjects: SubjectGrade[];
  termGPA: number;
  cumulativeGPA: number;
  rank: number;
  totalStudents: number;
  attendance: AttendanceSummary;
  remarks: string;
  generatedAt: Date;
}

interface SubjectGrade {
  subjectId: string;
  subjectName: string;
  creditHours: number;
  theoryMarks: number;
  practicalMarks: number;
  totalMarks: number;
  fullMarks: number;
  grade: NEBGrade;
  gradePoint: number;
}
```


### Finance Module API

**Endpoints:**

```typescript
// Fee Structures
GET    /api/v1/finance/fee-structures
POST   /api/v1/finance/fee-structures
GET    /api/v1/finance/fee-structures/:id
PUT    /api/v1/finance/fee-structures/:id

// Invoices
GET    /api/v1/finance/invoices
POST   /api/v1/finance/invoices
POST   /api/v1/finance/invoices/bulk-generate
GET    /api/v1/finance/invoices/:id
PUT    /api/v1/finance/invoices/:id

// Payments
POST   /api/v1/finance/payments
GET    /api/v1/finance/payments/:id
GET    /api/v1/finance/payments/student/:studentId

// Payment Gateway Integration
POST   /api/v1/finance/payment-gateway/initiate
POST   /api/v1/finance/payment-gateway/callback
POST   /api/v1/finance/payment-gateway/verify

// Reports
GET    /api/v1/finance/reports/collection
GET    /api/v1/finance/reports/pending
GET    /api/v1/finance/reports/defaulters
```

**Key Interfaces:**

```typescript
interface FeeStructure {
  id: string;
  name: string;
  applicableClasses: number[];
  applicableShifts: string[];
  feeComponents: FeeComponent[];
  totalAmount: number;
  academicYearId: string;
  isActive: boolean;
}

interface FeeComponent {
  id: string;
  name: string;
  type: 'admission' | 'annual' | 'monthly' | 'exam' | 'transport' | 'hostel' | 'library' | 'lab' | 'eca' | 'development';
  amount: number;
  frequency: 'one_time' | 'monthly' | 'quarterly' | 'annual';
  isMandatory: boolean;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  studentId: string;
  feeStructureId: string;
  academicYearId: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotal: number;
  discount: number;
  discountReason?: string;
  totalAmount: number;
  paidAmount: number;
  balance: number;
  status: 'pending' | 'partial' | 'paid' | 'overdue' | 'cancelled';
  generatedAt: Date;
}

interface InvoiceItem {
  feeComponentId: string;
  description: string;
  amount: number;
}

interface Payment {
  id: string;
  receiptNumber: string;
  invoiceId: string;
  studentId: string;
  amount: number;
  paymentMethod: 'cash' | 'bank_transfer' | 'esewa' | 'khalti' | 'ime_pay';
  paymentDate: string;
  transactionId?: string;         // For online payments
  gatewayResponse?: any;
  receivedBy: string;             // Accountant ID
  remarks?: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  createdAt: Date;
}

interface PaymentGatewayRequest {
  invoiceId: string;
  amount: number;
  gateway: 'esewa' | 'khalti' | 'ime_pay';
  returnUrl: string;
  cancelUrl: string;
}

interface PaymentGatewayCallback {
  gateway: 'esewa' | 'khalti' | 'ime_pay';
  transactionId: string;
  amount: number;
  status: 'success' | 'failed';
  signature: string;
  rawResponse: any;
}
```

### Library Module API

**Endpoints:**

```typescript
// Books
GET    /api/v1/library/books
POST   /api/v1/library/books
GET    /api/v1/library/books/:id
PUT    /api/v1/library/books/:id
DELETE /api/v1/library/books/:id

// Circulation
POST   /api/v1/library/issue
POST   /api/v1/library/return
GET    /api/v1/library/issued
GET    /api/v1/library/overdue

// Reservations
POST   /api/v1/library/reserve
GET    /api/v1/library/reservations
PUT    /api/v1/library/reservations/:id/cancel

// Fines
GET    /api/v1/library/fines/:studentId
POST   /api/v1/library/fines/:id/pay
```

**Key Interfaces:**

```typescript
interface Book {
  id: string;
  accessionNumber: string;
  isbn?: string;
  title: string;
  author: string;
  publisher?: string;
  publicationYear?: number;
  category: 'textbook' | 'reference' | 'fiction' | 'magazine' | 'newspaper';
  language: 'nepali' | 'english' | 'other';
  totalCopies: number;
  availableCopies: number;
  shelfLocation: string;
  price?: number;
  addedDate: Date;
}

interface Circulation {
  id: string;
  bookId: string;
  studentId: string;
  issueDate: string;
  dueDate: string;
  returnDate?: string;
  status: 'issued' | 'returned' | 'overdue';
  issuedBy: string;               // Librarian ID
  returnedTo?: string;
  fineAmount: number;
  finePaid: boolean;
  remarks?: string;
}

interface Reservation {
  id: string;
  bookId: string;
  studentId: string;
  reservedDate: Date;
  status: 'pending' | 'available' | 'issued' | 'cancelled' | 'expired';
  notifiedAt?: Date;
  expiresAt: Date;
}

interface LibraryFine {
  id: string;
  circulationId: string;
  studentId: string;
  amount: number;
  reason: string;
  status: 'pending' | 'paid' | 'waived';
  paidDate?: Date;
  paidAmount?: number;
}
```

### Notification Module API

**Endpoints:**

```typescript
// Notifications
GET    /api/v1/notifications
GET    /api/v1/notifications/unread-count
PUT    /api/v1/notifications/:id/read
PUT    /api/v1/notifications/mark-all-read
DELETE /api/v1/notifications/:id

// SMS
POST   /api/v1/notifications/sms/send
POST   /api/v1/notifications/sms/bulk
GET    /api/v1/notifications/sms/history

// Push Notifications
POST   /api/v1/notifications/push/send
POST   /api/v1/notifications/push/subscribe
```

**Key Interfaces:**

```typescript
interface Notification {
  id: string;
  userId: string;
  type: 'info' | 'warning' | 'success' | 'error';
  category: 'attendance' | 'exam' | 'fee' | 'grade' | 'announcement' | 'leave' | 'library';
  title: string;
  message: string;
  data?: any;                     // Additional context data
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
  expiresAt?: Date;
}

interface SMSMessage {
  id: string;
  recipient: string;              // Phone number
  message: string;
  language: 'nepali' | 'english';
  status: 'pending' | 'sent' | 'failed' | 'delivered';
  gateway: 'sparrow' | 'aakash';
  gatewayMessageId?: string;
  sentAt?: Date;
  deliveredAt?: Date;
  failureReason?: string;
  cost?: number;
}
```

### Communication Module API

**Endpoints:**

```typescript
// Messages
GET    /api/v1/communication/messages
POST   /api/v1/communication/messages
GET    /api/v1/communication/messages/:conversationId
PUT    /api/v1/communication/messages/:id/read

// Announcements
GET    /api/v1/communication/announcements
POST   /api/v1/communication/announcements
GET    /api/v1/communication/announcements/:id
PUT    /api/v1/communication/announcements/:id
DELETE /api/v1/communication/announcements/:id
```

**Key Interfaces:**

```typescript
interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  recipientId: string;
  content: string;
  attachments?: Attachment[];
  isRead: boolean;
  readAt?: Date;
  sentAt: Date;
}

interface Conversation {
  id: string;
  participants: string[];         // User IDs
  lastMessage?: Message;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

interface Announcement {
  id: string;
  title: string;
  content: string;
  targetAudience: 'all' | 'students' | 'parents' | 'teachers' | 'staff';
  targetClasses?: number[];
  priority: 'low' | 'medium' | 'high';
  publishedBy: string;
  publishedAt: Date;
  expiresAt?: Date;
  attachments?: Attachment[];
}
```

### Certificate Module API

**Endpoints:**

```typescript
// Templates
GET    /api/v1/certificates/templates
POST   /api/v1/certificates/templates
GET    /api/v1/certificates/templates/:id
PUT    /api/v1/certificates/templates/:id

// Certificates
POST   /api/v1/certificates/generate
POST   /api/v1/certificates/bulk-generate
GET    /api/v1/certificates/:id
GET    /api/v1/certificates/verify/:certificateNumber
GET    /api/v1/certificates/student/:studentId
```

**Key Interfaces:**

```typescript
interface CertificateTemplate {
  id: string;
  name: string;
  type: 'character' | 'transfer' | 'academic_excellence' | 'eca' | 'sports' | 'course_completion' | 'bonafide';
  templateHtml: string;
  variables: string[];            // Dynamic fields like {{student_name}}
  isActive: boolean;
}

interface Certificate {
  id: string;
  certificateNumber: string;
  templateId: string;
  studentId: string;
  type: string;
  issuedDate: string;
  issuedDateBS: string;
  data: Record<string, any>;      // Variable values
  pdfUrl: string;
  qrCode: string;
  issuedBy: string;
  verificationUrl: string;
  status: 'active' | 'revoked';
}
```

### Report Module API

**Endpoints:**

```typescript
// Dashboard
GET    /api/v1/reports/dashboard/admin
GET    /api/v1/reports/dashboard/teacher
GET    /api/v1/reports/dashboard/student
GET    /api/v1/reports/dashboard/parent

// Reports
GET    /api/v1/reports/enrollment
GET    /api/v1/reports/attendance
GET    /api/v1/reports/examination
GET    /api/v1/reports/finance
GET    /api/v1/reports/library
```

**Key Interfaces:**

```typescript
interface DashboardData {
  summary: {
    totalStudents: number;
    totalStaff: number;
    attendanceRate: number;
    feeCollectionRate: number;
  };
  charts: {
    enrollmentTrend: ChartData[];
    attendanceTrend: ChartData[];
    feeCollection: ChartData[];
    examPerformance: ChartData[];
  };
  recentActivities: Activity[];
  alerts: Alert[];
}

interface ChartData {
  label: string;
  value: number;
  date?: string;
}

interface Activity {
  id: string;
  type: string;
  description: string;
  timestamp: Date;
  userId: string;
}

interface Alert {
  id: string;
  type: 'warning' | 'error' | 'info';
  message: string;
  actionUrl?: string;
  createdAt: Date;
}
```


## Data Models

### Database Schema Design

The system uses MySQL 8.0+ with InnoDB engine for ACID compliance and foreign key support. All tables use `id` as UUID primary key and include `created_at` and `updated_at` timestamps.

### Core Tables

**users**
```sql
CREATE TABLE users (
  id VARCHAR(36) PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role ENUM('school_admin', 'subject_teacher', 'class_teacher', 'department_head', 
            'eca_coordinator', 'sports_coordinator', 'student', 'parent', 
            'librarian', 'accountant', 'transport_manager', 'hostel_warden', 
            'non_teaching_staff') NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  last_login_at DATETIME,
  failed_login_attempts INT DEFAULT 0,
  locked_until DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username),
  INDEX idx_email (email),
  INDEX idx_role (role)
);
```

**students**
```sql
CREATE TABLE students (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) UNIQUE,
  student_id VARCHAR(50) UNIQUE NOT NULL,
  symbol_number VARCHAR(50) UNIQUE,
  neb_registration_number VARCHAR(50) UNIQUE,
  
  -- Personal Information
  first_name_en VARCHAR(100) NOT NULL,
  middle_name_en VARCHAR(100),
  last_name_en VARCHAR(100) NOT NULL,
  first_name_np VARCHAR(100) NOT NULL,
  middle_name_np VARCHAR(100),
  last_name_np VARCHAR(100) NOT NULL,
  
  date_of_birth_bs VARCHAR(10) NOT NULL,
  date_of_birth_ad DATE NOT NULL,
  gender ENUM('male', 'female', 'other') NOT NULL,
  blood_group VARCHAR(5),
  
  -- Contact Information
  address_en TEXT NOT NULL,
  address_np TEXT NOT NULL,
  phone VARCHAR(20),
  email VARCHAR(255),
  
  -- Guardian Information
  father_name VARCHAR(200) NOT NULL,
  father_phone VARCHAR(20) NOT NULL,
  father_citizenship_no VARCHAR(50),
  mother_name VARCHAR(200) NOT NULL,
  mother_phone VARCHAR(20) NOT NULL,
  mother_citizenship_no VARCHAR(50),
  local_guardian_name VARCHAR(200),
  local_guardian_phone VARCHAR(20),
  local_guardian_relation VARCHAR(50),
  
  -- Academic Information
  admission_date DATE NOT NULL,
  admission_class INT NOT NULL,
  current_class INT NOT NULL,
  current_section VARCHAR(10) NOT NULL,
  current_shift ENUM('morning', 'day', 'evening') NOT NULL,
  roll_number INT,
  previous_school VARCHAR(255),
  
  -- Health Information
  allergies TEXT,
  medical_conditions TEXT,
  emergency_contact VARCHAR(20) NOT NULL,
  
  -- Status
  status ENUM('active', 'inactive', 'transferred', 'graduated') DEFAULT 'active',
  
  -- Media
  photo_url VARCHAR(500),
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_student_id (student_id),
  INDEX idx_current_class_section (current_class, current_section),
  INDEX idx_status (status)
);
```

**staff**
```sql
CREATE TABLE staff (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) UNIQUE,
  staff_id VARCHAR(50) UNIQUE NOT NULL,
  
  -- Personal Information
  first_name VARCHAR(100) NOT NULL,
  middle_name VARCHAR(100),
  last_name VARCHAR(100) NOT NULL,
  date_of_birth DATE NOT NULL,
  gender ENUM('male', 'female', 'other') NOT NULL,
  citizenship_no VARCHAR(50),
  
  -- Contact Information
  address TEXT NOT NULL,
  phone VARCHAR(20) NOT NULL,
  email VARCHAR(255),
  emergency_contact VARCHAR(20) NOT NULL,
  
  -- Employment Information
  join_date DATE NOT NULL,
  position VARCHAR(100) NOT NULL,
  department VARCHAR(100),
  salary_grade VARCHAR(20),
  employment_type ENUM('permanent', 'temporary', 'contract') NOT NULL,
  
  -- Qualifications
  qualifications JSON,
  teaching_license_no VARCHAR(50),
  
  -- Status
  status ENUM('active', 'on_leave', 'resigned', 'terminated') DEFAULT 'active',
  
  photo_url VARCHAR(500),
  
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  deleted_at DATETIME,
  
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_staff_id (staff_id),
  INDEX idx_status (status)
);
```

**academic_years**
```sql
CREATE TABLE academic_years (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  start_date_bs VARCHAR(10) NOT NULL,
  end_date_bs VARCHAR(10) NOT NULL,
  start_date_ad DATE NOT NULL,
  end_date_ad DATE NOT NULL,
  is_current BOOLEAN DEFAULT FALSE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_is_current (is_current)
);
```

**terms**
```sql
CREATE TABLE terms (
  id VARCHAR(36) PRIMARY KEY,
  academic_year_id VARCHAR(36) NOT NULL,
  name VARCHAR(100) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  exam_start_date DATE,
  exam_end_date DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE,
  INDEX idx_academic_year (academic_year_id)
);
```

**classes**
```sql
CREATE TABLE classes (
  id VARCHAR(36) PRIMARY KEY,
  grade_level INT NOT NULL,
  section VARCHAR(10) NOT NULL,
  shift ENUM('morning', 'day', 'evening') NOT NULL,
  class_teacher_id VARCHAR(36),
  capacity INT NOT NULL,
  current_strength INT DEFAULT 0,
  academic_year_id VARCHAR(36) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (class_teacher_id) REFERENCES staff(id) ON DELETE SET NULL,
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE,
  UNIQUE KEY unique_class (grade_level, section, shift, academic_year_id),
  INDEX idx_grade_level (grade_level),
  INDEX idx_academic_year (academic_year_id)
);
```

**subjects**
```sql
CREATE TABLE subjects (
  id VARCHAR(36) PRIMARY KEY,
  code VARCHAR(20) UNIQUE NOT NULL,
  name_en VARCHAR(200) NOT NULL,
  name_np VARCHAR(200) NOT NULL,
  type ENUM('compulsory', 'optional') NOT NULL,
  credit_hours INT NOT NULL,
  theory_marks INT NOT NULL,
  practical_marks INT DEFAULT 0,
  pass_marks INT NOT NULL,
  full_marks INT NOT NULL,
  stream ENUM('science', 'management', 'humanities', 'technical'),
  applicable_classes JSON NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_code (code),
  INDEX idx_type (type)
);
```

**class_subjects**
```sql
CREATE TABLE class_subjects (
  id VARCHAR(36) PRIMARY KEY,
  class_id VARCHAR(36) NOT NULL,
  subject_id VARCHAR(36) NOT NULL,
  teacher_id VARCHAR(36),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES staff(id) ON DELETE SET NULL,
  UNIQUE KEY unique_class_subject (class_id, subject_id),
  INDEX idx_class (class_id),
  INDEX idx_teacher (teacher_id)
);
```

**timetables**
```sql
CREATE TABLE timetables (
  id VARCHAR(36) PRIMARY KEY,
  class_id VARCHAR(36) NOT NULL,
  day_of_week INT NOT NULL,
  period_number INT NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  subject_id VARCHAR(36) NOT NULL,
  teacher_id VARCHAR(36) NOT NULL,
  room_number VARCHAR(20),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (teacher_id) REFERENCES staff(id) ON DELETE CASCADE,
  UNIQUE KEY unique_period (class_id, day_of_week, period_number),
  INDEX idx_class (class_id),
  INDEX idx_teacher (teacher_id)
);
```

**attendance**
```sql
CREATE TABLE attendance (
  id VARCHAR(36) PRIMARY KEY,
  student_id VARCHAR(36) NOT NULL,
  class_id VARCHAR(36) NOT NULL,
  date DATE NOT NULL,
  date_bs VARCHAR(10) NOT NULL,
  status ENUM('present', 'absent', 'late', 'excused') NOT NULL,
  period_number INT,
  marked_by VARCHAR(36) NOT NULL,
  marked_at DATETIME NOT NULL,
  remarks TEXT,
  sync_status ENUM('synced', 'pending', 'error') DEFAULT 'synced',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (marked_by) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_attendance (student_id, date, period_number),
  INDEX idx_student_date (student_id, date),
  INDEX idx_class_date (class_id, date),
  INDEX idx_sync_status (sync_status)
);
```

**leave_applications**
```sql
CREATE TABLE leave_applications (
  id VARCHAR(36) PRIMARY KEY,
  student_id VARCHAR(36) NOT NULL,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT NOT NULL,
  applied_by VARCHAR(36) NOT NULL,
  applied_at DATETIME NOT NULL,
  status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
  approved_by VARCHAR(36),
  approved_at DATETIME,
  remarks TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (applied_by) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_student (student_id),
  INDEX idx_status (status)
);
```

**exams**
```sql
CREATE TABLE exams (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  type ENUM('unit_test', 'first_terminal', 'second_terminal', 'final', 'practical', 'project') NOT NULL,
  subject_id VARCHAR(36) NOT NULL,
  class_id VARCHAR(36) NOT NULL,
  academic_year_id VARCHAR(36) NOT NULL,
  term_id VARCHAR(36) NOT NULL,
  exam_date DATE NOT NULL,
  duration INT NOT NULL,
  full_marks INT NOT NULL,
  pass_marks INT NOT NULL,
  theory_marks INT NOT NULL,
  practical_marks INT DEFAULT 0,
  weightage DECIMAL(5,2) NOT NULL,
  status ENUM('scheduled', 'ongoing', 'completed', 'cancelled') DEFAULT 'scheduled',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE,
  FOREIGN KEY (term_id) REFERENCES terms(id) ON DELETE CASCADE,
  INDEX idx_class_subject (class_id, subject_id),
  INDEX idx_exam_date (exam_date)
);
```

**grades**
```sql
CREATE TABLE grades (
  id VARCHAR(36) PRIMARY KEY,
  exam_id VARCHAR(36) NOT NULL,
  student_id VARCHAR(36) NOT NULL,
  theory_marks DECIMAL(5,2),
  practical_marks DECIMAL(5,2),
  total_marks DECIMAL(5,2) NOT NULL,
  grade ENUM('A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'NG') NOT NULL,
  grade_point DECIMAL(3,2) NOT NULL,
  remarks TEXT,
  entered_by VARCHAR(36) NOT NULL,
  entered_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (exam_id) REFERENCES exams(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (entered_by) REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE KEY unique_exam_student (exam_id, student_id),
  INDEX idx_student (student_id),
  INDEX idx_exam (exam_id)
);
```

**fee_structures**
```sql
CREATE TABLE fee_structures (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  applicable_classes JSON NOT NULL,
  applicable_shifts JSON NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL,
  academic_year_id VARCHAR(36) NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE,
  INDEX idx_academic_year (academic_year_id),
  INDEX idx_is_active (is_active)
);
```

**fee_components**
```sql
CREATE TABLE fee_components (
  id VARCHAR(36) PRIMARY KEY,
  fee_structure_id VARCHAR(36) NOT NULL,
  name VARCHAR(200) NOT NULL,
  type ENUM('admission', 'annual', 'monthly', 'exam', 'transport', 'hostel', 'library', 'lab', 'eca', 'development') NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  frequency ENUM('one_time', 'monthly', 'quarterly', 'annual') NOT NULL,
  is_mandatory BOOLEAN DEFAULT TRUE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (fee_structure_id) REFERENCES fee_structures(id) ON DELETE CASCADE,
  INDEX idx_fee_structure (fee_structure_id)
);
```

**invoices**
```sql
CREATE TABLE invoices (
  id VARCHAR(36) PRIMARY KEY,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  student_id VARCHAR(36) NOT NULL,
  fee_structure_id VARCHAR(36) NOT NULL,
  academic_year_id VARCHAR(36) NOT NULL,
  due_date DATE NOT NULL,
  subtotal DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0,
  discount_reason TEXT,
  total_amount DECIMAL(10,2) NOT NULL,
  paid_amount DECIMAL(10,2) DEFAULT 0,
  balance DECIMAL(10,2) NOT NULL,
  status ENUM('pending', 'partial', 'paid', 'overdue', 'cancelled') DEFAULT 'pending',
  generated_at DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (fee_structure_id) REFERENCES fee_structures(id) ON DELETE CASCADE,
  FOREIGN KEY (academic_year_id) REFERENCES academic_years(id) ON DELETE CASCADE,
  INDEX idx_student (student_id),
  INDEX idx_status (status),
  INDEX idx_due_date (due_date)
);
```

**payments**
```sql
CREATE TABLE payments (
  id VARCHAR(36) PRIMARY KEY,
  receipt_number VARCHAR(50) UNIQUE NOT NULL,
  invoice_id VARCHAR(36) NOT NULL,
  student_id VARCHAR(36) NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  payment_method ENUM('cash', 'bank_transfer', 'esewa', 'khalti', 'ime_pay') NOT NULL,
  payment_date DATE NOT NULL,
  transaction_id VARCHAR(200),
  gateway_response JSON,
  received_by VARCHAR(36) NOT NULL,
  remarks TEXT,
  status ENUM('pending', 'completed', 'failed', 'refunded') DEFAULT 'completed',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (invoice_id) REFERENCES invoices(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (received_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_invoice (invoice_id),
  INDEX idx_student (student_id),
  INDEX idx_payment_date (payment_date)
);
```

**books**
```sql
CREATE TABLE books (
  id VARCHAR(36) PRIMARY KEY,
  accession_number VARCHAR(50) UNIQUE NOT NULL,
  isbn VARCHAR(20),
  title VARCHAR(500) NOT NULL,
  author VARCHAR(200) NOT NULL,
  publisher VARCHAR(200),
  publication_year INT,
  category ENUM('textbook', 'reference', 'fiction', 'magazine', 'newspaper') NOT NULL,
  language ENUM('nepali', 'english', 'other') NOT NULL,
  total_copies INT NOT NULL,
  available_copies INT NOT NULL,
  shelf_location VARCHAR(50) NOT NULL,
  price DECIMAL(10,2),
  added_date DATE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_accession (accession_number),
  INDEX idx_title (title),
  INDEX idx_category (category)
);
```

**circulation**
```sql
CREATE TABLE circulation (
  id VARCHAR(36) PRIMARY KEY,
  book_id VARCHAR(36) NOT NULL,
  student_id VARCHAR(36) NOT NULL,
  issue_date DATE NOT NULL,
  due_date DATE NOT NULL,
  return_date DATE,
  status ENUM('issued', 'returned', 'overdue') NOT NULL,
  issued_by VARCHAR(36) NOT NULL,
  returned_to VARCHAR(36),
  fine_amount DECIMAL(10,2) DEFAULT 0,
  fine_paid BOOLEAN DEFAULT FALSE,
  remarks TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (issued_by) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (returned_to) REFERENCES users(id) ON DELETE SET NULL,
  INDEX idx_book (book_id),
  INDEX idx_student (student_id),
  INDEX idx_status (status)
);
```

**notifications**
```sql
CREATE TABLE notifications (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  type ENUM('info', 'warning', 'success', 'error') NOT NULL,
  category ENUM('attendance', 'exam', 'fee', 'grade', 'announcement', 'leave', 'library') NOT NULL,
  title VARCHAR(200) NOT NULL,
  message TEXT NOT NULL,
  data JSON,
  is_read BOOLEAN DEFAULT FALSE,
  read_at DATETIME,
  expires_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_read (user_id, is_read),
  INDEX idx_created_at (created_at)
);
```

**certificates**
```sql
CREATE TABLE certificates (
  id VARCHAR(36) PRIMARY KEY,
  certificate_number VARCHAR(50) UNIQUE NOT NULL,
  template_id VARCHAR(36) NOT NULL,
  student_id VARCHAR(36) NOT NULL,
  type VARCHAR(100) NOT NULL,
  issued_date DATE NOT NULL,
  issued_date_bs VARCHAR(10) NOT NULL,
  data JSON NOT NULL,
  pdf_url VARCHAR(500) NOT NULL,
  qr_code VARCHAR(500) NOT NULL,
  issued_by VARCHAR(36) NOT NULL,
  verification_url VARCHAR(500) NOT NULL,
  status ENUM('active', 'revoked') DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
  FOREIGN KEY (issued_by) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_certificate_number (certificate_number),
  INDEX idx_student (student_id)
);
```

### Indexes and Performance Optimization

**Composite Indexes:**
- `(student_id, date)` on attendance for fast student attendance queries
- `(class_id, date)` on attendance for class-wise attendance reports
- `(class_id, subject_id)` on exams for subject-wise exam queries
- `(user_id, is_read)` on notifications for unread count queries

**Full-Text Indexes:**
- `title` on books for search functionality
- `name_en, name_np` on students for name search

**Partitioning Strategy:**
- Attendance table partitioned by year for performance
- Audit logs partitioned by month

### Data Retention and Archiving

- Active academic year data: Hot storage (MySQL)
- Previous 2 years: Warm storage (MySQL with indexes)
- Older than 2 years: Cold storage (archived tables)
- Audit logs: 1 year retention with monthly rotation


## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### NEB Grading and Academic Properties

**Property 1: NEB Grade Mapping Correctness**
*For any* marks value between 0 and 100, the system should map it to exactly one NEB grade according to the official grading table, where marks in range [90-100] → A+ (4.0), [80-89] → A (3.6), [70-79] → B+ (3.2), [60-69] → B (2.8), [50-59] → C+ (2.4), [40-49] → C (2.0), [35-39] → D (1.6), and [0-34] → NG (0.0).
**Validates: Requirements N1.1, N1.4**

**Property 2: GPA Calculation Formula**
*For any* set of subjects with credit hours and grade points, the calculated GPA should equal the sum of (credit_hour × grade_point) divided by total credit hours, rounded to 2 decimal places.
**Validates: Requirements N1.2**

**Property 3: Weighted Grade Calculation**
*For any* theory marks and practical marks with specified weights, the total marks should equal (theory_marks × theory_weight + practical_marks × practical_weight), where weights sum to 100%.
**Validates: Requirements N1.3, 7.6**

**Property 4: NEB Mark Sheet Completeness**
*For any* generated mark sheet, it should contain all required NEB fields: student information, subject-wise marks (theory/practical/total), grades, grade points, GPA, attendance percentage, and school seal.
**Validates: Requirements N1.9**

**Property 5: Subject Combination Validation**
*For any* subject combination for Classes 11-12, if it violates NEB rules (e.g., missing compulsory subjects, invalid stream combinations), the enrollment should be rejected with a descriptive error.
**Validates: Requirements N2.4**

**Property 6: BS-AD Calendar Round Trip**
*For any* valid Bikram Sambat date within the supported range, converting to AD and back to BS should produce the original BS date.
**Validates: Requirements N4.7**

### Authentication and Authorization Properties

**Property 7: JWT Token Contains Role Information**
*For any* successful login with valid credentials, the generated JWT access token should contain the user's role and permissions in its payload, and the token should be verifiable with the server's secret key.
**Validates: Requirements 1.2**

**Property 8: Token Expiration Enforcement**
*For any* JWT token, if the current time exceeds the token's expiration time (30 minutes for access tokens, 7 days for refresh tokens), API requests using that token should be rejected with 401 Unauthorized.
**Validates: Requirements 1.3**

**Property 9: Account Lockout After Failed Attempts**
*For any* user account, if there are 5 or more failed login attempts within a 15-minute window, subsequent login attempts should be rejected until the lockout period expires, regardless of password correctness.
**Validates: Requirements 1.9**

**Property 10: Password Hashing Security**
*For any* password stored in the database, it should be a bcrypt hash (starting with "$2a$", "$2b$", or "$2y$") and not the plaintext password.
**Validates: Requirements 36.2**

### Student Management Properties

**Property 11: Student ID Uniqueness**
*For any* two students created in the system, their student IDs should be unique, following the format {school_prefix}-{admission_year}-{sequential_number}.
**Validates: Requirements 2.2**

**Property 12: Audit Trail Creation**
*For any* update operation on a student record, an audit log entry should be created containing the user ID, timestamp, field changed, old value, and new value.
**Validates: Requirements 2.9**

**Property 13: Student Promotion Grade Increment**
*For any* student promoted at year-end, their current_class should increase by 1, and their academic history should include a record of the previous class with completion status.
**Validates: Requirements 2.10**

**Property 14: Database Unique Constraints**
*For any* attempt to insert a student with a student_id, email, or symbol_number that already exists in the database, the operation should be rejected with a unique constraint violation error.
**Validates: Requirements 40.1**

**Property 15: Soft Delete Preservation**
*For any* delete operation on a student, staff, or transaction record, the record should remain in the database with deleted_at timestamp set, not physically removed.
**Validates: Requirements 40.3**

### Attendance Management Properties

**Property 16: Mark All Present Completeness**
*For any* class with N students, using "Mark All Present" should create exactly N attendance records with status 'present' for the specified date and period.
**Validates: Requirements 6.3**

**Property 17: Attendance Correction Time Window**
*For any* attendance record, correction attempts within 24 hours of marking should succeed, while attempts after 24 hours should be rejected with an error message.
**Validates: Requirements 6.6**

**Property 18: Low Attendance Alert Threshold**
*For any* student whose attendance percentage falls below 75%, a notification should be sent to both the parent and admin users.
**Validates: Requirements 6.8**

**Property 19: Offline Attendance Sync Round Trip**
*For any* attendance records marked while offline, when connectivity is restored, all queued records should be synced to the server and the local queue should be cleared upon successful sync.
**Validates: Requirements 6.13, 28.2, 28.3**

### Examination and Grading Properties

**Property 20: Class Rank Calculation Correctness**
*For any* set of students in a class with their total marks, the rank assigned to each student should be their position in descending order of marks, with tied students receiving the same rank and the next rank being skipped accordingly.
**Validates: Requirements 7.10**

### Finance and Fee Management Properties

**Property 21: Invoice Generation Completeness**
*For any* student assigned a fee structure, the generated invoice should contain all fee components from that structure with their respective amounts, and the total should equal the sum of all components minus any discount.
**Validates: Requirements 9.3**

**Property 22: Payment Balance Invariant**
*For any* invoice after a payment is recorded, the balance should always equal (total_amount - paid_amount), and the status should be 'paid' when balance equals zero.
**Validates: Requirements 9.8**

**Property 23: Payment Gateway Signature Verification**
*For any* payment callback from a payment gateway, if the signature verification fails using the gateway's public key or shared secret, the payment should be rejected and not recorded.
**Validates: Requirements 32.7**

**Property 24: Payment Idempotency**
*For any* payment request with the same transaction_id processed multiple times, only one payment record should be created in the database, preventing duplicate charges.
**Validates: Requirements 32.8**

**Property 25: Online Payment Verification**
*For any* online payment, the system should verify the payment with the gateway's API before updating the invoice balance, ensuring the payment actually succeeded.
**Validates: Requirements 9.6**

### Library Management Properties

**Property 26: Circulation Record Completeness**
*For any* book issued to a student, the circulation record should contain issue_date, due_date (calculated as issue_date + borrowing_period), student_id, book_id, and issued_by fields.
**Validates: Requirements 10.4**

**Property 27: Late Fee Calculation**
*For any* overdue book, the fine amount should equal (days_overdue × daily_fine_rate), where days_overdue is the number of days between due_date and current_date.
**Validates: Requirements 10.5**

**Property 28: Borrowing Limit Enforcement**
*For any* student attempting to borrow a book, if they already have N books issued (where N is the configured limit, default 3), the new borrowing request should be rejected.
**Validates: Requirements 10.13**

### Security and Input Validation Properties

**Property 29: SQL Injection Prevention**
*For any* user input containing SQL injection patterns (e.g., "'; DROP TABLE", "1' OR '1'='1"), the input should either be sanitized by escaping special characters or rejected, and should never be executed as SQL.
**Validates: Requirements 36.6**

**Property 30: XSS Prevention**
*For any* user input containing HTML/JavaScript tags (e.g., "<script>", "<img onerror="), the input should be sanitized by encoding special characters before storage and display, preventing script execution.
**Validates: Requirements 36.6**

### File Upload and Optimization Properties

**Property 31: Image Compression Enforcement**
*For any* uploaded image file, if it exceeds the size limit (200KB for photos, 500KB for documents), it should be compressed to meet the limit while maintaining acceptable quality.
**Validates: Requirements 29.2**


## Error Handling

### Error Response Structure

All API errors follow a consistent format:

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;           // Machine-readable error code
    message: string;        // Human-readable error message
    details?: any;          // Additional error context
    field?: string;         // For validation errors
  };
  timestamp: string;
  path: string;
  requestId: string;
}
```

### Error Categories and HTTP Status Codes

**Authentication Errors (401)**
- `AUTH_INVALID_CREDENTIALS`: Invalid username or password
- `AUTH_TOKEN_EXPIRED`: JWT token has expired
- `AUTH_TOKEN_INVALID`: JWT token is malformed or invalid
- `AUTH_ACCOUNT_LOCKED`: Account locked due to failed login attempts
- `AUTH_ACCOUNT_INACTIVE`: User account is deactivated

**Authorization Errors (403)**
- `AUTH_INSUFFICIENT_PERMISSIONS`: User lacks required permissions
- `AUTH_ROLE_MISMATCH`: Operation not allowed for user's role
- `AUTH_RESOURCE_FORBIDDEN`: Access to specific resource denied

**Validation Errors (400)**
- `VALIDATION_FAILED`: Input validation failed
- `VALIDATION_REQUIRED_FIELD`: Required field missing
- `VALIDATION_INVALID_FORMAT`: Field format invalid
- `VALIDATION_INVALID_RANGE`: Value outside acceptable range
- `VALIDATION_INVALID_DATE`: Invalid date format or value

**Business Logic Errors (422)**
- `BUSINESS_RULE_VIOLATION`: Business rule constraint violated
- `BUSINESS_DUPLICATE_ENTRY`: Duplicate record exists
- `BUSINESS_INVALID_STATE`: Operation invalid for current state
- `BUSINESS_QUOTA_EXCEEDED`: Limit or quota exceeded
- `BUSINESS_INVALID_COMBINATION`: Invalid combination of values

**Resource Errors (404)**
- `RESOURCE_NOT_FOUND`: Requested resource doesn't exist
- `RESOURCE_DELETED`: Resource has been soft-deleted

**Conflict Errors (409)**
- `CONFLICT_CONCURRENT_MODIFICATION`: Resource modified by another user
- `CONFLICT_DUPLICATE_OPERATION`: Operation already in progress

**Server Errors (500)**
- `SERVER_INTERNAL_ERROR`: Unexpected server error
- `SERVER_DATABASE_ERROR`: Database operation failed
- `SERVER_EXTERNAL_SERVICE_ERROR`: External service (payment gateway, SMS) failed

### Error Handling Strategy

**Backend Error Handling:**

1. **Global Error Handler Middleware**: Catches all unhandled errors and formats them consistently
2. **Async Error Wrapper**: Wraps async route handlers to catch promise rejections
3. **Validation Middleware**: Validates request data before reaching controllers
4. **Database Error Mapping**: Converts database errors to user-friendly messages
5. **Logging**: All errors logged with context (user, request, stack trace)

```typescript
// Example error handler middleware
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  const errorResponse: ErrorResponse = {
    success: false,
    error: {
      code: err.name || 'SERVER_INTERNAL_ERROR',
      message: err.message || 'An unexpected error occurred',
      details: process.env.NODE_ENV === 'development' ? err.stack : undefined
    },
    timestamp: new Date().toISOString(),
    path: req.path,
    requestId: req.id
  };
  
  logger.error('API Error', { error: err, request: req });
  
  const statusCode = getStatusCode(err);
  res.status(statusCode).json(errorResponse);
});
```

**Frontend Error Handling:**

1. **API Interceptor**: Catches all API errors and displays user-friendly messages
2. **Error Boundary**: React error boundaries catch rendering errors
3. **Toast Notifications**: Display error messages to users
4. **Retry Logic**: Automatic retry for network errors
5. **Offline Detection**: Special handling for offline scenarios

```typescript
// Example API interceptor
axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      // Token expired, attempt refresh
      return refreshTokenAndRetry(error.config);
    }
    
    if (!error.response) {
      // Network error, queue for offline sync
      return queueForOfflineSync(error.config);
    }
    
    // Display error to user
    toast.error(error.response?.data?.error?.message || 'An error occurred');
    
    return Promise.reject(error);
  }
);
```

### Specific Error Scenarios

**NEB Grading Errors:**
- Invalid marks range (< 0 or > full_marks)
- Missing theory or practical marks when required
- Invalid subject combination for stream
- GPA calculation with zero credit hours

**Attendance Errors:**
- Duplicate attendance for same student/date/period
- Attendance date in future
- Attendance correction outside 24-hour window
- Marking attendance for inactive student

**Payment Errors:**
- Payment amount exceeds invoice balance
- Invalid payment gateway signature
- Duplicate transaction ID
- Payment gateway timeout or failure
- Insufficient balance (for online payments)

**Library Errors:**
- Book not available (all copies issued)
- Student borrowing limit exceeded
- Book already issued to student
- Invalid return (book not issued to student)

**Offline Sync Errors:**
- Sync conflict (record modified on server)
- Network timeout during sync
- Invalid data in offline queue
- Server validation failure for queued operation

### Error Recovery Strategies

1. **Automatic Retry**: Network errors retried up to 3 times with exponential backoff
2. **Graceful Degradation**: System continues with reduced functionality when services unavailable
3. **User Notification**: Clear error messages with suggested actions
4. **Admin Alerts**: Critical errors trigger admin notifications
5. **Error Tracking**: All errors logged for monitoring and debugging


## Testing Strategy

### Overview

The testing strategy employs a **dual approach** combining unit tests and property-based tests to ensure comprehensive coverage:

- **Unit Tests**: Verify specific examples, edge cases, error conditions, and integration points
- **Property-Based Tests**: Verify universal properties across all inputs through randomized testing

Both approaches are complementary and necessary for comprehensive correctness validation.

### Property-Based Testing

**Framework**: We will use **fast-check** for JavaScript/TypeScript property-based testing.

**Configuration**:
- Minimum 100 iterations per property test (due to randomization)
- Each property test must reference its design document property
- Tag format: `// Feature: school-management-system-nodejs-react, Property {number}: {property_text}`

**Example Property Test**:

```typescript
import fc from 'fast-check';

describe('NEB Grading Properties', () => {
  // Feature: school-management-system-nodejs-react, Property 1: NEB Grade Mapping Correctness
  it('should map any marks (0-100) to correct NEB grade', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 100 }),
        (marks) => {
          const result = calculateNEBGrade(marks);
          
          // Verify grade mapping
          if (marks >= 90) {
            expect(result.grade).toBe('A+');
            expect(result.gradePoint).toBe(4.0);
          } else if (marks >= 80) {
            expect(result.grade).toBe('A');
            expect(result.gradePoint).toBe(3.6);
          } else if (marks >= 70) {
            expect(result.grade).toBe('B+');
            expect(result.gradePoint).toBe(3.2);
          } else if (marks >= 60) {
            expect(result.grade).toBe('B');
            expect(result.gradePoint).toBe(2.8);
          } else if (marks >= 50) {
            expect(result.grade).toBe('C+');
            expect(result.gradePoint).toBe(2.4);
          } else if (marks >= 40) {
            expect(result.grade).toBe('C');
            expect(result.gradePoint).toBe(2.0);
          } else if (marks >= 35) {
            expect(result.grade).toBe('D');
            expect(result.gradePoint).toBe(1.6);
          } else {
            expect(result.grade).toBe('NG');
            expect(result.gradePoint).toBe(0.0);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: school-management-system-nodejs-react, Property 2: GPA Calculation Formula
  it('should calculate GPA correctly for any set of subjects', () => {
    fc.assert(
      fc.property(
        fc.array(
          fc.record({
            creditHours: fc.integer({ min: 1, max: 6 }),
            gradePoint: fc.constantFrom(4.0, 3.6, 3.2, 2.8, 2.4, 2.0, 1.6, 0.0)
          }),
          { minLength: 1, maxLength: 10 }
        ),
        (subjects) => {
          const gpa = calculateGPA(subjects);
          
          const totalWeightedPoints = subjects.reduce(
            (sum, s) => sum + (s.creditHours * s.gradePoint),
            0
          );
          const totalCreditHours = subjects.reduce(
            (sum, s) => sum + s.creditHours,
            0
          );
          const expectedGPA = Number((totalWeightedPoints / totalCreditHours).toFixed(2));
          
          expect(gpa).toBe(expectedGPA);
        }
      ),
      { numRuns: 100 }
    );
  });

  // Feature: school-management-system-nodejs-react, Property 6: BS-AD Calendar Round Trip
  it('should preserve BS date after round-trip conversion', () => {
    fc.assert(
      fc.property(
        fc.record({
          year: fc.integer({ min: 2070, max: 2090 }),
          month: fc.integer({ min: 1, max: 12 }),
          day: fc.integer({ min: 1, max: 32 })
        }),
        (bsDate) => {
          // Skip invalid dates
          if (!isValidBSDate(bsDate)) return true;
          
          const adDate = convertBSToAD(bsDate);
          const roundTripBS = convertADToBS(adDate);
          
          expect(roundTripBS).toEqual(bsDate);
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### Unit Testing

**Framework**: Jest for both backend and frontend testing.

**Backend Unit Tests**:
- Controller tests: Mock services, verify request/response handling
- Service tests: Test business logic with mocked repositories
- Repository tests: Test database operations with test database
- Middleware tests: Test authentication, validation, error handling
- Integration tests: Test complete API flows

**Frontend Unit Tests**:
- Component tests: React Testing Library for UI components
- Hook tests: Test custom React hooks
- Redux tests: Test actions, reducers, selectors
- API tests: Mock API calls, test error handling
- Form validation tests: Test input validation logic

**Example Unit Tests**:

```typescript
// Backend service test
describe('StudentService', () => {
  describe('createStudent', () => {
    it('should generate unique student ID with correct format', async () => {
      const studentData = {
        firstNameEn: 'Ram',
        lastNameEn: 'Sharma',
        admissionClass: 1,
        admissionDate: '2081-01-01'
      };
      
      const student = await studentService.createStudent(studentData);
      
      expect(student.studentId).toMatch(/^[A-Z]+-2081-\d{4}$/);
    });

    it('should reject duplicate student ID', async () => {
      const studentData = { /* ... */ };
      
      await studentService.createStudent(studentData);
      
      await expect(
        studentService.createStudent(studentData)
      ).rejects.toThrow('BUSINESS_DUPLICATE_ENTRY');
    });

    it('should create audit log on student creation', async () => {
      const studentData = { /* ... */ };
      
      await studentService.createStudent(studentData);
      
      const auditLogs = await auditRepository.findByEntity('student');
      expect(auditLogs).toHaveLength(1);
      expect(auditLogs[0].action).toBe('create');
    });
  });
});

// Frontend component test
describe('AttendanceMarking', () => {
  it('should mark all students present with one click', async () => {
    const students = [
      { id: '1', name: 'Student 1' },
      { id: '2', name: 'Student 2' },
      { id: '3', name: 'Student 3' }
    ];
    
    render(<AttendanceMarking students={students} />);
    
    const markAllButton = screen.getByText('Mark All Present');
    await userEvent.click(markAllButton);
    
    const presentCheckboxes = screen.getAllByRole('checkbox', { checked: true });
    expect(presentCheckboxes).toHaveLength(3);
  });

  it('should show error when attendance correction exceeds 24 hours', async () => {
    const oldAttendance = {
      id: '1',
      date: '2081-01-01',
      markedAt: new Date(Date.now() - 25 * 60 * 60 * 1000) // 25 hours ago
    };
    
    render(<AttendanceCorrection attendance={oldAttendance} />);
    
    const saveButton = screen.getByText('Save Correction');
    await userEvent.click(saveButton);
    
    expect(screen.getByText(/correction window has expired/i)).toBeInTheDocument();
  });
});
```

### Integration Testing

**API Integration Tests**:
- Test complete request/response cycles
- Test authentication and authorization flows
- Test database transactions and rollbacks
- Test external service integrations (payment gateways, SMS)

**Example Integration Test**:

```typescript
describe('Fee Payment Flow', () => {
  it('should complete payment and update invoice balance', async () => {
    // Create student and invoice
    const student = await createTestStudent();
    const invoice = await createTestInvoice(student.id, 10000);
    
    // Make payment
    const paymentResponse = await request(app)
      .post('/api/v1/finance/payments')
      .set('Authorization', `Bearer ${accountantToken}`)
      .send({
        invoiceId: invoice.id,
        amount: 5000,
        paymentMethod: 'cash'
      });
    
    expect(paymentResponse.status).toBe(201);
    expect(paymentResponse.body.data.receiptNumber).toBeDefined();
    
    // Verify invoice updated
    const updatedInvoice = await getInvoice(invoice.id);
    expect(updatedInvoice.paidAmount).toBe(5000);
    expect(updatedInvoice.balance).toBe(5000);
    expect(updatedInvoice.status).toBe('partial');
  });
});
```

### End-to-End Testing

**Framework**: Playwright for E2E tests

**Coverage**:
- Critical user journeys (login, attendance marking, fee payment)
- Multi-portal workflows (parent pays fee, admin views report)
- Offline functionality (mark attendance offline, sync when online)
- Payment gateway integration (eSewa, Khalti)

**Example E2E Test**:

```typescript
test('Teacher marks attendance and parent receives notification', async ({ page, context }) => {
  // Teacher logs in
  await page.goto('/login');
  await page.fill('[name="username"]', 'teacher1');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');
  
  // Navigate to attendance
  await page.click('text=Attendance');
  await page.click('text=Class 5-A');
  
  // Mark all present
  await page.click('text=Mark All Present');
  await page.click('text=Submit Attendance');
  
  // Verify success
  await expect(page.locator('text=Attendance marked successfully')).toBeVisible();
  
  // Open parent portal in new tab
  const parentPage = await context.newPage();
  await parentPage.goto('/login');
  await parentPage.fill('[name="username"]', 'parent1');
  await parentPage.fill('[name="password"]', 'password');
  await parentPage.click('button[type="submit"]');
  
  // Verify attendance visible
  await parentPage.click('text=Attendance');
  await expect(parentPage.locator('text=Present')).toBeVisible();
});
```

### Test Coverage Goals

- **Unit Tests**: Minimum 70% code coverage
- **Property Tests**: All 31 correctness properties implemented
- **Integration Tests**: All critical API flows covered
- **E2E Tests**: All user journeys for each portal covered

### Testing Best Practices

1. **Test Isolation**: Each test should be independent and not rely on other tests
2. **Test Data**: Use factories or fixtures for consistent test data
3. **Mocking**: Mock external dependencies (payment gateways, SMS services)
4. **Cleanup**: Clean up test data after each test
5. **Descriptive Names**: Test names should clearly describe what is being tested
6. **Arrange-Act-Assert**: Follow AAA pattern for test structure
7. **Edge Cases**: Test boundary conditions and error scenarios
8. **Performance**: Keep unit tests fast (< 100ms each)

### Continuous Integration

**CI Pipeline**:
1. Lint code (ESLint, Prettier)
2. Type check (TypeScript)
3. Run unit tests
4. Run property-based tests
5. Run integration tests
6. Generate coverage report
7. Build application
8. Run E2E tests (on staging)

**Quality Gates**:
- All tests must pass
- Code coverage must be ≥ 70%
- No TypeScript errors
- No high-severity linting errors


## Nepal-Specific Implementations

### Bikram Sambat Calendar System

**Implementation Approach**:

The system uses a pre-computed lookup table for BS-AD conversion covering years 2000-2100 BS (1943-2043 AD).

```typescript
interface BSDate {
  year: number;
  month: number;
  day: number;
}

interface ADDate {
  year: number;
  month: number;
  day: number;
}

// Lookup table structure
const BS_CALENDAR_DATA = {
  2081: [31, 31, 32, 31, 31, 31, 30, 29, 30, 29, 30, 30], // Days in each month
  // ... data for other years
};

function convertBSToAD(bsDate: BSDate): ADDate {
  // Calculate total days from reference point
  // Use lookup table to convert
  // Return AD date
}

function convertADToBS(adDate: ADDate): BSDate {
  // Reverse conversion using lookup table
}

function isValidBSDate(bsDate: BSDate): boolean {
  // Validate year, month, day ranges
  // Check against calendar data
}

function formatBSDate(bsDate: BSDate, locale: 'en' | 'np'): string {
  const monthNames = {
    en: ['Baisakh', 'Jestha', 'Asar', 'Shrawan', 'Bhadra', 'Asoj', 
         'Kartik', 'Mangsir', 'Poush', 'Magh', 'Falgun', 'Chaitra'],
    np: ['बैशाख', 'जेठ', 'असार', 'श्रावण', 'भाद्र', 'आश्विन',
         'कार्तिक', 'मंसिर', 'पौष', 'माघ', 'फाल्गुन', 'चैत्र']
  };
  
  return `${bsDate.year}-${monthNames[locale][bsDate.month - 1]}-${bsDate.day}`;
}
```

**UI Components**:
- Custom BS date picker with Nepali month names
- Toggle between BS and AD display
- Dual date display: "2081-10-24 BS (2025-02-06 AD)"

### NEB Grading System

**Grade Calculation Service**:

```typescript
interface NEBGradeScale {
  minMarks: number;
  maxMarks: number;
  grade: string;
  gradePoint: number;
  description: string;
}

const NEB_GRADE_SCALE: NEBGradeScale[] = [
  { minMarks: 90, maxMarks: 100, grade: 'A+', gradePoint: 4.0, description: 'Outstanding' },
  { minMarks: 80, maxMarks: 89, grade: 'A', gradePoint: 3.6, description: 'Excellent' },
  { minMarks: 70, maxMarks: 79, grade: 'B+', gradePoint: 3.2, description: 'Very Good' },
  { minMarks: 60, maxMarks: 69, grade: 'B', gradePoint: 2.8, description: 'Good' },
  { minMarks: 50, maxMarks: 59, grade: 'C+', gradePoint: 2.4, description: 'Satisfactory' },
  { minMarks: 40, maxMarks: 49, grade: 'C', gradePoint: 2.0, description: 'Acceptable' },
  { minMarks: 35, maxMarks: 39, grade: 'D', gradePoint: 1.6, description: 'Basic' },
  { minMarks: 0, maxMarks: 34, grade: 'NG', gradePoint: 0.0, description: 'Not Graded' }
];

function calculateNEBGrade(marks: number): { grade: string; gradePoint: number } {
  const scale = NEB_GRADE_SCALE.find(s => marks >= s.minMarks && marks <= s.maxMarks);
  if (!scale) throw new Error('Invalid marks');
  return { grade: scale.grade, gradePoint: scale.gradePoint };
}

function calculateWeightedMarks(
  theoryMarks: number,
  practicalMarks: number,
  theoryWeight: number = 75,
  practicalWeight: number = 25
): number {
  return (theoryMarks * theoryWeight / 100) + (practicalMarks * practicalWeight / 100);
}

function calculateGPA(subjects: Array<{ creditHours: number; gradePoint: number }>): number {
  const totalWeightedPoints = subjects.reduce(
    (sum, s) => sum + (s.creditHours * s.gradePoint),
    0
  );
  const totalCreditHours = subjects.reduce((sum, s) => sum + s.creditHours, 0);
  
  if (totalCreditHours === 0) return 0;
  
  return Number((totalWeightedPoints / totalCreditHours).toFixed(2));
}

function calculateAggregateGPA(class11GPA: number, class12GPA: number): number {
  return Number(((class11GPA + class12GPA) / 2).toFixed(2));
}
```

### Payment Gateway Integration

**eSewa Integration**:

```typescript
interface ESewaPaymentRequest {
  amount: number;
  taxAmount: number;
  totalAmount: number;
  transactionUuid: string;
  productCode: string;
  productServiceCharge: number;
  successUrl: string;
  failureUrl: string;
}

async function initiateESewaPayment(invoice: Invoice): Promise<string> {
  const paymentRequest: ESewaPaymentRequest = {
    amount: invoice.totalAmount,
    taxAmount: 0,
    totalAmount: invoice.totalAmount,
    transactionUuid: generateUUID(),
    productCode: process.env.ESEWA_PRODUCT_CODE,
    productServiceCharge: 0,
    successUrl: `${process.env.APP_URL}/payment/esewa/success`,
    failureUrl: `${process.env.APP_URL}/payment/esewa/failure`
  };
  
  // Generate signature
  const message = `total_amount=${paymentRequest.totalAmount},transaction_uuid=${paymentRequest.transactionUuid},product_code=${paymentRequest.productCode}`;
  const signature = generateHMAC(message, process.env.ESEWA_SECRET_KEY);
  
  // Store pending payment
  await paymentRepository.createPending({
    invoiceId: invoice.id,
    transactionId: paymentRequest.transactionUuid,
    gateway: 'esewa',
    amount: paymentRequest.totalAmount
  });
  
  // Return eSewa payment URL
  return `https://uat.esewa.com.np/epay/main?${new URLSearchParams({
    ...paymentRequest,
    signature
  })}`;
}

async function verifyESewaPayment(transactionUuid: string): Promise<boolean> {
  const response = await axios.get(
    `https://uat.esewa.com.np/api/epay/transaction/status/?product_code=${process.env.ESEWA_PRODUCT_CODE}&total_amount=${amount}&transaction_uuid=${transactionUuid}`
  );
  
  if (response.data.status === 'COMPLETE') {
    // Verify signature
    const isValid = verifySignature(response.data);
    return isValid;
  }
  
  return false;
}
```

**Khalti Integration**:

```typescript
interface KhaltiPaymentRequest {
  return_url: string;
  website_url: string;
  amount: number;
  purchase_order_id: string;
  purchase_order_name: string;
}

async function initiateKhaltiPayment(invoice: Invoice): Promise<string> {
  const response = await axios.post(
    'https://khalti.com/api/v2/epayment/initiate/',
    {
      return_url: `${process.env.APP_URL}/payment/khalti/callback`,
      website_url: process.env.APP_URL,
      amount: invoice.totalAmount * 100, // Khalti uses paisa
      purchase_order_id: invoice.invoiceNumber,
      purchase_order_name: `Fee Payment - ${invoice.invoiceNumber}`
    },
    {
      headers: {
        'Authorization': `Key ${process.env.KHALTI_SECRET_KEY}`
      }
    }
  );
  
  // Store pending payment
  await paymentRepository.createPending({
    invoiceId: invoice.id,
    transactionId: response.data.pidx,
    gateway: 'khalti',
    amount: invoice.totalAmount
  });
  
  return response.data.payment_url;
}

async function verifyKhaltiPayment(pidx: string): Promise<boolean> {
  const response = await axios.post(
    'https://khalti.com/api/v2/epayment/lookup/',
    { pidx },
    {
      headers: {
        'Authorization': `Key ${process.env.KHALTI_SECRET_KEY}`
      }
    }
  );
  
  return response.data.status === 'Completed';
}
```

**IME Pay Integration**:

```typescript
interface IMEPayPaymentRequest {
  MerchantCode: string;
  Amount: number;
  RefId: string;
  Method: string;
  RespUrl: string;
  CancelUrl: string;
}

async function initiateIMEPayPayment(invoice: Invoice): Promise<string> {
  const paymentRequest: IMEPayPaymentRequest = {
    MerchantCode: process.env.IMEPAY_MERCHANT_CODE,
    Amount: invoice.totalAmount,
    RefId: invoice.invoiceNumber,
    Method: 'GET',
    RespUrl: `${process.env.APP_URL}/payment/imepay/success`,
    CancelUrl: `${process.env.APP_URL}/payment/imepay/cancel`
  };
  
  // Generate token
  const token = generateIMEPayToken(paymentRequest);
  
  // Store pending payment
  await paymentRepository.createPending({
    invoiceId: invoice.id,
    transactionId: paymentRequest.RefId,
    gateway: 'ime_pay',
    amount: invoice.totalAmount
  });
  
  return `https://payment.imepay.com.np:7979/WebCheckout/Checkout?${new URLSearchParams({
    ...paymentRequest,
    TokenId: token
  })}`;
}
```

### SMS Integration (Nepal)

**Sparrow SMS Integration**:

```typescript
interface SMSMessage {
  to: string;
  text: string;
  from?: string;
}

async function sendSMS(message: SMSMessage): Promise<boolean> {
  try {
    const response = await axios.post(
      'http://api.sparrowsms.com/v2/sms/',
      {
        token: process.env.SPARROW_SMS_TOKEN,
        from: message.from || process.env.SPARROW_SMS_SENDER_ID,
        to: message.to,
        text: message.text
      }
    );
    
    // Log SMS
    await smsRepository.create({
      recipient: message.to,
      message: message.text,
      gateway: 'sparrow',
      status: 'sent',
      gatewayMessageId: response.data.response_code
    });
    
    return response.data.response_code === '200';
  } catch (error) {
    logger.error('SMS sending failed', { error, message });
    return false;
  }
}

async function sendBulkSMS(messages: SMSMessage[]): Promise<void> {
  // Rate limiting: 10 SMS per second
  const chunks = chunkArray(messages, 10);
  
  for (const chunk of chunks) {
    await Promise.all(chunk.map(msg => sendSMS(msg)));
    await sleep(1000); // Wait 1 second between batches
  }
}

// SMS Templates
const SMS_TEMPLATES = {
  attendance_alert: (studentName: string, date: string) => 
    `प्रिय अभिभावक, ${studentName} ${date} मा अनुपस्थित हुनुहुन्थ्यो। - ${process.env.SCHOOL_NAME}`,
  
  fee_reminder: (studentName: string, amount: number, dueDate: string) =>
    `प्रिय अभिभावक, ${studentName} को रु. ${amount} शुल्क ${dueDate} सम्म बुझाउनुहोस्। - ${process.env.SCHOOL_NAME}`,
  
  exam_schedule: (studentName: string, subject: string, date: string, time: string) =>
    `${studentName} को ${subject} परीक्षा ${date}, ${time} मा छ। - ${process.env.SCHOOL_NAME}`,
  
  grade_published: (studentName: string, gpa: number) =>
    `${studentName} को परीक्षा परिणाम प्रकाशित भएको छ। GPA: ${gpa} - ${process.env.SCHOOL_NAME}`
};
```

### Nepali Language Support

**Translation System**:

```typescript
// i18n configuration
const translations = {
  en: {
    student: 'Student',
    attendance: 'Attendance',
    examination: 'Examination',
    fee: 'Fee',
    // ... more translations
  },
  np: {
    student: 'विद्यार्थी',
    attendance: 'उपस्थिति',
    examination: 'परीक्षा',
    fee: 'शुल्क',
    // ... more translations
  }
};

// Nepali number formatting
function formatNepaliNumber(num: number): string {
  return num.toLocaleString('ne-NP');
}

// Currency formatting
function formatNPR(amount: number, locale: 'en' | 'np'): string {
  const formatted = amount.toLocaleString(locale === 'np' ? 'ne-NP' : 'en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
  
  return locale === 'np' ? `रू ${formatted}` : `Rs. ${formatted}`;
}

// Nepali Unicode keyboard support
function setupNepaliInput() {
  // Support for Nepali Unicode input
  // Romanized Nepali input (e.g., "namaste" → "नमस्ते")
  // Traditional Nepali keyboard layout
}
```

## Offline-First Architecture

### Service Worker Strategy

**Caching Strategy**:

```typescript
// service-worker.ts
import { precacheAndRoute } from 'workbox-precaching';
import { registerRoute } from 'workbox-routing';
import { CacheFirst, NetworkFirst, StaleWhileRevalidate } from 'workbox-strategies';
import { ExpirationPlugin } from 'workbox-expiration';

// Precache static assets
precacheAndRoute(self.__WB_MANIFEST);

// Cache-first for static assets
registerRoute(
  ({ request }) => request.destination === 'style' || 
                   request.destination === 'script' ||
                   request.destination === 'image',
  new CacheFirst({
    cacheName: 'static-assets',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 30 * 24 * 60 * 60 // 30 days
      })
    ]
  })
);

// Network-first for API calls
registerRoute(
  ({ url }) => url.pathname.startsWith('/api/'),
  new NetworkFirst({
    cacheName: 'api-cache',
    networkTimeoutSeconds: 10,
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 5 * 60 // 5 minutes
      })
    ]
  })
);

// Stale-while-revalidate for student/class data
registerRoute(
  ({ url }) => url.pathname.match(/\/api\/v1\/(students|classes|subjects)/),
  new StaleWhileRevalidate({
    cacheName: 'master-data',
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 24 * 60 * 60 // 24 hours
      })
    ]
  })
);
```

### Offline Queue Management

**IndexedDB for Offline Storage**:

```typescript
import Dexie from 'dexie';

class OfflineDatabase extends Dexie {
  attendanceQueue: Dexie.Table<OfflineAttendance, string>;
  gradeQueue: Dexie.Table<OfflineGrade, string>;
  cachedStudents: Dexie.Table<Student, string>;
  cachedClasses: Dexie.Table<Class, string>;

  constructor() {
    super('SchoolManagementOfflineDB');
    
    this.version(1).stores({
      attendanceQueue: 'id, classId, date, syncStatus',
      gradeQueue: 'id, examId, studentId, syncStatus',
      cachedStudents: 'id, studentId, currentClass',
      cachedClasses: 'id, gradeLevel, section'
    });
  }
}

const db = new OfflineDatabase();

// Queue attendance for offline sync
async function queueAttendance(attendance: AttendanceRecord[]): Promise<void> {
  await db.attendanceQueue.bulkAdd(
    attendance.map(a => ({ ...a, syncStatus: 'pending' }))
  );
}

// Sync queued operations when online
async function syncOfflineQueue(): Promise<void> {
  if (!navigator.onLine) return;
  
  // Sync attendance
  const pendingAttendance = await db.attendanceQueue
    .where('syncStatus')
    .equals('pending')
    .toArray();
  
  for (const record of pendingAttendance) {
    try {
      await api.post('/api/v1/attendance/student/mark', record);
      await db.attendanceQueue.update(record.id, { syncStatus: 'synced' });
    } catch (error) {
      await db.attendanceQueue.update(record.id, { syncStatus: 'error' });
      logger.error('Sync failed', { record, error });
    }
  }
  
  // Sync grades
  const pendingGrades = await db.gradeQueue
    .where('syncStatus')
    .equals('pending')
    .toArray();
  
  for (const grade of pendingGrades) {
    try {
      await api.post('/api/v1/exams/grades', grade);
      await db.gradeQueue.update(grade.id, { syncStatus: 'synced' });
    } catch (error) {
      await db.gradeQueue.update(grade.id, { syncStatus: 'error' });
    }
  }
}

// Listen for online event
window.addEventListener('online', () => {
  syncOfflineQueue();
});
```

### Conflict Resolution

**Last-Write-Wins Strategy**:

```typescript
interface SyncConflict {
  localVersion: any;
  serverVersion: any;
  field: string;
}

async function handleSyncConflict(
  conflict: SyncConflict,
  strategy: 'server-wins' | 'client-wins' | 'prompt-user' = 'server-wins'
): Promise<any> {
  switch (strategy) {
    case 'server-wins':
      return conflict.serverVersion;
    
    case 'client-wins':
      return conflict.localVersion;
    
    case 'prompt-user':
      // Show UI dialog for user to choose
      return await promptUserForConflictResolution(conflict);
  }
}
```

### Low-Bandwidth Optimization

**Image Compression**:

```typescript
import imageCompression from 'browser-image-compression';

async function compressImage(
  file: File,
  maxSizeKB: number = 200
): Promise<File> {
  const options = {
    maxSizeMB: maxSizeKB / 1024,
    maxWidthOrHeight: 800,
    useWebWorker: true,
    fileType: 'image/jpeg'
  };
  
  try {
    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch (error) {
    logger.error('Image compression failed', { error });
    throw error;
  }
}
```

**Progressive Loading**:

```typescript
// Load data in chunks
async function loadStudentsProgressively(
  classId: string,
  pageSize: number = 20
): Promise<void> {
  let page = 1;
  let hasMore = true;
  
  while (hasMore) {
    const response = await api.get(`/api/v1/students`, {
      params: { classId, page, limit: pageSize }
    });
    
    // Update UI with chunk
    updateStudentList(response.data.data);
    
    hasMore = response.data.meta.page < response.data.meta.totalPages;
    page++;
    
    // Small delay to prevent overwhelming the UI
    await sleep(100);
  }
}
```

**Lite Mode**:

```typescript
// Detect slow connection
function isSlowConnection(): boolean {
  const connection = (navigator as any).connection;
  if (!connection) return false;
  
  return connection.effectiveType === '2g' || 
         connection.effectiveType === 'slow-2g' ||
         connection.saveData === true;
}

// Enable lite mode
if (isSlowConnection()) {
  // Disable animations
  document.body.classList.add('lite-mode');
  
  // Reduce image quality
  setImageQuality('low');
  
  // Limit concurrent requests
  setMaxConcurrentRequests(2);
  
  // Show lite mode indicator
  showLiteModeNotification();
}
```

---

## Security Considerations

### Input Validation and Sanitization

**Backend Validation**:

```typescript
import { body, param, query, validationResult } from 'express-validator';
import DOMPurify from 'isomorphic-dompurify';

// Validation middleware
const validateStudentCreation = [
  body('firstNameEn').trim().isLength({ min: 1, max: 100 }).escape(),
  body('email').optional().isEmail().normalizeEmail(),
  body('phone').optional().matches(/^[0-9]{10}$/),
  body('dateOfBirthBS').matches(/^\d{4}-\d{2}-\d{2}$/),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_FAILED',
          message: 'Validation failed',
          details: errors.array()
        }
      });
    }
    next();
  }
];

// SQL injection prevention
function sanitizeSQL(input: string): string {
  // Use parameterized queries (already handled by ORM)
  // Additional sanitization for dynamic queries
  return input.replace(/['";\\]/g, '');
}

// XSS prevention
function sanitizeHTML(input: string): string {
  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: [], // No HTML tags allowed
    ALLOWED_ATTR: []
  });
}
```

### Rate Limiting

```typescript
import rateLimit from 'express-rate-limit';

// General API rate limit
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100, // 100 requests per minute
  message: 'Too many requests, please try again later'
});

// Strict rate limit for authentication
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  skipSuccessfulRequests: true,
  message: 'Too many login attempts, please try again later'
});

app.use('/api/', apiLimiter);
app.use('/api/v1/auth/login', authLimiter);
```

### CORS Configuration

```typescript
import cors from 'cors';

const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
```

---

*Design Document Version: 1.0*
*Last Updated: 2082-10-24 BS (2026-02-06 AD)*
*Optimized for Nepal Education System*

