# Implementation Plan: School Management System (Node.js + React.js)

## Overview

This implementation plan breaks down the School Management System into discrete, manageable tasks following a phased approach. The system will be built using Node.js + Express.js (backend) and React.js + TypeScript (frontend), optimized for Nepal's education system with NEB compliance, Bikram Sambat calendar support, and offline-first architecture.

## Current Implementation Status

**Phase 1: Core Foundation** ✅ **COMPLETE**
- Authentication and RBAC
- Student and Staff Management
- Academic Management (Classes, Subjects, Timetables)
- NEB Grading System
- Bikram Sambat Calendar
- Database schema and migrations

**Phase 2: Essential Operations** ✅ **COMPLETE**
- Attendance Management with offline support
- Examination and Grading System
- Finance and Fee Management
- Payment Gateway Integration (eSewa, Khalti, IME Pay)
- Library Management
- ECA and Sports Modules
- Notification System (SMS via Sparrow)
- Core UI for all major modules

**Phase 3: Advanced Features** ✅ **COMPLETE**
- Communication System (messaging, announcements)
- Certificate Management
- Student CV Builder
- Document Management
- Calendar and Event Management
- Advanced UI components

**Phase 4: Optimization & Enhancement** ✅ **COMPLETE**
- Offline-first PWA implementation
- Low-bandwidth optimization
- Advanced reporting and analytics
- Theme and accessibility
- System configuration
- Audit logging
- Data archiving
- Security hardening
- Performance optimization
- Complete portal enhancements
- E2E testing
- Production deployment


**Technology Stack:**

- **Backend**: Node.js 18+ LTS, Express.js 4.x, TypeScript 5.x, MySQL 8.0+, Redis 7.x
- **Frontend**: React.js 18+, TypeScript 5.x, Redux Toolkit, Material-UI v5, React Router v6
- **Testing**: Jest (unit/integration), fast-check (property-based), Playwright (E2E)
- **DevOps**: Docker, Docker Compose, Nginx, GitHub Actions

**Implementation Phases:**

- **Phase 1**: Core Foundation (Auth, Student/Staff Management, Academic Structure)
- **Phase 2**: Essential Operations (Attendance, Examinations, Finance, Basic Portals)
- **Phase 3**: Advanced Features (Library, ECA, Sports, Certificates, Communication)
- **Phase 4**: Optimization & Enhancement (Offline-first, Nepal integrations, Reports, Full Portals)

**Key Principles:**

- Each task builds incrementally on previous work
- Property-based tests validate universal correctness properties
- Unit tests validate specific examples and edge cases
- Checkpoints ensure validation at major milestones
- All tasks reference specific requirements for traceability

## Tasks

### Phase 1: Core Foundation

- [x] 1. Project initialization and setup
  - Initialize backend project with Node.js 18+, Express.js, TypeScript 5.x
  - Initialize frontend project with React.js 18+, TypeScript 5.x, Material-UI v5
  - Set up MySQL 8.0+ database with connection pooling and InnoDB engine
  - Set up Redis 7.x for caching and session management
  - Configure Docker and Docker Compose for development environment
  - Set up ESLint, Prettier, and TypeScript configurations for both projects
  - Initialize Git repository with comprehensive .gitignore
  - Set up environment variable management (.env files with validation)
  - Configure Winston logger with file rotation
  - Set up testing frameworks (Jest, fast-check, Playwright)
  - _Requirements: Technical Setup, Maintainability_


- [x] 2. Database schema and migrations
  - [x] 2.1 Create core database tables (users, students, staff, academic_years, classes, subjects)
    - Implement Sequelize models with TypeScript interfaces
    - Create migration files for all core tables
    - Add proper indexes for performance optimization
    - _Requirements: 2, 4, 5, 40.1, 40.2_
  
  - [x] 2.2 Create attendance and examination tables
    - Implement attendance, leave_applications, exams, grades, exam_schedules tables
    - Add foreign key constraints and indexes
    - _Requirements: 6, 7, 40.2_
  
  - [x] 2.3 Create finance and fee management tables
    - Implement fee_structures, fee_components, invoices, payments tables
    - Add payment gateway transactions table
    - Add refunds and fee reminders tables
    - _Requirements: 9, 32, 40.2_
  
  - [x] 2.4 Create library management tables
    - Implement books, circulation, reservations, library_fines tables
    - Add proper indexes for search functionality
    - _Requirements: 10, 40.2_
  
  - [x] 2.5 Create ECA and Sports tables
    - Implement ECA, ECA_enrollments, ECA_events, ECA_achievements tables
    - Implement Sport, Team, Tournament, Sports_enrollments, Sports_achievements tables
    - _Requirements: 11, 12, 40.2_
  
  - [x] 2.6 Create supporting tables
    - Implement audit_logs, notifications, BS_calendar tables
    - Implement staff_documents, staff_assignments, timetables tables
    - Implement academic_history, admissions tables
    - _Requirements: 38, 22, N4, 4, 3, 5, 2_

