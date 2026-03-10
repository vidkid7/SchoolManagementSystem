# 🔍 SCHOOL MANAGEMENT SYSTEM — GAP ANALYSIS REPORT

**Generated:** Cross-referencing role requirements (.md docs), frontend implementation, and backend implementation.

---

## EXECUTIVE SUMMARY

| Metric | Count |
|--------|-------|
| Roles analyzed | 14 |
| **Critical gaps (frontend calling missing backend)** | **6 endpoints** |
| **Missing backend modules (no routes at all)** | **2 modules** (Lesson Plans, Assignments) |
| **Frontend pages using only hardcoded data** | **2 pages** |
| **Roles without dedicated portal** | **3** (Accountant, Class_Teacher/Dept_Head, ECA/Sports Coordinators share generic pages) |
| **Documented features with zero implementation** | **8+ feature areas** |
| Backend endpoints with no frontend consumer | ~15 endpoints |
| Frontend "Coming Soon" placeholders | 2 |

---

## PRIORITY 1 — CRITICAL: Frontend Calling Missing Backend

These are **runtime errors** — the frontend makes API calls to endpoints that don't exist.

### GAP-001: Student Portal — Missing `/students/me/assignments`
- **Frontend:** `EnhancedStudentPortal.tsx` references assignments data in the UI (Assignments tab)
- **Backend:** No `/api/v1/students/me/assignments` route in `student.routes.ts`
- **Backend module missing:** No `assignment` module exists anywhere in `backend/src/modules/`
- **Impact:** Student portal Assignments tab will fail or show empty
- **Fix:** Create `backend/src/modules/assignment/` with full CRUD + `GET /students/me/assignments` route

### GAP-002: Student Portal — Missing `/students/me/timetable`
- **Frontend:** `EnhancedStudentPortal.tsx` shows "Timetable Coming Soon" placeholder (line 514)
- **Backend:** No `/api/v1/students/me/timetable` route exists
- **Workaround possible:** Timetable data exists in `GET /api/v1/academic/timetable/:classId` but requires class lookup
- **Fix:** Add `GET /students/me/timetable` route to `student.routes.ts` that resolves the student's class and returns their timetable

### GAP-003: Student Portal — Missing `/students/me/notices`
- **Frontend:** Portal UI has a notices/announcements section
- **Backend:** No `/api/v1/students/me/notices` route exists
- **Workaround:** Announcements exist at `GET /api/v1/communication/announcements` (universal endpoint)
- **Fix:** Either add `/students/me/notices` or update frontend to use `/communication/announcements`

### GAP-004: Teacher LessonPlanning — No Backend API
- **Frontend:** `frontend/src/pages/teacher/LessonPlanning.tsx` (full UI with create/edit/delete)
- **Data:** Uses **hardcoded sample data** (`const lessonPlans = [...]` at line 61) — zero API calls
- **Backend:** No `lessonPlan` module exists in `backend/src/modules/`
- **Impact:** Lesson plans cannot be saved, edited, or retrieved — purely cosmetic UI
- **Fix:** Create `backend/src/modules/lessonPlan/` with CRUD endpoints + wire up frontend

### GAP-005: Teacher AssignmentManagement — No Backend API
- **Frontend:** `frontend/src/pages/teacher/AssignmentManagement.tsx` (full UI with grading)
- **Data:** Uses **hardcoded sample data** (`const assignments = [...]` at line 68) — zero API calls
- **Backend:** No `assignment` module exists in `backend/src/modules/`
- **Impact:** Assignments cannot be created, graded, or tracked — purely cosmetic UI
- **Fix:** Create `backend/src/modules/assignment/` with CRUD + grading endpoints

### GAP-006: Parent Portal — `/parents/announcements` path mismatch
- **Frontend:** `ParentPortal.tsx` calls `/api/v1/parents/children/:id/summary` (which exists)
- **Role docs:** Parent should see school announcements
- **Backend:** No `/api/v1/parents/announcements` — announcements live at `/api/v1/communication/announcements`
- **Fix:** Either add a parent-specific announcement proxy or update frontend to use communication endpoint

---

## PRIORITY 2 — HIGH: Roles Without Dedicated Portals

