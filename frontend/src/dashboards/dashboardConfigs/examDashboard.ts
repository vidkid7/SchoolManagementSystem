import type { DashboardConfig } from './types';
import { teacherRoles } from './shared';

export const examDashboard: DashboardConfig = {
  id: 'exam',
  title: 'Exam Analytics Center',
  eyebrow: 'Exam Dashboard',
  description: 'Upcoming exams, result readiness, grade distribution, pass rate, subject performance, and pending marks.',
  roles: teacherRoles,
  endpoint: '/reports/examination',
  statCards: [
    { id: 'students', label: 'Students', valuePath: 'totalStudents', icon: 'people', accent: 'blue', format: 'number' },
    { id: 'average', label: 'Average Marks', valuePath: 'averageMarks', icon: 'trend', accent: 'purple', format: 'number' },
    { id: 'gpa', label: 'Average GPA', valuePath: 'averageGPA', icon: 'academic', accent: 'green', format: 'number' },
    { id: 'pass-rate', label: 'Pass Rate', valuePath: 'passRate', icon: 'exam', accent: 'orange', format: 'percent' },
  ],
  charts: [
    { id: 'grades', title: 'Grade Distribution', type: 'bar', dataPath: 'gradeDistribution', xKey: 'grade', yKey: 'count', accent: 'purple' },
    { id: 'subjects', title: 'Subject Performance', type: 'bar', dataPath: 'subjectWisePerformance', xKey: 'subjectName', yKey: 'averageMarks', accent: 'blue' },
  ],
  tables: [
    {
      id: 'toppers',
      title: 'Top Performers',
      dataPath: 'topPerformers',
      columns: [
        { key: 'studentName', label: 'Student' },
        { key: 'totalMarks', label: 'Marks', format: 'number' },
        { key: 'gpa', label: 'GPA', format: 'number' },
      ],
      emptyLabel: 'No top performer data returned.',
    },
  ],
  quickActions: [
    { id: 'exams', label: 'Exam List', description: 'Review and schedule exams', path: '/examinations/list', icon: 'exam', accent: 'blue' },
    { id: 'grades', label: 'Grade Entry', description: 'Enter and publish marks', path: '/examinations/grades', icon: 'assignment', accent: 'purple' },
    { id: 'reports', label: 'Report Cards', description: 'Generate report cards', path: '/examinations/reports', icon: 'document', accent: 'green' },
  ],
};
