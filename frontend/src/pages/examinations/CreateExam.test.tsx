import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { MemoryRouter } from 'react-router-dom';
import * as mockReact from 'react';
import apiClient from '../../services/apiClient';
import { CreateExam } from './CreateExam';

const mockT = (key: string) => key;
const mockNavigate = jest.fn();

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: mockT }) }));
jest.mock('../../hooks/useSlugNavigate', () => ({ useSlugNavigate: () => mockNavigate }));
jest.mock('../../hooks/useCurrentAcademicYear', () => ({
  useCurrentAcademicYear: () => ({ currentYear: { academicYearId: 42, name: '2083-2084' } }),
}));
jest.mock('../../components/YearSelectableDatePicker/YearSelectableDatePicker', () => {
  return {
    YearSelectableDateField: (props: {
      label: string;
      name: string;
      value: string;
      onChange: (event: unknown) => void;
    }) => mockReact.createElement('input', {
      'aria-label': props.label,
      name: props.name,
      value: props.value,
      onChange: props.onChange,
    }),
  };
});
jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn() },
}));

const renderCreateExam = () => render(
  <MemoryRouter>
    <ThemeProvider theme={createTheme()}>
      <CreateExam />
    </ThemeProvider>
  </MemoryRouter>,
);

describe('CreateExam', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(apiClient.get).mockImplementation((url) => {
      const data = url.startsWith('/academic/terms')
        ? [{ termId: 7, name: 'Term 1' }]
        : url === '/academic/subjects'
          ? [{ subjectId: 9, nameEn: 'Mathematics' }]
          : url === '/academic/classes'
            ? [{ classId: 11, gradeLevel: 4, section: 'B' }]
            : [];
      return Promise.resolve({ data: { data } } as never);
    });
    jest.mocked(apiClient.post).mockResolvedValue({ data: { success: true } } as never);
  });

  it('submits selected database IDs and numeric exam marks', async () => {
    const user = userEvent.setup();
    renderCreateExam();

    fireEvent.change(await screen.findByRole('textbox', { name: 'examinations.examName' }), {
      target: { value: 'Quarterly Mathematics' },
    });
    await user.click(screen.getByRole('combobox', { name: 'examinations.examType' }));
    await user.click(screen.getByRole('option', { name: 'examinations.unitTest' }));
    await user.click(screen.getByRole('combobox', { name: 'common.subject' }));
    await user.click(screen.getByRole('option', { name: 'Mathematics' }));
    await user.click(screen.getByRole('combobox', { name: 'common.class' }));
    await user.click(screen.getByRole('option', { name: 'common.class 4B' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'examinations.examDate' }), {
      target: { value: '2026-11-01' },
    });
    await user.click(screen.getByRole('combobox', { name: 'examinations.term' }));
    await user.click(screen.getByRole('option', { name: 'Term 1' }));

    const createButton = await screen.findByRole('button', { name: 'examinations.createExam' });
    await waitFor(() => expect(createButton).toBeEnabled());
    await user.click(createButton);

    await waitFor(() => expect(apiClient.post).toHaveBeenCalledWith('/examinations', expect.objectContaining({
      name: 'Quarterly Mathematics',
      type: 'unit_test',
      classId: 11,
      subjectId: 9,
      academicYearId: 42,
      termId: 7,
      examDate: '2026-11-01',
      duration: 180,
      fullMarks: 100,
      passMarks: 35,
      theoryMarks: 75,
      practicalMarks: 25,
      weightage: 100,
    })));
  });

  it('shows an error and prevents submission instead of using fabricated dropdown IDs', async () => {
    jest.mocked(apiClient.get).mockImplementation((url) => {
      if (url === '/academic/subjects') return Promise.reject(new Error('Subjects unavailable'));
      const data = url.startsWith('/academic/terms')
        ? [{ termId: 7, name: 'Term 1' }]
        : [{ classId: 11, gradeLevel: 4, section: 'B' }];
      return Promise.resolve({ data: { data } } as never);
    });
    const user = userEvent.setup();
    renderCreateExam();

    expect(await screen.findByRole('alert')).toHaveTextContent('examinations.failedToLoadDropdowns');
    await user.click(screen.getByRole('combobox', { name: 'common.subject' }));
    expect(await screen.findByRole('option', { name: 'examinations.noSubjectsAvailable' })).toBeInTheDocument();
    expect(screen.queryByRole('option', { name: 'Mathematics' })).not.toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.getByRole('button', { name: 'examinations.createExam' })).toBeDisabled();
    expect(apiClient.post).not.toHaveBeenCalled();
  });
});
