# Sports Coordinator - Functionality Checklist

## Test login

- Username: `sportscoord1`
- Email: `sportscoord1@school.edu.np`
- Password: `SportsCoord@123`

## Expected landing page

- `/sports`

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
| `/reports` | Access analytics and reports |
| `/sports` | Manage and review sports activities |
| `/sports/dashboard` | Manage and review sports activities |
| `/sports/management` | Manage and review sports activities |

## Role access validation notes

- Confirm direct URL access is blocked for pages outside this list.
- Confirm menu only shows entries that belong to this role.
- Confirm backend API returns 403 for unauthorized operations.
