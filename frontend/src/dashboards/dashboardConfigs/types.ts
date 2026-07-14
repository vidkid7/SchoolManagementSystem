export type DashboardAccent = 'blue' | 'purple' | 'green' | 'orange' | 'red' | 'pink' | 'cyan' | 'slate';

export type DashboardIconKey =
  | 'academic'
  | 'admission'
  | 'alert'
  | 'assignment'
  | 'attendance'
  | 'book'
  | 'bus'
  | 'calendar'
  | 'certificate'
  | 'class'
  | 'dashboard'
  | 'document'
  | 'exam'
  | 'finance'
  | 'hostel'
  | 'library'
  | 'message'
  | 'notification'
  | 'people'
  | 'person'
  | 'school'
  | 'settings'
  | 'sports'
  | 'trend'
  | 'user';

export interface DashboardRequestConfig {
  key: string;
  endpoint: string;
  optional?: boolean;
}

export interface DashboardStatConfig {
  id: string;
  label: string;
  valuePath: string;
  icon: DashboardIconKey;
  accent: DashboardAccent;
  format?: 'number' | 'currency' | 'percent';
  helper?: string;
  trendPath?: string;
}

export interface DashboardChartConfig {
  id: string;
  title: string;
  subtitle?: string;
  type: 'line' | 'bar' | 'donut' | 'sparkline';
  dataPath: string;
  xKey?: string;
  yKey?: string;
  nameKey?: string;
  valueKey?: string;
  accent?: DashboardAccent;
}

export interface DashboardTableColumn {
  key: string;
  label: string;
  status?: boolean;
  format?: 'date' | 'currency' | 'number';
}

export interface DashboardTableConfig {
  id: string;
  title: string;
  subtitle?: string;
  dataPath: string;
  columns: DashboardTableColumn[];
  emptyLabel?: string;
}

export interface DashboardActionConfig {
  id: string;
  label: string;
  description?: string;
  path: string;
  icon: DashboardIconKey;
  accent: DashboardAccent;
  permissionRoles?: string[];
}

export interface DashboardProgressConfig {
  id: string;
  title: string;
  valuePath: string;
  label?: string;
  accent: DashboardAccent;
}

export interface DashboardFeedConfig {
  id: string;
  title: string;
  dataPath: string;
  emptyLabel?: string;
}

export interface DashboardConfig {
  id: string;
  title: string;
  eyebrow?: string;
  description: string;
  roles: string[];
  endpoint?: string;
  requests?: DashboardRequestConfig[];
  statCards: DashboardStatConfig[];
  charts?: DashboardChartConfig[];
  tables?: DashboardTableConfig[];
  quickActions?: DashboardActionConfig[];
  progress?: DashboardProgressConfig[];
  activityFeed?: DashboardFeedConfig;
  notificationFeed?: DashboardFeedConfig;
}
