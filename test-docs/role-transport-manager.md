# Transport Manager - Functionality Checklist

## Test login

- Username: `transport1`
- Email: `transport1@school.edu.np`
- Password: `Transport@123`

## Expected landing page

- `/portal/transport`

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
| `/portal/transport` | Access transport portal |

## Role access validation notes

- Confirm direct URL access is blocked for pages outside this list.
- Confirm menu only shows entries that belong to this role.
- Confirm backend API returns 403 for unauthorized operations.
