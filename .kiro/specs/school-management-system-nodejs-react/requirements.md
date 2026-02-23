# Requirements Document: School Management System (Node.js + React.js)
# Optimized for Nepal Education System (Class 1-12)

## Introduction

This document specifies the requirements for a comprehensive School Management System built with Node.js (backend) and React.js (frontend). The system will support school-level operations with role-based access control, and comprehensive modules for managing all aspects of school operations including academics, attendance, examinations, finance, library, and enhanced features like parent portal, online examinations, and real-time notifications.

**Target Audience:** Schools in Nepal from Class 1 to Class 12 (including SEE and NEB curriculum)

**Primary Focus:**
- Alignment with Nepal's National Examination Board (NEB) grading system
- Support for both Bikram Sambat (BS) and AD calendar systems
- Integration with Nepali payment gateways (eSewa, Khalti, IME Pay)
- Offline-first architecture for areas with limited connectivity
- Low-bandwidth optimization for 2G/3G networks
- Bilingual support (Nepali and English)

---

## System Architecture Overview

**Backend Architecture:**
- Framework: Node.js with Express.js (modular monolith - NOT microservices)
- Database: MySQL with connection pooling and InnoDB engine
- Cache Layer: Redis for session management and frequently accessed data
- Authentication: JWT with refresh token mechanism
- Real-time Communication: Socket.IO for WebSocket connections
- File Storage: Local storage with optional cloud storage (AWS S3 or compatible)
- API Documentation: Swagger/OpenAPI 3.0
- Push Notifications: Firebase Cloud Messaging (FCM)

**Simplified Backend Structure:**

The backend SHALL be organized into domain-specific modules deployed as a monolith:

- **Auth Module**: User authentication, authorization, JWT management
- **Academic Module**: Classes, subjects, timetables, syllabus, academic year management
- **Student Module**: Student records, enrollment, promotion, admission workflow
- **Staff Module**: Staff records, assignments, leave management
- **Attendance Module**: Student and staff attendance tracking, biometric integration
- **Examination Module**: Exam creation, grading, report cards (NEB-compliant)
- **Finance Module**: Fee management, payment processing, transactions, receipts
- **Library Module**: Book catalog, circulation, reservations, fines
- **Transport Module**: Routes, vehicles, drivers, GPS tracking
- **Hostel Module**: Room allocation, hostel attendance, visitor management
- **ECA Module**: Extra-curricular activities, participation tracking, events
- **Sports Module**: Sports management, team records, tournaments, achievements
- **Counseling Module**: Student counseling, well-being tracking (optional/Phase 2)
- **Notification Module**: Real-time notifications, SMS, email
- **Communication Module**: Chat, messaging, announcements
- **Document Module**: File storage, document management
- **Certificate Module**: Certificate generation, templates
- **Report Module**: Dashboard data, reports, visualizations

Each module SHALL:
- Have clear boundaries and responsibilities
- Expose well-defined REST APIs
- Be independently testable
- Support future extraction if needed

**Frontend Architecture:**
- Framework: React.js 18+ with TypeScript
- State Management: Redux Toolkit or Zustand
- UI Framework: Material-UI with custom Nepal-focused theme
- Routing: React Router v6 with role-based route guards
- API Client: Axios with interceptors
- Real-time: Socket.IO client
- PWA Support: Service Workers for offline capability (PRIORITY)
- Mobile Apps: PWA first, React Native in Phase 4 (optional)

**Separate Frontend Portals:**

- **Admin Portal**: Full school management with comprehensive analytics
- **Teacher Portal**: Class management, grading, attendance
- **Student Portal**: Academic information, assignments, exams
- **Parent Portal**: Child monitoring, fee payment, communication
- **Library Portal**: Library operations and circulation
- **Finance Portal**: Financial management and reporting
- **Staff Portal**: Non-teaching staff operations

**Note:** Additional specialized portals (Transport, Hostel, ECA, Sports, Counseling, Exam Cell) can be implemented as sections within Admin Portal rather than separate portals to reduce complexity.

**Deployment Architecture:**
- Containerization: Docker and Docker Compose
- Cloud Platform: DigitalOcean or local server (Nepal-based hosting encouraged)
- Load Balancer: Nginx
- CI/CD: GitHub Actions or GitLab CI
- Monitoring: Simple logging with file rotation (ELK Stack optional for Phase 3)

**Security Architecture:**
- HTTPS/TLS encryption for all communications
- JWT-based authentication with refresh tokens
- Role-Based Access Control (RBAC) at API level
- Input validation and sanitization
- SQL injection prevention using parameterized queries
- XSS and CSRF protection
- Rate limiting

---

## User Roles and Permissions Matrix

| Role | Key Permissions | Portal Access |
|------|----------------|---------------|
| **School_Admin** | Full school management, user management, system configuration, all reports | Admin Portal with full dashboard |
| **Subject_Teacher** | Attendance marking for assigned subjects only, grade entry for assigned subjects, lesson planning | Teacher Portal with subject-specific view |
| **Class_Teacher** | Class management, overall student monitoring, parent communication | Teacher Portal with class analytics |
| **Department_Head** | Department management, teacher supervision (Optional/Phase 2) | Admin Portal - Department Section |
| **ECA_Coordinator** | ECA activity management, student participation tracking | Admin Portal - ECA Section |
| **Sports_Coordinator** | Sports management, team records, tournaments | Admin Portal - Sports Section |
| **Student** | View academic data, submit assignments, take exams, library access | Student Portal |
| **Parent** | View child data, fee payment, teacher communication, leave application | Parent Portal |
| **Librarian** | Library management, book circulation, fine collection | Library Portal |
| **Accountant** | Fee management, payment processing, financial reports | Finance Portal |
| **Transport_Manager** | Transport management, route planning, GPS tracking (Optional/Phase 3) | Admin Portal - Transport Section |
| **Hostel_Warden** | Hostel management, room allocation, attendance (Optional/Phase 3) | Admin Portal - Hostel Section |
| **Non_Teaching_Staff** | View notices, mark attendance, apply for leave | Staff Portal |

**Removed/Simplified Roles:**
- ~~Head_School~~ (Merged with School_Admin, multi-school support is Phase 4)
- ~~Counselor~~ (Optional Phase 3, can be managed by Class_Teacher initially)
- ~~Discipline_Officer~~ (Merged with School_Admin)
- ~~Exam_Controller~~ (Merged with School_Admin for smaller schools)

---

## Glossary

- **SMS**: School Management System - the complete application
- **NEB**: National Examination Board of Nepal
- **SEE**: Secondary Education Examination (Class 10 board exam)
- **BS_Calendar**: Bikram Sambat calendar system used in Nepal
- **AD_Calendar**: Anno Domini (Gregorian) calendar system
- **GPA**: Grade Point Average (4.0 scale as per NEB)
- **NPR**: Nepali Rupees (currency)
- **PWA**: Progressive Web App
- **Student_Portal**: Web interface for students
- **Parent_Portal**: Web interface for parents
- **Admin_Portal**: Administrative interface for school management
- **Teacher_Portal**: Interface for teachers
- **Library_Portal**: Interface for librarians
- **Finance_Portal**: Interface for accountants
- **Notification_Service**: Real-time notification system
- **Payment_Gateway**: Integration service for eSewa, Khalti, IME Pay
- **Academic_Year**: Period from Baisakh (April) to Chaitra (March) in Nepal
- **Credit_Hour**: Subject weightage for GPA calculation

---

