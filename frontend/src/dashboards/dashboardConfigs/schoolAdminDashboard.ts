import type { DashboardConfig } from './types';
import { ROLE, commonActions } from './shared';

export const schoolAdminDashboard: DashboardConfig = {
  id: 'school-admin',
  title: 'School Command Center',
  eyebrow: 'School Admin Dashboard',
  description: 'Operational health across academics, attendance, finance, exams, library, activities, and alerts.',
  roles: [ROLE.schoolAdmin],
  endpoint: '/reports/dashboard',
  statCards: [
    { id: 'students', label: 'Students', valuePath: 'summary.totalStudents', icon: 'school', accent: 'blue', format: 'number', helper: 'Active enrollment' },
    { id: 'staff', label: 'Staff', valuePath: 'summary.totalStaff', icon: 'people', accent: 'purple', format: 'number', helper: 'Teaching and support' },
    { id: 'attendance', label: 'Attendance', valuePath: 'summary.attendanceRate', icon: 'attendance', accent: 'green', format: 'percent', helper: '30 day average' },
    { id: 'fees', label: 'Fee Collection', valuePath: 'summary.feeCollectionRate', icon: 'finance', accent: 'orange', format: 'percent', helper: 'Collected vs billed' },
    { id: 'classes', label: 'Classes', valuePath: 'summary.totalClasses', icon: 'class', accent: 'cyan', format: 'number' },
    { id: 'books', label: 'Library Books', valuePath: 'summary.totalBooks', icon: 'library', accent: 'pink', format: 'number' },
    { id: 'new-admissions', label: 'New Admissions', valuePath: 'summary.newAdmissionsThisMonth', icon: 'admission', accent: 'green', format: 'number', helper: 'This month' },
    { id: 'exams-total', label: 'Total Exams', valuePath: 'summary.totalExams', icon: 'exam', accent: 'purple', format: 'number', helper: 'Configured exams' },
    { id: 'pending-fees', label: 'Pending Fees', valuePath: 'summary.pendingFeeStudents', icon: 'alert', accent: 'red', format: 'number', helper: 'Students to follow up' },
    { id: 'circulations', label: 'Book Circulation', valuePath: 'summary.totalCirculations', icon: 'library', accent: 'cyan', format: 'number', helper: 'Issued and returned flow' },
    { id: 'eca-active', label: 'Active ECA', valuePath: 'summary.activeEcaActivities', icon: 'sports', accent: 'pink', format: 'number', helper: 'Activities running' },
    { id: 'sports-active', label: 'Active Sports', valuePath: 'summary.activeSports', icon: 'sports', accent: 'orange', format: 'number', helper: 'Sports programs' },
    { id: 'male-students', label: 'Male Students', valuePath: 'summary.totalMaleStudents', icon: 'people', accent: 'blue', format: 'number', helper: 'Gender split' },
    { id: 'female-students', label: 'Female Students', valuePath: 'summary.totalFemaleStudents', icon: 'people', accent: 'purple', format: 'number', helper: 'Gender split' },
  ],
  charts: [
    { id: 'enrollment', title: 'Enrollment Trend', subtitle: 'Student growth across recent months', type: 'line', dataPath: 'charts.enrollmentTrend', xKey: 'label', yKey: 'value', accent: 'blue' },
    { id: 'attendance', title: 'Attendance Trend', subtitle: 'Average attendance by period', type: 'bar', dataPath: 'charts.attendanceTrend', xKey: 'label', yKey: 'value', accent: 'green' },
    { id: 'gender', title: 'Gender Distribution', type: 'donut', dataPath: 'charts.genderDistribution', nameKey: 'label', valueKey: 'value', accent: 'purple' },
    { id: 'fees', title: 'Fee Status', type: 'donut', dataPath: 'charts.feeStatus', nameKey: 'label', valueKey: 'value', accent: 'orange' },
  ],
  progress: [
    { id: 'attendance-progress', title: 'Attendance Health', valuePath: 'summary.attendanceRate', label: 'Target 90%', accent: 'green' },
    { id: 'fee-progress', title: 'Collection Health', valuePath: 'summary.feeCollectionRate', label: 'Target 95%', accent: 'orange' },
  ],
  quickActions: [
    { id: 'students', label: 'Students', description: 'Search, admit, and manage learners', path: '/students', icon: 'people', accent: 'blue', permissionRoles: [ROLE.schoolAdmin, ROLE.classTeacher, ROLE.subjectTeacher, ROLE.departmentHead] },
    { id: 'attendance', label: 'Attendance', description: 'Mark and review attendance', path: '/attendance', icon: 'attendance', accent: 'green' },
    { id: 'finance', label: 'Finance', description: 'Fees, payments, invoices, reports', path: '/finance', icon: 'finance', accent: 'orange', permissionRoles: [ROLE.schoolAdmin] },
    { id: 'exams', label: 'Exams', description: 'Exams, marks, report cards', path: '/examinations', icon: 'exam', accent: 'purple' },
    ...commonActions,
  ],
  activityFeed: {
    id: 'recent-activity',
    title: 'Recent Activity',
    dataPath: 'recentActivities',
    emptyLabel: 'No recent activity is available from the API yet.',
  },
};
