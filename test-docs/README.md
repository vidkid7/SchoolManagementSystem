# Test Docs (Role-wise)

This folder provides QA-ready role documentation:

- `role-wise-credentials.md`: seeded login credentials per role
- `role-*.md`: per-role pages and functionality checklist

## How to use

1. Pick a role and sign in with the credential sheet.
2. Open the matching `role-*.md` file.
3. Validate each listed page and expected behavior.
4. Mark regressions where role access differs from expectations.

## Note

Route access here is derived from `frontend/src/App.tsx` protected routes.
- `role-municipality-admin.md`
- `role-school-admin.md`
- `role-department-head.md`
- `role-class-teacher.md`
- `role-subject-teacher.md`
- `role-eca-coordinator.md`
- `role-sports-coordinator.md`
- `role-student.md`
- `role-parent.md`
- `role-librarian.md`
- `role-accountant.md`
- `role-transport-manager.md`
- `role-hostel-warden.md`
- `role-non-teaching-staff.md`
