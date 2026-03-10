# Student - Functionality Checklist

## Test login

- Username: `student1`
- Email: `student1@school.edu.np`
- Password: `Student@123`

## Expected landing page

- `/portal/student`

## Page-wise functionality checks

| Page | Expected functionality |
|---|---|
| `/calendar` | View calendar and events |
| `/calendar/view` | View calendar and events |
| `/certificates/verify` | Manage and verify certificates |
| `/change-password` | Update own password |
| `/communication/announcements` | Read announcements |
| `/communication/messages` | Use direct and group messaging |
| `/eca/list` | Manage and review ECA activities |
| `/examinations/reports` | Manage examinations, grading, and report cards |
| `/library/books` | Manage and use library resources |
| `/library/categories` | Manage and use library resources |
| `/my-certificates` | View own certificates |
| `/portal/student` | Access student self-service portal |

## Role access validation notes

- Confirm direct URL access is blocked for pages outside this list.
- Confirm menu only shows entries that belong to this role.
- Confirm backend API returns 403 for unauthorized operations.
