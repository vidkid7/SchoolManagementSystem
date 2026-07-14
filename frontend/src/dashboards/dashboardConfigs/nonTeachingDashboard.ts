import type { DashboardConfig } from './types';
import { ROLE, commonActions } from './shared';

export const nonTeachingDashboard: DashboardConfig = {
  id: 'non-teaching-staff',
  title: 'Staff Service Desk',
  eyebrow: 'Non-Teaching Staff Dashboard',
  description: 'Daily tasks, schedules, announcements, documents, and communication for support operations.',
  endpoint: '/non-teaching-staff/dashboard',
  roles: [ROLE.nonTeachingStaff],
  statCards: [
    { id: 'profile', label: 'Profile Loaded', valuePath: 'profile.user_id', icon: 'person', accent: 'blue', format: 'number' },
  ],
  tables: [
    {
      id: 'links',
      title: 'Work Shortcuts',
      dataPath: 'quickLinks',
      columns: [
        { key: 'label', label: 'Action' },
        { key: 'path', label: 'Path' },
      ],
      emptyLabel: 'No support staff links were returned.',
    },
  ],
  quickActions: commonActions,
};
