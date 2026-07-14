import type { DashboardConfig } from './types';
import { ROLE, commonActions } from './shared';

export const parentDashboard: DashboardConfig = {
  id: 'parent',
  title: 'Family Progress Center',
  eyebrow: 'Parent Dashboard',
  description: 'Child overview, attendance, fees, marks, homework, notices, meetings, events, and teacher communication.',
  roles: [ROLE.parent],
  endpoint: '/parents/dashboard',
  statCards: [
    { id: 'children', label: 'Children', valuePath: 'totalChildren', icon: 'people', accent: 'blue', format: 'number' },
    { id: 'records', label: 'Child Records', valuePath: 'children.length', icon: 'school', accent: 'purple', format: 'number' },
  ],
  tables: [
    {
      id: 'children',
      title: 'Children Overview',
      subtitle: 'Linked child records available to this parent account',
      dataPath: 'children',
      columns: [
        { key: 'name', label: 'Student' },
        { key: 'class', label: 'Class' },
        { key: 'section', label: 'Section' },
        { key: 'rollNo', label: 'Roll', format: 'number' },
      ],
      emptyLabel: 'No linked child records were returned.',
    },
  ],
  quickActions: [
    { id: 'messages', label: 'Teacher Messages', description: 'Continue parent-teacher communication', path: '/communication/messages', icon: 'message', accent: 'blue' },
    { id: 'events', label: 'School Events', description: 'Open upcoming events and meetings', path: '/calendar', icon: 'calendar', accent: 'purple' },
    { id: 'fees', label: 'Fee Reports', description: 'Review child fee and invoice records', path: '/finance/students', icon: 'finance', accent: 'orange' },
    ...commonActions.filter((action) => action.id !== 'messages'),
  ],
  notificationFeed: {
    id: 'parent-notices',
    title: 'Family Notices',
    dataPath: 'notifications',
    emptyLabel: 'No family notices were returned by the dashboard endpoint.',
  },
};
