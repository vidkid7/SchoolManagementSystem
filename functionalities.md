# SchoolSystem Role and Functionality Considerations

This document is the current role-access verification guide for the Node.js/React implementation.

## 1. Role model and dashboard landing pages

| Role | Enum value | Primary frontend landing page |
|---|---|---|
| Municipality Admin | `Municipality_Admin` | `/admin/municipality/dashboard` |
| School Admin | `School_Admin` | `/dashboard` |
| Department Head | `Department_Head` | `/dashboard` |
| Class Teacher | `Class_Teacher` | `/portal/teacher` |
| Subject Teacher | `Subject_Teacher` | `/portal/teacher` |
| ECA Coordinator | `ECA_Coordinator` | `/eca` |
| Sports Coordinator | `Sports_Coordinator` | `/sports` |
| Student | `Student` | `/portal/student` |
| Parent | `Parent` | `/portal/parent` |
| Librarian | `Librarian` | `/library` |
| Accountant | `Accountant` | `/finance` |
| Transport Manager | `Transport_Manager` | `/portal/transport` |
| Hostel Warden | `Hostel_Warden` | `/portal/hostel` |
| Non Teaching Staff | `Non_Teaching_Staff` | `/portal/non-teaching-staff` |

## 2. Municipality Admin implementation status

Municipality Admin now has dedicated dashboard/report/incident coverage in both frontend and backend:

- Frontend protected routes: `/admin/municipality/dashboard` (primary) and `/municipality` (legacy alias).
- Frontend role redirects: Municipality Admin redirects to `/admin/municipality/dashboard`.
- Backend API base paths:
  - `/api/v1/municipality-admin/*`
  - `/api/v1/admin/municipality/*` (compatibility alias)
- Municipality Admin APIs:
  - `GET /dashboard`
  - `GET /reports`
  - `GET /incidents`
  - `GET /schools` / `POST /schools` / `PUT /schools/:schoolId`
  - `POST /schools/:schoolId/activate` / `POST /schools/:schoolId/deactivate`
  - `GET /users`
  - `POST /schools/:schoolId/admins`

## 3. Critical considerations when checking roles and functionalities

1. **Frontend and backend must both authorize**: page access in React is not enough; verify API role guards too.
2. **Role redirect consistency**: login redirect and default route redirect must point to actual accessible pages.
3. **Menu visibility consistency**: sidebar items must match route guards for the signed-in role.
4. **Direct URL hardening**: unauthorized direct route hits must land on `/unauthorized` (frontend) and 403 (backend).
5. **Cross-tenant safety**: Municipality Admin actions must stay scoped to their municipality records only.
6. **Seed credential verification**: use known seeded users to ensure each role is testable in QA quickly.

## 4. Role-wise QA artifacts

Use the `test-docs` folder for testing execution:

- `test-docs/role-wise-credentials.md`
- `test-docs/role-*.md` files for page-by-page role checks

## 5. Frontend route coverage snapshot

| Role | Protected page count |
|---|---:|
| Municipality Admin | 9 |
| School Admin | 86 |
| Department Head | 42 |
| Class Teacher | 40 |
| Subject Teacher | 40 |
| ECA Coordinator | 13 |
| Sports Coordinator | 13 |
| Student | 12 |
| Parent | 13 |
| Librarian | 17 |
| Accountant | 21 |
| Transport Manager | 10 |
| Hostel Warden | 10 |
| Non Teaching Staff | 10 |

> Generated from: `frontend/src/App.tsx` and `backend/src/scripts/seed-database.ts`
