# School Management System - Admin Dashboard Guide

## Getting Started

### Login to Admin Dashboard

1. Open your browser and navigate to `http://localhost:5173`
2. Login with admin credentials:
   - **Email:** `admin@school.edu.np`
   - **Password:** `Admin@123`
3. After login, you'll be redirected to the admin dashboard

---

## Dashboard Overview

The admin dashboard provides a comprehensive overview of your school:

### Quick Stats (Home Page)
- Total Students
- Total Staff  
- Today's Attendance
- Fee Collection Status
- Pending Admissions
- Upcoming Exams
- Library Statistics
- Recent Activities

### Quick Actions
- Add New Student
- Add New Staff
- Create Announcement
- Generate Report
- Create Backup
- Send Notification

---

## Accessing Features

### Sidebar Navigation

The left sidebar contains all accessible menu items. Menu items are filtered based on your role.

| Menu Item | Path | Description |
|-----------|------|-------------|
| **Dashboard** | `/dashboard` | Main dashboard with statistics |
| **Students** | `/students` | Manage student records |
| **Staff** | `/staff` | Manage staff records |
| **Academic** | `/academic` | Manage classes, subjects, sections |
| **Attendance** | `/attendance` | Mark and view attendance |
| **Examinations** | `/examinations` | Manage exams and grades |
| **Finance** | `/finance` | Fee management and invoices |
| **Library** | `/library` | Book and circulation management |
| **Calendar** | `/calendar` | School events and holidays |
| **Certificates** | `/certificates` | Generate certificates |
| **Messages** | `/communication/messages` | Internal messaging |
| **Announcements** | `/communication/announcements` | School announcements |
| **Reports** | `/reports` | Reports and analytics |
| **Role Management** | `/settings/roles` | Manage roles and permissions |
| **System Settings** | `/settings/system` | Configure grading, attendance rules |
| **Backup & Restore** | `/settings/backup` | Database backups |
| **Archive** | `/settings/archive` | Archive old academic years |
| **Settings** | `/settings` | General admin settings |

---

## Module-by-Module Guide

### 1. Student Management (`/students`)

**How to Access:** Click "Students" in sidebar

**Features Available:**
- ✅ View all students in a table
- ✅ Search students by name, ID
- ✅ Filter by class, section, status
- ✅ Add new student
- ✅ Edit student details
- ✅ Delete student
- ✅ View student details
- ✅ Upload student photo
- ✅ Bulk import students from Excel
- ✅ Generate student CV

**How to Use:**
1. **View Students:** Navigate to `/students` - shows list with pagination
2. **Add Student:** Click "Add Student" button → Fill form → Save
3. **Edit Student:** Click eye icon → Click edit button → Modify → Save
4. **Delete Student:** Click delete icon → Confirm
5. **Bulk Import:** Click "Import" → Download template → Upload filled Excel
6. **View CV:** Click on student → View CV tab

---

### 2. Staff Management (`/staff`)

**How to Access:** Click "Staff" in sidebar

**Features Available:**
- ✅ View all staff members
- ✅ Search staff
- ✅ Filter by department, position, status
- ✅ Add new staff
- ✅ Edit staff details
- ✅ Delete staff
- ✅ View staff details
- ✅ Upload staff photo
- ✅ Assign teachers to classes/subjects
- ✅ Role assignment

**How to Use:**
1. **View Staff:** Navigate to `/staff` - shows card grid with stats
2. **Add Staff:** Click "Add Staff" → Fill form including role → Save
3. **Edit Staff:** Click on staff row → Edit button → Modify → Save
4. **Delete Staff:** Click delete icon → Confirm
5. **Manage Assignments:** For teachers, click assignment icon to assign classes

---

### 3. Academic Management (`/academic`)

**How to Access:** Click "Academic" in sidebar

**Features Available:**
- ✅ Manage classes/grades
- ✅ Manage subjects
- ✅ Assign subjects to classes
- ✅ Create sections
- ✅ Academic calendar management

**How to Use:**
1. Navigate to `/academic`
2. Use tabs to switch between Classes, Subjects, Sections
3. Click "Add" to create new entries
4. Click edit/delete icons to modify

---

### 4. Attendance Management (`/attendance`)

**How to Access:** Click "Attendance" in sidebar

**Features Available:**
- ✅ Mark student attendance
- ✅ Mark staff attendance
- ✅ View attendance reports
- ✅ Edit attendance records

**How to Use:**
1. Navigate to `/attendance`
2. Select class, date
3. Mark present/absent/late for each student
4. Save attendance

---

### 5. Examination Management (`/examinations`)

**How to Access:** Click "Examinations" in sidebar

**Features Available:**
- ✅ Create exam schedules
- ✅ Enter grades
- ✅ Generate report cards
- ✅ View exam results
- ✅ Configure grading schemes (via System Settings)

**How to Use:**
1. Navigate to `/examinations`
2. Create exam schedule
3. Enter grades for each subject
4. Generate/view report cards

---

### 6. Finance Management (`/finance`)

**How to Access:** Click "Finance" in sidebar

**Features Available:**
- ✅ View fee structures
- ✅ Generate invoices
- ✅ Record payments
- ✅ View payment history
- ✅ Send invoice reminders

**How to Use:**
1. Navigate to `/finance`
2. View invoice list
3. Filter by status (paid/pending/overdue)
4. Click to view details