- [x] 3. Authentication and authorization module
  - [x] 3.1 Implement JWT-based authentication
    - Create auth controller with login, logout, refresh token endpoints
    - Implement password hashing with bcrypt
    - Generate JWT access tokens (30 min) and refresh tokens (7 days)
    - Store refresh tokens securely
    - _Requirements: 1.2, 1.3, 36.2_
  
  - [x] 3.2 Implement role-based access control (RBAC)
    - Create auth middleware to verify JWT tokens
    - Implement role checking middleware
    - Support all 13 user roles defined in requirements
    - _Requirements: 1.1, 1.4, 1.5, 36.7_
  
  - [x] 3.3 Implement account security features
    - Add failed login attempt tracking
    - Implement account lockout after 5 failed attempts
    - Add password reset functionality
    - _Requirements: 1.9, 1.11, 36.3, 36.4_
  
  - [x] 3.4 Write unit tests for authentication
    - Test login with valid/invalid credentials
    - Test token generation and verification
    - Test account lockout mechanism
    - Test password reset flow
    - _Requirements: 1.2, 1.3, 1.9_
  
  - [x]* 3.5 Write property test for JWT token validation
    - **Property 7: JWT Token Contains Role Information**
    - **Validates: Requirements 1.2**
  
  - [x]* 3.6 Write property test for token expiration
    - **Property 8: Token Expiration Enforcement**
    - **Validates: Requirements 1.3**
  
  - [x]* 3.7 Write property test for account lockout
    - **Property 9: Account Lockout After Failed Attempts**
    - **Validates: Requirements 1.9**
  
  - [x]* 3.8 Write property test for password hashing
    - **Property 10: Password Hashing Security**
    - **Validates: Requirements 36.2**


- [x] 4. NEB grading system implementation
  - [x] 4.1 Implement NEB grade calculation service
    - Create nebGrading.service.ts with grade mapping function
    - Implement GPA calculation formula
    - Support weighted grading (theory/practical splits)
    - Support 75/25 and 50/50 theory-practical splits
    - _Requirements: N1.1, N1.2, N1.3, N1.4_
  
  - [x]* 4.2 Write property tests for NEB grading
    - **Property 1: NEB Grade Mapping Correctness**
    - **Property 2: GPA Calculation Formula**
    - **Property 3: Weighted Grade Calculation**
    - **Property 4: NEB Mark Sheet Completeness**
    - **Validates: Requirements N1.1, N1.2, N1.3, N1.4, N1.9**
  
  - [x] 4.3 Write unit tests for NEB grading edge cases
    - Test boundary values (35%, 40%, 50%, etc.)
    - Test invalid inputs (negative marks, marks > 100)
    - Test subject combination validation
    - _Requirements: N1.1, N2.4_
  
  - [x]* 4.4 Write property test for subject combination validation
    - **Property 5: Subject Combination Validation**
    - **Validates: Requirements N2.4**

- [x] 5. Bikram Sambat calendar system
  - [x] 5.1 Implement BS-AD date conversion service
    - Create bsCalendar.service.ts with conversion functions
    - Populate BS calendar data table (2070-2090 BS)
    - Implement date validation for BS dates
    - _Requirements: N4.1, N4.3, N4.7_
  
  - [x] 5.2 Create BS date picker component (frontend)
    - Implement BSDatePicker React component
    - Support both BS and AD input/display
    - Integrate with React Hook Form
    - _Requirements: N4.1, N4.3, N4.4_
  
  - [x]* 5.3 Write property test for BS-AD conversion
    - **Property 6: BS-AD Calendar Round Trip**
    - **Validates: Requirements N4.7**
  
  - [x] 5.4 Write unit tests for BS calendar
    - Test date conversion accuracy
    - Test invalid date handling
    - Test boundary dates
    - _Requirements: N4.7_

- [x] 6. Student management module
  - [x] 6.1 Implement student CRUD operations
    - Create student controller, service, and repository
    - Implement create, read, update, delete endpoints
    - Add student search and filtering
    - Generate unique student IDs
    - _Requirements: 2.1, 2.2, 2.9_
  
  - [x] 6.2 Implement student admission workflow
    - Create admission controller and service
    - Support inquiry → application → test → interview → admission flow
    - Track admission status and documents
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6, 3.7, 3.8, 3.9, 3.10, 3.11, 3.12_
  
  - [x] 6.3 Implement bulk student import
    - Support Excel file upload
    - Validate and parse student data
    - Handle errors and provide feedback
    - _Requirements: 2.7_
  
  - [x]* 6.4 Write property tests for student management
    - **Property 11: Student ID Uniqueness**
    - **Property 12: Audit Trail Creation**
    - **Property 13: Student Promotion Grade Increment**
    - **Property 14: Database Unique Constraints**
    - **Property 15: Soft Delete Preservation**
    - **Validates: Requirements 2.2, 2.9, 2.10, 40.1, 40.3**
  
  - [x] 6.5 Write unit tests for student operations
    - Test student creation with valid/invalid data
    - Test student search and filtering
    - Test bulk import with various file formats
    - _Requirements: 2.1, 2.7, 2.9_


- [x] 7. Staff management module
  - [x] 7.1 Implement staff CRUD operations
    - Create staff controller, service, and repository
    - Implement create, read, update, delete endpoints
    - Generate unique staff IDs
    - Support staff document management
    - _Requirements: 4.1, 4.2, 4.5, 4.10_
  
  - [x] 7.2 Implement staff assignment management
    - Create staff assignment endpoints
    - Support teacher-subject-class assignments
    - Track assignment history
    - _Requirements: 4.3, 4.4, 4.9_
  
  - [x] 7.3 Write unit tests for staff operations
    - Test staff creation and updates
    - Test staff assignment validation
    - Test document upload and storage
    - _Requirements: 4.1, 4.3, 4.5_

