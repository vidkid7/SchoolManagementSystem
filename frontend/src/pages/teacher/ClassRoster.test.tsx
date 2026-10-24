import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import apiClient from '../../services/apiClient';
import { useSlugNavigate } from '../../hooks/useSlugNavigate';
import { ClassRoster } from './ClassRoster';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('../../hooks/useSlugNavigate', () => ({ useSlugNavigate: jest.fn() }));
jest.mock('../../services/apiClient', () => ({ __esModule: true, default: { get: jest.fn() } }));

const mockedApi = jest.mocked(apiClient);
const mockedNavigate = jest.mocked(useSlugNavigate);
const renderRoster = () => render(<ThemeProvider theme={createTheme()}><ClassRoster /></ThemeProvider>);

describe('ClassRoster', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedNavigate.mockReturnValue(jest.fn() as never);
    mockedApi.get.mockResolvedValue({ data: { data: {
      classInfo: { classId: 6, name: 'Grade 6 A', section: 'A', gradeLevel: 6, totalStudents: 1 },
      students: [{
        studentId: 23,
        rollNumber: 'SCH-023',
        firstNameEn: 'Test',
        lastNameEn: 'Student',
        gender: 'female',
        dateOfBirth: '2014-01-01',
        motherPhone: '9800000023',
        attendanceRate: 92,
        averageGrade: null,
      }],
    } } } as never);
  });

  it('shows the class roster and falls back to the mother phone when father phone is absent', async () => {
    renderRoster();

    expect(await screen.findByText('Test Student')).toBeInTheDocument();
    expect(screen.getByText('Grade 6 A - A')).toBeInTheDocument();
    expect(screen.getByText('9800000023')).toBeInTheDocument();
    expect(screen.getByText('N/A')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'teacher.searchStudents' })).toBeInTheDocument();
  });

  it('filters students by name and roll number and opens the selected student', async () => {
    const navigate = jest.fn();
    mockedNavigate.mockReturnValue(navigate);
    renderRoster();

    const search = await screen.findByRole('textbox', { name: 'teacher.searchStudents' });
    fireEvent.change(search, { target: { value: 'SCH-023' } });
    expect(screen.getByText('Test Student')).toBeInTheDocument();
    fireEvent.change(search, { target: { value: 'missing' } });
    expect(screen.queryByText('Test Student')).not.toBeInTheDocument();
    expect(screen.getByText('teacher.noStudentsFound')).toBeInTheDocument();
    fireEvent.change(search, { target: { value: '' } });
    fireEvent.click(await screen.findByTitle('View Details'));
    expect(navigate).toHaveBeenCalledWith('/students/23');
  });

  it('shows an error and empty roster state when loading fails', async () => {
    mockedApi.get.mockRejectedValue(new Error('unavailable'));
    renderRoster();

    expect(await screen.findByRole('alert')).toHaveTextContent('portal.failedToLoadData');
    expect(screen.getByText('teacher.noStudentsFound')).toBeInTheDocument();
  });
});