### GAP-007: ACCOUNTANT — No Dedicated Portal
- **Current:** Accountant login redirects to `/finance` (the admin finance dashboard)
- **Role docs require:** Dedicated dashboard with finance summary, collection trends, pending invoices, refund requests
- **Missing features vs role docs:**
  - ❌ Accountant-specific dashboard widgets (today's collection, pending invoices count)
  - ❌ Refund management UI (backend has `POST /finance/refunds` but no dedicated frontend page)
  - ❌ Student financial data search by fee status
  - ❌ Communication features for fee reminders
- **Fix:** Create `frontend/src/pages/portals/AccountantPortal.tsx` with accountant-specific dashboard

### GAP-008: CLASS_TEACHER — No Dedicated Portal
- **Current:** Redirects to TeacherPortal.tsx → which is a **stub** (20 lines, just redirects to `/teacher/dashboard`)
- **Role docs require:**
  - ❌ Class roster management
  - ❌ Class-specific attendance monitoring
  - ❌ Behavior/discipline management for class students
  - ❌ Parent communication hub
  - ❌ Student progress tracking dashboard
  - ❌ Class event management
- **Backend:** Teacher endpoints (`/api/v1/teachers/`) provide only: dashboard, schedule/today, tasks/pending, classes/performance, stats, notifications — **no class-specific management**
- **Fix:** Create `frontend/src/pages/portals/ClassTeacherPortal.tsx` + extend `backend/src/modules/teacher/` with class-teacher-specific endpoints

### GAP-009: DEPARTMENT_HEAD — No Dedicated Portal
- **Current:** Department Head is NOT handled in login redirect — falls to `default` → `/dashboard` (admin dashboard)
- **Role docs require:**
  - ❌ Department statistics dashboard
  - ❌ Teacher supervision & evaluation
  - ❌ Lesson plan review
  - ❌ Department performance reports
  - ❌ Department-specific communication
- **Backend:** Uses same teacher endpoints — no department-specific endpoints exist
- **Fix:** Create `frontend/src/pages/portals/DepartmentHeadPortal.tsx` + add `/api/v1/department-head/` backend module

### GAP-010: TeacherPortal.tsx — Is a Stub
- **File:** `frontend/src/pages/portals/TeacherPortal.tsx` (20 lines)
- **Implementation:** Just renders a `CircularProgress` spinner and redirects to `/teacher/dashboard`
- **Impact:** No true teacher portal experience; teachers get the generic TeacherDashboard instead
- **Fix:** Either make TeacherPortal a real portal or remove the indirection and route directly to TeacherDashboard

---

## PRIORITY 3 — MEDIUM: Missing Backend Modules (Documented but Unimplemented)

### GAP-011: Assignment Module — Complete Absence
- **Role docs:** Subject_Teacher, Class_Teacher, Student, Parent all reference assignments
- **Backend:** No `backend/src/modules/assignment/` directory
- **Required endpoints:**
  - `POST /api/v1/assignments` — Create assignment
  - `GET /api/v1/assignments` — List assignments (with filters)
  - `GET /api/v1/assignments/:id` — Get assignment detail
  - `PUT /api/v1/assignments/:id` — Update assignment
  - `DELETE /api/v1/assignments/:id` — Delete assignment
  - `POST /api/v1/assignments/:id/submit` — Student submission
  - `POST /api/v1/assignments/:id/grade` — Grade submission
  - `GET /api/v1/assignments/student/:studentId` — Student's assignments
- **Database entities needed:** Assignment, AssignmentSubmission, AssignmentGrade

### GAP-012: Lesson Plan Module — Complete Absence
- **Role docs:** Subject_Teacher, Class_Teacher, Department_Head all reference lesson plans
- **Backend:** No `backend/src/modules/lessonPlan/` directory
- **Required endpoints:**
  - `POST /api/v1/lesson-plans` — Create lesson plan
  - `GET /api/v1/lesson-plans` — List lesson plans
  - `GET /api/v1/lesson-plans/:id` — Get detail
  - `PUT /api/v1/lesson-plans/:id` — Update
  - `DELETE /api/v1/lesson-plans/:id` — Delete
  - `PATCH /api/v1/lesson-plans/:id/status` — Mark complete/reviewed
- **Database entities needed:** LessonPlan, LessonPlanResource

### GAP-013: Student Behavior/Discipline Module — Missing (Non-Hostel)
- **Role docs:** Class_Teacher should manage behavior incidents, disciplinary actions
- **Current:** Discipline tracking ONLY exists in hostel module (`/api/v1/hostel/discipline`)
- **Required:** General student behavior module accessible to Class Teachers and Admins
- **Fix:** Create `backend/src/modules/behavior/` for school-wide behavior tracking

### GAP-014: Transport GPS Tracking — Not Implemented
- **Role docs:** Transport_Manager should have real-time vehicle tracking, geofence alerts, speed monitoring
- **Backend:** No GPS/tracking endpoints exist in transport module
- **Current transport endpoints:** Routes, vehicles, pickup points, attendance only
- **Fix:** Requires GPS device integration — may be deferred to Phase 2

### GAP-015: Hostel Mess Management — Not Implemented
- **Role docs:** Hostel_Warden should manage mess menu, meal attendance, food complaints
- **Backend:** No mess-related endpoints in hostel module
- **Fix:** Add mess management endpoints to `backend/src/modules/hostel/`

### GAP-016: Hostel Inventory Management — Not Implemented
- **Role docs:** Hostel_Warden should manage hostel inventory, supplies, asset allocation
- **Backend:** No inventory endpoints in hostel module
- **Fix:** Add inventory management endpoints to `backend/src/modules/hostel/`

### GAP-017: Hostel Facility Management — Not Implemented
- **Role docs:** Monitor facilities, schedule maintenance, manage common areas
- **Backend:** Not implemented
- **Fix:** Add facility management endpoints to `backend/src/modules/hostel/`

---

## PRIORITY 4 — LOW: Backend Endpoints with No Frontend

These backend endpoints exist but have no corresponding frontend UI:

| Backend Endpoint | Module | Frontend Status |
|---|---|---|
| `POST /students/detect-duplicates` | Student | No UI trigger |
| `POST /students/validate` | Student | No UI trigger |
| `GET /students/roll-number/next` | Student | No UI usage found |
| `POST /students/:id/promote` | Student | No promote button in StudentDetail |
| `POST /students/:id/transfer` | Student | No transfer UI |
| `GET /students/:id/siblings` | Student | No siblings display |
| `POST /finance/invoices/bulk-generate` | Finance | No bulk generation UI |
| `POST /finance/payment-gateways/:key/test` | Finance | No test connection button |
| `GET /finance/reports/defaulters` | Finance | No defaulters list page |
| `POST /attendance/student/sync` | Attendance | No offline sync UI |
| `POST /communication/sms/send` | Communication | No SMS UI |
| `POST /communication/sms/bulk` | Communication | No bulk SMS UI |
| `POST /communication/push/send` | Communication | No push notification UI |
| `POST /archive/academic-year` | Archive | Limited UI in ArchiveManagement |
| `GET /audit/entity/:entityType/:entityId` | Audit | No entity-specific audit UI |

---

## PRIORITY 5 — COSMETIC: "Coming Soon" Placeholders

| File | Line | Placeholder Text |
|---|---|---|
| `EnhancedStudentPortal.tsx` | 514 | "Timetable Coming Soon" |
| `StudentCV.tsx` | 539 | "CV Feature Coming Soon" |
| `translation.json` | 247 | `"cvComingSoon": "CV Feature Coming Soon"` |

**Note:** The CV module backend is fully implemented (`/api/v1/cv/`) — the frontend just hasn't been wired up yet.

---

## ROLE-BY-ROLE GAP SUMMARY

### ACCOUNTANT
| Feature (from docs) | Frontend | Backend | Status |
|---|---|---|---|
| Finance dashboard | FinanceDashboard.tsx (shared w/admin) | `/finance/statistics` ✅ | ⚠️ Not accountant-specific |
| Fee structure CRUD | FeeStructures.tsx ✅ | `/finance/fee-structures` ✅ | ✅ Working |
| Invoice management | InvoiceList.tsx ✅ | `/finance/invoices` ✅ | ✅ Working |
| Payment processing | Payments.tsx ✅ | `/finance/payments` ✅ | ✅ Working |
| Refund management | ❌ No dedicated UI | `/finance/refunds` ✅ | ⚠️ Backend exists, no frontend |
| Payment gateway | PaymentGateways.tsx ✅ | `/finance/payment-gateways` ✅ | ✅ Working |
| Financial reports | FinancialReports.tsx ✅ | `/finance/reports` ✅ | ✅ Working |
| Accountant-specific dashboard | ❌ Missing | ❌ Missing | ❌ Gap |
| Fee reminders | ❌ No UI | ✅ Backend exists | ⚠️ Gap |

### CLASS_TEACHER
| Feature (from docs) | Frontend | Backend | Status |
|---|---|---|---|
| Class roster | ❌ Missing | ❌ No class-teacher endpoints | ❌ Gap |
| Class attendance | AttendanceMarking.tsx (shared) | `/attendance/student/mark` ✅ | ⚠️ Shared UI |
| Behavior management | ❌ Missing | ❌ No behavior module | ❌ Gap |
| Parent communication | Messaging.tsx (shared) | `/communication/` ✅ | ⚠️ Shared UI |
| Class announcements | ❌ No class-specific | Announcements shared | ⚠️ Gap |
| Student progress tracking | ❌ Missing | ❌ Missing | ❌ Gap |
| Class events | ❌ Missing | Calendar shared | ⚠️ Gap |
| Dedicated portal | ❌ Stub (20 lines) | `/teachers/` (6 endpoints) | ❌ Gap |

### DEPARTMENT_HEAD
| Feature (from docs) | Frontend | Backend | Status |
|---|---|---|---|
| Dept dashboard | ❌ Missing | ❌ No dept-head module | ❌ Gap |
| Teacher supervision | ❌ Missing | ❌ Missing | ❌ Gap |
| Lesson plan review | ❌ Missing | ❌ No lesson plan module | ❌ Gap |
| Dept performance reports | ❌ Missing | ❌ Missing | ❌ Gap |
| Student monitoring | ReportsAnalytics.tsx (shared) | `/reports/` ✅ | ⚠️ Shared |
| Dedicated portal | ❌ Falls to admin dashboard | Teacher endpoints only | ❌ Gap |

### STUDENT
| Feature (from docs) | Frontend | Backend | Status |
|---|---|---|---|
| Student portal | EnhancedStudentPortal.tsx ✅ | Multiple `/students/me/` ✅ | ✅ Working |
| Attendance | ✅ | `/students/me/attendance/summary` ✅ | ✅ Working |
| Grades | ✅ | `/students/me/grades` ✅ | ✅ Working |
| Fee status | ✅ | `/students/me/fees/summary` ✅ | ✅ Working |
| Assignments | ⚠️ UI exists, no API | ❌ No endpoint | ❌ Gap |
| Timetable | "Coming Soon" placeholder | ❌ No `/me/timetable` | ❌ Gap |
| Library | ✅ | `/students/:id/library` ✅ | ✅ Working |
| ECA | ✅ | `/students/:id/eca` ✅ | ✅ Working |
| Certificates | ✅ | `/students/:id/certificates` ✅ | ✅ Working |

### PARENT
| Feature (from docs) | Frontend | Backend | Status |
|---|---|---|---|
| Parent portal | ParentPortal.tsx ✅ | `/parents/` ✅ | ✅ Working |
| Child attendance | ✅ | `/parents/children/:id/attendance` ✅ | ✅ Working |
| Child grades | ✅ | `/parents/children/:id/grades` ✅ | ✅ Working |
| Child fees | ✅ | `/parents/children/:id/fees` ✅ | ✅ Working |
| Announcements | ⚠️ Uses `/communication/` | ❌ No `/parents/announcements` | ⚠️ Minor gap |
| Assignment tracking | ❌ Missing | ❌ No assignment module | ❌ Gap |
| Library monitoring | ❌ Missing in portal | Backend exists | ⚠️ Frontend gap |
| Online payments | ❌ Missing in portal | Backend exists | ⚠️ Frontend gap |
| Behavior monitoring | ❌ Missing | ❌ No behavior module | ❌ Gap |

### SUBJECT_TEACHER
| Feature (from docs) | Frontend | Backend | Status |
|---|---|---|---|
| Attendance marking | AttendanceMarking.tsx ✅ | `/attendance/student/mark` ✅ | ✅ Working |
| Grade entry | GradeEntry.tsx ✅ | `/grades/` ✅ | ✅ Working |
| Lesson planning | LessonPlanning.tsx (hardcoded data) | ❌ No module | ❌ Gap |
| Assignment mgmt | AssignmentManagement.tsx (hardcoded) | ❌ No module | ❌ Gap |
| Student profiles (read) | StudentDetail.tsx ✅ | `/students/:id` ✅ | ✅ Working |
| Communication | Messaging.tsx ✅ | `/communication/` ✅ | ✅ Working |

### SPORTS_COORDINATOR
| Feature (from docs) | Frontend | Backend | Status |
|---|---|---|---|
| Sports dashboard | SportsDashboard.tsx ✅ | `/sports/statistics` ✅ | ✅ Working |
| Sports CRUD | SportsManagement.tsx ✅ | `/sports/` CRUD ✅ | ✅ Working |
| Team management | ✅ | `/sports/teams` ✅ | ✅ Working |
| Tournament mgmt | ✅ | `/sports/tournaments` ✅ | ✅ Working |
| Achievements | ✅ | `/sports/achievements` ✅ | ✅ Working |
| Practice attendance | ✅ | `/sports/:id/mark-attendance` ✅ | ✅ Working |
| Dedicated portal | ⚠️ Redirects to `/sports` | Shared admin page | ⚠️ No dedicated portal |

### ECA_COORDINATOR
| Feature (from docs) | Frontend | Backend | Status |
|---|---|---|---|
| ECA dashboard | ECADashboard.tsx ✅ | `/eca/statistics` ✅ | ✅ Working |
| ECA CRUD | ECAManagement.tsx ✅ | `/eca/` CRUD ✅ | ✅ Working |
| Student enrollment | ✅ | `/eca/:id/enroll` ✅ | ✅ Working |
| Attendance | ✅ | `/eca/:id/mark-attendance` ✅ | ✅ Working |
| Achievements | ✅ | `/eca/:id/record-achievement` ✅ | ✅ Working |
| Events | ✅ | `/eca/events` ✅ | ✅ Working |
| Dedicated portal | ⚠️ Redirects to `/eca` | Shared admin page | ⚠️ No dedicated portal |

### TRANSPORT_MANAGER
| Feature (from docs) | Frontend | Backend | Status |
|---|---|---|---|
| Transport portal | TransportPortal.tsx ✅ | `/transport/` ✅ | ✅ Working |
| Vehicle management | ✅ | `/transport/vehicles` ✅ | ✅ Working |
| Route management | ✅ | `/transport/routes` ✅ | ✅ Working |
| Driver management | ❌ Missing | ❌ No driver endpoints | ❌ Gap |
| Maintenance mgmt | ❌ Missing | ❌ Missing | ❌ Gap |
| GPS tracking | ❌ Missing | ❌ Missing | ❌ Gap |
| Safety/compliance | ❌ Missing | ❌ Missing | ❌ Gap |
| Fuel tracking | ❌ Missing | ❌ Missing | ❌ Gap |

### HOSTEL_WARDEN
| Feature (from docs) | Frontend | Backend | Status |
|---|---|---|---|
| Hostel portal | HostelPortal.tsx ✅ | `/hostel/` ✅ | ✅ Working |
| Room management | ✅ | `/hostel/rooms` ✅ | ✅ Working |
| Discipline | ✅ | `/hostel/discipline` ✅ | ✅ Working |
| Visitors | ✅ | `/hostel/visitors` ✅ | ✅ Working |
| Leave requests | ✅ | `/hostel/leaves` ✅ | ✅ Working |
| Incidents | ✅ | `/hostel/incidents` ✅ | ✅ Working |
| Mess management | ❌ Missing | ❌ Missing | ❌ Gap |
| Inventory | ❌ Missing | ❌ Missing | ❌ Gap |
| Facility management | ❌ Missing | ❌ Missing | ❌ Gap |

### NON_TEACHING_STAFF
| Feature (from docs) | Frontend | Backend | Status |
|---|---|---|---|
| Staff portal | NonTeachingStaffPortal.tsx ✅ | `/non-teaching-staff/` ✅ | ✅ Working |
| Task management | ✅ | `/non-teaching-staff/tasks` ✅ | ✅ Working |
| Schedule | ✅ | `/non-teaching-staff/schedule` ✅ | ✅ Working |
| Leave management | ❌ Not in portal | `/attendance/leave/` (shared) | ⚠️ Not integrated |
| Facility requests | ❌ Missing | ❌ Missing | ❌ Gap |
| Inventory (if assigned) | ❌ Missing | ❌ Missing | ❌ Gap |

### LIBRARIAN
| Feature (from docs) | Frontend | Backend | Status |
|---|---|---|---|
| Library dashboard | LibraryDashboard.tsx ✅ | `/library/statistics` ✅ | ✅ Working |
| Book catalog | BookCatalog.tsx ✅ | `/library/books` ✅ | ✅ Working |
| Circulation | BookCirculation.tsx ✅ | `/library/issue`, `/return` ✅ | ✅ Working |
| Categories | Categories.tsx ✅ | `/library/categories` ✅ | ✅ Working |
| Fines | ✅ | `/library/fines/` ✅ | ✅ Working |
| Reports | LibraryReports.tsx ✅ | `/library/reports` ✅ | ✅ Working |
| Reservations | ✅ | `/library/reservations` ✅ | ✅ Working |
| Dedicated portal | ⚠️ Redirects to `/library` | Shared admin page | ⚠️ No dedicated portal |

### MUNICIPALITY_ADMIN
| Feature (from docs) | Frontend | Backend | Status |
|---|---|---|---|
| Municipality portal | MunicipalityAdminPortal.tsx ✅ | `/municipality-admin/` ✅ | ✅ Working |
| School management | ✅ | `/municipality-admin/schools` ✅ | ✅ Working |
| Admin management | ✅ | `/municipality-admin/schools/:id/admins` ✅ | ✅ Working |
| Reports | ✅ | `/municipality-admin/reports` ✅ | ✅ Working |
| Audit & compliance | ❌ Limited | `/audit/` (shared) | ⚠️ Not municipality-specific |

### SCHOOL_ADMIN
| Feature (from docs) | Frontend | Backend | Status |
|---|---|---|---|
| Full system access | Dashboard.tsx ✅ | All modules ✅ | ✅ Mostly Working |
| All CRUD operations | ✅ | 200+ endpoints ✅ | ✅ Working |
| Assignment module | ❌ No module | ❌ No module | ❌ Gap |
| Lesson plan module | ❌ No module | ❌ No module | ❌ Gap |
| Behavior tracking | ❌ No module | ❌ No module | ❌ Gap |

---

## PRIORITIZED ACTION ITEMS

### 🔴 P0 — Fix Immediately (Runtime Errors / Broken Features)
1. **Create Assignment backend module** (`backend/src/modules/assignment/`) — affects Student, Teacher, Parent roles
2. **Create Lesson Plan backend module** (`backend/src/modules/lessonPlan/`) — affects all Teacher roles
3. **Wire LessonPlanning.tsx to API** — currently uses hardcoded data, zero API calls
4. **Wire AssignmentManagement.tsx to API** — currently uses hardcoded data, zero API calls
5. **Add `GET /students/me/timetable`** endpoint to student routes (resolve student class → return timetable)
6. **Add `GET /students/me/assignments`** endpoint (once assignment module exists)

### 🟡 P1 — Create Missing Portals (Role Experience)
7. **Create AccountantPortal.tsx** — with finance summary dashboard, pending invoices, collection trends
8. **Create ClassTeacherPortal.tsx** — with class roster, attendance, behavior, parent communication
9. **Create DepartmentHeadPortal.tsx** — with department stats, teacher supervision, lesson plan review
10. **Fix TeacherPortal.tsx** — replace stub with real portal or route directly to TeacherDashboard
11. **Fix Department_Head login redirect** — currently falls to default `/dashboard`
12. **Add class-teacher backend endpoints** — class roster, class students, class-specific operations
13. **Add department-head backend endpoints** — department teachers, department performance

### 🟢 P2 — Add Missing Feature Modules
14. **Create Behavior/Discipline module** (general, non-hostel) — for Class Teacher behavioral tracking
15. **Add Hostel Mess Management** — mess menu, meal attendance, food complaints
16. **Add Hostel Inventory Management** — supplies tracking, asset allocation
17. **Add Transport Driver Management** — driver profiles, license tracking, scheduling
18. **Add Transport Maintenance tracking** — maintenance schedules, cost tracking
19. **Add Non-Teaching Staff Leave Integration** — connect portal to leave management system
20. **Add Non-Teaching Staff Facility Requests** — maintenance request submission

### 🔵 P3 — Wire Existing Backend to Frontend
21. **Add Refund Management UI** for Accountant (backend `/finance/refunds` exists)
22. **Add Student Promote/Transfer UI** (backend endpoints exist, no frontend buttons)
23. **Add SMS sending UI** (backend `/communication/sms/send` exists)
24. **Add Push notification UI** (backend `/communication/push/send` exists)
25. **Add Bulk invoice generation UI** (backend `/finance/invoices/bulk-generate` exists)
26. **Wire StudentCV.tsx to API** — remove "Coming Soon", backend `/api/v1/cv/` is fully implemented
27. **Add Student Timetable to portal** — remove "Coming Soon" placeholder, wire to academic timetable API
28. **Add Parent online payment integration** in ParentPortal
29. **Add Parent library monitoring** in ParentPortal (backend exists)

### ⚪ P4 — Future Enhancements (Documented but Complex)
30. Transport GPS real-time tracking (requires hardware integration)
31. Hostel Facility Management
32. Transport Safety & Compliance module
33. Transport Fuel consumption tracking
34. Municipality audit & compliance (municipality-specific audit views)

---

## FILES TO CREATE (New)

| # | File Path | Purpose |
|---|-----------|---------|
| 1 | `backend/src/modules/assignment/assignment.model.ts` | Assignment + Submission entities |
| 2 | `backend/src/modules/assignment/assignment.controller.ts` | Assignment CRUD + grading |
| 3 | `backend/src/modules/assignment/assignment.routes.ts` | Route definitions |
| 4 | `backend/src/modules/assignment/assignment.validation.ts` | Joi validation |
| 5 | `backend/src/modules/lessonPlan/lessonPlan.model.ts` | LessonPlan entity |
| 6 | `backend/src/modules/lessonPlan/lessonPlan.controller.ts` | Lesson plan CRUD |
| 7 | `backend/src/modules/lessonPlan/lessonPlan.routes.ts` | Route definitions |
| 8 | `backend/src/modules/lessonPlan/lessonPlan.validation.ts` | Joi validation |
| 9 | `backend/src/modules/behavior/behavior.model.ts` | BehaviorRecord entity |
| 10 | `backend/src/modules/behavior/behavior.controller.ts` | Behavior CRUD |
| 11 | `backend/src/modules/behavior/behavior.routes.ts` | Route definitions |
| 12 | `frontend/src/pages/portals/AccountantPortal.tsx` | Accountant dashboard portal |
| 13 | `frontend/src/pages/portals/ClassTeacherPortal.tsx` | Class teacher portal |
| 14 | `frontend/src/pages/portals/DepartmentHeadPortal.tsx` | Department head portal |

## FILES TO MODIFY (Existing)

| # | File Path | Change |
|---|-----------|--------|
| 1 | `backend/src/app.ts` | Register new route modules (assignment, lessonPlan, behavior) |
| 2 | `backend/src/modules/student/student.routes.ts` | Add `/me/assignments`, `/me/timetable`, `/me/notices` |
| 3 | `backend/src/modules/student/student.controller.ts` | Add handlers for new /me/ endpoints |
| 4 | `frontend/src/pages/teacher/LessonPlanning.tsx` | Replace hardcoded data with API calls |
| 5 | `frontend/src/pages/teacher/AssignmentManagement.tsx` | Replace hardcoded data with API calls |
| 6 | `frontend/src/pages/portals/TeacherPortal.tsx` | Replace stub with real portal or remove |
| 7 | `frontend/src/App.tsx` | Add routes for new portals, fix Dept Head redirect |
| 8 | `frontend/src/pages/Login.tsx` | Add Department_Head to redirect switch |
| 9 | `frontend/src/pages/portals/EnhancedStudentPortal.tsx` | Wire timetable tab to API, fix assignments |
| 10 | `frontend/src/pages/students/StudentCV.tsx` | Wire to `/api/v1/cv/` API, remove "Coming Soon" |
| 11 | `frontend/src/pages/portals/ParentPortal.tsx` | Add library, behavior, payment sections |
| 12 | `backend/src/modules/hostel/hostel.routes.ts` | Add mess, inventory, facility endpoints |
| 13 | `backend/src/modules/hostel/hostel.controller.ts` | Add mess, inventory, facility handlers |
| 14 | `backend/src/modules/transport/transport.routes.ts` | Add driver, maintenance endpoints |
| 15 | `backend/src/modules/transport/transport.controller.ts` | Add driver, maintenance handlers |

---

*End of Gap Analysis Report*
