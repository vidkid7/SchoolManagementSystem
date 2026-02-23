# Complete System Roles and Admin Capabilities

## System Roles Overview

Your School Management System has **13 distinct user roles**, each with specific permissions and capabilities:

### 1. **School Admin** (SCHOOL_ADMIN)

**Description:** Full school management, user management, system configuration, all reports

**Full Access Level:** Complete control over the entire system

### 2. **Subject Teacher** (SUBJECT_TEACHER)

**Description:** Attendance marking for assigned subjects, grade entry, lesson planning

### 3. **Class Teacher** (CLASS_TEACHER)

**Description:** Class management, overall student monitoring, parent communication

### 4. **Department Head** (DEPARTMENT_HEAD)

**Description:** Department management, teacher supervision

### 5. **ECA Coordinator** (ECA_COORDINATOR)

**Description:** ECA activity management, student participation tracking

### 6. **Sports Coordinator** (SPORTS_COORDINATOR)

**Description:** Sports management, team records, tournaments

### 7. **Student** (STUDENT)

**Description:** View academic data, submit assignments, take exams, library access

### 8. **Parent** (PARENT)

**Description:** View child data, fee payment, teacher communication, leave application

### 9. **Librarian** (LIBRARIAN)

**Description:** Library management, book circulation, fine collection

### 10. **Accountant** (ACCOUNTANT)

**Description:** Fee management, payment processing, financial reports

### 11. **Transport Manager** (TRANSPORT_MANAGER)

**Description:** Transport management, route planning, GPS tracking

### 12. **Hostel Warden** (HOSTEL_WARDEN)

**Description:** Hostel management, room allocation, attendance

### 13. **Non-Teaching Staff** (NON_TEACHING_STAFF)

**Description:** View notices, mark attendance, apply for leave

---

## Permission Categories (16 Total)

The system uses granular permissions across 16 categories:

1. **STUDENT** - Student management
2. **STAFF** - Staff management
3. **ACADEMIC** - Academic management (classes, subjects, years)
4. **ATTENDANCE** - Attendance tracking
5. **EXAMINATION** - Exam and grading management
6. **FINANCE** - Fee and payment management
7. **LIBRARY** - Library operations
8. **TRANSPORT** - Transport management
9. **HOSTEL** - Hostel management
10. **ECA** - Extra-curricular activities
11. **SPORTS** - Sports management
12. **COMMUNICATION** - Internal messaging
13. **DOCUMENT** - Document management
14. **CERTIFICATE** - Certificate generation
15. **REPORT** - Reports and analytics
16. **SYSTEM** - System configuration

### Permission Actions

Each permission has an action type:

- **CREATE** - Create new records
- **READ** - View records
- **UPDATE** - Modify existing records
- **DELETE** - Remove records
- **MANAGE** - Full control (all CRUD operations)

---

## School Admin Complete Capabilities

When a user logs in with the **School Admin** role, they have access to ALL of the following:

### 2. STAFF MANAGEMENT MODULE

**Full Access (MANAGE permission)**

#### Staff Records

- ✅ Create new staff records
- ✅ View all staff details
- ✅ Update staff information
- ✅ Delete staff records (soft delete)
- ✅ Upload staff photos
- ✅ View staff statistics

#### Staff Assignments

- ✅ Assign staff to classes
- ✅ Assign staff to subjects
- ✅ View staff assignments
- ✅ End staff assignments
- ✅ View class teachers
- ✅ View subject teachers

#### Staff Documents

- ✅ Upload staff documents (certificates, contracts, etc.)
- ✅ Bulk upload documents (up to 10 at once)
- ✅ View all staff documents
- ✅ View document statistics
- ✅ View document versions
- ✅ View expired documents
- ✅ View documents expiring soon
- ✅ Update document details
- ✅ Delete documents

### 3. ACADEMIC MANAGEMENT MODULE

**Full Access (MANAGE permission)**