- [x] 8. Academic management module
  - [x] 8.1 Implement academic year and term management
    - Create academic year CRUD endpoints
    - Support term creation within academic years
    - Track current academic year
    - _Requirements: 5.1, 5.2_
  
  - [x] 8.2 Implement class and section management
    - Create class CRUD endpoints
    - Support multiple sections and shifts
    - Assign class teachers
    - Track class capacity and current strength
    - _Requirements: 5.3, N5.1, N5.2_
  
  - [x] 8.3 Implement subject management
    - Create subject CRUD endpoints
    - Support compulsory and optional subjects
    - Configure credit hours and marks distribution
    - Support stream-based subjects for Classes 11-12
    - _Requirements: 5.4, 5.5, N2.1, N2.2, N2.3, N2.6_
  
  - [x] 8.4 Implement timetable management
    - Create timetable CRUD endpoints
    - Support period-wise scheduling
    - Validate teacher conflicts
    - _Requirements: 5.6, 5.7_
  
  - [x] 8.5 Write unit tests for academic operations
    - Test academic year creation and current year tracking
    - Test class capacity validation
    - Test subject assignment to classes
    - Test timetable conflict detection
    - _Requirements: 5.1, 5.3, 5.5, 5.7_

- [x] 9. Checkpoint - Phase 1 Core Foundation Complete
  - Ensure all tests pass (unit and property tests)
  - Verify database migrations run successfully
  - Verify all core APIs are functional
  - Review code quality and test coverage
  - Ask the user if questions arise

### Phase 2: Essential Operations

- [x] 10. Attendance management module
  - [x] 10.1 Implement attendance marking
    - Create attendance controller, service, and repository
    - Support marking attendance (Present, Absent, Late, Excused)
    - Implement "Mark All Present" functionality
    - Support period-wise and day-wise attendance
    - _Requirements: 6.1, 6.2, 6.3, 6.14_
  
  - [x] 10.2 Implement attendance correction and validation
    - Allow corrections within 24-hour window
    - Validate attendance records
    - _Requirements: 6.6_
  
  - [x] 10.3 Implement attendance reporting
    - Calculate attendance percentages
    - Generate attendance summaries
    - Support date range filtering
    - _Requirements: 6.7, 6.10_
  
  - [x] 10.4 Implement low attendance alerts
    - Monitor attendance percentage
    - Send alerts when below 75%
    - _Requirements: 6.8_
  
  - [x] 10.5 Implement leave application management
    - Create leave application endpoints
    - Support application submission and approval workflow
    - Auto-mark excused attendance for approved leaves
    - _Requirements: 6.11, 6.12_
  
  - [x]* 10.6 Write property tests for attendance
    - **Property 16: Mark All Present Completeness**
    - **Property 17: Attendance Correction Time Window**
    - **Property 18: Low Attendance Alert Threshold**
    - **Validates: Requirements 6.3, 6.6, 6.8**
  
  - [x] 10.7 Write unit tests for attendance operations
    - Test attendance marking with various statuses
    - Test attendance percentage calculation
    - Test leave application workflow
    - _Requirements: 6.1, 6.7, 6.11_


- [x] 11. Examination management module
  - [x] 11.1 Implement exam creation and management
    - Create exam controller, service, and repository
    - Support various exam types (unit test, terminal, final, practical)
    - Configure marks distribution (theory/practical)
    - Track exam status
    - _Requirements: 7.1, 7.2_
  
  - [x] 11.2 Implement exam scheduling
    - Create exam schedule endpoints
    - Assign rooms and invigilators
    - Validate no student conflicts
    - _Requirements: 7.3, 7.4_
  
  - [x] 11.3 Implement grade entry
    - Create grade entry endpoints
    - Support batch grade entry
    - Auto-calculate NEB grades from marks
    - Support internal assessment tracking
    - _Requirements: 7.5, 7.6, 7.9, 7.11_
  
  - [x] 11.4 Implement report card generation
    - Generate NEB-compliant report cards
    - Calculate term and cumulative GPA
    - Include attendance summary
    - Calculate class rank
    - _Requirements: 7.7, 7.10, N1.9_
  
  - [x]* 11.5 Write property tests for examination
    - **Property 20: Class Rank Calculation Correctness**
    - **Validates: Requirements 7.10**
  
  - [x] 11.6 Write unit tests for examination operations
    - Test exam creation with various configurations
    - Test grade entry validation
    - Test report card generation
    - Test rank calculation with tied students
    - _Requirements: 7.1, 7.5, 7.7, 7.10_

