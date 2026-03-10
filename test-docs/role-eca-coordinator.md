# ECA Coordinator - Functionality Checklist

## Test login

- Username: `ecacoord1`
- Email: `ecacoord1@school.edu.np`
- Password: `ECACoord@123`

## Expected landing page

- `/eca`

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
| `/eca` | Manage and review ECA activities |
| `/eca/dashboard` | Manage and review ECA activities |
| `/eca/list` | Manage and review ECA activities |
| `/eca/management` | Manage and review ECA activities |
| `/reports` | Access analytics and reports |

## Role access validation notes

- Confirm direct URL access is blocked for pages outside this list.
- Confirm menu only shows entries that belong to this role.
- Confirm backend API returns 403 for unauthorized operations.