#### Academic Structure

- ✅ Create academic years
- ✅ Manage classes/grades
- ✅ Manage subjects
- ✅ Assign subjects to classes
- ✅ Create class sections
- ✅ Manage academic calendar

---

### 4. ADMISSION MANAGEMENT MODULE

**Full Access (School_Admin only)**

#### Complete Admission Workflow

- ✅ Create new inquiries
- ✅ View all admissions/inquiries
- ✅ Convert inquiry to application
- ✅ Schedule admission tests
- ✅ Record admission test scores
- ✅ Schedule interviews
- ✅ Record interview feedback
- ✅ Admit applicants
- ✅ Enroll admitted students (convert to student record)
- ✅ Reject applicants
- ✅ View admission statistics and reports
- ✅ Filter admissions by status, class, date

---

### 5. ATTENDANCE MANAGEMENT MODULE

**Full Access (MANAGE permission)**

#### Attendance Operations

- ✅ Mark student attendance
- ✅ Mark staff attendance
- ✅ View attendance reports
- ✅ Edit attendance records
- ✅ Delete attendance records
- ✅ Generate attendance statistics
- ✅ Configure attendance rules

---

### 6. EXAMINATION MANAGEMENT MODULE

**Full Access (MANAGE permission)**

#### Exam Operations

- ✅ Create exam schedules
- ✅ Manage exam types (internal/external)
- ✅ Create exam papers
- ✅ Enter grades
- ✅ Generate report cards
- ✅ Publish results
- ✅ View exam statistics
- ✅ Configure grading schemes

---

### 7. FINANCE MANAGEMENT MODULE

**Full Access (MANAGE permission)**

#### Fee Management

- ✅ Create fee structures
- ✅ View all fee structures
- ✅ Update fee structures
- ✅ Delete fee structures
- ✅ Assign fees to students/classes

#### Invoice Management

- ✅ Generate invoices
- ✅ View all invoices
- ✅ Update invoice status
- ✅ Send invoice reminders

#### Payment Management

- ✅ Record payments
- ✅ View payment history
- ✅ Process refunds
- ✅ View payment statistics
- ✅ Generate financial reports

#### Payment Gateway

- ✅ Configure eSewa integration
- ✅ Configure Khalti integration
- ✅ Configure IME Pay integration
- ✅ View gateway transactions
- ✅ Process online payments

---

### 8. LIBRARY MANAGEMENT MODULE

**Full Access (MANAGE permission)**

#### Library Operations

- ✅ Add books to catalog
- ✅ Update book information
- ✅ Delete books
- ✅ Issue books to students/staff
- ✅ Return books
- ✅ Calculate and collect fines
- ✅ View borrowing history
- ✅ Generate library reports
- ✅ Manage book categories

---

### 9. ECA (EXTRA-CURRICULAR ACTIVITIES) MODULE

**Full Access (MANAGE permission)**

#### ECA Management

- ✅ Create new ECAs (clubs, activities)
- ✅ View all ECAs
- ✅ Update ECA details
- ✅ Delete ECAs
- ✅ Enroll students in ECAs
- ✅ Mark ECA attendance
- ✅ Record student achievements
- ✅ Create ECA events
- ✅ View ECA events
- ✅ View student ECA history
- ✅ Filter by category, status, coordinator

---

### 10. SPORTS MANAGEMENT MODULE

**Full Access (MANAGE permission)**

#### Sports Management

- ✅ Create sports
- ✅ View all sports
- ✅ Update sport details
- ✅ Enroll students in sports
- ✅ Mark practice attendance

#### Team Management

- ✅ Create teams
- ✅ View all teams
- ✅ Update team details
- ✅ Assign students to teams

#### Tournament Management

- ✅ Create tournaments
- ✅ View all tournaments
- ✅ Record match results
- ✅ Track tournament progress

#### Achievement Tracking

- ✅ Record student sports achievements
- ✅ View student sports history
- ✅ Generate sports reports

