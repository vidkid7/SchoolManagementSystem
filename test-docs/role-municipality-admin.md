# Municipality Admin - Functionality Checklist

## Test login

- Username: `municipalityadmin`
- Email: `municipality.admin@school.edu.np`
- Password: `Municipality@123`

## Expected landing page

- `/admin/municipality/dashboard`

## Page-wise functionality checks

| Page | Expected functionality |
|---|---|
| `/admin/municipality/dashboard` | Municipality dashboard with schools, reports, and incident visibility |
| `/calendar` | View calendar and events |
| `/calendar/view` | View calendar and events |
| `/certificates/verify` | Manage and verify certificates |
| `/change-password` | Update own password |
| `/communication/announcements` | Read announcements |
| `/communication/messages` | Use direct and group messaging |
| `/eca/list` | Manage and review ECA activities |
| `/municipality` | Municipality dashboard (legacy route alias) |

## Municipality API functionality checks

- `GET /api/v1/municipality-admin/dashboard` returns municipality summary cards.
- `GET /api/v1/municipality-admin/reports` returns role/status report metrics.
- `GET /api/v1/municipality-admin/incidents` returns inactive school and flagged user incidents.
- `GET /api/v1/municipality-admin/schools?includeInactive=true` lists municipality schools.
- `POST /api/v1/municipality-admin/schools/:schoolId/admins` creates school admin inside municipality scope.

## Role access validation notes

- Confirm direct URL access is blocked for pages outside this list.
- Confirm menu only shows entries that belong to this role.
- Confirm backend API returns 403 for unauthorized operations.
