import type { DashboardConfig } from './types';
import { ROLE } from './shared';

export const municipalityAdminDashboard: DashboardConfig = {
  id: 'municipality-admin',
  title: 'Multi-School Operations',
  eyebrow: 'Municipality Admin Dashboard',
  description: 'Platform-style oversight for schools, active administrators, users, school health, incidents, and recent onboarding.',
  roles: [ROLE.municipalityAdmin],
  requests: [
    { key: 'dashboard', endpoint: '/admin/municipality/dashboard' },
    { key: 'reports', endpoint: '/admin/municipality/reports', optional: true },
    { key: 'incidents', endpoint: '/admin/municipality/incidents?limit=6', optional: true },
  ],
  statCards: [
    { id: 'schools', label: 'Schools', valuePath: 'dashboard.summary.totalSchools', icon: 'school', accent: 'blue', format: 'number' },
    { id: 'active-schools', label: 'Active Schools', valuePath: 'dashboard.summary.activeSchools', icon: 'academic', accent: 'green', format: 'number' },
    { id: 'inactive-schools', label: 'Inactive Schools', valuePath: 'dashboard.summary.inactiveSchools', icon: 'alert', accent: 'red', format: 'number' },
    { id: 'users', label: 'Users', valuePath: 'dashboard.summary.totalUsers', icon: 'people', accent: 'purple', format: 'number' },
    { id: 'school-admins', label: 'School Admins', valuePath: 'dashboard.summary.activeSchoolAdmins', icon: 'user', accent: 'orange', format: 'number' },
  ],
  charts: [
    { id: 'role-mix', title: 'User Role Mix', type: 'donut', dataPath: 'reports.userMetrics.byRole', nameKey: 'label', valueKey: 'value', accent: 'purple' },
    { id: 'status-mix', title: 'User Status', type: 'donut', dataPath: 'reports.userMetrics.byStatus', nameKey: 'label', valueKey: 'value', accent: 'green' },
  ],
  tables: [
    {
      id: 'schools',
      title: 'Recent Schools',
      subtitle: 'Latest school records in this municipality',
      dataPath: 'dashboard.recentSchools',
      columns: [
        { key: 'schoolNameEn', label: 'School' },
        { key: 'schoolCode', label: 'Code' },
        { key: 'isActive', label: 'Status', status: true },
        { key: 'createdAt', label: 'Created', format: 'date' },
      ],
      emptyLabel: 'No recent schools were returned.',
    },
    {
      id: 'incidents',
      title: 'Platform Alerts',
      dataPath: 'incidents.incidents',
      columns: [
        { key: 'severity', label: 'Severity', status: true },
        { key: 'title', label: 'Alert' },
        { key: 'category', label: 'Category' },
        { key: 'occurredAt', label: 'Time', format: 'date' },
      ],
      emptyLabel: 'No municipality incidents were returned.',
    },
  ],
  quickActions: [
    { id: 'schools', label: 'Schools', description: 'Create and manage schools', path: '/municipality', icon: 'school', accent: 'blue' },
    { id: 'reports', label: 'Reports', description: 'Open municipality analytics', path: '/municipality', icon: 'trend', accent: 'purple' },
    { id: 'users', label: 'Users', description: 'Manage municipality users', path: '/municipality', icon: 'people', accent: 'green' },
  ],
};
