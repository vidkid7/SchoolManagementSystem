import type { DashboardConfig } from './types';
import { ROLE, commonActions } from './shared';

export const teacherDashboard: DashboardConfig = {
  id: 'teacher',
  title: 'Teaching Studio',
  eyebrow: 'Teacher Dashboard',
  description: 'Today’s classes, tasks, class performance, attendance trends, lesson planning, and student follow-ups.',
  roles: [ROLE.classTeacher, ROLE.subjectTeacher, ROLE.departmentHead],
  endpoint: '/teachers/dashboard',
  statCards: [
    { id: 'classes', label: 'Classes Today', valuePath: 'stats.classesToday', icon: 'calendar', accent: 'blue', format: 'number' },
    { id: 'tasks', label: 'Pending Tasks', valuePath: 'stats.pendingTasks', icon: 'assignment', accent: 'orange', format: 'number' },
    { id: 'students', label: 'Students', valuePath: 'stats.totalStudents', icon: 'people', accent: 'purple', format: 'number' },
    { id: 'attendance', label: 'Avg Attendance', valuePath: 'stats.avgAttendance', icon: 'attendance', accent: 'green', format: 'percent' },
  ],
  charts: [
    { id: 'trend', title: 'Attendance Trend', subtitle: 'Class attendance by week', type: 'line', dataPath: 'trend', xKey: 'week', yKey: 'rate', accent: 'green' },
    { id: 'performance', title: 'Class Performance', type: 'bar', dataPath: 'performances', xKey: 'class', yKey: 'avgGrade', accent: 'purple' },
  ],
  tables: [
    {
      id: 'schedule',
      title: 'Today’s Schedule',
      subtitle: 'Live class flow for the current day',
      dataPath: 'schedule',
      columns: [
        { key: 'period', label: 'Period', format: 'number' },
        { key: 'time', label: 'Time' },
        { key: 'class', label: 'Class' },
        { key: 'room', label: 'Room' },
        { key: 'status', label: 'Status', status: true },
      ],
      emptyLabel: 'No class schedule was returned for today.',
    },
    {
      id: 'tasks',
      title: 'Priority Queue',
      dataPath: 'tasks',
      columns: [
        { key: 'title', label: 'Task' },
        { key: 'priority', label: 'Priority', status: true },
        { key: 'count', label: 'Count', format: 'number' },
      ],
      emptyLabel: 'No pending teacher tasks.',
    },
  ],
  quickActions: [
    { id: 'lesson-planning', label: 'Lesson Planner', description: 'Plan lessons and track syllabus progress', path: '/teacher/lesson-planning', icon: 'book', accent: 'blue' },
    { id: 'assignments', label: 'Assignments', description: 'Review and manage homework', path: '/teacher/assignments', icon: 'assignment', accent: 'purple' },
    { id: 'class-roster', label: 'My Class', description: 'Open class roster and student profile views', path: '/teacher/my-class', icon: 'people', accent: 'green', permissionRoles: [ROLE.classTeacher] },
    ...commonActions,
  ],
  notificationFeed: {
    id: 'teacher-notifications',
    title: 'Teacher Notifications',
    dataPath: 'notifications',
    emptyLabel: 'No teacher notifications.',
  },
};
