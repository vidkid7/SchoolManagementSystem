import type { DashboardConfig } from './types';
import { ROLE } from './shared';

export const admissionDashboard: DashboardConfig = {
  id: 'admission',
  title: 'Admission Funnel',
  eyebrow: 'Admission Dashboard',
  description: 'Inquiries, applications, test pipeline, interviews, confirmations, rejected applications, and follow-up work.',
  roles: [ROLE.schoolAdmin, ROLE.accountant],
  endpoint: '/admissions/reports',
  statCards: [
    { id: 'inquiries', label: 'Inquiries', valuePath: 'summary.totalInquiries', icon: 'admission', accent: 'blue', format: 'number' },
    { id: 'applications', label: 'Applications', valuePath: 'summary.totalApplications', icon: 'document', accent: 'purple', format: 'number' },
    { id: 'admitted', label: 'Admitted', valuePath: 'summary.admitted', icon: 'school', accent: 'green', format: 'number' },
    { id: 'rejected', label: 'Rejected', valuePath: 'summary.rejected', icon: 'alert', accent: 'red', format: 'number' },
  ],
  charts: [
    { id: 'status', title: 'Admission Status', type: 'donut', dataPath: 'statusBreakdown', nameKey: 'status', valueKey: 'count', accent: 'blue' },
    { id: 'monthly', title: 'Monthly Inquiries', type: 'bar', dataPath: 'monthlyTrend', xKey: 'month', yKey: 'count', accent: 'purple' },
  ],
  quickActions: [
    { id: 'new-inquiry', label: 'New Inquiry', description: 'Capture a new admission inquiry', path: '/admissions/new', icon: 'admission', accent: 'blue' },
    { id: 'list', label: 'Applications', description: 'Review admission pipeline', path: '/admissions/list', icon: 'document', accent: 'purple' },
  ],
};
