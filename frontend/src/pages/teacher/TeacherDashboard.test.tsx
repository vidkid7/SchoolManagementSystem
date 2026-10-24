import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import apiClient from '../../services/apiClient';
import { useSlugNavigate } from '../../hooks/useSlugNavigate';
import { TeacherDashboard } from './TeacherDashboard';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('../../hooks/useSlugNavigate', () => ({ useSlugNavigate: jest.fn() }));
jest.mock('../../services/apiClient', () => ({ __esModule: true, default: { get: jest.fn() } }));

const mockedApi = jest.mocked(apiClient);
const mockedNavigate = jest.mocked(useSlugNavigate);
const renderDashboard = () => render(<ThemeProvider theme={createTheme()}><TeacherDashboard /></ThemeProvider>);

describe('TeacherDashboard', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedNavigate.mockReturnValue(jest.fn() as never);
    mockedApi.get.mockResolvedValue({
      data: { data: {
        schedule: [{ period: 1, time: '08:00', subject: 'Science', class: 'Grade 6 A', room: '101', status: 'upcoming' }],
        tasks: [{ type: 'grading', title: 'Grade assignments', priority: 'high', count: 7 }],
        performances: [{ class: 'Grade 6 A', attendance: 92, avgGrade: 3.6, assignments: 80 }],
        trend: [{ week: 'Week 4', rate: 91 }],
        stats: { classesToday: 3, pendingTasks: 7, totalStudents: 120, avgAttendance: 91 },
        notifications: [{ icon: 'event', text: 'Assembly notice', time: '08:00' }],
      } },
    } as never);
  });

  it('renders statistics from the backend stats object', async () => {
    renderDashboard();

    expect(await screen.findByText('120')).toBeInTheDocument();
    expect(screen.getByText('91%')).toBeInTheDocument();
    expect(screen.getByText('portal.todaysClasses').parentElement).toHaveTextContent('3');
    expect(screen.getAllByText('7').length).toBeGreaterThan(0);
    expect(screen.getByText('Assembly notice')).toBeInTheDocument();
  });

  it('wires dashboard actions to existing schedule, roster, assignments, and notifications destinations', async () => {
    const navigate = jest.fn();
    mockedNavigate.mockReturnValue(navigate);
    const scrollIntoView = jest.fn();
    window.HTMLElement.prototype.scrollIntoView = scrollIntoView;
    renderDashboard();

    fireEvent.click(await screen.findByRole('button', { name: 'portal.todaysSchedule' }));
    expect(scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'start' });

    fireEvent.click(screen.getByRole('button', { name: 'dashboard.viewDetails' }));
    fireEvent.click(screen.getByRole('button', { name: 'portal.myTasks' }));
    fireEvent.click(screen.getByRole('button', { name: 'notifications.viewAll' }));
    expect(navigate).toHaveBeenNthCalledWith(1, '/teacher/classes');
    expect(navigate).toHaveBeenNthCalledWith(2, '/teacher/assignments');
    expect(navigate).toHaveBeenNthCalledWith(3, '/notifications');
  });

  it('shows the empty dashboard state when the teacher API is unavailable', async () => {
    mockedApi.get.mockRejectedValue(new Error('service unavailable'));
    renderDashboard();

    expect(await screen.findByText('portal.noClassesScheduled')).toBeInTheDocument();
    expect(screen.getByText('portal.noTasksPending')).toBeInTheDocument();
  });
});