---

### 7. Library Management (`/library`)

**How to Access:** Click "Library" in sidebar

**Features Available:**
- ✅ Add books to catalog
- ✅ Issue books
- ✅ Return books
- ✅ View borrowing history
- ✅ Manage book categories

**How to Use:**
1. Navigate to `/library`
2. Add books to inventory
3. Issue books to students/staff
4. Process returns

---

### 8. Calendar (`/calendar`)

**How to Access:** Click "Calendar" in sidebar

**Features Available:**
- ✅ View calendar with events
- ✅ Create events
- ✅ Manage holidays (Bikram Sambat supported)
- ✅ Academic calendar view

**How to Use:**
1. Navigate to `/calendar`
2. Click on date to add event
3. View events in month/week/day view

---

### 9. Certificates (`/certificates`)

**How to Access:** Click "Certificates" in sidebar

**Features Available:**
- ✅ Create certificate templates
- ✅ Generate certificates
- ✅ View all certificates
- ✅ Bulk certificate generation
- ✅ Certificate verification

**How to Use:**
1. Navigate to `/certificates`
2. Create template or select existing
3. Generate certificate for student
4. Verify using verification portal

---

### 10. Communication

**How to Access:** 
- Messages: `/communication/messages`
- Announcements: `/communication/announcements`

**Features Available:**
- ✅ Send messages to users
- ✅ Create announcements
- ✅ Bulk notifications
- ✅ View message history

---

### 11. Reports (`/reports`)

**How to Access:** Click "Reports" in sidebar

**Features Available:**
- ✅ Student reports
- ✅ Staff reports
- ✅ Attendance reports
- ✅ Financial reports
- ✅ Exam reports
- ✅ Library reports
- ✅ Export to PDF/Excel

**How to Use:**
1. Navigate to `/reports`
2. Select report type
3. Configure filters
4. Generate and export

---

### 12. Role Management (`/settings/roles`)

**How to Access:** Click "Role Management" in sidebar

**Features Available:**
- ✅ View all roles
- ✅ Create custom roles
- ✅ Edit role details
- ✅ Delete custom roles (system roles protected)
- ✅ Assign permissions to roles
- ✅ Toggle role active/inactive

**How to Use:**
1. Navigate to `/settings/roles`
2. View roles in table with permissions
3. Click "Add Role" to create new
4. Click "Manage Permissions" to assign
5. Use checkbox grid to select permissions

---

### 13. System Settings (`/settings/system`)

**How to Access:** Click "System Settings" in sidebar

**Features Available:**
- ✅ Manage grading schemes
- ✅ Configure attendance rules
- ✅ Manage notification templates
- ✅ Set date format preferences

**How to Use:**
1. Navigate to `/settings/system`
2. Use tabs to switch between:
   - **Grading Schemes:** Add/edit grade ranges and points
   - **Attendance Rules:** Configure weightage and minimum attendance
   - **Notification Templates:** Create SMS/email templates
   - **Date Format:** Set display format

---

### 14. Backup & Restore (`/settings/backup`)

**How to Access:** Click "Backup & Restore" in sidebar

**Features Available:**
- ✅ Create manual backup
- ✅ View backup list
- ✅ Restore from backup
- ✅ Verify backup integrity
- ✅ Clean up old backups
- ✅ View backup statistics

**How to Use:**
1. Navigate to `/settings/backup`
2. Click "Create Backup" to generate new backup
3. View list with status (success/failed, verified/not verified)
4. Click verify icon to check integrity
5. Click restore icon → Confirm → Restores database

⚠️ **Warning:** Restoring a backup will replace current data!

---

### 15. Archive Management (`/settings/archive`)

**How to Access:** Click "Archive" in sidebar

**Features Available:**
- ✅ Archive academic year data
- ✅ View archive list
- ✅ Restore archived data
- ✅ Delete expired archives

**How to Use:**
1. Navigate to `/settings/archive`
2. Click "Archive Academic Year" to archive old data
3. View archived years with record counts
4. Restore if needed

---

### 16. Audit Logs (`/audit`)

**How to Access:** Via Reports or direct route

**Features Available:**
- ✅ View all system actions
- ✅ Filter by user, action, resource
- ✅ View change history

---

## Quick Reference

### Keyboard Shortcuts
- Navigate forward: `Tab`
- Navigate backward: `Shift + Tab`
- Select: `Enter`
- Cancel: `Escape`

### Common Tasks

| Task | Steps |
|------| Student | Students-------|
| Add → Add Student → Fill Form → Save |
| Add Staff | Staff → Add Staff → Fill Form (with role) → Save |
| Mark Attendance | Attendance → Select Class → Mark → Save |
| Create Backup | Backup → Create Backup → Wait → Verify |
| Generate Report | Reports → Select Type → Configure → Export |

---

## Troubleshooting

### Common Issues

1. **Can't access a menu item**
   - Check if your role has permission
   - Contact system administrator

2. **Backup fails**
   - Check server storage space
   - Verify database connection

3. **Can't save data**
   - Check required fields
   - Verify data format

---

## Support

For additional help:
- Check backend logs: `backend/logs/`
- Check console for errors
- Verify database connection

---

**Document Version:** 1.0
**Last Updated:** February 16, 2026
