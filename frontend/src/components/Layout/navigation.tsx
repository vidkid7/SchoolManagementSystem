import {
  AccountBalance,
  Assessment,
  Assignment,
  CalendarMonth,
  Campaign,
  Class,
  Dashboard,
  Description,
  DirectionsBus,
  Event,
  Group,
  History,
  Hotel,
  Inventory2,
  LibraryBooks,
  LocationCity,
  Message,
  Notifications,
  People,
  Person,
  PersonAdd,
  School,
  Security,
  Settings,
  SportsBasketball,
  Tune,
  VerifiedUser,
} from '@mui/icons-material';
import { ROLE, staffRoles, teacherRoles } from '../../dashboards/dashboardConfigs/shared';

export interface NavItem {
  label: string;
  path?: string;
  icon: JSX.Element;
  roles?: string[];
  children?: NavItem[];
  badge?: string;
}

export interface NavSection {
  id: string;
  title: string;
  items: NavItem[];
}

export const navigationSections: NavSection[] = [
  {
    id: 'main',
    title: 'Overview',
    items: [
      { label: 'Municipality', path: '/municipality', icon: <LocationCity />, roles: [ROLE.municipalityAdmin] },
      { label: 'Dashboard', path: '/dashboard', icon: <Dashboard />, roles: [ROLE.schoolAdmin, ROLE.classTeacher, ROLE.subjectTeacher, ROLE.departmentHead, ROLE.ecaCoordinator, ROLE.sportsCoordinator, ROLE.librarian] },
      { label: 'Accountant', path: '/portal/accountant', icon: <AccountBalance />, roles: [ROLE.accountant] },
      { label: 'Teacher Portal', path: '/portal/teacher', icon: <School />, roles: [ROLE.subjectTeacher] },
      { label: 'Class Teacher', path: '/portal/class-teacher', icon: <Class />, roles: [ROLE.classTeacher] },
      { label: 'Department Head', path: '/portal/department-head', icon: <Group />, roles: [ROLE.departmentHead] },
      { label: 'Student Portal', path: '/portal/student', icon: <Person />, roles: [ROLE.student] },
      { label: 'Parent Portal', path: '/portal/parent', icon: <People />, roles: [ROLE.parent] },
      { label: 'Library Portal', path: '/portal/librarian', icon: <LibraryBooks />, roles: [ROLE.librarian] },
      { label: 'Transport Portal', path: '/portal/transport', icon: <DirectionsBus />, roles: [ROLE.transportManager] },
      { label: 'Hostel Portal', path: '/portal/hostel', icon: <Hotel />, roles: [ROLE.hostelWarden] },
      { label: 'Staff Portal', path: '/portal/non-teaching-staff', icon: <Person />, roles: [ROLE.nonTeachingStaff] },
      { label: 'ECA Portal', path: '/portal/eca-coordinator', icon: <Campaign />, roles: [ROLE.ecaCoordinator] },
      { label: 'Sports Portal', path: '/portal/sports-coordinator', icon: <SportsBasketball />, roles: [ROLE.sportsCoordinator] },
    ],
  },
  {
    id: 'school',
    title: 'School Operations',
    items: [
      { label: 'Students', path: '/students', icon: <People />, roles: teacherRoles },
      { label: 'Admissions', path: '/admissions', icon: <PersonAdd />, roles: [ROLE.schoolAdmin, ROLE.accountant] },
      { label: 'Staff', path: '/staff', icon: <Group />, roles: [ROLE.schoolAdmin] },
      {
        label: 'Academic',
        icon: <Class />,
        roles: teacherRoles,
        children: [
          { label: 'Academic Dashboard', path: '/academic', icon: <Dashboard /> },
          { label: 'Classes', path: '/academic/classes', icon: <Class /> },
          { label: 'Subjects', path: '/academic/subjects', icon: <School /> },
          { label: 'Timetable', path: '/academic/timetable', icon: <CalendarMonth /> },
          { label: 'Syllabus', path: '/academic/syllabus', icon: <Description /> },
        ],
      },
      {
        label: 'Attendance',
        icon: <Assignment />,
        roles: teacherRoles,
        children: [
          { label: 'Attendance Dashboard', path: '/attendance', icon: <Dashboard /> },
          { label: 'Mark Student', path: '/attendance/mark', icon: <Assignment /> },
          { label: 'Reports', path: '/attendance/reports', icon: <Assessment /> },
          { label: 'Leave', path: '/attendance/leave', icon: <Event /> },
        ],
      },
      {
        label: 'Examinations',
        icon: <Assessment />,
        roles: teacherRoles,
        children: [
          { label: 'Exam Dashboard', path: '/examinations', icon: <Dashboard /> },
          { label: 'Exam List', path: '/examinations/list', icon: <Assessment /> },
          { label: 'Grade Entry', path: '/examinations/grades', icon: <Assignment /> },
          { label: 'Report Cards', path: '/examinations/reports', icon: <Description /> },
        ],
      },
    ],
  },
  {
    id: 'business',
    title: 'Business Modules',
    items: [
      {
        label: 'Finance',
        icon: <AccountBalance />,
        roles: [ROLE.schoolAdmin, ROLE.accountant],
        children: [
          { label: 'Finance Dashboard', path: '/finance', icon: <Dashboard /> },
          { label: 'Invoices', path: '/finance/invoices', icon: <Description /> },
          { label: 'Payments', path: '/finance/payments', icon: <AccountBalance /> },
          { label: 'Reports', path: '/finance/reports', icon: <Assessment /> },
        ],
      },
      {
        label: 'Library',
        icon: <LibraryBooks />,
        roles: [ROLE.schoolAdmin, ROLE.librarian],
        children: [
          { label: 'Library Dashboard', path: '/library', icon: <Dashboard /> },
          { label: 'Book Catalog', path: '/library/books', icon: <LibraryBooks /> },
          { label: 'Circulation', path: '/library/circulation', icon: <Assignment /> },
          { label: 'Reports', path: '/library/reports', icon: <Assessment /> },
        ],
      },
      { label: 'ECA', path: '/eca', icon: <Campaign />, roles: [ROLE.schoolAdmin, ROLE.ecaCoordinator, ROLE.departmentHead] },
      { label: 'Sports', path: '/sports', icon: <SportsBasketball />, roles: [ROLE.schoolAdmin, ROLE.sportsCoordinator, ROLE.departmentHead] },
      { label: 'Documents', path: '/documents', icon: <Description />, roles: staffRoles },
      { label: 'Certificates', path: '/certificates', icon: <VerifiedUser />, roles: [ROLE.schoolAdmin] },
      { label: 'Inventory', path: '/documents', icon: <Inventory2 />, roles: [ROLE.schoolAdmin, ROLE.nonTeachingStaff], badge: 'Docs' },
    ],
  },
  {
    id: 'communication',
    title: 'Communication',
    items: [
      { label: 'Messages', path: '/communication/messages', icon: <Message /> },
      { label: 'Announcements', path: '/communication/announcements', icon: <Notifications /> },
      { label: 'Calendar', path: '/calendar', icon: <CalendarMonth /> },
      { label: 'My Notifications', path: '/my-notifications', icon: <Notifications />, roles: [ROLE.schoolAdmin] },
    ],
  },
  {
    id: 'system',
    title: 'Administration',
    items: [
      { label: 'Reports', path: '/reports', icon: <Assessment />, roles: [ROLE.schoolAdmin, ROLE.departmentHead, ROLE.accountant, ROLE.librarian, ROLE.ecaCoordinator, ROLE.sportsCoordinator, ROLE.classTeacher, ROLE.subjectTeacher] },
      { label: 'Users', path: '/users', icon: <People />, roles: [ROLE.schoolAdmin] },
      { label: 'Audit Logs', path: '/audit', icon: <History />, roles: [ROLE.schoolAdmin] },
      { label: 'Roles', path: '/settings/roles', icon: <Security />, roles: [ROLE.schoolAdmin] },
      { label: 'System Settings', path: '/settings/system', icon: <Tune />, roles: [ROLE.schoolAdmin] },
      { label: 'Settings', path: '/settings', icon: <Settings />, roles: [ROLE.schoolAdmin] },
    ],
  },
];
