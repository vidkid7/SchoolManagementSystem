import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import api from '../../config/api';
import { useSlugNavigate } from '../../hooks/useSlugNavigate';
import { DepartmentTeachers } from './DepartmentTeachers';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('../../hooks/useSlugNavigate', () => ({ useSlugNavigate: jest.fn() }));
jest.mock('../../config/api', () => ({ __esModule: true, default: { get: jest.fn() } }));

const mockedApi = jest.mocked(api);
const mockedNavigate = jest.mocked(useSlugNavigate);
const teachers = [
  { staffId: 41, firstName: 'Maya', lastName: 'Rai', email: 'maya@example.test', phone: '9800000041', department: 'Science', position: 'Teacher', employmentType: 'full-time', status: 'active', classCount: 2, attendanceRate: 96 },
  { staffId: 42, firstName: 'Hari', lastName: 'Gurung', department: 'Science', position: 'Senior Teacher', employmentType: 'full-time', status: 'on_leave', classCount: 1, attendanceRate: 80 },
];
const renderPage = () => render(<ThemeProvider theme={createTheme()}><DepartmentTeachers /></ThemeProvider>);

describe('DepartmentTeachers', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedNavigate.mockReturnValue(jest.fn() as never);
    mockedApi.get.mockResolvedValue({ data: { data: {
      teachers,
      stats: { totalTeachers: 2, activeTeachers: 1, onLeave: 1, avgAttendance: 88 },
    } } } as never);
  });

  it('renders department statistics and supports search and status tabs', async () => {
    renderPage();

    expect(await screen.findByText('Maya Rai')).toBeInTheDocument();
    expect(screen.getByText('Hari Gurung')).toBeInTheDocument();
    expect(screen.getByText('88.0%')).toBeInTheDocument();
    fireEvent.change(screen.getByRole('textbox', { name: 'Search by name or position' }), { target: { value: 'senior' } });
    expect(screen.queryByText('Maya Rai')).not.toBeInTheDocument();
    expect(screen.getByText('Hari Gurung')).toBeInTheDocument();
    fireEvent.change(screen.getByRole('textbox', { name: 'Search by name or position' }), { target: { value: '' } });
    fireEvent.click(screen.getByRole('tab', { name: 'Active (1)' }));
    expect(screen.getByText('Maya Rai')).toBeInTheDocument();
    expect(screen.queryByText('Hari Gurung')).not.toBeInTheDocument();
  });

  it('opens an inline teacher detail dialog and uses working schedule/performance destinations', async () => {
    const navigate = jest.fn();
    mockedNavigate.mockReturnValue(navigate);
    renderPage();

    fireEvent.click(await screen.findByRole('button', { name: 'View details for Maya Rai' }));
    expect(screen.getByRole('dialog', { name: 'Teacher Details' })).toHaveTextContent('maya@example.test');
    fireEvent.click(screen.getByRole('button', { name: 'Close' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
    fireEvent.click(screen.getByRole('button', { name: 'View schedule for Maya Rai' }));
    fireEvent.click(screen.getByRole('button', { name: 'View department performance for Maya Rai' }));
    expect(navigate).toHaveBeenNthCalledWith(1, '/academic/timetable');
    expect(navigate).toHaveBeenNthCalledWith(2, '/portal/department-head');
  });

  it('shows the API error and empty table when loading fails', async () => {
    mockedApi.get.mockRejectedValue({ response: { data: { message: 'Department service unavailable' } } });
    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('Department service unavailable');
    await waitFor(() => expect(screen.getByText('No teachers found')).toBeInTheDocument());
  });
});