- [x] 12. Finance and fee management module
  - [x] 12.1 Implement fee structure management
    - Create fee structure controller, service, and repository
    - Support multiple fee components
    - Configure fee structures per class/shift
    - _Requirements: 9.1, 9.2_
  
  - [x] 12.2 Implement invoice generation
    - Auto-generate invoices based on fee structures
    - Support bulk invoice generation
    - Calculate totals and apply discounts
    - _Requirements: 9.3, 9.4_
  
  - [x] 12.3 Implement payment processing
    - Create payment endpoints
    - Support multiple payment methods (cash, bank, online)
    - Auto-update invoice balances
    - Generate receipts
    - _Requirements: 9.5, 9.6, 9.7, 9.8, 9.9_
  
  - [x] 12.4 Implement fee reminders
    - Create fee reminder service
    - Configure reminder schedules
    - Track reminder delivery
    - _Requirements: 9.13_
  
  - [x] 12.5 Implement refund processing
    - Create refund endpoints
    - Support refund approval workflow
    - Track refund status
    - _Requirements: 9.14_
  
  - [x]* 12.6 Write property tests for finance
    - **Property 21: Invoice Generation Completeness**
    - **Property 22: Payment Balance Invariant**
    - **Validates: Requirements 9.3, 9.8**
  
  - [x] 12.7 Write unit tests for finance operations
    - Test invoice generation with discounts
    - Test payment processing and balance updates
    - Test fee reminder scheduling
    - Test refund workflow
    - _Requirements: 9.3, 9.6, 9.8, 9.13, 9.14_


- [x] 13. Payment gateway integration (Nepal)
  - [x] 13.1 Implement eSewa integration
    - Create eSewa payment service
    - Implement payment initiation
    - Handle payment callbacks
    - Verify payment signatures
    - _Requirements: 32.1, 32.5, 32.6, 32.7_
  
  - [x] 13.2 Implement Khalti integration
    - Create Khalti payment service
    - Implement payment initiation
    - Handle payment callbacks
    - Verify payment signatures
    - _Requirements: 32.2, 32.5, 32.6, 32.7_
  
  - [x] 13.3 Implement IME Pay integration
    - Create IME Pay payment service
    - Implement payment initiation
    - Handle payment callbacks
    - Verify payment signatures
    - _Requirements: 32.3, 32.5, 32.6, 32.7_
  
  - [x] 13.4 Implement payment verification and idempotency
    - Verify payments with gateway APIs
    - Prevent duplicate payment processing
    - Handle payment failures
    - _Requirements: 32.6, 32.8, 32.9, 32.10_
  
  - [x]* 13.5 Write property tests for payment gateway
    - **Property 23: Payment Gateway Signature Verification**
    - **Property 24: Payment Idempotency**
    - **Property 25: Online Payment Verification**
    - **Validates: Requirements 32.7, 32.8, 9.6**
  
  - [x] 13.6 Write unit tests for payment gateway
    - Test payment initiation for each gateway
    - Test callback handling
    - Test signature verification
    - Test duplicate payment prevention
    - _Requirements: 32.5, 32.6, 32.7, 32.8_

- [x] 14. Notification system
  - [x] 14.1 Implement notification service
    - Create notification model and repository
    - Support multiple notification types
    - Track read/unread status
    - _Requirements: 22.2, 22.6, 22.7_
  
  - [x] 14.2 Implement SMS integration (Sparrow SMS)
    - Create SMS service for Sparrow SMS gateway
    - Support Nepali and English messages
    - Track delivery status
    - _Requirements: 23.1, 23.2, 23.4, 23.7_
  
  - [x] 14.3 Write unit tests for notifications
    - Test notification creation and delivery
    - Test SMS sending
    - Test notification filtering
    - _Requirements: 22.2, 23.1_

- [x] 15. Frontend - Core UI components and i18n
  - [x] 15.1 Implement authentication UI
    - Create Login page with form validation
    - Implement JWT token storage
    - Create protected route wrapper
    - _Requirements: 1.2, 14.1_
  
  - [x] 15.2 Implement dashboard layout
    - Create DashboardLayout component with navigation
    - Implement role-based menu rendering
    - Add responsive design for mobile
    - _Requirements: 14.1, 16.1, 17.1_
  
  - [x] 15.3 Implement internationalization (i18n)
    - Set up i18next with Nepali and English translations
    - Create LanguageSwitcher component
    - Add translation files for common terms
    - _Requirements: 30.1, 30.2, 30.3_
  
  - [x] 15.4 Implement date and number formatters
    - Create utility functions for BS/AD date formatting
    - Create NPR currency formatter
    - Create Nepali number formatter
    - _Requirements: 30.6, 30.7, 30.8_
  
  - [x] 15.5 Write unit tests for UI components
    - Test Login component
    - Test LanguageSwitcher
    - Test BSDatePicker
    - Test formatters
    - _Requirements: 1.2, 30.1, N4.1_


- [x] 16. Frontend - Student management UI
  - [x] 16.1 Create StudentList page
    - Display students in table with search and filters
    - Support pagination
    - Add action buttons (view, edit, delete)
    - _Requirements: 2.9, 14.4_
  
  - [x] 16.2 Create StudentForm page
    - Implement student creation/edit form
    - Integrate BSDatePicker for date of birth
    - Support photo upload
    - Add form validation
    - _Requirements: 2.1, 2.12, 14.4_
  
  - [x] 16.3 Create StudentDetail page
    - Display student information in tabs
    - Show attendance, grades, fees
    - Support document viewing
    - _Requirements: 2.1, 14.4_
  
  - [x] 16.4 Create BulkImport page
    - Support Excel file upload
    - Display import results
    - Handle errors gracefully
    - _Requirements: 2.7, 14.4_

