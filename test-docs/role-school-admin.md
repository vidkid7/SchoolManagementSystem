# School Admin - Functionality Checklist

## Test login

- Username: `admin`
- Email: `admin@school.edu.np`
- Password: `Admin@123`

## Expected landing page

- `/dashboard`

## Page-wise functionality checks

| Page | Expected functionality |
|---|---|
| `/academic` | Manage academic structures, classes, and timetable settings |
| `/academic/calendar` | Manage academic structures, classes, and timetable settings |
| `/academic/class-subjects` | Manage academic structures, classes, and timetable settings |
| `/academic/classes` | Manage academic structures, classes, and timetable settings |
| `/academic/classes/:classId/subjects/:subjectId/teachers` | Manage academic structures, classes, and timetable settings |
| `/academic/classes/:classId/teacher` | Manage academic structures, classes, and timetable settings |
| `/academic/syllabus` | Manage academic structures, classes, and timetable settings |
| `/academic/timetable` | Manage academic structures, classes, and timetable settings |
| `/academic/years` | Manage academic structures, classes, and timetable settings |
| `/admissions` | Manage admissions and inquiries |
| `/admissions/:id` | Manage admissions and inquiries |
| `/admissions/list` | Manage admissions and inquiries |
| `/admissions/new` | Manage admissions and inquiries |
| `/attendance` | Track and manage attendance workflows |
| `/attendance/leave` | Track and manage attendance workflows |
| `/attendance/reports` | Track and manage attendance workflows |
| `/attendance/settings` | Track and manage attendance workflows |
| `/attendance/staff/mark` | Track and manage attendance workflows |
| `/attendance/student/mark` | Track and manage attendance workflows |
| `/audit` | Review system audit logs |
| `/calendar` | View calendar and events |
| `/calendar/dashboard` | View calendar and events |
| `/calendar/events` | View calendar and events |
| `/calendar/view` | View calendar and events |
| `/certificates` | Manage and verify certificates |
| `/certificates/dashboard` | Manage and verify certificates |
| `/certificates/manage` | Manage and verify certificates |
| `/certificates/templates` | Manage and verify certificates |
| `/certificates/verify` | Manage and verify certificates |
| `/change-password` | Update own password |
| `/communication/announcements` | Read announcements |
| `/communication/messages` | Use direct and group messaging |
| `/dashboard` | Institution-level overview dashboard |
| `/documents` | Access shared document workflows |
| `/eca` | Manage and review ECA activities |
| `/eca/dashboard` | Manage and review ECA activities |
| `/eca/list` | Manage and review ECA activities |
| `/eca/management` | Manage and review ECA activities |
| `/examinations` | Manage examinations, grading, and report cards |
| `/examinations/:id/edit` | Manage examinations, grading, and report cards |
| `/examinations/:id/grades` | Manage examinations, grading, and report cards |
| `/examinations/create` | Manage examinations, grading, and report cards |
| `/examinations/grades` | Manage examinations, grading, and report cards |
| `/examinations/grading-scheme` | Manage examinations, grading, and report cards |
| `/examinations/list` | Manage examinations, grading, and report cards |
| `/examinations/reports` | Manage examinations, grading, and report cards |
| `/finance` | Manage finance operations and reports |
| `/finance/dashboard` | Manage finance operations and reports |
| `/finance/fee-structures` | Manage finance operations and reports |
| `/finance/invoices` | Manage finance operations and reports |
| `/finance/payment-gateways` | Manage finance operations and reports |
| `/finance/payments` | Manage finance operations and reports |
| `/finance/reports` | Manage finance operations and reports |
| `/library` | Manage and use library resources |
| `/library/books` | Manage and use library resources |
| `/library/categories` | Manage and use library resources |
| `/library/circulation` | Manage and use library resources |
| `/library/dashboard` | Manage and use library resources |
| `/library/management` | Manage and use library resources |
| `/library/reports` | Manage and use library resources |
| `/notifications` | Review notification center |
| `/reports` | Access analytics and reports |
| `/settings` | Manage system-level settings |
| `/settings/archive` | Manage system-level settings |
| `/settings/backup` | Manage system-level settings |
| `/settings/roles` | Manage system-level settings |
| `/settings/school` | Manage system-level settings |
| `/settings/system` | Manage system-level settings |
| `/sports` | Manage and review sports activities |
| `/sports/dashboard` | Manage and review sports activities |
| `/sports/management` | Manage and review sports activities |
| `/staff` | Manage staff records and assignments |
| `/staff/:id` | Manage staff records and assignments |
| `/staff/:id/assignments` | Manage staff records and assignments |
| `/staff/:id/edit` | Manage staff records and assignments |
| `/staff/create` | Manage staff records and assignments |
| `/students` | Manage and review student records |
| `/students/:id` | Manage and review student records |
| `/students/:id/cv` | Manage and review student records |
| `/students/:id/edit` | Manage and review student records |
| `/students/bulk-import` | Manage and review student records |
| `/students/create` | Manage and review student records |
| `/teacher/assignments` | Use teacher workbench for lessons/assignments |
| `/teacher/dashboard` | Use teacher workbench for lessons/assignments |
| `/teacher/lessons` | Use teacher workbench for lessons/assignments |
| `/users` | Manage users and accounts |

## Role access validation notes

- Confirm direct URL access is blocked for pages outside this list.
- Confirm menu only shows entries that belong to this role.
- Confirm backend API returns 403 for unauthorized operations.
