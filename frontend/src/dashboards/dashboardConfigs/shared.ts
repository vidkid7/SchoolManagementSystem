import type { DashboardAccent, DashboardActionConfig } from './types';

export const ROLE = {
  municipalityAdmin: 'Municipality_Admin',
  schoolAdmin: 'School_Admin',
  subjectTeacher: 'Subject_Teacher',
  classTeacher: 'Class_Teacher',
  departmentHead: 'Department_Head',
  ecaCoordinator: 'ECA_Coordinator',
  sportsCoordinator: 'Sports_Coordinator',
  student: 'Student',
  parent: 'Parent',
  librarian: 'Librarian',
  accountant: 'Accountant',
  transportManager: 'Transport_Manager',
  hostelWarden: 'Hostel_Warden',
  nonTeachingStaff: 'Non_Teaching_Staff',
} as const;

export const teacherRoles = [ROLE.schoolAdmin, ROLE.classTeacher, ROLE.subjectTeacher, ROLE.departmentHead];

export const staffRoles = [
  ROLE.schoolAdmin,
  ROLE.classTeacher,
  ROLE.subjectTeacher,
  ROLE.departmentHead,
  ROLE.ecaCoordinator,
  ROLE.sportsCoordinator,
  ROLE.librarian,
  ROLE.accountant,
  ROLE.transportManager,
  ROLE.hostelWarden,
  ROLE.nonTeachingStaff,
];

export const accentColor: Record<DashboardAccent, string> = {
  blue: '#2563eb',
  purple: '#7c3aed',
  green: '#16a34a',
  orange: '#f97316',
  red: '#dc2626',
  pink: '#db2777',
  cyan: '#0891b2',
  slate: '#475569',
};

export const commonActions: DashboardActionConfig[] = [
  {
    id: 'messages',
    label: 'Messages',
    description: 'Open staff, parent, and student conversations',
    path: '/communication/messages',
    icon: 'message',
    accent: 'blue',
  },
  {
    id: 'calendar',
    label: 'Calendar',
    description: 'Review events, meetings, and academic dates',
    path: '/calendar',
    icon: 'calendar',
    accent: 'purple',
  },
  {
    id: 'documents',
    label: 'Documents',
    description: 'Manage shared records and uploaded files',
    path: '/documents',
    icon: 'document',
    accent: 'green',
  },
];
