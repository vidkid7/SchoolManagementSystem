import type { DashboardConfig } from './types';
import { teacherRoles } from './shared';

export const academicDashboard: DashboardConfig = {
  id: 'academic',
  title: 'Academic Planning Board',
  eyebrow: 'Academic Dashboard',
  description: 'Classes, subjects, academic years, timetable, syllabus progress, class teachers, and subject allocation.',
  roles: teacherRoles,
  requests: [
    { key: 'classes', endpoint: '/academic/classes', optional: true },
    { key: 'subjects', endpoint: '/academic/subjects', optional: true },
  ],
  statCards: [
    { id: 'classes', label: 'Classes', valuePath: 'classes.length', icon: 'class', accent: 'blue', format: 'number' },
    { id: 'subjects', label: 'Subjects', valuePath: 'subjects.length', icon: 'book', accent: 'purple', format: 'number' },
  ],
  tables: [
    {
      id: 'classes',
      title: 'Classes',
      dataPath: 'classes',
      columns: [
        { key: 'gradeLevel', label: 'Grade', format: 'number' },
        { key: 'section', label: 'Section' },
        { key: 'shift', label: 'Shift', status: true },
      ],
      emptyLabel: 'No academic classes returned.',
    },
  ],
  quickActions: [
    { id: 'classes', label: 'Classes', description: 'Manage class structure', path: '/academic/classes', icon: 'class', accent: 'blue' },
    { id: 'subjects', label: 'Subjects', description: 'Assign and manage subjects', path: '/academic/subjects', icon: 'book', accent: 'purple' },
    { id: 'timetable', label: 'Timetable', description: 'Plan class schedules', path: '/academic/timetable', icon: 'calendar', accent: 'green' },
  ],
};