---

### 11. COMMUNICATION MODULE

**Full Access (CREATE, READ, UPDATE, DELETE permissions)**

#### Internal Communication

- ✅ Send messages to staff
- ✅ Send messages to parents
- ✅ Send messages to students
- ✅ View all messages
- ✅ Update message status
- ✅ Delete messages
- ✅ Create announcements
- ✅ Send bulk notifications

---

### 12. DOCUMENT MANAGEMENT MODULE

**Full Access (CREATE, READ, UPDATE, DELETE permissions)**

#### Document Operations

- ✅ Upload documents
- ✅ View all documents
- ✅ Update document metadata
- ✅ Delete documents
- ✅ Version control
- ✅ Document search
- ✅ Document preview
- ✅ Access control management
- ✅ Set document expiry dates
- ✅ View expired documents

---

### 13. CERTIFICATE MANAGEMENT MODULE

**Full Access (CREATE, READ, UPDATE, DELETE permissions)**

#### Certificate Operations

- ✅ Create certificate templates
- ✅ Generate certificates
- ✅ View all certificates
- ✅ Update certificate details
- ✅ Delete certificates
- ✅ Bulk certificate generation
- ✅ Certificate verification
- ✅ Digital signature integration

---

### 14. CALENDAR MODULE

**Full Access**

#### Calendar Management

- ✅ Create events
- ✅ View all events
- ✅ Update events
- ✅ Delete events
- ✅ Manage holidays (Nepal holidays pre-seeded)
- ✅ Bikram Sambat calendar support
- ✅ Academic calendar management

---

### 15. BACKUP & RESTORE MODULE

**Exclusive Access (School_Admin only)**

#### Backup Operations

- ✅ Create manual backups
- ✅ List all available backups
- ✅ Restore from backup
- ✅ Verify backup integrity
- ✅ Clean up old backups
- ✅ View backup configuration
- ✅ Configure automatic backup schedule
- ✅ Set backup retention policy

---

### 16. ARCHIVE MANAGEMENT MODULE

**Exclusive Access (School_Admin only)**

#### Archive Operations

- ✅ Archive academic year data
- ✅ View all archives
- ✅ View archive details
- ✅ Restore archived data
- ✅ Delete expired archives
- ✅ Clean up old archives

---

### 17. SYSTEM CONFIGURATION MODULE

**Exclusive Access (School_Admin only)**

#### School Configuration

- ✅ View school configuration
- ✅ Create school configuration
- ✅ Update school details
- ✅ Upload school logo
- ✅ Deactivate configuration
- ✅ Configure branding (colors, theme)
- ✅ Configure localization (language, date format)

#### System Settings

- ✅ Manage grading schemes
- ✅ Configure attendance rules
- ✅ Manage notification templates
- ✅ Configure date format preferences
- ✅ Set academic year settings
- ✅ Configure system-wide defaults

#### Role & Permission Management

- ✅ Create custom roles
- ✅ View all roles
- ✅ Update role details
- ✅ Delete custom roles (system roles protected)
- ✅ Create custom permissions
- ✅ View all permissions
- ✅ Update permission details
- ✅ Delete custom permissions
- ✅ Assign permissions to roles
- ✅ Remove permissions from roles
- ✅ View role-permission matrix

---

### 18. AUDIT LOG MODULE

**Full Access (MANAGE permission)**

#### Audit Operations

- ✅ View all audit logs
- ✅ Filter by user, action, resource
- ✅ View timeline visualization
- ✅ Export audit logs
- ✅ View audit analytics
- ✅ Real-time audit log streaming
- ✅ Track all system changes

---

### 19. REPORTS & ANALYTICS MODULE

**Full Access (MANAGE permission)**

#### Report Generation

