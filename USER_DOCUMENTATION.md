# 📚 School Management System — User Documentation

> **Version:** 1.0 | **Last Updated:** March 2026
> **System URL (Production):** https://schoolmanagementsystem-production-4bb7.up.railway.app
> **Languages:** English 🇬🇧 / Nepali 🇳🇵

---

## Table of Contents

1. [System Overview](#1-system-overview)
2. [Getting Started](#2-getting-started)
3. [Role: School Admin](#3-school-admin)
4. [Role: Student](#4-student)
5. [Role: Parent](#5-parent)
6. [Role: Class Teacher](#6-class-teacher)
7. [Role: Subject Teacher](#7-subject-teacher)
8. [Role: Department Head](#8-department-head)
9. [Role: Accountant](#9-accountant)
10. [Role: Librarian](#10-librarian)
11. [Role: ECA Coordinator](#11-eca-coordinator)
12. [Role: Sports Coordinator](#12-sports-coordinator)
13. [Role: Hostel Warden](#13-hostel-warden)
14. [Role: Transport Manager](#14-transport-manager)
15. [Role: Non-Teaching Staff](#15-non-teaching-staff)
16. [Role: Municipality Admin](#16-municipality-admin)
17. [Admin Dashboard Modules](#17-admin-dashboard-modules)
18. [Backend API Reference](#18-backend-api-reference)
19. [Login Credentials (Production)](#19-login-credentials-production)

---

## 1. System Overview

The School Management System (SMS) is a comprehensive, multi-tenant web application designed to digitize every aspect of school operations — from student enrollment and attendance to finance, library, sports, and hostel management.

### Key Highlights

| Feature | Details |
|---------|---------|
| **Roles** | 15 distinct user roles with granular permissions |
| **Multi-School** | Municipality-level oversight across multiple schools |
| **Finance** | Online payments via eSewa, Khalti, IME Pay |
| **Languages** | Bilingual — English and Nepali |
| **Design** | Glassmorphic UI, iOS-inspired color palette, responsive |
| **Security** | JWT authentication, role-based access, audit logging |
| **Deployment** | Railway (production), Docker Compose (local) |

### Architecture

```
┌─────────────────────────────────────────────────┐
│                   Frontend                       │
│   React 18 · TypeScript · Material-UI · i18n     │
│   Vite build · Nginx (production)                │
├─────────────────────────────────────────────────┤
│                   Backend API                    │
│   Node.js · Express · Sequelize ORM              │
│   JWT Auth · Socket.IO · Rate Limiting           │
├─────────────────────────────────────────────────┤
│              MySQL 8.0 · Redis 7                 │
└─────────────────────────────────────────────────┘
```

---

## 2. Getting Started

### Logging In

1. Open the application URL in your browser.
2. Enter your **Username** and **Password**.
3. Click **Sign In**.
4. You will be redirected to your role-specific dashboard/portal.

### Switching Language

- Click the **language toggle** (🇬🇧 / 🇳🇵) in the top navigation bar.
- All page content, labels, buttons, and messages switch to the selected language.

### Navigation

- **Sidebar** — Main navigation menu (collapsible).
- **Top Bar** — Quick actions, notifications bell, language toggle, profile menu.
- **Breadcrumbs** — Shows your current location in the page hierarchy.

---

## 3. School Admin

**Role Code:** `School_Admin`
**Landing Page:** `/KMC/dashboard`
**Access Level:** Full school-wide control

### Overview

The School Admin has complete access to every module in the system. This is the primary administrator role responsible for configuring the school, managing users, overseeing academic operations, and generating reports.

### Accessible Modules

| Module | Path | Description |
|--------|------|-------------|
| Dashboard | `/dashboard` | Overview cards: total students, staff, classes, attendance rate, fee collection |
| Students | `/students` | Student list, create/edit student, bulk import, promote, transfer |
| Admissions | `/admissions` | Admission inquiries, applications, process workflow, enrollment |
| Staff | `/staff` | Staff list, create/edit staff, assign to classes, manage documents |
| Academic | `/academic` | Academic years, classes, subjects, timetable, syllabus management |
| Attendance | `/attendance` | Mark student/staff attendance, reports, leave management, settings |
| Examinations | `/examinations` | Create exams, grade entry, grading schemes, report cards |
| Finance | `/finance` | Fee structures, invoices, payments, refunds, payment gateways, reports |
| Library | `/library` | Book catalog, circulation (issue/return), categories, fines, reports |
| ECA | `/eca` | Extracurricular activities management, enrollment, events, achievements |
| Sports | `/sports` | Sports teams, tournaments, enrollment, results, achievements |
| Calendar | `/calendar` | School calendar, events, holidays, exam dates |
| Communication | `/communication/messages` | Direct messages, group messages |
| Announcements | `/communication/announcements` | School-wide and targeted announcements |
| Notifications | `/my-notifications` | System notification center |
| Reports | `/reports` | Comprehensive reports: enrollment, attendance, finance, exam, library, ECA, sports |
| Certificates | `/certificates` | Certificate templates, generation, verification |
| Documents | `/documents` | School document management, file uploads, version control |
| Users | `/users` | User account management, role assignment, password resets |
| Audit | `/audit` | Audit log viewer — track all system changes by user, action, timestamp |
| Settings | `/settings` | System settings, school configuration, role management, backup/restore |

### Key Actions

- **Add Student** — Register a new student with personal, academic, and guardian details.
- **Add Staff** — Create staff profiles with employment details, qualifications, and role assignment.
- **Generate Reports** — Export PDF/Excel reports for enrollment, attendance, finance, exams.
- **Create Backup** — Full database backup with download option.
- **Manage Users** — Create accounts, assign roles, reset passwords, lock/unlock accounts.
- **Configure School** — Update school name, logo, address, academic year settings, localization.

### Permissions (65+)

Includes but not limited to: `student.create`, `student.read`, `student.update`, `student.delete`, `staff.manage`, `finance.manage`, `library.manage`, `exam.manage`, `user.manage`, `settings.manage`, `audit.view`, `backup.manage`, `report.generate`.

---

## 4. Student

**Role Code:** `Student`
**Landing Page:** `/KMC/portal/student`
**Access Level:** Personal academic data only

### Overview

Students can view their own academic records, attendance, grades, timetable, and assignments. They can also interact with the library, participate in ECAs and sports, and communicate with teachers.

### Portal Features

| Section | Description |
|---------|-------------|
| **Dashboard Overview** | Attendance percentage, GPA, upcoming exams, pending assignments |
| **Attendance Tab** | View daily/monthly attendance records, present/absent/late status |
| **Grades Tab** | Subject-wise grades, GPA, exam results, report cards |
| **Timetable Tab** | Weekly class timetable with subject, teacher, room, and time |
| **Assignments Tab** | View assigned work, submit completed assignments, check feedback |

### Accessible Pages

| Page | Path | Description |
|------|------|-------------|
| Student Portal | `/portal/student` | Main dashboard with tabs |
| Library Search | `/library/search` | Browse and search the book catalog |
| Calendar | `/calendar` | School events and exam dates |
| Announcements | `/communication/announcements` | School notices |
| Messages | `/communication/messages` | Chat with teachers |
| ECA Enrollment | `/eca` | Browse and enroll in extracurricular activities |
| Sports Enrollment | `/sports` | Browse and enroll in sports |
| Notifications | `/my-notifications` | Personal notifications |

### Key Actions

- **View Timetable** — See weekly class schedule.
- **Submit Assignment** — Upload completed homework/projects.
- **Check Grades** — View subject grades and exam results.
- **Search Library** — Find books, check availability.
- **Enroll in ECA/Sports** — Register for extracurricular activities.
- **Message Teacher** — Send direct messages to teachers.
- **Download CV** — Generate and download academic CV.

### Limitations

- ❌ Cannot view other students' data
- ❌ Cannot modify academic records
- ❌ Cannot access admin, finance, or staff modules

---

## 5. Parent

**Role Code:** `Parent`
**Landing Page:** `/KMC/portal/parent`
**Access Level:** Child's academic data only

### Overview

Parents can monitor their child's academic progress, attendance, grades, fees, and communicate with teachers. If a parent has multiple children in the school, they can switch between children's profiles.

### Portal Features

| Section | Description |
|---------|-------------|
| **Child Overview** | Quick stats — attendance rate, GPA, pending fees, upcoming exams |
| **Attendance** | View child's daily attendance records |
| **Grades** | Subject-wise marks, GPA, progress tracking |
| **Fee Status** | Outstanding fees, payment history, download receipts |
| **Assignments** | Track child's homework status and teacher feedback |

### Accessible Pages

| Page | Path | Description |
|------|------|-------------|
| Parent Portal | `/portal/parent` | Main dashboard |
| Library Search | `/library/search` | Browse the school library |
| Calendar | `/calendar` | School events |
| Announcements | `/communication/announcements` | School notices |
| Messages | `/communication/messages` | Chat with class teacher |
| Notifications | `/my-notifications` | Alerts and reminders |
| ECA Activities | `/eca` | View child's ECA participation |
| Sports | `/sports` | View child's sports participation |

### Key Actions

- **View Report Card** — Download child's report card PDF.
- **Pay Fees** — Make online payments via eSewa, Khalti, or IME Pay.
- **Apply for Leave** — Submit leave application on behalf of child.
- **Message Teacher** — Communicate with class teacher or subject teacher.
- **View Certificates** — Download child's certificates.

### Limitations

- ❌ Cannot view other students' data
- ❌ Cannot modify any records
- ❌ Cannot access admin or staff modules

---

## 6. Class Teacher

**Role Code:** `Class_Teacher`
**Landing Page:** `/KMC/portal/class-teacher`
**Access Level:** Assigned class management

### Overview

The Class Teacher manages a specific class — monitoring student attendance, tracking performance, communicating with parents, recording behavior, and overseeing the overall well-being of students in the class.

### Portal Features

| Section | Description |
|---------|-------------|
| **Class Overview** | Total students, average attendance, recent incidents, upcoming events |
| **Attendance** | Quick attendance marking for the class |
| **Student List** | Browse class roster with student details |
| **Behavior** | Record behavior incidents, praise, and disciplinary actions |
| **Messages** | Communicate with students and parents |
| **Schedule** | Class timetable and event schedule |

### Accessible Pages

| Page | Path | Description |
|------|------|-------------|
| Class Teacher Portal | `/portal/class-teacher` | Main dashboard |
| Attendance Marking | `/attendance` | Mark/edit class attendance |
| Student Details | `/students/:id` | View individual student records |
| Class Roster | `/teacher/class-roster` | View all students in class |
| Behavior Tracking | `/teacher/behavior` | Log behavior incidents |
| Assignment Management | `/teacher/assignments` | Create and grade assignments |
| Lesson Planning | `/teacher/lesson-plans` | Create and share lesson plans |
| Calendar | `/calendar` | Class events and deadlines |
| Messages | `/communication/messages` | Direct and group messaging |
| Announcements | `/communication/announcements` | Class announcements |
| ECA Management | `/eca` | ECA enrollment for class |
| Sports Management | `/sports` | Sports enrollment for class |
| Library | `/library` | Browse book catalog |
| Reports | `/reports` | Class-level reports |

### Key Actions

- **Mark Attendance** — Daily attendance for the class.
- **Record Behavior** — Log positive/negative behavior incidents.
- **Send to Parents** — Bulk or individual messages to parents.
- **Create Announcement** — Class-specific announcements.
- **Schedule Meeting** — Arrange parent-teacher meetings.
- **View Class Report** — Attendance and performance summary.

### Limitations

- ❌ Cannot access other classes
- ❌ Cannot modify school-wide settings
- ❌ Cannot access financial modules

---

## 7. Subject Teacher

**Role Code:** `Subject_Teacher`
**Landing Page:** `/KMC/teacher/dashboard`
**Access Level:** Assigned subjects only

### Overview

Subject Teachers handle subject-specific tasks — marking attendance, entering grades, creating assignments, and building lesson plans for the subjects and classes they are assigned to.

### Portal Features

| Section | Description |
|---------|-------------|
| **Dashboard** | Teaching load, upcoming classes, pending assignments to grade |
| **Quick Actions** | Mark attendance, Enter grades, Create assignment, Create lesson plan |
| **Schedule** | Weekly timetable for assigned classes |
| **Student Performance** | View grades/marks for assigned subjects |

### Accessible Pages

| Page | Path | Description |
|------|------|-------------|
| Teacher Dashboard | `/teacher/dashboard` | Main portal |
| Attendance Marking | `/attendance` | Mark attendance for assigned classes |
| Grade Entry | `/examinations/grade-entry` | Enter student grades |
| Assignment Management | `/teacher/assignments` | Create, distribute, grade assignments |
| Lesson Planning | `/teacher/lesson-plans` | Create and manage lesson plans |
| Class Roster | `/teacher/class-roster` | View students in assigned classes |
| Calendar | `/calendar` | Events and exam schedule |
| Messages | `/communication/messages` | Communicate with students and parents |
| Library Search | `/library/search` | Browse book catalog |

### Key Actions

- **Mark Attendance** — Daily attendance for assigned periods.
- **Enter Grades** — Input marks/scores for exams and assessments.
- **Create Assignment** — Distribute homework with due dates.
- **Grade Assignment** — Review submissions and provide feedback.
- **Create Lesson Plan** — Weekly/monthly lesson plans with objectives and resources.

### Limitations

- ❌ Cannot access other teachers' classes/subjects
- ❌ Cannot modify student records
- ❌ Cannot access admin, finance, or setting modules

---

## 8. Department Head

**Role Code:** `Department_Head`
**Landing Page:** `/KMC/portal/department-head`
**Access Level:** Department-wide oversight

### Overview

The Department Head oversees all teachers and subjects within their department. They review lesson plans, monitor student performance department-wide, evaluate teachers, and generate departmental reports.

### Portal Features

| Section | Description |
|---------|-------------|
| **Department Overview** | Total teachers, subjects, classes, performance metrics |
| **Teacher Management** | View department teachers, their schedules, and performance |
| **Curriculum Monitoring** | Track syllabus coverage and lesson plan completion |
| **Reports** | Department-level academic and attendance reports |
| **Announcements** | Department-specific notices |

### Accessible Pages

| Page | Path | Description |
|------|------|-------------|
| Department Head Portal | `/portal/department-head` | Main dashboard |
| Attendance | `/attendance` | View/monitor department attendance |
| Student Records | `/students` | View students in department classes |
| Grade Entry | `/examinations/grade-entry` | Monitor grade entry by teachers |
| Lesson Plans | `/teacher/lesson-plans` | Review and approve lesson plans |
| Assignments | `/teacher/assignments` | Monitor assignment distribution |
| Calendar | `/calendar` | Department events |
| Messages | `/communication/messages` | Communicate with department staff |
| Reports | `/reports` | Generate department-level reports |
| ECA | `/eca` | Monitor department ECA involvement |
| Sports | `/sports` | Monitor department sports involvement |

### Key Actions

- **Review Lesson Plans** — Approve or provide feedback on teacher lesson plans.
- **Evaluate Teachers** — Conduct performance evaluations.
- **Generate Reports** — Department performance, attendance, and curriculum coverage reports.
- **Send Announcements** — Department-wide notifications.
- **Monitor Performance** — Track student grades across department subjects.

### Limitations

- ❌ Cannot access other departments
- ❌ Cannot modify individual student records
- ❌ Cannot enter grades directly (delegated to teachers)

---

## 9. Accountant

**Role Code:** `Accountant`
**Landing Page:** `/KMC/portal/accountant`
**Access Level:** Full finance module

### Overview

The Accountant manages all financial operations — fee structures, invoicing, payment collection, refunds, payment gateway configuration, and financial reporting.

### Portal Features

| Section | Description |
|---------|-------------|
| **Finance Dashboard** | Total collection, outstanding fees, recent payments, monthly trend chart |
| **Fee Structures** | Create and manage fee categories (tuition, transport, hostel, exam, etc.) |
| **Invoices** | Generate, send, track invoice status |
| **Payments** | Record cash/cheque/bank/online payments |
| **Refunds** | Process fee refunds |
| **Reports** | Collection reports, outstanding reports, payment method analysis |

### Accessible Pages

| Page | Path | Description |
|------|------|-------------|
| Accountant Portal | `/portal/accountant` | Main dashboard |
| Finance Dashboard | `/finance` | Financial overview |
| Fee Structures | `/finance/fee-structures` | Manage fee categories and amounts |
| Invoice List | `/finance/invoices` | View all invoices |
| Invoice Generation | `/finance/invoices/generate` | Create new invoices |
| Payments | `/finance/payments` | Record and track payments |
| Refunds | `/finance/refunds` | Process refund requests |
| Student Fee Search | `/finance/student-search` | Look up student fee details |
| Financial Reports | `/finance/reports` | Generate financial reports |
| Payment Gateways | `/finance/gateways` | Configure eSewa, Khalti, IME Pay |
| Admissions | `/admissions` | View admission fee requirements |

### Key Actions

- **Record Payment** — Accept cash, cheque, bank transfer, or online payment.
- **Generate Invoice** — Create fee invoices for students.
- **Process Refund** — Handle fee refund requests.
- **Send Reminder** — Send payment reminders to parents.
- **Export Report** — Download financial reports as PDF/Excel.
- **Configure Gateways** — Set up online payment integrations.

### Limitations

- ❌ Cannot modify academic records
- ❌ Cannot access staff salary data
- ❌ Cannot delete payment records (audit trail preserved)
- ❌ Cannot access admin settings or user management

---

## 10. Librarian

**Role Code:** `Librarian`
**Landing Page:** `/KMC/portal/librarian`
**Access Level:** Full library module

### Overview

The Librarian manages the school library — cataloging books, handling issue/return transactions, managing categories, tracking overdue items, collecting fines, and generating circulation reports.

### Portal Features

| Section | Description |
|---------|-------------|
| **Library Dashboard** | Total books, currently issued, overdue count, popular books |
| **Book Catalog** | Search, add, edit, delete books |
| **Circulation** | Issue books, process returns, renewals |
| **Categories** | Manage book categories and genres |
| **Fines** | Calculate and collect late return fines |
| **Reports** | Circulation, overdue, most-borrowed, inventory reports |

### Accessible Pages

| Page | Path | Description |
|------|------|-------------|
| Librarian Portal | `/portal/librarian` | Main dashboard |
| Library Dashboard | `/library` | Library overview |
| Book Catalog | `/library/catalog` | Browse/search/manage books |
| Book Circulation | `/library/circulation` | Issue and return books |
| Categories | `/library/categories` | Manage book categories |
| Library Reports | `/library/reports` | Generate library reports |
| Library Management | `/library/management` | Bulk operations, inventory |

### Key Actions

- **Add Book** — Register new books with ISBN, title, author, category, copies.
- **Issue Book** — Check out a book to a student or staff member.
- **Return Book** — Process book returns, calculate overdue fines.
- **Collect Fine** — Record fine payment for overdue books.
- **Generate Report** — Circulation stats, popular books, overdue list.
- **Search Catalog** — Full-text search across books by title, author, ISBN.

### Limitations

- ❌ Cannot modify student or staff records
- ❌ Cannot access financial modules
- ❌ Cannot access admin settings

---

## 11. ECA Coordinator

**Role Code:** `ECA_Coordinator`
**Landing Page:** `/KMC/portal/eca-coordinator`
**Access Level:** Extracurricular activities management

### Overview

The ECA Coordinator manages all extracurricular activities — creating clubs, enrolling students, organizing events, recording achievements, and tracking participation statistics.

### Portal Features

| Section | Description |
|---------|-------------|
| **ECA Dashboard** | Total activities, active participants, upcoming events, achievements |
| **Activities** | Create and manage clubs, groups, activities |
| **Events** | Schedule events, competitions, performances |
| **Achievements** | Record student achievements, awards, certificates |
| **Enrollment** | Manage student enrollment in activities |
| **Statistics** | Participation rates, activity popularity |

### Accessible Pages

| Page | Path | Description |
|------|------|-------------|
| ECA Coordinator Portal | `/portal/eca-coordinator` | Main dashboard |
| ECA Dashboard | `/eca` | ECA overview |
| ECA List | `/eca/list` | All activities |
| ECA Management | `/eca/manage` | Create, edit, delete activities |

### Key Actions

- **Create Activity** — New club, society, or group with description, schedule, capacity.
- **Enroll Student** — Add students to activities, manage waiting lists.
- **Create Event** — Schedule competitions, shows, exhibitions.
- **Record Achievement** — Log awards, certificates, recognitions.
- **Mark Attendance** — Track activity participation.
- **Generate Report** — Participation rates, popular activities, student involvement.

### Limitations

- ❌ Cannot modify academic records
- ❌ Cannot access financial info
- ❌ Cannot manage sports (separate coordinator)

---

## 12. Sports Coordinator

**Role Code:** `Sports_Coordinator`
**Landing Page:** `/KMC/portal/sports-coordinator`
**Access Level:** Sports program management

### Overview

The Sports Coordinator manages the school's sports program — creating teams, organizing tournaments, tracking match results, recording achievements, and generating sports reports.

### Portal Features

| Section | Description |
|---------|-------------|
| **Sports Dashboard** | Total sports, active athletes, upcoming tournaments, recent results |
| **Teams** | Create and manage sports teams |
| **Tournaments** | Organize inter/intra-school competitions |
| **Results** | Record match scores and standings |
| **Achievements** | Medals, trophies, records |
| **Enrollment** | Student sport registration |

### Accessible Pages

| Page | Path | Description |
|------|------|-------------|
| Sports Coordinator Portal | `/portal/sports-coordinator` | Main dashboard |
| Sports Dashboard | `/sports` | Sports overview |
| Sports Management | `/sports/manage` | Create, edit sports and teams |

### Key Actions

- **Create Sport** — Register new sport with rules, schedule, coach.
- **Create Team** — Form teams with player assignments.
- **Create Tournament** — Schedule tournaments with brackets and fixtures.
- **Record Results** — Enter match scores, update standings.
- **Record Achievement** — Log medals, trophies, records.
- **Generate Report** — Participation, performance, tournament summaries.

### Limitations

- ❌ Cannot manage ECAs (separate coordinator)
- ❌ Cannot modify academic records
- ❌ Cannot access financial modules

---

## 13. Hostel Warden

**Role Code:** `Hostel_Warden`
**Landing Page:** `/KMC/portal/hostel`
**Access Level:** Hostel facility management

### Overview

The Hostel Warden manages the school's residential facilities — room assignments, hostel attendance, leave processing, discipline, visitor management, and facility maintenance.

### Portal Features

| Section | Description |
|---------|-------------|
| **Hostel Dashboard** | Total residents, room occupancy rate, pending leaves, recent incidents |
| **Room Management** | Assign/reassign students to rooms, view floor plan |
| **Attendance** | Mark hostel check-in/check-out |
| **Leave Management** | Approve/reject student leave requests |
| **Discipline** | Record incidents, warnings, actions taken |
| **Visitors** | Register visitor entry/exit |
| **Maintenance** | Track facility issues and repairs |

### Key Actions

- **Assign Room** — Allocate student to a room based on availability.
- **Mark Attendance** — Daily hostel roll call (morning and evening).
- **Process Leave** — Approve or reject student leave requests.
- **Record Incident** — Log disciplinary issues, curfew violations, etc.
- **Register Visitor** — Record parent/guardian visits with time stamps.
- **Schedule Maintenance** — Report and track facility repairs.

### Limitations

- ❌ Cannot modify academic records
- ❌ Cannot access financial data
- ❌ Cannot manage users or system settings

---

## 14. Transport Manager

**Role Code:** `Transport_Manager`
**Landing Page:** `/KMC/portal/transport`
**Access Level:** Transport operations

### Overview

The Transport Manager oversees the school's transport system — managing vehicles, defining routes, assigning drivers, tracking students, scheduling maintenance, and ensuring safety compliance.

### Portal Features

| Section | Description |
|---------|-------------|
| **Transport Dashboard** | Total vehicles, active routes, students enrolled, maintenance due |
| **Vehicles** | Register vehicles, track insurance, maintenance schedule |
| **Routes** | Define routes with stops, timing, assigned vehicle |
| **Drivers** | Assign drivers to vehicles, manage licenses |
| **Student Assignment** | Assign students to routes, pick-up/drop-off points |
| **Safety** | Inspections, incidents, insurance tracking |

### Key Actions

- **Add Vehicle** — Register with license plate, capacity, insurance details.
- **Create Route** — Define route with stops, timings, fare.
- **Assign Driver** — Link driver to vehicle and route.
- **Assign Student** — Allocate student to pick-up/drop-off route.
- **Schedule Maintenance** — Plan vehicle servicing and repairs.
- **Record Incident** — Log accidents, breakdowns, safety violations.

### Limitations

- ❌ Cannot modify academic records
- ❌ Cannot access financial data directly
- ❌ Cannot manage school settings

---

## 15. Non-Teaching Staff

**Role Code:** `Non_Teaching_Staff`
**Landing Page:** `/KMC/portal/non-teaching-staff`
**Access Level:** Personal work management

### Overview

Non-Teaching Staff (office assistants, cleaners, security, lab technicians, etc.) have access to their own attendance, leave management, tasks, and basic communication features.

### Portal Features

| Section | Description |
|---------|-------------|
| **Dashboard** | Quick stats — attendance, leave balance, pending tasks |
| **Attendance** | View own attendance history |
| **Leave** | Apply for leave, check leave balance and status |
| **Tasks** | View assigned tasks, update task progress |
| **Requests** | Submit maintenance or supply requests |
| **Messages** | View announcements, receive notifications |

### Key Actions

- **Mark Attendance** — Clock in/out for daily attendance.
- **Apply for Leave** — Submit sick, casual, or annual leave requests.
- **Update Task** — Change task status (pending → in progress → completed).
- **Submit Request** — Request supplies, report maintenance issues.
- **View Messages** — Read school-wide and targeted announcements.

### Limitations

- ❌ Cannot access student or academic data
- ❌ Cannot access financial data
- ❌ Cannot access admin or configuration settings

---

## 16. Municipality Admin

**Role Code:** `Municipality_Admin`
**Landing Page:** `/KMC/municipality`
**Access Level:** Multi-school oversight

### Overview

The Municipality Admin oversees all schools within a municipality. They can view consolidated statistics, create new schools, assign school administrators, and monitor school-level performance across the municipality.

### Portal Features

| Section | Description |
|---------|-------------|
| **Municipality Dashboard** | Total schools, total students, total staff, performance overview |
| **School List** | View all schools with status, student count, staff count |
| **Create School** | Register new schools under the municipality |
| **Assign Admin** | Create and assign School Admin accounts to schools |
| **Reports** | Municipality-level consolidated reports |
| **Incidents** | Track safety and compliance incidents across schools |

### Key Actions

- **Create School** — Register a new school with name, code, address.
- **Assign Admin** — Create a School Admin account and link to a school.
- **View Statistics** — Municipality-wide student, staff, and school counts.
- **Monitor Performance** — Comparative analytics across schools.
- **Send Announcements** — Municipality-wide notices to all schools.
- **View Audit Logs** — Track administrative actions across schools.

### Limitations

- ❌ Cannot manage individual school operations (delegated to School Admins)
- ❌ Cannot directly access student or staff records within schools
- ❌ Cannot modify classroom-level data

---

## 17. Admin Dashboard Modules

These modules are accessible from the School Admin dashboard sidebar:

### Students Module

| Sub-Page | Path | Description |
|----------|------|-------------|
| Student List | `/students` | Paginated list with search, filter by class/section/status |
| Student Detail | `/students/:id` | Full profile — personal info, academics, attendance, fees |
| Student Library | `/students/:id/library` | Student's borrowed books and history |
| Bulk Import | (via Student List) | Import students from Excel/CSV |

### Admissions Module

| Sub-Page | Path | Description |
|----------|------|-------------|
| Dashboard | `/admissions` | Pipeline overview — inquiries, applications, enrolled |
| Admission List | `/admissions/list` | All admission records with status filters |
| New Inquiry | `/admissions/new-inquiry` | Create new admission inquiry |
| Admission Detail | `/admissions/:id` | Full admission workflow — interview, test, decision |

### Staff Module

| Sub-Page | Path | Description |
|----------|------|-------------|
| Staff List | `/staff` | All staff with role, department, status filters |
| Staff Detail | `/staff/:id` | Full profile — employment, qualifications, attendance |
| Staff Documents | `/staff/:id/documents` | Upload/manage staff documents |

### Academic Module

| Sub-Page | Path | Description |
|----------|------|-------------|
| Dashboard | `/academic` | Academic year overview |
| Academic Years | `/academic/years` | Manage academic years and terms |
| Class Management | `/academic/classes` | Create/edit classes and sections |
| Class Subjects | `/academic/subjects` | Assign subjects to classes |
| Timetable | `/academic/timetable` | Build weekly timetables |
| Syllabus | `/academic/syllabus` | Upload and manage syllabi |

### Attendance Module

| Sub-Page | Path | Description |
|----------|------|-------------|
| Attendance Marking | `/attendance` | Mark daily student attendance |
| Staff Attendance | `/attendance/staff` | Mark staff attendance |
| Reports | `/attendance/reports` | Attendance reports by class, student, date range |
| Leave Management | `/attendance/leave` | Approve/reject leave applications |
| Settings | `/attendance/settings` | Configure attendance rules and thresholds |

### Examinations Module

| Sub-Page | Path | Description |
|----------|------|-------------|
| Exam List | `/examinations` | All exams with status |
| Create Exam | `/examinations/create` | Schedule new exam with subjects, dates |
| Exam Details | `/examinations/:id` | View exam details, enrolled students |
| Grade Entry | `/examinations/grade-entry` | Enter marks/scores |
| Grading Scheme | `/examinations/grading` | Configure grading scales (A/B/C or percentage) |
| Report Cards | `/examinations/report-cards` | Generate student report cards |

### Finance Module

| Sub-Page | Path | Description |
|----------|------|-------------|
| Dashboard | `/finance` | Financial overview with collection stats |
| Fee Structures | `/finance/fee-structures` | Define fee categories and amounts |
| Invoice List | `/finance/invoices` | View all invoices |
| Generate Invoice | `/finance/invoices/generate` | Create new invoices |
| Payments | `/finance/payments` | Record and track payments |
| Refunds | `/finance/refunds` | Process refund requests |
| Student Search | `/finance/student-search` | Look up student fee details |
| Reports | `/finance/reports` | Financial reports |
| Payment Gateways | `/finance/gateways` | Configure eSewa, Khalti, IME Pay |

### Library Module

| Sub-Page | Path | Description |
|----------|------|-------------|
| Dashboard | `/library` | Library overview stats |
| Book Catalog | `/library/catalog` | Browse, search, manage books |
| Circulation | `/library/circulation` | Issue and return books |
| Categories | `/library/categories` | Manage book categories |
| Reports | `/library/reports` | Circulation and inventory reports |
| Management | `/library/management` | Bulk operations, settings |

### ECA Module

| Sub-Page | Path | Description |
|----------|------|-------------|
| Dashboard | `/eca` | ECA overview |
| Activity List | `/eca/list` | All ECAs with enrollment count |
| Management | `/eca/manage` | Create, edit, delete activities |

### Sports Module

| Sub-Page | Path | Description |
|----------|------|-------------|
| Dashboard | `/sports` | Sports overview |
| Management | `/sports/manage` | Create sports, teams, tournaments |

### Calendar Module

| Sub-Page | Path | Description |
|----------|------|-------------|
| Calendar | `/calendar` | Monthly calendar view |
| Event Management | `/calendar/events` | Create and manage events |

### Communication Module

| Sub-Page | Path | Description |
|----------|------|-------------|
| Messages | `/communication/messages` | Direct and group messaging |
| Announcements | `/communication/announcements` | Create and manage announcements |

### Other Modules

| Module | Path | Description |
|--------|------|-------------|
| Notifications | `/my-notifications` | Notification center |
| Reports | `/reports` | Comprehensive report generator |
| Certificates | `/certificates` | Template management, generation, verification |
| Documents | `/documents` | School document management |
| Users | `/users` | User account management |
| Audit | `/audit` | System audit logs |
| Settings | `/settings` | System configuration |
| Role Management | `/settings/roles` | Manage roles and permissions |
| System Settings | `/settings/system` | System-wide configuration |
| Backup | `/settings/backup` | Database backup and restore |
| Archive | `/settings/archive` | Archive old data |

---

## 18. Backend API Reference

The backend API is organized into 31 modules:

| Module | Base Path | Description |
|--------|-----------|-------------|
| Auth | `/api/v1/auth` | Login, logout, token refresh, password reset |
| Users | `/api/v1/users` | User CRUD, role assignment |
| Students | `/api/v1/students` | Student records management |
| Staff | `/api/v1/staff` | Staff records management |
| Academic | `/api/v1/academic` | Classes, subjects, timetable, syllabus |
| Admissions | `/api/v1/admissions` | Admission workflow |
| Attendance | `/api/v1/attendance` | Attendance marking and reports |
| Examinations | `/api/v1/examinations` | Exam management, grades, report cards |
| Finance | `/api/v1/finance` | Fee structures, invoices, payments |
| Library | `/api/v1/library` | Book catalog, circulation, fines |
| ECA | `/api/v1/eca` | Extracurricular activities |
| Sports | `/api/v1/sports` | Sports, teams, tournaments |
| Calendar | `/api/v1/calendar` | Events and holidays |
| Communication | `/api/v1/messages` | Messaging system |
| Announcements | `/api/v1/announcements` | Announcement management |
| Notifications | `/api/v1/notifications` | Push notifications |
| Certificates | `/api/v1/certificates` | Certificate generation |
| Documents | `/api/v1/documents` | Document management |
| Reports | `/api/v1/reports` | Report generation |
| Audit | `/api/v1/audit` | Audit log access |
| Config | `/api/v1/config` | School configuration |
| Backup | `/api/v1/backup` | Backup management |
| Hostel | `/api/v1/hostel` | Hostel management |
| Transport | `/api/v1/transport` | Transport management |
| Payment Gateway | `/api/v1/payment-gateway` | Online payment processing |
| Assignments | `/api/v1/assignments` | Assignment management |
| Lesson Plans | `/api/v1/lesson-plans` | Lesson plan management |
| Department | `/api/v1/departments` | Department management |
| CV | `/api/v1/cv` | Student CV generation |
| Parent | `/api/v1/parent` | Parent portal API |
| Municipality Admin | `/api/v1/municipality-admin` | Municipality management |

---

## 19. Login Credentials (Production)

**Backend URL:** `https://schoolmanagementsystem-production-4bb7.up.railway.app`
**API Base:** `https://schoolmanagementsystem-production-4bb7.up.railway.app/api/v1`

| # | Role | Username | Password |
|---|------|----------|----------|
| 1 | School Admin | `admin_school` | `Admin@123` |
| 2 | Class Teacher | `ct_school` | `Teacher@123` |
| 3 | Subject Teacher | `st_school` | `Teacher@123` |
| 4 | Department Head | `dh_school` | `DeptHead@123` |
| 5 | ECA Coordinator | `eca_school` | `ECACoord@123` |
| 6 | Sports Coordinator | `sc_school` | `SportsCoord@123` |
| 7 | Librarian | `lib_school` | `Librarian@123` |
| 8 | Accountant | `acc_school` | `Accountant@123` |
| 9 | Transport Manager | `tm_school` | `Transport@123` |
| 10 | Hostel Warden | `hw_school` | `Hostel@123` |
| 11 | Non-Teaching Staff | `nts_school` | `Staff@123` |
| 12 | Municipality Admin | `municipalityadmin` | `Municipality@123` |
| 13 | Student | `student_0001` | `Student@123` |
| 14 | Parent | `parent_0001` | `Parent@123` |

**Students:** `student_0001` to `student_0150` (150 accounts)
**Parents:** `parent_0001` to `parent_0150` (50 accounts, every 3rd student has a parent)

---

*End of User Documentation*
