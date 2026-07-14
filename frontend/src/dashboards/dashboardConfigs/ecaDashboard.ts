import type { DashboardConfig } from './types';
import { ROLE, commonActions } from './shared';

export const ecaDashboard: DashboardConfig = {
  id: 'eca',
  title: 'Activities Studio',
  eyebrow: 'ECA Coordinator Dashboard',
  description: 'Co-curricular programs, participation, events, enrollments, category mix, achievements, and coordinator actions.',
  roles: [ROLE.ecaCoordinator],
  requests: [
    { key: 'eca', endpoint: '/eca/statistics' },
    { key: 'activities', endpoint: '/eca/recent-activities?limit=8', optional: true },
  ],
  statCards: [
    { id: 'total', label: 'Activities', valuePath: 'eca.totalECAs', icon: 'sports', accent: 'blue', format: 'number' },
    { id: 'active', label: 'Active ECAs', valuePath: 'eca.activeECAs', icon: 'attendance', accent: 'green', format: 'number' },
    { id: 'students', label: 'Participants', valuePath: 'eca.totalStudents', icon: 'people', accent: 'purple', format: 'number' },
    { id: 'events', label: 'Upcoming Events', valuePath: 'eca.upcomingEvents', icon: 'calendar', accent: 'orange', format: 'number' },
  ],
  charts: [
    { id: 'category', title: 'Category Breakdown', type: 'donut', dataPath: 'eca.categoryBreakdown', nameKey: 'category', valueKey: 'count', accent: 'purple' },
    { id: 'enrollments', title: 'Monthly Enrollments', type: 'bar', dataPath: 'eca.monthlyEnrollments', xKey: 'month', yKey: 'count', accent: 'blue' },
  ],
  tables: [
    {
      id: 'activities',
      title: 'Recent ECA Activity',
      dataPath: 'activities',
      columns: [
        { key: 'type', label: 'Type', status: true },
        { key: 'ecaName', label: 'Activity' },
        { key: 'student', label: 'Student' },
        { key: 'status', label: 'Status', status: true },
      ],
      emptyLabel: 'No recent ECA activities returned.',
    },
  ],
  quickActions: [
    { id: 'management', label: 'Manage ECA', description: 'Programs, enrollments, events, achievements', path: '/eca/management', icon: 'sports', accent: 'purple' },
    { id: 'list', label: 'ECA List', description: 'Browse all available activities', path: '/eca/list', icon: 'book', accent: 'blue' },
    ...commonActions,
  ],
};