## Nepal Education System Requirements

### Requirement N1: NEB Grading System Compliance

**User Story:** As a School_Admin, I want the system to follow Nepal's National Examination Board (NEB) grading system, so that all grades and GPAs are calculated correctly per government standards.

#### Acceptance Criteria

1. THE SMS SHALL implement the following NEB grading scale:

| Marks Range | Grade | Grade Point | Description |
|------------|-------|-------------|-------------|
| 90-100% | A+ | 4.0 | Outstanding |
| 80-89% | A | 3.6 | Excellent |
| 70-79% | B+ | 3.2 | Very Good |
| 60-69% | B | 2.8 | Good |
| 50-59% | C+ | 2.4 | Satisfactory |
| 40-49% | C | 2.0 | Acceptable |
| 35-39% | D | 1.6 | Basic |
| Below 35% | NG | 0.0 | Not Graded |

2. THE SMS SHALL calculate GPA using: GPA = Σ(Credit Hour × Grade Point) / Total Credit Hours
3. THE SMS SHALL support weighted grading (75% theory + 25% practical by default)
4. THE SMS SHALL support 50/50 theory-practical split for subjects like Computer Science
5. THE SMS SHALL mark students scoring below 35% as "Not Graded (NG)" without issuing certificate
6. THE SMS SHALL support grade improvement/re-examination for up to 2 subjects
7. THE SMS SHALL track re-examination attempts (maximum 3 attempts per subject)
8. THE SMS SHALL calculate aggregate GPA for Class 11-12 by averaging both years
9. THE SMS SHALL generate NEB-compliant mark sheets and transcripts

### Requirement N2: Subject Stream Management for Classes 11-12

**User Story:** As a School_Admin, I want to manage subject streams for Classes 11-12 as per NEB curriculum, so that students can be enrolled in appropriate subject combinations.

#### Acceptance Criteria

1. THE SMS SHALL manage compulsory subjects for Class 11:
   - Nepali
   - English
   - Social Studies
   - Mathematics OR Social Studies & Life Skills

2. THE SMS SHALL manage compulsory subjects for Class 12:
   - Nepali
   - English
   - Life Skill

3. THE SMS SHALL support optional subject selection (3-4 subjects from available pool):
   - **Science Stream:** Physics, Chemistry, Biology, Computer Science, Mathematics
   - **Management Stream:** Accounting, Economics, Business Studies, Computer Science, Finance, Marketing
   - **Humanities Stream:** Sociology, Political Science, History, Psychology, Education
   - **Technical:** Hotel Management, Tourism & Mountaineering

4. THE SMS SHALL validate subject combinations per NEB rules before enrollment
5. THE SMS SHALL support credit hour tracking per subject (minimum 100 hours/subject)
6. THE SMS SHALL allow schools to define which optional subjects they offer
7. THE SMS SHALL prevent invalid subject combinations

### Requirement N3: SEE (Class 10) Examination Support

**User Story:** As a School_Admin, I want to manage SEE examination for Class 10 students, so that they are properly prepared for the national board exam.

#### Acceptance Criteria

1. THE SMS SHALL support SEE compulsory subjects:
   - Nepali
   - English
   - Mathematics
   - Science
   - Social Studies
   - Health, Population, and Environmental Education

2. THE SMS SHALL support SEE optional subjects (school-specific additions)
3. THE SMS SHALL track minimum 35% requirement for each subject
4. THE SMS SHALL calculate GPA (minimum 1.6 required for Class 11 promotion)
5. THE SMS SHALL generate SEE preparation reports and mock exam schedules
6. THE SMS SHALL track practical exam marks separately (if applicable)
7. THE SMS SHALL support symbol number/registration number for SEE
8. THE SMS SHALL generate student performance reports for SEE preparation

### Requirement N4: Academic Calendar (Bikram Sambat)

**User Story:** As a user, I want to use both Bikram Sambat and AD calendar systems, so that I can work with Nepal's official calendar system.

#### Acceptance Criteria

1. THE SMS SHALL support both BS (Bikram Sambat) and AD calendar systems
2. THE SMS SHALL default to BS calendar for Nepal deployment
3. THE SMS SHALL allow users to toggle between BS and AD display
4. THE SMS SHALL display dates in format: YYYY-MM-DD BS (YYYY-MM-DD AD)
5. THE SMS SHALL support Nepal academic year: Baisakh (April) to Chaitra (March)
6. THE SMS SHALL include Nepal government holidays by default
7. THE SMS SHALL support date conversion between BS and AD
8. THE SMS SHALL display Nepali month names (Baisakh, Jestha, Asar, etc.)
9. THE SMS SHALL support Nepal exam schedules:
   - SEE: Chaitra (March-April)
   - NEB Class 11-12: Baisakh-Jestha (April-May)
   - Terminal Exams: Kartik (Oct-Nov), Magh (Jan-Feb)

### Requirement N5: Multi-Shift School Support

**User Story:** As a School_Admin, I want to manage multiple school shifts, so that I can support schools operating morning and day sections.

#### Acceptance Criteria

1. THE SMS SHALL support multiple shifts per school (Morning, Day, Evening)
2. THE SMS SHALL allow separate timetables per shift
3. THE SMS SHALL support teacher assignment across multiple shifts
4. THE SMS SHALL generate shift-wise attendance reports
5. THE SMS SHALL generate shift-wise fee collection reports
6. THE SMS SHALL manage shared resources across shifts (rooms, equipment)
7. THE SMS SHALL support different class timings per shift

### Requirement N6: Scholarship and Financial Aid Management

**User Story:** As a School_Admin, I want to manage various scholarship programs, so that I can track and distribute financial aid to eligible students.

#### Acceptance Criteria

1. THE SMS SHALL support scholarship categories:
   - Government quota scholarships (Dalit, Janajati, girls in STEM)
   - Municipality/Ward-level scholarships
   - School merit scholarships
   - Need-based scholarships
   - NGO/INGO sponsored scholarships

2. THE SMS SHALL track scholarship eligibility criteria
3. THE SMS SHALL manage scholarship application workflow
4. THE SMS SHALL generate scholarship disbursement reports
5. THE SMS SHALL support partial fee waivers
6. THE SMS SHALL alert when scholarship quotas are filled
7. THE SMS SHALL track government free education mandate (Class 1-10)

---

## Core Requirements

### Requirement 1: Role-Based Access Control and Authentication

**User Story:** As a system administrator, I want to implement role-based access control, so that users can only access features appropriate to their role.

#### Acceptance Criteria

1. THE Auth_Module SHALL support roles: School_Admin, Subject_Teacher, Class_Teacher, Department_Head, ECA_Coordinator, Sports_Coordinator, Student, Parent, Librarian, Accountant, Transport_Manager, Hostel_Warden, Non_Teaching_Staff
2. WHEN a user logs in, THE Auth_Module SHALL validate credentials and issue JWT token with role information
3. THE Auth_Module SHALL enforce token expiration (access token: 30 minutes, refresh token: 7 days)
4. WHEN a user attempts to access a protected resource, THE API SHALL verify JWT token and role permissions
5. THE SMS SHALL support role-based permissions at both module and feature level
6. THE SMS SHALL allow School_Admin to assign and modify user roles
7. WHEN a user's role changes, THE SMS SHALL invalidate existing tokens
8. THE Auth_Module SHALL log all authentication attempts for security auditing
9. THE Auth_Module SHALL implement account lockout after 5 failed login attempts within 15 minutes
10. THE SMS SHALL support "Remember Me" functionality with extended token validity
11. THE SMS SHALL support password reset via SMS or email

