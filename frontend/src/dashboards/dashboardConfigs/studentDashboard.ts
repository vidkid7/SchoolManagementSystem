import type { DashboardConfig } from './types';
import { ROLE, commonActions } from './shared';

export const studentDashboard: DashboardConfig = {
  id: 'student',
  title: 'Student Learning Hub',
  eyebrow: 'Student Dashboard',
  description: 'Attendance, assignments, GPA, fees, timetable, library, certificates, notices, and learning goals.',
  roles: [ROLE.student],
  requests: [
    { key: 'attendance', endpoint: '/students/me/attendance/summary', optional: true },
    { key: 'grades', endpoint: '/students/me/grades', optional: true },
    { key: 'fees', endpoint: '/students/me/fees/summary', optional: true },
    { key: 'profile', endpoint: '/students/me/profile', optional: true },
    { key: 'assignments', endpoint: '/students/me/assignments', optional: true },
  ],
  statCards: [
    { id: 'attendance', label: 'Attendance', valuePath: 'attendance.percentage', icon: 'attendance', accent: 'green', format: 'percent' },
    { id: 'present', label: 'Present Days', valuePath: 'attendance.present', icon: 'calendar', accent: 'blue', format: 'number' },
    { id: 'pending-fees', label: 'Fees Due', valuePath: 'fees.totalPending', icon: 'finance', accent: 'orange', format: 'currency' },
    { id: 'assignments', label: 'Assignments', valuePath: 'assignments.assignments.length', icon: 'assignment', accent: 'purple', format: 'number' },
  ],
  charts: [
    { id: 'grades', title: 'Subject Progress', subtitle: 'Latest grade records returned by the API', type: 'bar', dataPath: 'grades', xKey: 'subject', yKey: 'gpa', accent: 'blue' },
  ],
  tables: [
    {
      id: 'assignments',
      title: 'Assignment Queue',
      dataPath: 'assignments.assignments',
      columns: [
        { key: 'title', label: 'Assignment' },
        { key: 'subject', label: 'Subject' },
        { key: 'dueDate', label: 'Due', format: 'date' },
        { key: 'status', label: 'Status', status: true },
      ],
      emptyLabel: 'No assignments were returned.',
    },
  ],
  quickActions: [
    { id: 'certificates', label: 'Certificates', description: 'View and download school certificates', path: '/my-certificates', icon: 'certificate', accent: 'purple' },
    { id: 'exams', label: 'Exam Reports', description: 'Review report cards and grades', path: '/examinations/reports', icon: 'exam', accent: 'blue' },
    { id: 'library', label: 'Library', description: 'Browse the book catalog', path: '/library/books', icon: 'library', accent: 'green' },
    ...commonActions,
  ],
  progress: [
    { id: 'attendance-health', title: 'Attendance Target', valuePath: 'attendance.percentage', label: 'Minimum 75%', accent: 'green' },
  ],
};
