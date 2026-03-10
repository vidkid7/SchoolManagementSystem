# Accountant - Functionality Checklist

## Test login

- Username: `accountant1`
- Email: `accountant1@school.edu.np`
- Password: `Accountant@123`

## Expected landing page

- `/finance`

## Page-wise functionality checks

| Page | Expected functionality |
|---|---|
| `/admissions` | Manage admissions and inquiries |
| `/admissions/:id` | Manage admissions and inquiries |
| `/admissions/list` | Manage admissions and inquiries |
| `/admissions/new` | Manage admissions and inquiries |
| `/calendar` | View calendar and events |
| `/calendar/view` | View calendar and events |
| `/certificates/verify` | Manage and verify certificates |
| `/change-password` | Update own password |
| `/communication/announcements` | Read announcements |
| `/communication/messages` | Use direct and group messaging |
| `/dashboard` | Institution-level overview dashboard |
| `/documents` | Access shared document workflows |
| `/eca/list` | Manage and review ECA activities |
| `/finance` | Manage finance operations and reports |
| `/finance/dashboard` | Manage finance operations and reports |
| `/finance/fee-structures` | Manage finance operations and reports |
| `/finance/invoices` | Manage finance operations and reports |
| `/finance/payment-gateways` | Manage finance operations and reports |
| `/finance/payments` | Manage finance operations and reports |
| `/finance/reports` | Manage finance operations and reports |
| `/reports` | Access analytics and reports |

## Role access validation notes

- Confirm direct URL access is blocked for pages outside this list.
- Confirm menu only shows entries that belong to this role.
- Confirm backend API returns 403 for unauthorized operations.