### Requirement 2: Student Management Module

**User Story:** As a School_Admin, I want to manage student information comprehensively, so that I can maintain accurate student records.

#### Acceptance Criteria

1. WHEN a School_Admin creates a student record, THE SMS SHALL capture:
   - Personal information (name in English and Nepali, DOB in BS/AD, gender, blood group)
   - Contact details (address, phone, guardian phone)
   - Guardian information (father, mother, local guardian with citizenship/ID numbers)
   - Enrollment details (admission date, previous school, admission class)
   - Health records (allergies, medical conditions, emergency contact)

2. THE SMS SHALL assign a unique student ID (school prefix + admission year + sequential number)
3. THE SMS SHALL assign Symbol Number for SEE students and NEB registration number
4. THE SMS SHALL support student enrollment in specific classes, sections, and shifts
5. WHEN a student transfers between sections, THE SMS SHALL maintain historical records
6. THE SMS SHALL store student documents (birth certificate, photos, medical records) in local storage
7. THE SMS SHALL support bulk student import via Excel files
8. WHEN a student record is updated, THE SMS SHALL maintain audit trail
9. THE SMS SHALL allow searching and filtering by name, class, section, roll number
10. THE SMS SHALL support student promotion to next grade level at year-end
11. THE SMS SHALL link students to parent accounts for portal access
12. THE SMS SHALL support student photo upload with compression (max 200KB)
13. THE SMS SHALL generate student ID cards with QR code

### Requirement 3: Student Admission and Registration Workflow

**User Story:** As a School_Admin, I want to manage the student admission process, so that I can track applicants and streamline admissions.

#### Acceptance Criteria

1. THE SMS SHALL support admission workflow: Inquiry → Application → Admission Test → Interview → Admission → Enrollment
2. WHEN a new inquiry is received, THE SMS SHALL create inquiry record with temporary ID
3. THE SMS SHALL allow conversion of inquiries to applications
4. WHEN an application is created, THE SMS SHALL collect required documents and application fee
5. THE SMS SHALL support online registration form for parents
6. THE SMS SHALL allow scheduling of admission tests and interviews
7. THE SMS SHALL allow recording of admission test scores and interview feedback
8. WHEN an applicant is admitted, THE SMS SHALL generate admission offer letter
9. THE SMS SHALL track document verification status (birth certificate, previous school records)
10. WHEN admission is confirmed and fees paid, THE SMS SHALL convert to enrolled student
11. THE SMS SHALL send SMS notifications to parents at each stage
12. THE SMS SHALL generate admission reports (applications received, admitted, pending)

### Requirement 4: Staff Management Module

**User Story:** As a School_Admin, I want to manage staff information and assignments, so that I can track teacher qualifications and performance.

#### Acceptance Criteria

1. WHEN a School_Admin creates a staff record, THE SMS SHALL capture:
   - Personal information (name, address, citizenship number)
   - Qualifications (degrees, certifications, teaching license)
   - Employment details (join date, position, salary grade)
   - Role assignments (class teacher, subject teacher, coordinator)

2. THE SMS SHALL assign unique staff ID
3. THE SMS SHALL support assignment of teachers to subjects, classes, and sections
4. WHEN a teacher is assigned to a class, THE SMS SHALL validate qualifications
5. THE SMS SHALL store staff documents (certificates, contracts, ID proofs)
6. THE SMS SHALL track staff attendance and leave records
7. THE SMS SHALL support department-based organization
8. WHEN a staff role changes, THE SMS SHALL update system permissions
9. THE SMS SHALL maintain historical records of all assignments
10. THE SMS SHALL support staff categories: Teaching, Non-Teaching, Administrative

### Requirement 5: Academic Management Module

**User Story:** As a School_Admin, I want to manage academic structures, so that I can organize the school's educational framework.

#### Acceptance Criteria

1. THE SMS SHALL support Academic_Year creation with BS date range (Baisakh to Chaitra)
2. THE SMS SHALL support multiple terms: First Terminal, Second Terminal, Third Terminal/Final
3. WHEN a School_Admin creates a class, THE SMS SHALL allow grade level (1-12), sections (A, B, C...), shift, and class teacher
4. THE SMS SHALL support subject creation with code, name, type (compulsory/optional), and credit hours
5. THE SMS SHALL allow assignment of subjects to specific classes per NEB curriculum
6. THE SMS SHALL support timetable creation with period-wise subject and teacher assignments
7. WHEN creating timetable, THE SMS SHALL validate no teacher conflicts
8. THE SMS SHALL support syllabus management with topic-wise breakdown
9. THE SMS SHALL allow teachers to mark syllabus completion status
10. THE SMS SHALL support academic calendar with holidays, events, and exam schedules
11. THE SMS SHALL support different subject configurations for Classes 1-10 vs 11-12

### Requirement 6: Attendance Management Module

**User Story:** As a Teacher, I want to record student attendance efficiently, so that I can track presence and generate reports.

#### Acceptance Criteria

1. WHEN a Teacher opens attendance, THE SMS SHALL display student list with photos
2. THE SMS SHALL allow marking: Present (P), Absent (A), Late (L), Excused (E)
3. THE SMS SHALL support one-click "Mark All Present" with exception marking
4. WHEN attendance is submitted, THE SMS SHALL record date, time, period, teacher
5. THE SMS SHALL support bulk attendance via Excel import
6. THE SMS SHALL allow attendance correction within 24-hour window
7. THE SMS SHALL calculate and display attendance percentage
8. WHEN attendance falls below 75%, THE SMS SHALL alert parent and admin via SMS
9. THE SMS SHALL support biometric device integration (optional)
10. THE SMS SHALL generate attendance reports by student, class, date range
11. THE SMS SHALL support leave application submission by students/parents
12. WHEN leave is approved, THE SMS SHALL mark corresponding dates as Excused
13. THE SMS SHALL work offline and sync when connectivity is restored
14. THE SMS SHALL support period-wise and day-wise attendance modes

### Requirement 7: Examination and Assessment Module

**User Story:** As a Teacher, I want to create and manage examinations, so that I can evaluate student performance per NEB standards.

#### Acceptance Criteria

1. WHEN a Teacher creates an examination, THE SMS SHALL capture:
   - Exam name and type (Unit Test, Terminal, Final, Practical, Project)
   - Subject, class, date, duration
   - Full marks, pass marks, theory/practical split

2. THE SMS SHALL support examination types per Nepal curriculum:
   - Unit Tests (multiple per term)
   - First Terminal Exam
   - Second Terminal Exam
   - Third Terminal/Final Exam
   - Practical Exams
   - Project Work

3. THE SMS SHALL create exam schedules with room assignments
4. WHEN creating schedule, THE SMS SHALL validate no student has overlapping exams
5. THE SMS SHALL support grade entry with marks, convert to NEB grades automatically
6. THE SMS SHALL calculate weighted grades across assessments
7. THE SMS SHALL generate Nepal-standard report cards (ledger format)
8. THE SMS SHALL allow parents/students to view results through portals
9. THE SMS SHALL support batch grade entry via Excel import
10. THE SMS SHALL calculate class rank, section rank, and percentile
11. THE SMS SHALL support internal assessment (25-50% weightage)
12. THE SMS SHALL generate subject-wise and overall performance analytics

### Requirement 8: Online Examination Module (Phase 2)

