import type { DashboardConfig } from './types';
import { ROLE, commonActions } from './shared';

export const accountantDashboard: DashboardConfig = {
  id: 'accountant',
  title: 'Finance Control Room',
  eyebrow: 'Accountant Dashboard',
  description: 'Fee collection, pending balances, invoices, payment history, defaulters, and revenue trends.',
  roles: [ROLE.accountant],
  requests: [
    { key: 'finance', endpoint: '/finance/statistics' },
    { key: 'transactions', endpoint: '/finance/recent-transactions?limit=8', optional: true },
    { key: 'overdue', endpoint: '/finance/invoices?status=overdue&limit=6', optional: true },
  ],
  statCards: [
    { id: 'collected', label: 'Total Collected', valuePath: 'finance.totalCollection', icon: 'finance', accent: 'green', format: 'currency' },
    { id: 'pending', label: 'Pending Fees', valuePath: 'finance.pendingFees', icon: 'alert', accent: 'orange', format: 'currency' },
    { id: 'invoices', label: 'Invoices', valuePath: 'finance.totalInvoices', icon: 'document', accent: 'blue', format: 'number' },
    { id: 'overdue', label: 'Overdue', valuePath: 'finance.overdueInvoices', icon: 'notification', accent: 'red', format: 'number' },
    { id: 'collection-rate', label: 'Collection Rate', valuePath: 'finance.collectionRate', icon: 'trend', accent: 'purple', format: 'percent' },
  ],
  charts: [
    { id: 'monthly-collection', title: 'Monthly Collection', subtitle: 'Completed payments grouped by month', type: 'bar', dataPath: 'finance.monthlyCollection', xKey: 'month', yKey: 'amount', accent: 'green' },
    { id: 'fee-breakdown', title: 'Payment Method Mix', type: 'donut', dataPath: 'finance.feeBreakdown', nameKey: 'category', valueKey: 'amount', accent: 'blue' },
  ],
  tables: [
    {
      id: 'recent-transactions',
      title: 'Recent Transactions',
      dataPath: 'transactions',
      columns: [
        { key: 'receiptNumber', label: 'Receipt' },
        { key: 'studentName', label: 'Student' },
        { key: 'amount', label: 'Amount', format: 'currency' },
        { key: 'paymentMethod', label: 'Method' },
        { key: 'status', label: 'Status', status: true },
      ],
      emptyLabel: 'No recent payments were returned.',
    },
  ],
  progress: [
    { id: 'collection-health', title: 'Collection Health', valuePath: 'finance.collectionRate', label: 'Paid invoices ratio', accent: 'green' },
  ],
  quickActions: [
    { id: 'record-payment', label: 'Record Payment', description: 'Capture a student fee payment', path: '/finance/payments', icon: 'finance', accent: 'green' },
    { id: 'invoices', label: 'Invoices', description: 'Create, filter, and manage invoices', path: '/finance/invoices', icon: 'document', accent: 'blue' },
    { id: 'reports', label: 'Finance Reports', description: 'Review fee collection reports', path: '/finance/reports', icon: 'trend', accent: 'purple' },
    { id: 'defaulters', label: 'Student Fees', description: 'Search fee status by student', path: '/finance/students', icon: 'people', accent: 'orange' },
    ...commonActions,
  ],
};