- [x] 17. Frontend - Staff management UI
  - [x] 17.1 Create StaffList page
    - Display staff in table with search and filters
    - Support pagination
    - Add action buttons
    - _Requirements: 4.9, 16.6_
  
  - [x] 17.2 Create StaffForm page
    - Implement staff creation/edit form
    - Support document upload
    - Add form validation
    - _Requirements: 4.1, 16.6_
  
  - [x] 17.3 Create StaffAssignments page
    - Display and manage staff assignments
    - Support adding/removing assignments
    - _Requirements: 4.3, 16.6_

- [x] 18. Frontend - Attendance UI
  - [x] 18.1 Create AttendanceMarking page
    - Display student list with photos
    - Support quick marking (Present/Absent/Late/Excused)
    - Implement "Mark All Present" button
    - _Requirements: 6.1, 6.2, 6.3, 16.5_

- [x] 19. Frontend - Finance UI
  - [x] 19.1 Create InvoiceList page
    - Display invoices with filters
    - Show payment status
    - Support payment initiation
    - _Requirements: 9.15, 15.5, 19.4_

- [x] 20. Frontend - Examination UI
  - [x] 20.1 Create GradeEntry page
    - Display students for grade entry
    - Support batch grade entry
    - Auto-calculate NEB grades
    - _Requirements: 7.5, 16.9_

- [x] 21. Frontend - Academic management UI
  - [x] 21.1 Create ClassManagement page
    - Display and manage classes
    - Support class creation/editing
    - _Requirements: 5.3, 17.4_

- [x] 22. Frontend - Library UI
  - [x] 22.1 Create LibraryManagement page
    - Display books with search
    - Support book issue/return
    - _Requirements: 10.1, 10.2, 10.3, 18.2, 18.3_

- [x] 23. Frontend - Teacher portal UI
  - [x] 23.1 Create TeacherDashboard page
    - Display today's schedule
    - Show pending tasks
    - Display class performance charts
    - _Requirements: 16.1, 16.2_
  
  - [x] 23.2 Create LessonPlanning page
    - Support lesson plan creation
    - Track syllabus completion
    - _Requirements: 13.1, 13.2, 16.10_
  
  - [x] 23.3 Create AssignmentManagement page
    - Support assignment creation
    - Track submissions
    - Support grading
    - _Requirements: 16.7, 16.8_

- [x] 24. Frontend - Reports UI
  - [x] 24.1 Create ReportsAnalytics page
    - Display various report options
    - Support report generation
    - _Requirements: 33.1, 33.2, 17.10_

- [x] 25. Checkpoint - Phase 2 Essential Operations Complete
  - Ensure all Phase 2 tests pass
  - Verify all essential modules are functional
  - Test payment gateway integrations
  - Test SMS notifications
  - Review code quality and test coverage
  - Ask the user if questions arise


### Phase 3: Advanced Features

- [x] 26. Communication system module
  - [x] 26.1 Implement messaging infrastructure
    - Create message model and repository
    - Implement conversation management
    - Support one-on-one messaging
    - _Requirements: 24.1, 24.5_
  
  - [x] 26.2 Implement real-time messaging with Socket.IO
    - Set up Socket.IO server
    - Implement message delivery
    - Support online/offline status
    - Support read receipts
    - _Requirements: 24.3, 24.6, 24.7_
  
  - [x] 26.3 Implement group messaging
    - Support class-based groups
    - Support announcement channels
    - Enforce role-based restrictions
    - _Requirements: 24.2, 24.8, 24.9_
  
  - [x] 26.4 Implement file attachments
    - Support file upload in messages
    - Store attachments securely
    - _Requirements: 24.4_
  
  - [x] 26.5 Write unit tests for messaging
    - Test message creation and delivery
    - Test conversation management
    - Test file attachments
    - _Requirements: 24.1, 24.3, 24.4_

- [x] 27. Certificate management module
  - [x] 27.1 Implement certificate template management
    - Create certificate template model
    - Support template CRUD operations
    - Support dynamic field configuration
    - _Requirements: 25.2_
  
  - [x] 27.2 Implement certificate generation
    - Generate certificates from templates
    - Support all certificate types (character, transfer, academic, ECA, sports, etc.)
    - Generate PDF with school branding
    - Generate QR code for verification
    - _Requirements: 25.1, 25.3, 25.4, 25.5_
  
  - [x] 27.3 Implement certificate verification
    - Create verification endpoint
    - Support QR code scanning
    - Support certificate number lookup
    - _Requirements: 25.7_
  
  - [x] 27.4 Implement bulk certificate generation
    - Support batch generation for multiple students
    - Track generation status
    - _Requirements: 25.3_
  
  - [x] 27.5 Write unit tests for certificates
    - Test template management
    - Test certificate generation
    - Test verification
    - _Requirements: 25.2, 25.4, 25.7_

- [x] 28. Student CV builder module
  - [x] 28.1 Implement CV data compilation
    - Aggregate student data from all modules
    - Include academic performance, attendance, ECA, sports
    - Include certificates and awards
    - _Requirements: 26.1, 26.2_
  
  - [x] 28.2 Implement CV customization
    - Support section show/hide
    - Support custom fields (skills, hobbies, goals)
    - _Requirements: 26.3, 26.4_
  
  - [x] 28.3 Implement CV generation
    - Generate PDF with school branding
    - Support multiple templates
    - Include QR code for verification
    - Auto-update when data changes
    - _Requirements: 26.5, 26.6, 26.7, 26.8_
  
  - [x] 28.4 Write unit tests for CV builder
    - Test data compilation
    - Test PDF generation
    - Test customization
    - _Requirements: 26.1, 26.5_

