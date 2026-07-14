import type { DashboardConfig } from './types';
import { ROLE, commonActions } from './shared';

export const sportsDashboard: DashboardConfig = {
  id: 'sports',
  title: 'Sports Performance Hub',
  eyebrow: 'Sports Coordinator Dashboard',
  description: 'Sports inventory, teams, players, upcoming matches, category mix, recent results, and athletic participation.',
  roles: [ROLE.sportsCoordinator],
  requests: [
    { key: 'sports', endpoint: '/sports/statistics' },
    { key: 'matches', endpoint: '/sports/recent-matches?limit=8', optional: true },
  ],
  statCards: [
    { id: 'sports', label: 'Sports', valuePath: 'sports.totalSports', icon: 'sports', accent: 'blue', format: 'number' },
    { id: 'teams', label: 'Teams', valuePath: 'sports.totalTeams', icon: 'people', accent: 'green', format: 'number' },
    { id: 'players', label: 'Players', valuePath: 'sports.totalPlayers', icon: 'person', accent: 'purple', format: 'number' },
    { id: 'matches', label: 'Upcoming Matches', valuePath: 'sports.upcomingMatches', icon: 'calendar', accent: 'orange', format: 'number' },
  ],
  charts: [
    { id: 'category', title: 'Sports by Category', type: 'donut', dataPath: 'sports.sportsByCategory', nameKey: 'category', valueKey: 'count', accent: 'blue' },
    { id: 'matches', title: 'Monthly Matches', type: 'bar', dataPath: 'sports.monthlyMatches', xKey: 'month', yKey: 'count', accent: 'green' },
  ],
  tables: [
    {
      id: 'matches',
      title: 'Recent Matches',
      dataPath: 'matches',
      columns: [
        { key: 'sport', label: 'Sport' },
        { key: 'teamA', label: 'Team A' },
        { key: 'teamB', label: 'Team B' },
        { key: 'score', label: 'Score' },
        { key: 'result', label: 'Result', status: true },
      ],
      emptyLabel: 'No recent matches returned.',
    },
  ],
  quickActions: [
    { id: 'management', label: 'Sports Management', description: 'Sports, teams, enrollments, and events', path: '/sports/management', icon: 'sports', accent: 'blue' },
    { id: 'reports', label: 'Reports', description: 'Open sports analytics reports', path: '/reports', icon: 'trend', accent: 'purple' },
    ...commonActions,
  ],
};