**User Story:** As a Teacher, I want to conduct online examinations with automated grading, so that I can assess students remotely.

#### Acceptance Criteria

1. THE SMS SHALL support question types: MCQ, True/False, Short Answer, Essay
2. THE SMS SHALL allow question bank creation by subject and difficulty level
3. THE SMS SHALL support question selection from bank or manual entry
4. THE SMS SHALL support question and answer randomization
5. WHEN a student starts exam, THE SMS SHALL display countdown timer
6. THE SMS SHALL auto-save responses every 30 seconds
7. WHEN timer expires, THE SMS SHALL auto-submit exam
8. THE SMS SHALL log exam activities (start time, tab switches, submission)
9. THE SMS SHALL auto-grade MCQ and True/False questions
10. THE SMS SHALL allow manual grading for Short Answer and Essay
11. THE SMS SHALL show results immediately for auto-graded questions
12. THE SMS SHALL generate exam analytics (pass rate, average score, question-wise analysis)

**Note:** Proctoring features (webcam monitoring, screen recording) are REMOVED due to privacy concerns and bandwidth limitations in Nepal context.

### Requirement 9: Finance and Fee Management Module

**User Story:** As an Accountant, I want to manage fee structures and track payments, so that I can maintain accurate financial records.

#### Acceptance Criteria

1. WHEN creating a Fee_Structure, THE SMS SHALL support fee types:
   - Admission Fee
   - Annual/Tuition Fee
   - Monthly Fee
   - Examination Fee
   - Transport Fee
   - Hostel Fee
   - Library Fee
   - Lab Fee
   - ECA Fee
   - Development Fee

2. THE SMS SHALL support different fee structures per class, shift, or category
3. THE SMS SHALL auto-generate fee invoices based on assigned structure
4. WHEN invoice is generated, THE SMS SHALL notify parent via SMS
5. THE SMS SHALL support payment methods: Cash, Bank Transfer, eSewa, Khalti, IME Pay
6. WHEN online payment is made, THE SMS SHALL verify via payment gateway callback
7. THE SMS SHALL record transactions with NPR amount, date, method, receipt number
8. THE SMS SHALL auto-update fee balance after payment
9. THE SMS SHALL generate receipts with school letterhead and QR code
10. THE SMS SHALL support fee concessions with approval workflow
11. THE SMS SHALL support installment payment plans (monthly, quarterly)
12. THE SMS SHALL generate reports: collection summary, pending fees, defaulters
13. WHEN fee is overdue, THE SMS SHALL send reminder via SMS (configurable intervals)
14. THE SMS SHALL support refund processing with approval
15. THE SMS SHALL allow parents to view breakdown and history in Parent_Portal
16. THE SMS SHALL support advance fee payment

### Requirement 10: Library Management Module

**User Story:** As a Librarian, I want to manage library resources and track circulation, so that I can maintain an organized library.

#### Acceptance Criteria

1. WHEN adding a Library_Item, THE SMS SHALL capture: title, author, ISBN, category, quantity, shelf location
2. THE SMS SHALL assign unique accession number to each physical copy
3. THE SMS SHALL support categorization: Textbooks, Reference, Fiction, Magazines, Newspapers
4. WHEN a book is borrowed, THE SMS SHALL record issue date, due date (configurable: 7, 14, 21 days)
5. THE SMS SHALL calculate late fees based on per-day fine rate
6. WHEN book is returned, THE SMS SHALL update availability status
7. THE SMS SHALL allow students to search and reserve books through portal
8. WHEN reserved book is available, THE SMS SHALL notify student via SMS/notification
9. THE SMS SHALL generate reports: most borrowed, overdue, member activity
10. THE SMS SHALL support barcode scanning for quick issue/return (optional)
11. THE SMS SHALL track damaged/lost books with penalty
12. THE SMS SHALL support e-book catalog with download links (Phase 3)
13. THE SMS SHALL limit concurrent borrowings per student (configurable: default 3 books)

### Requirement 11: Extra-Curricular Activities (ECA) Module

**User Story:** As an ECA Coordinator, I want to manage activities and student participation, so that I can track holistic development.

#### Acceptance Criteria

1. THE SMS SHALL support ECA categories:
   - Clubs (Debate, Quiz, Scout, Red Cross, Eco Club, etc.)
   - Cultural Activities (Music, Dance, Drama, Art)
   - Community Service
   - Leadership Programs

2. WHEN creating an ECA, THE SMS SHALL capture: name, type, schedule, coordinator, capacity
3. THE SMS SHALL support student enrollment in multiple ECAs
4. THE SMS SHALL track student participation and attendance in each ECA
5. THE SMS SHALL support event creation: competitions, performances, exhibitions
6. WHEN ECA event is scheduled, THE SMS SHALL notify enrolled students and parents
7. THE SMS SHALL allow recording of achievements and awards
8. THE SMS SHALL include ECA participation in student CV/report
9. THE SMS SHALL generate certificates for participation/achievement
10. THE SMS SHALL upload photos/videos from events

### Requirement 12: Sports Module

**User Story:** As a Sports Coordinator, I want to manage sports activities and achievements, so that I can track athletic development.

#### Acceptance Criteria

1. THE SMS SHALL support sports categories:
   - Individual Sports: Athletics, Table Tennis, Badminton, Swimming
   - Team Sports: Football, Cricket, Basketball, Volleyball
   - Traditional Sports: Dandi Biyo, Kabaddi

2. THE SMS SHALL support team management with captain and member list
3. THE SMS SHALL support student enrollment and team assignment
4. THE SMS SHALL track practice session attendance
5. THE SMS SHALL manage tournaments: date, venue, teams, match schedule
6. THE SMS SHALL record match results, scores, player statistics
7. THE SMS SHALL record achievements: medals, ranks, records
8. THE SMS SHALL generate certificates for participants and winners
9. THE SMS SHALL maintain school sports records (best performances)
10. THE SMS SHALL upload photos/videos from tournaments
11. THE SMS SHALL include sports achievements in student CV

### Requirement 13: Teacher Log and Lesson Planning Module

**User Story:** As a Teacher, I want to maintain teaching logs and lesson plans, so that I can track curriculum coverage.

#### Acceptance Criteria

1. WHEN creating lesson plan, THE SMS SHALL capture: topic, objectives, teaching methods, resources
2. THE SMS SHALL allow marking lesson completion status
3. THE SMS SHALL track actual vs planned syllabus coverage
4. THE SMS SHALL allow daily teaching logs with topics covered
5. THE SMS SHALL allow School_Admin to view and approve lesson plans (optional)
6. THE SMS SHALL generate syllabus completion reports by subject and class
7. THE SMS SHALL support lesson plan templates for common topics
8. THE SMS SHALL allow attaching teaching materials to lesson plans

---

## Portal Requirements

### Requirement 14: Student Portal

**User Story:** As a student, I want to access my academic information through a portal, so that I can stay informed about my progress.

#### Acceptance Criteria