- [x] 29. Document management module
  - [x] 29.1 Implement document storage
    - Create document model and repository
    - Support document upload with categorization
    - Store in local filesystem
    - Support document versioning
    - _Requirements: 27.1, 27.2, 27.3_
  
  - [x] 29.2 Implement document access control
    - Enforce role-based access
    - Track document access logs
    - _Requirements: 27.4_
  
  - [x] 29.3 Implement document search and preview
    - Support search by name and category
    - Support document preview
    - _Requirements: 27.5, 27.6_
  
  - [x] 29.4 Implement file size and compression
    - Compress images before storage
    - Enforce file size limits
    - _Requirements: 27.7, 27.8_
  
  - [x] 29.5 Write unit tests for document management
    - Test upload and storage
    - Test access control
    - Test search functionality
    - _Requirements: 27.1, 27.4, 27.5_


- [x] 30. Calendar and event management module
  - [x] 30.1 Implement event management
    - Create event model and repository
    - Support event CRUD operations
    - Support event categories
    - Support recurring events
    - _Requirements: 31.3, 31.4, 31.6_
  
  - [x] 30.2 Implement calendar views
    - Create calendar component with BS and AD views
    - Display Nepal government holidays
    - Display school events
    - _Requirements: 31.1, 31.2_
  
  - [x] 30.3 Implement event notifications
    - Notify relevant users when events are created
    - Support personal calendar integration
    - _Requirements: 31.5, 31.7_
  
  - [x] 30.4 Write unit tests for calendar
    - Test event creation and management
    - Test recurring events
    - Test notifications
    - _Requirements: 31.3, 31.5, 31.6_

- [x] 31. Frontend - Communication UI
  - [x] 31.1 Create Messaging page
    - Display conversation list
    - Support one-on-one chat
    - Support group chat
    - Real-time message updates
    - _Requirements: 24.1, 24.2, 24.3_
  
  - [x] 31.2 Create Announcements page
    - Display announcements
    - Support creating announcements (admin/teacher)
    - Filter by target audience
    - _Requirements: 24.8_

- [x] 32. Frontend - Certificate UI
  - [x] 32.1 Create CertificateManagement page (admin)
    - Manage certificate templates
    - Generate certificates
    - View certificate registry
    - _Requirements: 25.2, 25.3, 25.5_
  
  - [x] 32.2 Create CertificateVerification page (public)
    - Support QR code scanning
    - Support certificate number lookup
    - Display certificate details
    - _Requirements: 25.7_
  
  - [x] 32.3 Add certificate download to Student Portal
    - Display available certificates
    - Support PDF download
    - _Requirements: 25.6_

- [x] 33. Frontend - Student CV UI
  - [x] 33.1 Create StudentCV page
    - Display CV preview
    - Support customization options
    - Support PDF download
    - _Requirements: 26.3, 26.5_

- [x] 34. Frontend - Document Management UI
  - [x] 34.1 Create DocumentManagement page
    - Display document list
    - Support upload with categorization
    - Support search and filtering
    - Support document preview
    - _Requirements: 27.1, 27.5, 27.6_

- [x] 35. Frontend - Calendar UI
  - [x] 35.1 Create Calendar page
    - Display calendar with BS/AD toggle
    - Show events and holidays
    - Support event creation (admin)
    - _Requirements: 31.1, 31.2, 31.3_

- [x] 36. Checkpoint - Phase 3 Advanced Features Complete
  - Ensure all Phase 3 tests pass
  - Verify communication system works
  - Test certificate generation and verification
  - Test CV builder
  - Review code quality and test coverage
  - Ask the user if questions arise

### Phase 4: Optimization & Enhancement

- [x] 37. Offline-first implementation
  - [x] 37.1 Implement service worker
    - Set up Workbox for PWA
    - Configure caching strategies
    - Cache static assets
    - Cache API responses
    - _Requirements: 28.7_
  
  - [x] 37.2 Implement offline queue
    - Set up IndexedDB for offline storage
    - Queue attendance marking offline
    - Queue grade entry offline
    - Cache student and class data
    - _Requirements: 28.1, 28.2, 28.6_
  
  - [x] 37.3 Implement sync mechanism
    - Auto-sync when connectivity restored
    - Display sync status clearly
    - Handle sync conflicts
    - _Requirements: 28.3, 28.4, 28.5_
  
  - [x]* 37.4 Write property test for offline sync
    - **Property 19: Offline Attendance Sync Round Trip**
    - **Validates: Requirements 6.13, 28.2, 28.3**
  
  - [x] 37.5 Write unit tests for offline functionality
    - Test queue management
    - Test sync mechanism
    - Test conflict resolution
    - _Requirements: 28.2, 28.3, 28.5_


