# Librarian - Functionality Checklist

## Test login

- Username: `librarian1`
- Email: `librarian1@school.edu.np`
- Password: `Librarian@123`

## Expected landing page

- `/library`

## Page-wise functionality checks

| Page | Expected functionality |
|---|---|
| `/calendar` | View calendar and events |
| `/calendar/view` | View calendar and events |
| `/certificates/verify` | Manage and verify certificates |
| `/change-password` | Update own password |
| `/communication/announcements` | Read announcements |
| `/communication/messages` | Use direct and group messaging |
| `/dashboard` | Institution-level overview dashboard |
| `/documents` | Access shared document workflows |
| `/eca/list` | Manage and review ECA activities |
| `/library` | Manage and use library resources |
| `/library/books` | Manage and use library resources |
| `/library/categories` | Manage and use library resources |
| `/library/circulation` | Manage and use library resources |
| `/library/dashboard` | Manage and use library resources |
| `/library/management` | Manage and use library resources |
| `/library/reports` | Manage and use library resources |
| `/reports` | Access analytics and reports |

## Role access validation notes

- Confirm direct URL access is blocked for pages outside this list.
- Confirm menu only shows entries that belong to this role.
- Confirm backend API returns 403 for unauthorized operations.
