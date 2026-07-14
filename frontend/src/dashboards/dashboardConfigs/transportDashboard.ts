import type { DashboardConfig } from './types';
import { ROLE, commonActions } from './shared';

export const transportDashboard: DashboardConfig = {
  id: 'transport',
  title: 'Transport Operations',
  eyebrow: 'Transport Manager Dashboard',
  description: 'Routes, drivers, active students, vehicles, pickup points, maintenance alerts, and transport communication.',
  roles: [ROLE.transportManager],
  endpoint: '/transport/dashboard',
  statCards: [
    { id: 'students', label: 'Students', valuePath: 'summary.totalStudents', icon: 'people', accent: 'blue', format: 'number' },
    { id: 'active', label: 'Active Students', valuePath: 'summary.activeStudents', icon: 'attendance', accent: 'green', format: 'number' },
  ],
  quickActions: [
    { id: 'routes', label: 'Routes', description: 'Manage bus route coverage', path: '/portal/transport', icon: 'bus', accent: 'blue' },
    { id: 'students', label: 'Student List', description: 'Open transport student list', path: '/students', icon: 'people', accent: 'green' },
    ...commonActions,
  ],
  tables: [
    {
      id: 'links',
      title: 'Operational Shortcuts',
      dataPath: 'quickLinks',
      columns: [
        { key: 'label', label: 'Action' },
        { key: 'path', label: 'Path' },
      ],
      emptyLabel: 'No transport quick links were returned.',
    },
  ],
};