- ✅ Student reports
- ✅ Staff reports
- ✅ Attendance reports
- ✅ Financial reports
- ✅ Exam reports
- ✅ Library reports
- ✅ ECA reports
- ✅ Sports reports
- ✅ Admission reports
- ✅ Custom report builder
- ✅ Export to PDF/Excel
- ✅ Schedule automated reports

---

### 20. NOTIFICATION MANAGEMENT MODULE

**Full Access**

#### SMS Notifications

- ✅ Configure Sparrow SMS integration
- ✅ Send individual SMS
- ✅ Send bulk SMS
- ✅ View SMS history
- ✅ Check SMS balance
- ✅ Manage SMS templates
- ✅ Schedule SMS

#### Email Notifications

- ✅ Configure SMTP settings
- ✅ Send individual emails
- ✅ Send bulk emails
- ✅ View email history
- ✅ Manage email templates

#### Push Notifications

- ✅ Send push notifications
- ✅ View notification history
- ✅ Manage notification preferences

---

### 21. USER MANAGEMENT

**Full Access (via Staff/Student modules)**

#### User Operations

- ✅ Create user accounts
- ✅ View all users
- ✅ Update user details
- ✅ Deactivate users
- ✅ Reset user passwords
- ✅ Assign roles to users
- ✅ View user activity logs
- ✅ Manage user permissions

---

### 22. CV MANAGEMENT MODULE

**Full Access**

#### Student CV Operations

- ✅ Generate student CVs
- ✅ View CV data
- ✅ Update CV information
- ✅ Export CVs to PDF
- ✅ Include academic records
- ✅ Include ECA participation
- ✅ Include sports achievements
- ✅ Include certificates

---

## Admin Dashboard Features

When School Admin logs in, they see:

### Dashboard Widgets

- 📊 Total students count
- 📊 Total staff count
- 📊 Attendance statistics (today)
- 📊 Fee collection status
- 📊 Pending admissions
- 📊 Upcoming exams
- 📊 Library statistics
- 📊 Recent activities
- 📊 System health status

### Quick Actions

- ➕ Add new student
- ➕ Add new staff
- ➕ Create announcement
- ➕ Generate report
- 💾 Create backup
- 📧 Send notification

---

## Admin Permissions Summary

### School Admin Has:

- ✅ **65+ permissions** across all 16 categories
- ✅ **MANAGE** permission for: Students, Staff, Academic, Attendance, Examination, Finance, Library, ECA, Sports
- ✅ **Full CRUD** permissions for: Communication, Documents, Certificates
- ✅ **Exclusive access** to: Backup, Archive, System Configuration, Role Management
- ✅ **All reports** access
- ✅ **System management** capabilities

### What School Admin CANNOT Do:

- ❌ Delete system roles (13 default roles are protected)
- ❌ Delete system permissions (protected permissions)
- ❌ Access other schools' data (in multi-school mode)
- ❌ Bypass audit logging (all actions are logged)

---

## Security Features for Admin

### Authentication

- JWT-based authentication
- Refresh token rotation
- Session management with Redis
- Password complexity requirements
- Account lockout after failed attempts

### Authorization

- Role-based access control (RBAC)
- Permission-based authorization
- Resource ownership validation
- Audit trail for all actions

### Data Protection

- Sensitive data encryption
- SQL injection prevention
- XSS protection
- CSRF protection
- Rate limiting
- Input validation and sanitization

---

## API Endpoints Summary for School Admin

**Total API Endpoints Available:** 200+

### By Module:

- Student Management: 25+ endpoints
- Staff Management: 30+ endpoints
- Admission: 12 endpoints
- Finance: 20+ endpoints
- Examination: 15+ endpoints
- Library: 12+ endpoints
- ECA: 11 endpoints
- Sports: 15+ endpoints
- Backup: 6 endpoints
- Archive: 5 endpoints
- Configuration: 15+ endpoints
- Audit: 8+ endpoints
- Reports: 20+ endpoints
- Communication: 10+ endpoints
- Documents: 12+ endpoints
- Certificates: 8+ end