1. THE Student_Portal SHALL display dashboard with: attendance summary, upcoming exams, pending assignments, recent grades, notifications
2. THE Student_Portal SHALL display interactive charts: attendance trends, grade progression
3. THE Student_Portal SHALL allow viewing complete timetable
4. THE Student_Portal SHALL allow viewing attendance records with percentage
5. THE Student_Portal SHALL allow viewing exam schedules with countdown
6. THE Student_Portal SHALL allow viewing grades and report cards with NEB grading
7. THE Student_Portal SHALL allow downloading study materials
8. THE Student_Portal SHALL allow submitting assignments online (file upload)
9. THE Student_Portal SHALL allow applying for leave
10. THE Student_Portal SHALL allow viewing library books and borrowing history
11. THE Student_Portal SHALL allow viewing fee invoices and payment history
12. THE Student_Portal SHALL allow participating in online exams
13. THE Student_Portal SHALL allow viewing ECA and sports enrollments
14. THE Student_Portal SHALL allow receiving real-time notifications
15. THE Student_Portal SHALL allow viewing announcements and calendar
16. THE Student_Portal SHALL allow downloading certificates and ID card
17. THE Student_Portal SHALL be mobile-responsive (PWA)
18. THE Student_Portal SHALL support Nepali and English languages
19. THE Student_Portal SHALL display dates in BS and AD formats
20. THE Student_Portal SHALL work offline for viewing cached data

### Requirement 15: Parent Portal

**User Story:** As a parent, I want to monitor my child's progress, so that I can stay engaged in their education.

#### Acceptance Criteria

1. THE Parent_Portal SHALL display dashboard with all children's summary (if multiple)
2. THE Parent_Portal SHALL display charts: attendance trends, grade progression
3. THE Parent_Portal SHALL allow viewing attendance with absence alerts
4. THE Parent_Portal SHALL allow viewing grades and report cards
5. THE Parent_Portal SHALL allow viewing and paying fee invoices online (eSewa, Khalti, IME Pay)
6. THE Parent_Portal SHALL allow downloading payment receipts
7. THE Parent_Portal SHALL allow applying for leave on child's behalf
8. THE Parent_Portal SHALL allow viewing teacher remarks and feedback
9. THE Parent_Portal SHALL allow messaging teachers
10. THE Parent_Portal SHALL allow viewing announcements and calendar
11. THE Parent_Portal SHALL allow downloading report cards and certificates
12. THE Parent_Portal SHALL allow viewing timetable and assignment submissions
13. THE Parent_Portal SHALL allow receiving real-time notifications (SMS and app)
14. THE Parent_Portal SHALL be mobile-responsive (PWA)
15. THE Parent_Portal SHALL support Nepali and English languages
16. THE Parent_Portal SHALL display dates in BS and AD formats

### Requirement 16: Teacher Portal

**User Story:** As a teacher, I want to manage my classes and view student analytics, so that I can effectively teach and monitor progress.

#### Acceptance Criteria

1. THE Teacher_Portal SHALL display dashboard: today's schedule, pending tasks, class performance
2. THE Teacher_Portal SHALL display charts: class attendance, grade distribution
3. THE Teacher_Portal SHALL allow viewing personal timetable
4. WHEN Subject_Teacher accesses portal, THE SMS SHALL restrict to assigned subjects only
5. THE Teacher_Portal SHALL allow marking attendance with one-click options
6. THE Teacher_Portal SHALL allow viewing student lists with photos
7. THE Teacher_Portal SHALL allow creating assignments with due dates
8. THE Teacher_Portal SHALL allow grading assignments and providing feedback
9. THE Teacher_Portal SHALL allow creating exams and entering grades
10. THE Teacher_Portal SHALL allow creating lesson plans and tracking syllabus
11. THE Teacher_Portal SHALL allow uploading study materials
12. THE Teacher_Portal SHALL allow messaging students and parents
13. THE Teacher_Portal SHALL allow viewing and approving leave applications (Class_Teacher)
14. THE Teacher_Portal SHALL allow recording student remarks
15. THE Teacher_Portal SHALL allow generating class reports (attendance, grades)
16. THE Teacher_Portal SHALL be mobile-responsive for on-the-go access
17. THE Teacher_Portal SHALL support Nepali and English languages
18. THE Teacher_Portal SHALL support Nepali Unicode keyboard input

### Requirement 17: Admin Portal

**User Story:** As a School_Admin, I want to manage all operations and view analytics, so that I can make data-driven decisions.

#### Acceptance Criteria

1. THE Admin_Portal SHALL display dashboard: total students, staff count, attendance rate, fee collection, exam performance
2. THE Admin_Portal SHALL display charts: enrollment trends, fee collection, attendance patterns
3. THE Admin_Portal SHALL allow managing user accounts and roles
4. THE Admin_Portal SHALL allow managing academic structure (classes, sections, subjects)
5. THE Admin_Portal SHALL allow managing fee structures
6. THE Admin_Portal SHALL allow viewing real-time attendance with drill-down
7. THE Admin_Portal SHALL allow viewing financial analytics and pending dues
8. THE Admin_Portal SHALL allow viewing academic performance analytics
9. THE Admin_Portal SHALL allow managing school configuration
10. THE Admin_Portal SHALL allow generating and exporting reports (PDF, Excel)
11. THE Admin_Portal SHALL allow sending bulk SMS and announcements
12. THE Admin_Portal SHALL allow viewing audit logs
13. THE Admin_Portal SHALL allow managing integrations (payment gateway, SMS)
14. THE Admin_Portal SHALL support comparative analysis across years
15. THE Admin_Portal SHALL be mobile-responsive

### Requirement 18: Library Portal

**User Story:** As a librarian, I want to manage library operations efficiently, so that I can maintain an organized system.

#### Acceptance Criteria

1. THE Library_Portal SHALL display dashboard: circulation stats, overdue count, popular books
2. THE Library_Portal SHALL allow managing book catalog (add, edit, delete)
3. THE Library_Portal SHALL allow processing issue and return with barcode/manual entry
4. THE Library_Portal SHALL allow managing reservations
5. THE Library_Portal SHALL calculate and collect late fees
6. THE Library_Portal SHALL allow searching books by title, author, ISBN
7. THE Library_Portal SHALL allow viewing member borrowing history
8. THE Library_Portal SHALL generate reports: overdue, circulation, inventory
9. THE Library_Portal SHALL allow sending due date reminders
10. THE Library_Portal SHALL support Nepali and English languages

### Requirement 19: Finance Portal

**User Story:** As an accountant, I want to manage financial operations, so that I can maintain accurate records.

#### Acceptance Criteria

1. THE Finance_Portal SHALL display dashboard: revenue summary, collection rate, pending dues
2. THE Finance_Portal SHALL display charts: revenue trends, collection by class
3. THE Finance_Portal SHALL allow managing fee structures
4. THE Finance_Portal SHALL allow generating invoices (bulk and individual)
5. THE Finance_Portal SHALL allow processing cash/bank payments
6. THE Finance_Portal SHALL generate receipts with auto-numbering
7. THE Finance_Portal SHALL allow managing fee concessions
8. THE Finance_Portal SHALL allow processing refunds
9. THE Finance_Portal SHALL allow viewing real-time collection status
10. THE Finance_Portal SHALL generate reports: daily collection, monthly summary, defaulters
11. THE Finance_Portal SHALL allow exporting reports (PDF, Excel)
12. THE Finance_Portal SHALL allow sending payment reminders via SMS
13. THE Finance_Portal SHALL reconcile online payments
14. THE Finance_Portal SHALL display all amounts in NPR with proper formatting

---

## Additional Modules

### Requirement 20: Transport Management Module (Optional - Phase 3)

**User Story:** As a Transport_Manager, I want to manage school transport services, so that I can track buses and ensure student safety.

#### Acceptance Criteria

