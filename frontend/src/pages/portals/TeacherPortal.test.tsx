import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import apiClient from '../../services/apiClient';
import TeacherPortal from './TeacherPortal';

const mockT = (key: string) => key;
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: mockT }) }));
jest.mock('react-redux', () => ({
  useSelector: (selector: (state: unknown) => unknown) => selector({
    auth: { user: { username: 'teacher.qa', firstName: 'QA' }, accessToken: 'teacher-token' },
  }),
}));
jest.mock('../../hooks/useSlugNavigate', () => ({ useSlugNavigate: () => jest.fn() }));
jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

const renderTeacherPortal = () => render(
  <ThemeProvider theme={createTheme()}>
    <TeacherPortal />
  </ThemeProvider>,
);

describe('TeacherPortal dashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(apiClient.get).mockImplementation((url) => {
      if (url.endsWith('/dashboard')) {
        return Promise.resolve({ data: { data: {
          stats: { todayClasses: 3, pendingTasks: 1, totalStudents: 28, completedLessons: 2 },
          schedule: [{ period: 1, time: '09:00', subject: 'Science', class: '8A', room: 'Lab 1' }],
          tasks: [{ id: 11, title: 'Grade lab reports', status: 'pending', dueDate: '2026-10-29' }],
          performances: [],
          profile: { firstName: 'QA', role: 'Teacher' },
        } } } as never);
      }
      return Promise.resolve({ data: { data: { notifications: [] } } } as never);
    });
  });

  it('loads dashboard, schedule, and tasks with the authenticated request header', async () => {
    const user = userEvent.setup();
    renderTeacherPortal();

    expect(await screen.findByRole('heading', { name: 'menu.teacherPortal' })).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('28')).toBeInTheDocument();
    expect(screen.getByText('Grade lab reports')).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'portal.todaysSchedule' }));
    expect(screen.getByText('Science')).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'portal.assignments' }));
    expect(screen.getByRole('button', { name: 'portal.openAssignmentMgmt' })).toBeInTheDocument();
    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/teachers/dashboard', {
      headers: { Authorization: 'Bearer teacher-token' },
    });
    expect(apiClient.get).not.toHaveBeenCalledWith('/api/v1/teachers/notifications', expect.anything());
  });

  it('shows the dashboard load error if the primary endpoint fails', async () => {
    jest.mocked(apiClient.get).mockImplementation((url) => {
      if (url.endsWith('/dashboard')) return Promise.reject(new Error('unavailable'));
      return Promise.resolve({ data: { data: { notifications: [] } } } as never);
    });

    renderTeacherPortal();
    expect(await screen.findByText('portal.failedToLoadData')).toBeInTheDocument();
  });
});
