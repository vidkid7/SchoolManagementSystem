import { render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { ExamDetails } from './ExamDetails';

let mockRole = 'Department_Head';
const mockNavigate = jest.fn();
const mockT = (key: string) => key;

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: mockT }) }));
jest.mock('react-redux', () => ({
  useSelector: (selector: (state: unknown) => unknown) => selector({ auth: { user: { role: mockRole } } }),
}));
jest.mock('../../hooks/useSlugNavigate', () => ({ useSlugNavigate: () => mockNavigate }));
jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn(), delete: jest.fn() },
}));

const renderExamDetails = () => render(
  <MemoryRouter initialEntries={['/examinations/42']}>
    <ThemeProvider theme={createTheme()}>
      <Routes>
        <Route path="/examinations/:examId" element={<ExamDetails />} />
      </Routes>
    </ThemeProvider>
  </MemoryRouter>,
);

describe('ExamDetails role actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(apiClient.get).mockResolvedValue({ data: { data: {
      examId: 42,
      name: 'Midterm',
      type: 'mid_term',
      className: 'Class 8A',
      subjectName: 'Science',
      examDate: '2026-11-10',
      fullMarks: 100,
      passMarks: 40,
      status: 'scheduled',
    } } } as never);
  });

  it('shows only read access actions to department heads', async () => {
    mockRole = 'Department_Head';
    renderExamDetails();

    expect(await screen.findByRole('heading', { name: 'Midterm' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'common.edit' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'examinations.enterGrades' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'common.delete' })).not.toBeInTheDocument();
  });

  it('does not show delete to teachers, whose API role cannot delete exams', async () => {
    mockRole = 'Class_Teacher';
    renderExamDetails();

    expect(await screen.findByRole('heading', { name: 'Midterm' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'common.edit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'examinations.enterGrades' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'common.delete' })).not.toBeInTheDocument();
  });

  it('shows exam delete only to school administrators', async () => {
    mockRole = 'School_Admin';
    renderExamDetails();

    expect(await screen.findByRole('heading', { name: 'Midterm' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'common.edit' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'examinations.enterGrades' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'common.delete' })).toBeInTheDocument();
  });
});
