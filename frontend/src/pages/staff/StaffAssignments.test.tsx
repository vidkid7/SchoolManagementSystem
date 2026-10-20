import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { StaffAssignments } from './StaffAssignments';

jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

jest.mock('../../hooks/useSlugNavigate', () => ({
  useSlugNavigate: () => jest.fn(),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

describe('StaffAssignments', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiClient.get as jest.Mock).mockImplementation((path: string) => {
      if (path === '/api/v1/staff/1') {
        return Promise.resolve({ data: { data: { staffId: 1, firstNameEn: 'Test', lastNameEn: 'Teacher' } } });
      }
      if (path === '/api/v1/staff/1/assignments') {
        return Promise.resolve({ data: { data: [] } });
      }
      if (path === '/academic/classes') {
        return Promise.resolve({ data: { data: [{ classId: 1, gradeLevel: 1, section: 'K' }] } });
      }
      if (path === '/academic/subjects') {
        return Promise.resolve({ data: { data: [{ subjectId: 1, nameEn: 'Mathematics', nameNp: 'गणित' }] } });
      }
      if (path === '/academic/years/current') {
        return Promise.resolve({ data: { data: { academicYearId: 1 } } });
      }
      return Promise.resolve({ data: { data: [] } });
    });
  });

  it('keeps subject-teacher submission disabled until a subject is selected', async () => {
    render(
      <ThemeProvider theme={createTheme()}>
        <MemoryRouter initialEntries={['/KMC/staff/1/assignments']}>
          <Routes>
            <Route path='/:municipalitySlug/staff/:id/assignments' element={<StaffAssignments />} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>,
    );

    await screen.findByRole('heading', { name: 'staff.form.teacherAssignments' });
    await act(async () => {
      fireEvent.click(screen.getAllByRole('button', { name: 'staff.form.addAssignment' })[0]);
    });

    const dialog = screen.getByRole('dialog');
    const getDialogComboboxes = () => within(dialog).getAllByRole('combobox');
    expect(within(dialog).getByRole('combobox', { name: 'staff.form.assignmentType' })).toBeInTheDocument();
    expect(within(dialog).getByRole('combobox', { name: 'academic.class' })).toBeInTheDocument();
    expect(within(dialog).getByRole('combobox', { name: 'examinations.subject' })).toBeInTheDocument();
    fireEvent.mouseDown(getDialogComboboxes()[1]);
    await act(async () => {
      fireEvent.click(await screen.findByRole('option'));
    });

    const getDialogAddButton = () => screen.getAllByRole('button', { name: 'staff.form.addAssignment' }).at(-1)!;
    const addButton = getDialogAddButton();
    expect(addButton).toBeDisabled();

    fireEvent.mouseDown(getDialogComboboxes()[2]);
    await act(async () => {
      fireEvent.click(await screen.findByRole('option'));
    });

    await waitFor(() => expect(addButton).toBeEnabled());
    expect(apiClient.post).not.toHaveBeenCalled();
  });
});
