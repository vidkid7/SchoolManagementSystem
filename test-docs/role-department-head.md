# Department Head - Functionality Checklist

## Test login

- Username: `depthead1`
- Email: `depthead1@school.edu.np`
- Password: `DeptHead@123`

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
| `/attendance` | Track and manage attendance workflows |
| `/attendance/leave` | Track and manage attendance workflows |
| `/attendance/reports` | Track and manage attendance workflows |
| `/attendance/student/mark` | Track and manage attendance workflows |
| `/calendar` | View calendar and events |
| `/calendar/view` | View calendar and events |
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
| `/examinations/grading-scheme` | Manage examinations, grading, and report cards |
| `/examinations/list` | Manage examinations, grading, and report cards |
| `/examinations/reports` | Manage examinations, grading, and report cards |
| `/library/books` | Manage and use library resources |
| `/library/categories` | Manage and use library resources |
| `/portal/teacher` | Access teacher portal landing page |
| `/reports` | Access analytics and reports |
| `/sports` | Manage and review sports activities |
| `/sports/dashboard` | Manage and review sports activities |
| `/sports/management` | Manage and review sports activities |
| `/students` | Manage and review student records |
| `/students/:id` | Manage and review student records |
| `/students/:id/cv` | Manage and review student records |
| `/teacher/assignments` | Use teacher workbench for lessons/assignments |
| `/teacher/dashboard` | Use teacher workbench for lessons/assignments |
| `/teacher/lessons` | Use teacher workbench for lessons/assignments |

## Role access validation notes

- Confirm direct URL access is blocked for pages outside this list.
- Confirm menu only shows entries that belong to this role.
- Confirm backend API returns 403 for unauthorized operations.
