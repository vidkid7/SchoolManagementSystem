import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { apiClient } from '../../services/apiClient';
import { StudentForm } from './StudentForm';
import { formatBSDate, parseDate } from './studentDateUtils';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}));

jest.mock('../../hooks/useSlugNavigate', () => ({ useSlugNavigate: () => jest.fn() }));
jest.mock('../../hooks/useNepaliNumbers', () => ({ useNepaliNumbers: () => ({ formatNumber: (value: number) => String(value) }) }));

jest.mock('../../services/apiClient', () => {
  const client = { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() };
  return { __esModule: true, apiClient: client, default: client };
});

jest.mock('../../components/BSDatePicker/BSDatePicker', () => ({
  BSDatePicker: ({ label, value }: { label: string; value: unknown }) => (
    <input aria-label={label} type="text" value={value ? 'date-selected' : ''} readOnly />
  ),
}));

jest.mock('../../components/YearSelectableDatePicker/YearSelectableDatePicker', () => ({
  YearSelectableDatePicker: ({ label, value, onChange }: { label: string; value: Date | null; onChange: (date: Date | null) => void }) => (
    <input
      aria-label={label}
      type="date"
      value={value ? value.toISOString().slice(0, 10) : ''}
      onChange={(event) => onChange(event.target.value ? new Date(`${event.target.value}T12:00:00`) : null)}
    />
  ),
}));

const mockedApi = jest.mocked(apiClient);

const renderStudentForm = () => render(
  <ThemeProvider theme={createTheme()}>
    <MemoryRouter initialEntries={['/students/new']}>
      <Routes>
        <Route path="/students/new" element={<StudentForm />} />
      </Routes>
    </MemoryRouter>
  </ThemeProvider>,
);

const fillRequiredFields = () => {
  const values: Record<string, string> = {
    'students.firstName *': 'QA',
    'students.lastName *': 'Student',
    'students.dateOfBirth (AD) *': '2008-04-01',
    'students.admissionDate *': '2026-01-01',
    'students.address (English) *': 'Test Street',
    'students.emergencyContact *': '9801110001',
    'students.fatherName *': 'QA Father',
    'students.fatherPhone *': '9801110002',
    'students.motherName *': 'QA Mother',
    'students.motherPhone *': '9801110003',
  };

  for (const [label, value] of Object.entries(values)) {
    const input = screen.queryByLabelText(label);
    if (!input) {
      const labels = Array.from(document.querySelectorAll('label')).map((element) => element.textContent?.trim()).filter(Boolean);
      throw new Error(`Missing form field ${label}; rendered labels: ${labels.join(' | ')}`);
    }
    fireEvent.change(input, { target: { value } });
  }
};

describe('StudentForm create flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedApi.get.mockResolvedValue({ data: { data: [] } } as never);
    mockedApi.post.mockImplementation(async (url: string) => {
      if (url === '/api/v1/students/detect-duplicates') {
        return { data: { data: { duplicates: [] } } } as never;
      }
      if (url === '/api/v1/students/validate') {
        return { data: { data: { isValid: true, errors: [], warnings: [] } } } as never;
      }
      if (url === '/api/v1/students') {
        return { data: { data: { studentId: 900001 } } } as never;
      }
      throw new Error(`Unexpected POST ${url}`);
    });
  });

  it('blocks an empty submission before calling student APIs', async () => {
    renderStudentForm();
    await screen.findByText('students.noClassesConfigured');

    fireEvent.click(screen.getByRole('button', { name: 'common.save' }));

    expect(await screen.findAllByText('validation.required')).not.toHaveLength(0);
    expect(mockedApi.post).not.toHaveBeenCalled();
  });

  it('checks duplicates, validates, then creates a valid student with the backend payload', async () => {
    renderStudentForm();
    await screen.findByText('students.noClassesConfigured');
    fillRequiredFields();

    fireEvent.click(screen.getByRole('button', { name: 'common.save' }));

    await waitFor(() => expect(mockedApi.post).toHaveBeenCalledWith('/api/v1/students', expect.any(Object)));

    const duplicateCall = mockedApi.post.mock.calls.find(([url]) => url === '/api/v1/students/detect-duplicates');
    const validateCall = mockedApi.post.mock.calls.find(([url]) => url === '/api/v1/students/validate');
    const createCall = mockedApi.post.mock.calls.find(([url]) => url === '/api/v1/students');

    expect(duplicateCall?.[1]).toEqual(expect.objectContaining({ firstNameEn: 'QA', lastNameEn: 'Student' }));
    expect(validateCall?.[1]).toEqual(duplicateCall?.[1]);
    expect(createCall?.[1]).toEqual(expect.objectContaining({
      firstNameEn: 'QA',
      lastNameEn: 'Student',
      dateOfBirthAD: '2008-04-01',
      dateOfBirthBS: formatBSDate(parseDate('2008-04-01')),
      addressEn: 'Test Street',
      phone: null,
      email: null,
      emergencyContact: '9801110001',
      admissionDate: '2026-01-01',
      admissionClass: 1,
      currentClassId: null,
      fatherName: 'QA Father',
      fatherPhone: '9801110002',
      motherName: 'QA Mother',
      motherPhone: '9801110003',
    }));
  });

  it('shows server validation errors and prevents student creation', async () => {
    const validationMessage = 'Date of birth is inconsistent';
    mockedApi.post.mockImplementation(async (url: string) => {
      if (url === '/api/v1/students/detect-duplicates') {
        return { data: { data: { duplicates: [] } } } as never;
      }
      if (url === '/api/v1/students/validate') {
        return { data: { data: { isValid: false, errors: [validationMessage], warnings: [] } } } as never;
      }
      throw new Error(`Unexpected POST ${url}`);
    });

    renderStudentForm();
    await screen.findByText('students.noClassesConfigured');
    fillRequiredFields();
    fireEvent.click(screen.getByRole('button', { name: 'common.save' }));

    expect(await screen.findByText(validationMessage)).toBeInTheDocument();
    expect(mockedApi.post).not.toHaveBeenCalledWith('/api/v1/students', expect.anything());
    expect(screen.getByRole('button', { name: 'common.save' })).toBeEnabled();
  });

  it('maps a Joi field error response to the student form', async () => {
    const apiValidationError = {
      isAxiosError: true,
      response: {
        data: {
          message: 'Validation failed',
          errors: [{ field: 'fatherPhone', message: 'Invalid phone number format' }],
        },
      },
    };
    mockedApi.post.mockImplementation(async (url: string) => {
      if (url === '/api/v1/students/detect-duplicates') {
        return { data: { data: { duplicates: [] } } } as never;
      }
      if (url === '/api/v1/students/validate') {
        return { data: { data: { isValid: true, errors: [], warnings: [] } } } as never;
      }
      if (url === '/api/v1/students') throw apiValidationError;
      throw new Error(`Unexpected POST ${url}`);
    });

    renderStudentForm();
    await screen.findByText('students.noClassesConfigured');
    fillRequiredFields();
    fireEvent.click(screen.getByRole('button', { name: 'common.save' }));

    expect(await screen.findByText("validation.errors: Father's Phone")).toBeInTheDocument();
  });
});