1. THE SMS SHALL support route creation with stops, timings, distance
2. THE SMS SHALL support vehicle management with registration and capacity
3. THE SMS SHALL support driver management with license details
4. THE SMS SHALL allow assigning students to routes and stops
5. THE SMS SHALL calculate transport fees based on route
6. THE SMS SHALL support GPS tracking integration for real-time location
7. WHEN bus reaches a stop, THE SMS SHALL notify parents
8. THE SMS SHALL allow parents to view bus location in Parent_Portal
9. THE SMS SHALL generate route-wise student lists
10. THE SMS SHALL track vehicle maintenance schedules

### Requirement 21: Hostel Management Module (Optional - Phase 3)

**User Story:** As a Hostel_Warden, I want to manage hostel facilities, so that I can track room assignments and operations.

#### Acceptance Criteria

1. THE SMS SHALL support hostel creation with floors and rooms
2. THE SMS SHALL support room management with capacity and type (boys/girls, AC/non-AC)
3. THE SMS SHALL allow assigning students to rooms
4. THE SMS SHALL track hostel attendance (check-in/check-out)
5. THE SMS SHALL manage hostel fees separately
6. THE SMS SHALL support visitor management with entry/exit logs
7. THE SMS SHALL allow students to raise maintenance requests
8. THE SMS SHALL generate hostel reports: occupancy, attendance, fees

---

## Notification and Communication Requirements

### Requirement 22: Real-Time Notification System

**User Story:** As a user, I want to receive real-time notifications about important events, so that I can stay informed.

#### Acceptance Criteria

1. THE Notification_Service SHALL support push notifications via Socket.IO (web) and FCM (mobile)
2. WHEN significant events occur (fee due, exam scheduled, attendance alert, grade published), THE SMS SHALL notify relevant users
3. THE SMS SHALL support notification channels: in-app, SMS, push notification
4. THE SMS SHALL allow users to configure notification preferences
5. THE SMS SHALL record delivery and read status
6. THE SMS SHALL display unread count in UI
7. THE SMS SHALL support notification history with search
8. THE SMS SHALL support broadcast notifications for announcements
9. THE SMS SHALL support scheduled notifications for reminders
10. THE SMS SHALL group notifications to avoid spam
11. THE SMS SHALL prioritize critical notifications (emergency alerts)

### Requirement 23: SMS Integration for Nepal

**User Story:** As a School_Admin, I want to send SMS notifications to parents, so that I can communicate important information.

#### Acceptance Criteria

1. THE SMS SHALL integrate with Nepal SMS gateways: Sparrow SMS, Aakash SMS
2. THE SMS SHALL support SMS templates in Nepali and English
3. THE SMS SHALL support bulk SMS to class, section, or custom groups
4. THE SMS SHALL track delivery status
5. THE SMS SHALL implement rate limiting to control costs
6. THE SMS SHALL log all SMS communications
7. THE SMS SHALL support Unicode/Nepali SMS (length considerations)
8. THE SMS SHALL allow configuration of sender ID

### Requirement 24: Communication System

**User Story:** As a user, I want to communicate with others through built-in messaging, so that I can collaborate efficiently.

#### Acceptance Criteria

1. THE SMS SHALL provide one-on-one messaging between users
2. THE SMS SHALL support class-based group messaging
3. THE SMS SHALL deliver messages in real-time via WebSocket
4. THE SMS SHALL support file attachments
5. THE SMS SHALL maintain chat history with search
6. THE SMS SHALL show online/offline status
7. THE SMS SHALL support message read receipts
8. THE SMS SHALL allow teachers to create announcement channels
9. THE SMS SHALL enforce role-based restrictions on messaging

---

## Certificate and Document Management

### Requirement 25: Certificate Management Module

**User Story:** As a coordinator, I want to generate certificates with templates, so that I can issue professional certificates efficiently.

#### Acceptance Criteria

1. THE SMS SHALL support certificate types:
   - Character Certificate
   - Transfer Certificate
   - Academic Excellence
   - ECA Participation/Achievement
   - Sports Participation/Achievement
   - Course Completion
   - Bonafide Certificate

2. THE SMS SHALL support certificate template creation with:
   - School logo and letterhead
   - Dynamic fields (student_name, class, achievement, date_bs, date_ad)
   - Principal signature
   - Background image
   - QR code for verification

3. THE SMS SHALL support bulk certificate generation
4. THE SMS SHALL generate certificates in PDF format
5. THE SMS SHALL maintain certificate registry with unique numbers
6. THE SMS SHALL allow students to download certificates via portal
7. THE SMS SHALL support certificate verification via QR code or number
8. THE SMS SHALL support bilingual certificates (Nepali/English)

### Requirement 26: Student CV Builder

**User Story:** As a student, I want to generate a comprehensive CV, so that I can use it for applications.

#### Acceptance Criteria

1. THE SMS SHALL auto-compile student data from all modules
2. THE Student_CV SHALL include:
   - Personal Information
   - Academic Performance (year-wise grades, GPA)
   - Attendance Record
   - ECA Participation and Achievements
   - Sports Participation and Achievements
   - Certificates and Awards
   - Teacher Remarks

3. THE SMS SHALL allow students to customize CV sections (show/hide)
4. THE SMS SHALL allow adding skills, hobbies, career goals
5. THE SMS SHALL generate CV in PDF with school branding
6. THE SMS SHALL support multiple templates
7. THE SMS SHALL include QR code for verification
8. THE SMS SHALL update CV automatically when new data is added

### Requirement 27: Document Management

**User Story:** As a user, I want to manage documents with organization, so that I can maintain up-to-date documentation.

#### Acceptance Criteria

1. THE SMS SHALL allow document upload with categorization
2. THE SMS SHALL store documents in local storage (cloud optional)
3. THE SMS SHALL support document versioning
4. THE SMS SHALL support role-based access control
5. THE SMS SHALL allow document search by name and category
6. THE SMS SHALL support document preview
7. THE SMS SHALL compress images before storage (max 500KB)
8. THE SMS SHALL enforce file size limits (max 10MB per file)

---

## Technical Requirements

### Requirement 28: Offline-First Architecture (CRITICAL)

**User Story:** As a user in an area with limited connectivity, I want the system to work offline, so that I can continue working during network outages.

#### Acceptance Criteria

1. THE SMS SHALL work offline for core functions:
   - Attendance marking (queue for sync)
   - Grade entry (queue for sync)
   - Student information viewing (cached)
   - Timetable viewing (cached)
   - Assignment viewing (cached)

2. WHEN network is unavailable, THE SMS SHALL queue write operations
3. WHEN connectivity is restored, THE SMS SHALL auto-sync queued operations
4. THE SMS SHALL indicate sync status clearly (synced, pending, error)
5. THE SMS SHALL handle sync conflicts (last-write-wins or prompt user)
6. THE SMS SHALL cache frequently accessed data locally
7. THE SMS SHALL work as PWA with service worker

### Requirement 29: Low-Bandwidth Optimization

**User Story:** As a user on slow network, I want the system to work on 2G/3G, so that I can use it with limited bandwidth.

#### Acceptance Criteria

1. THE SMS SHALL work on 2G/3G networks (max 3 seconds page load on 3G)
2. THE SMS SHALL compress all images before upload (max 200KB for photos, 500KB for documents)
3. THE SMS SHALL support progressive loading
4. THE SMS SHALL cache frequently accessed data locally
5. THE SMS SHALL provide "lite mode" for slow connections (disable animations, reduce images)
6. THE SMS SHALL implement lazy loading for lists
7. THE SMS SHALL minimize API payload sizes
8. THE SMS SHALL use pagination (default 20 items, max 50)
9. THE SMS SHALL compress API responses (gzip)

