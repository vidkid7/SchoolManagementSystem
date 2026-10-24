import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import apiClient from '../../services/apiClient';
import ClassTeacherPortal from './ClassTeacherPortal';

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

const renderPortal = () => render(
  <ThemeProvider theme={createTheme()}><ClassTeacherPortal /></ThemeProvider>,
);

describe('ClassTeacherPortal API contract', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(apiClient.get).mockImplementation((url) => {
      if (url.endsWith('/dashboard')) return Promise.resolve({ data: { data: {
        stats: { classesToday: 2, pendingTasks: 3, totalStudents: 27, avgAttendance: 92 },
        performances: [{ class: 'Grade 8 A', attendance: 92 }],
        schedule: [{ period: 1, time: '09:00 - 09:45', subject: 'Science', class: 'Grade 8 A', room: 'Lab 1' }],
        tasks: [{ type: 'attendance', title: 'Mark attendance for Grade 8 A', priority: 'high', count: 2 }],
      } } } as never);
      if (url.endsWith('/classes/performance')) return Promise.resolve({ data: { data: [
        { class: 'Grade 8 A', attendance: 92, avgGrade: 3.5, assignments: 85 },
      ] } } as never);
      if (url.endsWith('/schedule/today')) return Promise.resolve({ data: { data: [
        { period: 1, time: '09:00 - 09:45', subject: 'Science', class: 'Grade 8 A', room: 'Lab 1' },
      ] } } as never);
      if (url.endsWith('/tasks/pending')) return Promise.resolve({ data: { data: [
        { type: 'attendance', title: 'Mark attendance for Grade 8 A', priority: 'high', count: 2 },
      ] } } as never);
      return Promise.resolve({ data: { data: {} } } as never);
    });
  });

  it('renders teacher statistics and records using the backend response shape', async () => {
    const user = userEvent.setup();
    renderPortal();

    expect(await screen.findByRole('heading', { name: 'portal.classTeacherPortal' })).toBeInTheDocument();
    expect(screen.getAllByText('27').length).toBeGreaterThan(0);
    expect(screen.getAllByText('92%').length).toBeGreaterThan(0);
    expect(screen.getAllByText('2').length).toBeGreaterThan(0);

    expect(screen.getAllByText('Grade 8 A').length).toBeGreaterThan(0);
    await user.click(screen.getByRole('tab', { name: 'portal.pendingTasksCount' }));
    expect(screen.getByText('Mark attendance for Grade 8 A')).toBeInTheDocument();
  });
});
