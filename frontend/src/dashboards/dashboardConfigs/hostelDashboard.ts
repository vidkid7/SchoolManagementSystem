import type { DashboardConfig } from './types';
import { ROLE, commonActions } from './shared';

export const hostelDashboard: DashboardConfig = {
  id: 'hostel',
  title: 'Hostel Command Desk',
  eyebrow: 'Hostel Warden Dashboard',
  description: 'Resident records, room allocation, attendance, mess planning, visitors, incidents, leave, and maintenance.',
  roles: [ROLE.hostelWarden],
  endpoint: '/hostel/dashboard',
  statCards: [
    { id: 'students', label: 'Residents Scope', valuePath: 'summary.totalStudents', icon: 'people', accent: 'blue', format: 'number' },
    { id: 'active', label: 'Active Students', valuePath: 'summary.activeStudents', icon: 'hostel', accent: 'green', format: 'number' },
  ],
  quickActions: [
    { id: 'rooms', label: 'Rooms', description: 'Manage allocation and occupancy', path: '/portal/hostel', icon: 'hostel', accent: 'blue' },
    { id: 'students', label: 'Resident List', description: 'Open student roster', path: '/students', icon: 'people', accent: 'green' },
    ...commonActions,
  ],
  tables: [
    {
      id: 'links',
      title: 'Hostel Shortcuts',
      dataPath: 'quickLinks',
      columns: [
        { key: 'label', label: 'Action' },
        { key: 'path', label: 'Path' },
      ],
      emptyLabel: 'No hostel quick links were returned.',
    },
  ],
};