- [x] 38. Low-bandwidth optimization
  - [x] 38.1 Implement image compression
    - Compress images before upload
    - Support progressive loading
    - _Requirements: 29.2, 29.3_
  
  - [x] 38.2 Implement lite mode
    - Detect slow connections
    - Disable animations in lite mode
    - Reduce image quality
    - Limit concurrent requests
    - _Requirements: 29.5_
  
  - [x] 38.3 Implement lazy loading
    - Lazy load lists and images
    - Implement pagination
    - _Requirements: 29.6, 29.8_
  
  - [x] 38.4 Implement API response compression
    - Enable gzip compression
    - Minimize payload sizes
    - _Requirements: 29.7, 29.9_
  
  - [x]* 38.5 Write property test for image compression
    - **Property 31: Image Compression Enforcement**
    - **Validates: Requirements 29.2**

- [x] 39. Library management properties
  - [x]* 39.1 Write property tests for library
    - **Property 26: Circulation Record Completeness**
    - **Property 27: Late Fee Calculation**
    - **Property 28: Borrowing Limit Enforcement**
    - **Validates: Requirements 10.4, 10.5, 10.13**

- [x] 40. Advanced reporting and analytics
  - [x] 40.1 Implement comprehensive reports
    - Student enrollment reports
    - Attendance summary reports
    - Fee collection reports
    - Examination results reports
    - Teacher performance reports
    - Library circulation reports
    - ECA/Sports participation reports
    - _Requirements: 33.1_
  
  - [x] 40.2 Implement report filters and export
    - Support date range, class, section filters
    - Export to PDF and Excel
    - _Requirements: 33.2, 33.3_
  
  - [x] 40.3 Implement interactive dashboards
    - Create charts for all portals
    - Support comparative analysis
    - _Requirements: 33.4, 33.5_
  
  - [x] 40.4 Write unit tests for reports
    - Test report generation
    - Test filters
    - Test export functionality
    - _Requirements: 33.1, 33.2, 33.3_

- [x] 41. Theme and accessibility
  - [x] 41.1 Implement theme system
    - Support light and dark themes
    - Add theme toggle
    - Remember theme preference
    - _Requirements: 34.1, 34.2, 34.3_
  
  - [x] 41.2 Implement accessibility features
    - Follow WCAG guidelines
    - Support keyboard navigation
    - Ensure color contrast
    - Support font size adjustment
    - _Requirements: 34.4, 34.5, 34.6, 34.7_
  
  - [x] 41.3 Write accessibility tests
    - Test keyboard navigation
    - Test screen reader compatibility
    - Test color contrast
    - _Requirements: 34.4, 34.5, 34.6_

- [x] 42. System configuration and settings
  - [x] 42.1 Implement school configuration
    - Configure school information
    - Upload school logo
    - Configure academic year structure
    - _Requirements: 39.1, 39.2_
  
  - [x] 42.2 Implement system settings
    - Configure grading schemes
    - Configure attendance rules
    - Configure notification templates
    - Configure date format and currency
    - _Requirements: 39.3, 39.5, 39.6, 39.9_
  
  - [x] 42.3 Implement role and permission management
    - Configure user roles
    - Customize permissions
    - _Requirements: 39.7_
  
  - [x] 42.4 Write unit tests for configuration
    - Test school configuration
    - Test system settings
    - Test role management
    - _Requirements: 39.1, 39.7_


- [x] 43. Audit logging and monitoring
  - [x] 43.1 Implement comprehensive audit logging
    - Log authentication attempts
    - Log data modifications
    - Log administrative actions
    - Log financial transactions
    - _Requirements: 38.1, 38.2, 38.3, 38.4_
  
  - [x] 43.2 Implement audit log viewing
    - Create audit log viewer for admins
    - Support filtering and search
    - Implement log rotation
    - _Requirements: 38.5, 38.6, 38.7_
  
  - [x] 43.3 Write unit tests for audit logging
    - Test log creation
    - Test log filtering
    - Test log rotation
    - _Requirements: 38.1, 38.5, 38.7_

- [x] 44. Data archiving and backup
  - [x] 44.1 Implement data archiving
    - Archive completed academic years
    - Support data restoration
    - Implement retention policies
    - _Requirements: 40.4, 40.5, 40.6, 40.7_
  
  - [x] 44.2 Implement automated backup
    - Daily database backup
    - Backup to external storage
    - Implement recovery procedure
    - _Requirements: Reliability NFR_
  
  - [x] 44.3 Write unit tests for archiving
    - Test archiving process
    - Test data restoration
    - Test retention policies
    - _Requirements: 40.4, 40.6_

- [x] 45. API documentation and integration
  - [x] 45.1 Implement Swagger/OpenAPI documentation
    - Document all API endpoints
    - Include request/response examples
    - Support API versioning
    - _Requirements: 35.1, 35.2, 35.3_
  
  - [x] 45.2 Implement API features
    - Ensure rate limiting is configured
    - Ensure pagination is implemented
    - Support filtering and sorting
    - _Requirements: 35.4, 35.6, 35.7_

- [x] 46. Security hardening
  - [x] 46.1 Implement security best practices
    - Ensure HTTPS/TLS for all communications
    - Enforce strong password policy
    - Implement CSRF protection
    - Ensure input sanitization
    - _Requirements: 36.1, 36.3, 36.5, 36.6_
  
  - [x] 46.2 Implement data encryption
    - Encrypt sensitive data at rest
    - Ensure passwords are hashed with bcrypt
    - _Requirements: 36.2, 36.10_
  
  - [x] 46.3 Write security tests
    - Test SQL injection prevention
    - Test XSS prevention
    - Test authentication and authorization
    - _Requirements: 36.6, 36.7_
  
  - [x]* 46.4 Write property tests for security
    - **Property 29: SQL Injection Prevention**
    - **Property 30: XSS Prevention**
    - **Validates: Requirements 36.6**

