import { useCallback, useEffect, useMemo, useState } from 'react';

/**
 * Persisted dashboard section preferences per role.
 *
 * Lets users hide/show cards on their dashboard. Order is fixed but
 * the visibility map is fully customizable per logged-in role.
 */

export type DashboardSectionId =
  | 'pulse'
  | 'kpis'
  | 'liveCards'
  | 'focus'
  | 'quickActions'
  | 'charts'
  | 'progress'
  | 'tables'
  | 'insights'
  | 'moreActions'
  | 'activity';

export interface DashboardSectionMeta {
  id: DashboardSectionId;
  label: string;
  description: string;
  defaultVisible: boolean;
  /** When true, this section can be hidden from the layout UI */
  toggleable: boolean;
}

export const DASHBOARD_SECTIONS: DashboardSectionMeta[] = [
  { id: 'pulse', label: 'Pulse Bar', description: 'Greeting, date and live KPIs strip', defaultVisible: true, toggleable: true },
  { id: 'kpis', label: 'Primary KPIs', description: 'Top stat cards from your role config', defaultVisible: true, toggleable: true },
  { id: 'liveCards', label: 'Live Metrics', description: 'Compact secondary metric tiles', defaultVisible: true, toggleable: true },
  { id: 'focus', label: 'Focus Card', description: 'Top progress and next priority action', defaultVisible: true, toggleable: true },
  { id: 'quickActions', label: 'Quick Actions', description: 'Role command center sidebar', defaultVisible: true, toggleable: true },
  { id: 'charts', label: 'Analytics Charts', description: 'Trend, distribution and comparison charts', defaultVisible: true, toggleable: true },
  { id: 'progress', label: 'Performance Trackers', description: 'Progress bars for attendance, fees, GPA, etc.', defaultVisible: true, toggleable: true },
  { id: 'tables', label: 'Data Tables', description: 'Searchable, paginated record tables', defaultVisible: true, toggleable: true },
  { id: 'insights', label: 'AI Insights', description: 'Generated insights from analytics', defaultVisible: true, toggleable: true },
  { id: 'moreActions', label: 'More Actions', description: 'Extra shortcuts beyond the top 5', defaultVisible: true, toggleable: true },
  { id: 'activity', label: 'Activity & Notices', description: 'Recent updates and notifications', defaultVisible: true, toggleable: true },
];

const STORAGE_PREFIX = 'sms_dashboard_layout_v1::';

function buildDefaultVisibility(): Record<DashboardSectionId, boolean> {
  return DASHBOARD_SECTIONS.reduce((acc, section) => {
    acc[section.id] = section.defaultVisible;
    return acc;
  }, {} as Record<DashboardSectionId, boolean>);
}

function readStoredLayout(key: string): Record<DashboardSectionId, boolean> {
  if (typeof window === 'undefined') return buildDefaultVisibility();
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return buildDefaultVisibility();
    const parsed = JSON.parse(raw) as Partial<Record<DashboardSectionId, boolean>>;
    return { ...buildDefaultVisibility(), ...parsed };
  } catch {
    return buildDefaultVisibility();
  }
}

export interface DashboardLayoutApi {
  visibility: Record<DashboardSectionId, boolean>;
  isVisible: (id: DashboardSectionId) => boolean;
  toggle: (id: DashboardSectionId) => void;
  setVisible: (id: DashboardSectionId, value: boolean) => void;
  reset: () => void;
  showAll: () => void;
  hideAll: () => void;
  hiddenCount: number;
  visibleCount: number;
}

export function useDashboardLayout(scope: string): DashboardLayoutApi {
  const storageKey = useMemo(() => `${STORAGE_PREFIX}${scope || 'default'}`, [scope]);
  const [visibility, setVisibility] = useState<Record<DashboardSectionId, boolean>>(() => readStoredLayout(storageKey));

  // Re-hydrate when the scope (role) changes
  useEffect(() => {
    setVisibility(readStoredLayout(storageKey));
  }, [storageKey]);

  // Persist on change
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(visibility));
    } catch {
      /* localStorage may be disabled */
    }
  }, [storageKey, visibility]);

  const isVisible = useCallback((id: DashboardSectionId) => visibility[id] !== false, [visibility]);

  const toggle = useCallback((id: DashboardSectionId) => {
    setVisibility((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const setVisibleFn = useCallback((id: DashboardSectionId, value: boolean) => {
    setVisibility((prev) => ({ ...prev, [id]: value }));
  }, []);

  const reset = useCallback(() => setVisibility(buildDefaultVisibility()), []);

  const showAll = useCallback(() => {
    setVisibility(
      DASHBOARD_SECTIONS.reduce((acc, section) => {
        acc[section.id] = true;
        return acc;
      }, {} as Record<DashboardSectionId, boolean>)
    );
  }, []);

  const hideAll = useCallback(() => {
    setVisibility(
      DASHBOARD_SECTIONS.reduce((acc, section) => {
        // Keep KPIs always on so dashboard isn't completely empty
        acc[section.id] = section.id === 'kpis';
        return acc;
      }, {} as Record<DashboardSectionId, boolean>)
    );
  }, []);

  const hiddenCount = DASHBOARD_SECTIONS.filter((section) => visibility[section.id] === false).length;
  const visibleCount = DASHBOARD_SECTIONS.length - hiddenCount;

  return { visibility, isVisible, toggle, setVisible: setVisibleFn, reset, showAll, hideAll, hiddenCount, visibleCount };
}
