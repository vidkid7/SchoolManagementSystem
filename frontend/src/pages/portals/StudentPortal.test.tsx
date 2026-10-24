import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import apiClient from '../../services/apiClient';
import StudentPortal from './StudentPortal';

const mockT = (key: string) => key;

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: mockT }) }));
jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

const renderStudentPortal = () => render(
  <ThemeProvider theme={createTheme()}>
    <StudentPortal />
  </ThemeProvider>,
);

describe('StudentPortal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(apiClient.get).mockImplementation((url) => {
      const data = url.endsWith('/attendance/summary')
        ? { present: 22, total: 25, percentage: 88 }
        : url.endsWith('/grades')
          ? [{ subject: 'Mathematics', grade: 'A', gpa: 4 }]
          : url.endsWith('/fees/summary')
            ? { paid: 1000, pending: 250, total: 1250 }
            : url.endsWith('/assignments')
              ? [{ title: 'Science homework', subject: 'Science', dueDate: '2026-10-28', status: 'pending' }]
              : url.endsWith('/announcements')
                ? [{ id: 7, title: 'School meeting', date: '2026-10-22' }]
                : [{ period: 1, subject: 'Science', teacher: 'Ms. QA', time: '09:00' }];
      return Promise.resolve({ data: { data } } as never);
    });
  });

  it('loads student-owned dashboard endpoints and renders the returned summary', async () => {
    renderStudentPortal();

    expect(await screen.findByRole('heading', { name: 'portal.studentPortal' })).toBeInTheDocument();
    expect(screen.getByText('88%')).toBeInTheDocument();
    expect(screen.getByText('4.00')).toBeInTheDocument();
    expect(screen.getByText('common.currency 250')).toBeInTheDocument();
    for (const url of [
      '/api/v1/students/me/attendance/summary',
      '/api/v1/students/me/grades',
      '/api/v1/students/me/fees/summary',
      '/api/v1/students/me/assignments',
      '/api/v1/announcements',
      '/api/v1/students/me/timetable',
    ]) {
      expect(apiClient.get).toHaveBeenCalledWith(url);
    }
  });

  it('shows the selected student assignment tab content', async () => {
    const user = userEvent.setup();
    renderStudentPortal();

    await screen.findByRole('heading', { name: 'portal.studentPortal' });
    await user.click(screen.getByRole('tab', { name: 'portal.assignments' }));

    expect(screen.getByText('Science homework')).toBeInTheDocument();
  });
});