- [x] 47. Performance optimization
  - [x] 47.1 Implement database optimization
    - Add indexes on frequently queried columns
    - Implement connection pooling
    - Log slow queries
    - _Requirements: 37.4, 37.6, 37.9_
  
  - [x] 47.2 Implement caching
    - Cache frequently accessed data in Redis
    - Implement cache invalidation
    - _Requirements: 37.5_
  
  - [x] 47.3 Implement frontend optimization
    - Optimize images
    - Implement lazy loading
    - _Requirements: 37.7, 37.8_
  
  - [x] 47.4 Write performance tests
    - Test API response times
    - Test concurrent user load
    - Test database query performance
    - _Requirements: 37.1, 37.2_


- [x] 48. Frontend - Complete portal enhancements
  - [x] 48.1 Enhance Student Portal
    - Add all missing features from requirements
    - Ensure PWA functionality
    - Test offline capabilities
    - _Requirements: 14.1-14.20_
  
  - [x] 48.2 Enhance Parent Portal
    - Add all missing features from requirements
    - Ensure payment integration works
    - Test notifications
    - _Requirements: 15.1-15.16_
  
  - [x] 48.3 Enhance Teacher Portal
    - Add all missing features from requirements
    - Ensure mobile responsiveness
    - _Requirements: 16.1-16.18_
  
  - [x] 48.4 Enhance Admin Portal
    - Add all missing features from requirements
    - Ensure comprehensive analytics
    - _Requirements: 17.1-17.15_
  
  - [x] 48.5 Enhance Library Portal
    - Add all missing features from requirements
    - _Requirements: 18.1-18.10_
  
  - [x] 48.6 Enhance Finance Portal
    - Add all missing features from requirements
    - _Requirements: 19.1-19.14_

- [x] 49. End-to-end testing
  - [x] 49.1 Write E2E tests for critical flows
    - Test complete user journeys for each portal
    - Test attendance marking flow
    - Test fee payment flow
    - Test exam grading flow
    - Test offline functionality
    - _Requirements: All critical user flows_
  
  - [x] 49.2 Set up CI/CD pipeline
    - Configure GitHub Actions
    - Run tests on every commit
    - Generate coverage reports
    - Deploy to staging
    - _Requirements: Maintainability NFR_

- [x] 50. Final checkpoint - Phase 4 Complete
  - Ensure all tests pass (unit, property, integration, E2E)
  - Verify all requirements are implemented
  - Test all portals thoroughly
  - Verify offline functionality works
  - Test payment gateways in production mode
  - Verify SMS integration works
  - Review security measures
  - Review performance metrics
  - Generate final documentation
  - Ask the user if questions arise

- [x] 51. Deployment and production readiness
  - [x] 51.1 Prepare production environment
    - Set up production server
    - Configure Nginx
    - Set up SSL certificates
    - Configure environment variables
    - _Requirements: Portability NFR_
  
  - [x] 51.2 Deploy application
    - Deploy backend
    - Deploy frontend
    - Run database migrations
    - Verify all services are running
    - _Requirements: Portability NFR_
  
  - [x] 51.3 Production testing
    - Test all critical flows in production
    - Monitor logs for errors
    - Test performance under load
    - _Requirements: Availability NFR_
  
  - [x] 51.4 Create user documentation
    - Write user manuals for each portal
    - Create video tutorials
    - Document common troubleshooting steps
    - _Requirements: Usability NFR_

## Notes

- Tasks marked with `*` are optional property-based test tasks and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties (31 properties total)
- Unit tests validate specific examples and edge cases
- All 31 correctness properties from the design document are mapped to property test tasks

## Property Test Summary

The following 31 correctness properties from the design document are implemented as property-based tests:

1. **Property 1-4**: NEB Grading (Task 4.2)
2. **Property 5**: Subject Combination Validation (Task 4.4)
3. **Property 6**: BS-AD Calendar Round Trip (Task 5.3)
4. **Property 7-10**: Authentication & Security (Tasks 3.5-3.8)
5. **Property 11-15**: Student Management (Task 6.4)
6. **Property 16-18**: Attendance Management (Task 10.6)
7. **Property 19**: Offline Sync (Task 37.4)
8. **Property 20**: Examination (Task 11.5)
9. **Property 21-22**: Finance (Task 12.6)
10. **Property 23-25**: Payment Gateway (Task 13.5)
11. **Property 26-28**: Library (Task 39.1)
12. **Property 29-30**: Security (Task 46.4)
13. **Property 31**: Image Compression (Task 38.5)

## Requirements Coverage

All 40 main requirements are covered:
- **N1-N6**: Nepal-specific requirements (NEB grading, BS calendar, streams, SEE, multi-shift, scholarships)
- **1-27**: Core functional requirements (auth, student, staff, academic, attendance, exams, finance, library, ECA, sports, communication, certificates, documents)
- **28-40**: Technical requirements (offline-first, low-bandwidth, i18n, calendar, payment gateways, reports, theme, API, security, performance, audit, config, data management)

