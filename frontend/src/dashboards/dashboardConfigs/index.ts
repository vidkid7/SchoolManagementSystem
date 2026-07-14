import type { DashboardConfig } from './types';
import { accountantDashboard } from './accountantDashboard';
import { academicDashboard } from './academicDashboard';
import { admissionDashboard } from './admissionDashboard';
import { ecaDashboard } from './ecaDashboard';
import { examDashboard } from './examDashboard';
import { hostelDashboard } from './hostelDashboard';
import { librarianDashboard } from './librarianDashboard';
import { municipalityAdminDashboard } from './municipalityAdminDashboard';
import { nonTeachingDashboard } from './nonTeachingDashboard';
import { parentDashboard } from './parentDashboard';
import { schoolAdminDashboard } from './schoolAdminDashboard';
import { sportsDashboard } from './sportsDashboard';
import { studentDashboard } from './studentDashboard';
import { teacherDashboard } from './teacherDashboard';
import { transportDashboard } from './transportDashboard';

export const dashboardConfigs: DashboardConfig[] = [
  municipalityAdminDashboard,
  schoolAdminDashboard,
  accountantDashboard,
  teacherDashboard,
  studentDashboard,
  parentDashboard,
  librarianDashboard,
  transportDashboard,
  hostelDashboard,
  ecaDashboard,
  sportsDashboard,
  nonTeachingDashboard,
  academicDashboard,
  admissionDashboard,
  examDashboard,
];

export function getDashboardConfigById(id?: string): DashboardConfig | undefined {
  if (!id) return undefined;
  return dashboardConfigs.find((config) => config.id === id);
}

export function getDashboardConfigForRole(role?: string): DashboardConfig {
  if (!role) return schoolAdminDashboard;
  const config = dashboardConfigs.find((item) => item.roles.includes(role));
  return config ?? schoolAdminDashboard;
}

export type { DashboardConfig } from './types';
