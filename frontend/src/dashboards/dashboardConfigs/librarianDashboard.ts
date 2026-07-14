import type { DashboardConfig } from './types';
import { ROLE, commonActions } from './shared';

export const librarianDashboard: DashboardConfig = {
  id: 'librarian',
  title: 'Library Analytics Desk',
  eyebrow: 'Librarian Dashboard',
  description: 'Books, issued inventory, returns, overdue books, fines, members, category mix, and borrowing trends.',
  roles: [ROLE.librarian],
  requests: [
    { key: 'library', endpoint: '/library/statistics' },
    { key: 'activities', endpoint: '/library/recent-activities?limit=8', optional: true },
  ],
  statCards: [
    { id: 'books', label: 'Total Books', valuePath: 'library.totalBooks', icon: 'library', accent: 'blue', format: 'number' },
    { id: 'available', label: 'Available Books', valuePath: 'library.availableBooks', icon: 'book', accent: 'green', format: 'number' },
    { id: 'issued', label: 'Issued Books', valuePath: 'library.issuedBooks', icon: 'document', accent: 'purple', format: 'number' },
    { id: 'overdue', label: 'Overdue Books', valuePath: 'library.overdueBooks', icon: 'alert', accent: 'red', format: 'number' },
    { id: 'fines', label: 'Pending Fines', valuePath: 'library.pendingFines', icon: 'finance', accent: 'orange', format: 'currency' },
  ],
  charts: [
    { id: 'category', title: 'Books by Category', type: 'donut', dataPath: 'library.booksByCategory', nameKey: 'category', valueKey: 'count', accent: 'blue' },
    { id: 'issuance', title: 'Monthly Issuance', type: 'bar', dataPath: 'library.monthlyIssuance', xKey: 'month', yKey: 'count', accent: 'green' },
  ],
  tables: [
    {
      id: 'activities',
      title: 'Recent Library Activity',
      dataPath: 'activities',
      columns: [
        { key: 'type', label: 'Type', status: true },
        { key: 'book', label: 'Book' },
        { key: 'student', label: 'Student' },
        { key: 'status', label: 'Status', status: true },
      ],
      emptyLabel: 'No recent library activity returned.',
    },
  ],
  quickActions: [
    { id: 'catalog', label: 'Book Catalog', description: 'Browse and manage books', path: '/library/books', icon: 'book', accent: 'blue' },
    { id: 'circulation', label: 'Circulation', description: 'Issue, return, reserve, and fine workflows', path: '/library/circulation', icon: 'library', accent: 'green' },
    { id: 'reports', label: 'Library Reports', description: 'Open circulation and fine reports', path: '/library/reports', icon: 'trend', accent: 'purple' },
    ...commonActions,
  ],
};
