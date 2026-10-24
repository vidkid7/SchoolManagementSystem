import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import apiClient from '../../services/apiClient';
import DepartmentHeadPortal from './DepartmentHeadPortal';

const mockT = (key: string) => key;
let performanceRows: Array<{ class: string; averageScore: number }> = [];
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: mockT }) }));
jest.mock('react-redux', () => ({
  useSelector: (selector: (state: unknown) => unknown) => selector({
    auth: { user: { username: 'dept.qa', firstName: 'QA' }, accessToken: 'department-token' },
  }),
}));
jest.mock('../../hooks/useSlugNavigate', () => ({ useSlugNavigate: () => jest.fn() }));
jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

describe('DepartmentHeadPortal API contract', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    performanceRows = [];
    jest.mocked(apiClient.get).mockImplementation((url) => {
      if (url.endsWith('/department/teachers')) return Promise.resolve({ data: { data: {
        teachers: [{ staffId: 41, firstName: 'Casey', lastName: 'Teacher', department: 'Science', position: 'Teacher', classCount: 2, attendanceRate: 91.5, status: 'active' }],
        stats: { totalTeachers: 2, activeTeachers: 1, onLeave: 1, avgAttendance: 91.5 },
      } } } as never);
      if (url.endsWith('/department/stats')) return Promise.resolve({ data: { data: {
        totalTeachers: 2, totalClasses: 4, avgPerformance: 0, pendingReviews: 0,
      } } } as never);
      if (url.endsWith('/department/performance')) return Promise.resolve({ data: { data: performanceRows } } as never);
      return Promise.resolve({ data: { data: {} } } as never);
    });
  });

  it('renders teacher statistics returned by the backend', async () => {
    performanceRows = [{ class: 'Class 8-A', averageScore: 84.5 }];
    const user = userEvent.setup();
    render(<ThemeProvider theme={createTheme()}><DepartmentHeadPortal /></ThemeProvider>);

    expect(await screen.findByRole('heading', { name: 'portal.departmentHeadPortal' })).toBeInTheDocument();
    expect(screen.getAllByText('2').length).toBeGreaterThan(0);
    expect(screen.getAllByText('4').length).toBeGreaterThan(0);
    expect(screen.getAllByText('91.5%').length).toBeGreaterThan(0);
    await user.click(screen.getByRole('tab', { name: 'portal.teachers' }));
    expect(screen.getByText('Casey Teacher')).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'portal.performance' }));
    expect(screen.getByText('Class 8-A')).toBeInTheDocument();
    expect(screen.getByText('84.5%')).toBeInTheDocument();
    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/department/teachers', {
      headers: { Authorization: 'Bearer department-token' },
    });
    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/department/performance', {
      headers: { Authorization: 'Bearer department-token' },
    });
  });

  it('keeps the documented empty state when there are no completed exam results', async () => {
    const user = userEvent.setup();
    render(<ThemeProvider theme={createTheme()}><DepartmentHeadPortal /></ThemeProvider>);

    await user.click(await screen.findByRole('tab', { name: 'portal.performance' }));

    expect(screen.getByText('portal.noPerformanceData')).toBeInTheDocument();
  });
});