### Requirement 30: Multi-Language Support (Nepali/English)

**User Story:** As a user, I want to use the system in my preferred language, so that I can work comfortably.

#### Acceptance Criteria

1. THE SMS SHALL support Nepali (नेपाली) and English languages
2. THE SMS SHALL default to Nepali with easy toggle
3. WHEN language is changed, THE SMS SHALL update all interface text immediately
4. THE SMS SHALL support Nepali Unicode fonts
5. THE SMS SHALL support Nepali traditional keyboard and Romanized input
6. THE SMS SHALL display currency in NPR format (रू or Rs.)
7. THE SMS SHALL support date formats:
   - BS: YYYY-MM-DD (Nepali numerals optional)
   - AD: YYYY-MM-DD
8. THE SMS SHALL support Nepali number formatting

### Requirement 31: Calendar and Event Management

**User Story:** As a user, I want to view and manage school events in a calendar, so that I can stay organized.

#### Acceptance Criteria

1. THE SMS SHALL provide calendar with BS and AD views
2. THE SMS SHALL display Nepal government holidays by default
3. THE SMS SHALL allow School_Admin to create events with date, time, location
4. THE SMS SHALL support event categories: academic, sports, cultural, holiday
5. WHEN event is created, THE SMS SHALL notify relevant users
6. THE SMS SHALL support recurring events (weekly, monthly)
7. THE SMS SHALL allow users to add events to personal calendar

### Requirement 32: Payment Gateway Integration

**User Story:** As a parent, I want to pay fees online using Nepali payment methods, so that I can make payments conveniently.

#### Acceptance Criteria

1. THE Payment_Gateway SHALL integrate with eSewa
2. THE Payment_Gateway SHALL integrate with Khalti
3. THE Payment_Gateway SHALL integrate with IME Pay
4. THE Payment_Gateway SHALL support bank transfer information display
5. WHEN user initiates payment, THE SMS SHALL redirect to selected gateway
6. WHEN payment completes, THE SMS SHALL receive callback and verify
7. THE Payment_Gateway SHALL verify payment authenticity via signature
8. THE Payment_Gateway SHALL prevent duplicate payment processing (idempotency)
9. WHEN payment succeeds, THE SMS SHALL auto-update balance and generate receipt
10. WHEN payment fails, THE SMS SHALL log failure and notify user
11. THE Payment_Gateway SHALL support refunds
12. THE Payment_Gateway SHALL maintain transaction logs with gateway references

### Requirement 33: Reports and Analytics

**User Story:** As a School_Admin, I want comprehensive reports and analytics, so that I can make data-driven decisions.

#### Acceptance Criteria

1. THE SMS SHALL generate reports:
   - Student enrollment by class, section, gender
   - Attendance summary (daily, weekly, monthly, yearly)
   - Fee collection (daily, monthly, yearly, pending)
   - Examination results (class-wise, subject-wise, grade distribution)
   - Teacher performance (attendance, syllabus completion)
   - Library circulation
   - Transport utilization (if applicable)
   - ECA/Sports participation

2. THE SMS SHALL support report filters: date range, class, section
3. THE SMS SHALL export reports in PDF and Excel
4. THE SMS SHALL provide dashboards with interactive charts
5. THE SMS SHALL support comparative analysis across academic years
6. THE SMS SHALL generate automated reports on schedule (optional)

### Requirement 34: Theme and Accessibility

**User Story:** As a user, I want to customize appearance and access accessibility features, so that I can use the system comfortably.

#### Acceptance Criteria

1. THE SMS SHALL support light and dark themes
2. THE SMS SHALL allow theme toggle in settings
3. THE SMS SHALL remember theme preference
4. THE SMS SHALL follow basic accessibility guidelines
5. THE SMS SHALL support keyboard navigation
6. THE SMS SHALL provide sufficient color contrast
7. THE SMS SHALL allow font size adjustment (small, normal, large)

### Requirement 35: API and Integration

**User Story:** As a developer, I want API documentation, so that I can integrate with the system.

#### Acceptance Criteria

1. THE API SHALL provide RESTful endpoints for all features
2. THE API SHALL support versioning (/api/v1/)
3. THE SMS SHALL provide Swagger/OpenAPI documentation
4. THE API SHALL implement rate limiting (100 requests/minute/user)
5. THE API SHALL return consistent error responses with HTTP status codes
6. THE API SHALL support pagination (default 20, max 100 items)
7. THE API SHALL support filtering and sorting on list endpoints

### Requirement 36: Security Requirements

**User Story:** As a system administrator, I want robust security measures, so that I can protect sensitive data.

#### Acceptance Criteria

1. THE SMS SHALL use HTTPS/TLS for all communications
2. THE Auth_Module SHALL hash passwords using bcrypt
3. THE SMS SHALL enforce strong passwords (min 8 chars, mixed case, numbers)
4. THE SMS SHALL implement account lockout after failed attempts
5. THE SMS SHALL implement CSRF protection
6. THE SMS SHALL sanitize all inputs to prevent SQL injection and XSS
7. THE SMS SHALL implement RBAC at API level
8. THE SMS SHALL maintain audit logs for sensitive operations
9. THE SMS SHALL support data backup and recovery
10. THE SMS SHALL encrypt sensitive data (passwords, payment info)

### Requirement 37: Performance Requirements

**User Story:** As a user, I want the system to perform efficiently, so that I have a smooth experience.

#### Acceptance Criteria

1. THE SMS SHALL respond to API requests within 500ms for 95% of requests
2. THE SMS SHALL support at least 500 concurrent users
3. THE SMS SHALL support at least 5,000 student records per school
4. THE Database SHALL use indexing on frequently queried columns
5. THE SMS SHALL implement caching for frequently accessed data
6. THE SMS SHALL use connection pooling
7. THE SMS SHALL optimize images for fast loading
8. THE SMS SHALL implement lazy loading for large lists
9. THE SMS SHALL log slow queries (>1 second) for optimization

### Requirement 38: Audit Logging

**User Story:** As a system administrator, I want comprehensive audit logs, so that I can track system activities.

#### Acceptance Criteria

1. THE Audit_Module SHALL log authentication attempts (success/failure)
2. THE Audit_Module SHALL log data modifications (create, update, delete)
3. THE Audit_Module SHALL log administrative actions (role changes, config updates)
4. THE Audit_Module SHALL log financial transactions
5. THE SMS SHALL allow School_Admin to view audit logs with filters
6. THE SMS SHALL retain audit logs for 1 year (configurable)
7. THE SMS SHALL implement log rotation

### Requirement 39: System Configuration

**User Story:** As a School_Admin, I want to configure system settings, so that the system aligns with my school's requirements.

#### Acceptance Criteria

1. THE SMS SHALL allow configuring school information (name, logo, address, contact)
2. THE SMS SHALL allow configuring academic year structure
3. THE SMS SHALL allow configuring grading schemes (NEB default, custom option)
4. THE SMS SHALL allow configuring fee structures
5. THE SMS SHALL allow configuring attendance rules and thresholds
6. THE SMS SHALL allow configuring notification templates
7. THE SMS SHALL allow configuring user roles and permissions
8. THE SMS SHALL allow customizing report card templates
9. THE SMS SHALL allow configuring date format, timezone, currency

### Requirement 40: Data Management

**User Story:** As a system administrator, I want proper data constraints and archiving, so that data integrity is maintained.

