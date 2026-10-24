import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import apiClient from '../../services/apiClient';
import { AttendanceMarking } from './AttendanceMarking';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

const classRows = [
  { classId: 11, gradeLevel: 1, section: 'A' },
  { classId: 12, gradeLevel: 1, section: 'B' },
];

const studentRow = {
  studentId: 91,
  studentCode: 'SCH001-2026-0091',
  firstNameEn: 'Mina',
  lastNameEn: 'Rai',
  rollNumber: 4,
};

const renderPage = () => render(
  <ThemeProvider theme={createTheme()}>
    <AttendanceMarking />
  </ThemeProvider>,
);

const choose = async (label: string, option: string) => {
  const select = screen.getByRole('combobox', { name: label });
  await waitFor(() => expect(select).not.toBeDisabled());
  await waitFor(() => expect(apiClient.get).toHaveBeenCalledWith('/academic/classes'));
  fireEvent.mouseDown(select, { button: 0 });
  fireEvent.click(await screen.findByRole('option', { name: option }));
  await waitFor(() => expect(select).toHaveTextContent(option));
};

describe('AttendanceMarking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    localStorage.clear();
    Object.defineProperty(navigator, 'onLine', { configurable: true, value: true });
    jest.mocked(apiClient.get).mockImplementation(async (url: string) => {
      if (url === '/academic/classes') return { data: { data: classRows } } as Awaited<ReturnType<typeof apiClient.get>>;
      return { data: { data: [studentRow] } } as Awaited<ReturnType<typeof apiClient.get>>;
    });
    jest.mocked(apiClient.post).mockResolvedValue({ data: { success: true } } as Awaited<ReturnType<typeof apiClient.post>>);
  });

  it('loads active students for the selected class and section and saves their selected attendance status', async () => {
    renderPage();
    await choose('common.class', 'common.class 1');
    await choose('common.section', 'common.section B');
    expect(await screen.findByText('Mina Rai')).toBeInTheDocument();

    await choose('attendance.period', 'attendance.period 3');
    const studentCard = screen.getByText('Mina Rai').closest('.MuiCard-root');
    expect(studentCard).not.toBeNull();
    fireEvent.click(within(studentCard as HTMLElement).getByRole('button', { name: 'attendance.absent' }));
    fireEvent.click(screen.getByRole('button', { name: 'attendance.saveAttendance' }));

    await waitFor(() => expect(apiClient.post).toHaveBeenCalledWith('/attendance/student/mark', expect.objectContaining({
      studentId: 91,
      classId: 12,
      status: 'absent',
      periodNumber: 3,
    })));
    expect(await screen.findAllByText('attendance.attendanceSavedSuccess')).toHaveLength(2);
  });

  it('keeps the save action disabled until a period is selected', async () => {
    renderPage();
    await choose('common.class', 'common.class 1');
    await choose('common.section', 'common.section B');
    await screen.findByText('Mina Rai');

    expect(screen.getByRole('button', { name: 'attendance.saveAttendance' })).toBeDisabled();
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('queues attendance locally when the browser goes offline', async () => {
    renderPage();
    await choose('common.class', 'common.class 1');
    await choose('common.section', 'common.section B');
    await screen.findByText('Mina Rai');
    await choose('attendance.period', 'attendance.period 2');

    fireEvent(window, new Event('offline'));
    fireEvent.click(screen.getByRole('button', { name: 'attendance.saveAttendance' }));

    expect(await screen.findByText('attendance.attendanceSavedSuccess')).toBeInTheDocument();
    const queued = JSON.parse(localStorage.getItem('pending_attendance') || '{}');
    expect(queued).toEqual(expect.objectContaining({
      classId: '1',
      section: 'B',
      periodNumber: 2,
      students: [{ studentId: 91, status: 'present' }],
    }));
    expect(apiClient.post).not.toHaveBeenCalled();
  });
});