#### Acceptance Criteria

1. THE Database SHALL enforce unique constraints on student_id, staff_id, email
2. THE Database SHALL enforce foreign key constraints
3. THE Database SHALL use soft deletes for critical entities (students, staff, transactions)
4. THE SMS SHALL implement data archiving for completed academic years
5. WHEN academic year is archived, THE SMS SHALL move data to archive tables
6. THE SMS SHALL allow restoring archived data when needed
7. THE SMS SHALL implement data retention policies (10 years for student records)
8. THE Database SHALL enforce NOT NULL on mandatory fields
9. THE SMS SHALL implement database migrations with rollback capability

---

## Non-Functional Requirements

### Availability

1. THE SMS SHALL achieve 99% uptime (excluding scheduled maintenance)
2. THE SMS SHALL support scheduled maintenance with advance notification
3. THE SMS SHALL support graceful degradation during partial outages

### Reliability

1. THE SMS SHALL implement daily automated database backup
2. THE SMS SHALL support backup to external storage
3. THE SMS SHALL have recovery procedure with RTO of 4 hours

### Maintainability

1. THE SMS SHALL follow modular architecture
2. THE SMS SHALL implement unit tests with minimum 60% coverage
3. THE SMS SHALL use Git for version control
4. THE SMS SHALL implement CI/CD pipeline
5. THE SMS SHALL maintain technical documentation

### Portability

1. THE SMS SHALL support deployment on Ubuntu Server
2. THE SMS SHALL use Docker for consistent deployment
3. THE SMS SHALL support browsers: Chrome, Firefox, Edge, Safari (latest 2 versions)
4. THE SMS SHALL support mobile browsers (Chrome Mobile, Safari Mobile)

### Usability

1. THE SMS SHALL provide intuitive navigation (max 3 clicks to any feature)
2. THE SMS SHALL provide contextual help and tooltips
3. THE SMS SHALL provide meaningful error messages in Nepali/English
4. THE SMS SHALL follow consistent UI patterns
5. THE SMS SHALL provide simplified interface options for less technical users

---

## Implementation Phases

### Phase 1: Core (3-4 months)
- Authentication and Role-Based Access Control
- Student Management with Admission
- Staff Management
- Academic Management (Classes, Subjects, Timetable)
- Attendance Management (with offline support)
- NEB-Compliant Grading System
- Fee Management with Nepal Payment Gateways
- Basic Reports
- Student, Parent, and Teacher Portals (basic)
- Admin Portal

### Phase 2: Essential (2-3 months)
- Online Examinations
- Complete Parent Portal with Payment
- Nepal SMS Integration
- BS Calendar Full Implementation
- Certificate Generation
- Student CV Module
- Library Management
- Finance Portal

### Phase 3: Advanced (2-3 months)
- ECA Module
- Sports Module
- Transport Management (optional)
- Hostel Management (optional)
- Advanced Analytics
- Document Management

### Phase 4: Premium (2 months)
- React Native Mobile App (optional)
- Advanced Reporting
- Multi-school Support (optional)
- API for Third-party Integration
- Alumni Management

---

## Removed/Deferred Features (From Original Requirements)

The following features have been REMOVED or DEFERRED to simplify the system for typical Nepal schools:

| Feature | Status | Reason |
|---------|--------|--------|
| Head_School Role | Deferred to Phase 4 | Most schools are single entities |
| React Native Mobile Apps | Deferred to Phase 4 | PWA is sufficient for most users |
| AWS S3 Cloud Storage | Optional | Local storage default, cloud optional |
| Exam Proctoring (webcam/screen) | Removed | Privacy concerns, bandwidth limitations |
| Microservices Architecture | Removed | Monolith is simpler and sufficient |
| Complex API Scopes | Simplified | Over-engineered for typical use |
| Counseling Module | Deferred to Phase 3 | Can be managed by Class_Teacher initially |
| Discipline Module (dedicated) | Merged into Admin | Separate module unnecessary |
| Exam Controller Role (dedicated) | Merged into Admin | Smaller schools don't need this |
| ELK Stack Monitoring | Optional Phase 3 | File-based logging sufficient initially |
| Video Conferencing Integration | Removed | External tools (Zoom, Meet) sufficient |
| Two-Factor Authentication | Optional | Password + SMS OTP is sufficient |
| Device Fingerprinting | Removed | Adds complexity, limited benefit |
| Multiple Separate Frontend Apps | Merged | Single SPA with role-based views |

---

## Appendix A: Nepal Education System Reference

### Academic Years
- Primary Level: Class 1-5
- Lower Secondary: Class 6-8
- Secondary: Class 9-10 (SEE examination)
- Higher Secondary: Class 11-12 (NEB examination)

### Exam Schedule
- First Terminal: Kartik-Mangsir (October-November)
- Second Terminal: Magh-Falgun (January-February)
- Final: Chaitra (March-April)
- SEE: Chaitra (March-April)
- NEB: Baisakh-Jestha (April-May)

### NEB Grading Table
| Percentage | Grade | GPA | Remarks |
|-----------|-------|-----|---------|
| 90-100 | A+ | 4.0 | Outstanding |
| 80-89 | A | 3.6 | Excellent |
| 70-79 | B+ | 3.2 | Very Good |
| 60-69 | B | 2.8 | Good |
| 50-59 | C+ | 2.4 | Satisfactory |
| 40-49 | C | 2.0 | Acceptable |
| 35-39 | D | 1.6 | Basic |
| 0-34 | NG | 0.0 | Not Graded |

### Common Terms in Nepali
- विद्यार्थी (Vidyarthi) - Student
- शिक्षक (Shikshak) - Teacher
- परीक्षा (Pariksha) - Examination
- उपस्थिति (Upasthiti) - Attendance
- भर्ना (Bharna) - Admission
- शुल्क (Shulka) - Fee
- पुस्तकालय (Pustakalaya) - Library
- प्रमाणपत्र (Pramanpatra) - Certificate
- ग्रेड अंक (Grade Anka) - Grade Point

---

## Appendix B: UI/UX Guidelines Based on Screenshots

Based on the provided system screenshots, the following UI patterns should be maintained:

### Navigation Structure
1. **Setup Section**
   - Settings (school configuration)
   - Change Password
   - Switch Accounts (for users with multiple roles)
   - Switch Academic Year
   - Logout

2. **Favorites Section** (customizable quick access)
   - Switch Academic Year

3. **Academics Section**
   - Homework
   - Assignment
   - Time Table
   - Attendance
   - Student Leave Requests
   - Fee Details
   - My Remarks
   - Continuation Confirmation

4. **Exam Section**
   - Exam Schedule
   - Marksheet
   - Result Summary
   - Aggregate Marksheet
   - Aggregate Result Summary

5. **Events Section**
   - Event Calendar
   - Upcoming Events
   - Past Events
   - Holidays
   - Video (media gallery)

6. **Who We Are Section** (informational)
   - About Us
   - Privacy Policy
   - Staff Hierarchy
   - Notice Board
   - Pre Login Dashboard

7. **Service & Facilities**
   - Academic Programs
   - Feedback/Suggestions

### UI Design Patterns
- Card-based layout for menu items
- Icon + Text for navigation items
- Clean, light background (light green/cream tones)
- Consistent color coding for categories
- Mobile-first responsive design

---

*Document Version: 2.0*
*Last Updated: 2082-10-24 BS (2026-02-06 AD)*
*Optimized for Nepal Education System*
