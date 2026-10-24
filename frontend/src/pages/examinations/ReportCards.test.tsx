import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { ReportCards } from './ReportCards';

jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

jest.mock('../../hooks/useSlugNavigate', () => ({ useSlugNavigate: () => jest.fn() }));

jest.mock('../../hooks/useCurrentAcademicYear', () => ({
  useCurrentAcademicYear: () => ({
    currentYear: { academicYearId: 30001, name: '2083-2084' },
    academicYears: [{ academicYearId: 30001, name: '2083-2084' }],
  }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}));

describe('ReportCards', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiClient.get as jest.Mock).mockImplementation((path: string) => {
      if (path === '/academic/classes') return Promise.resolve({ data: { data: [
        { classId: 1, gradeLevel: 1, section: 'K' },
        { classId: 2, gradeLevel: 1, section: 'L' },
      ] } });
      if (path === '/academic/terms') return Promise.resolve({ data: { data: [] } });
      return Promise.resolve({ data: { data: [] } });
    });
  });

  it('labels every filter and loads configured terms instead of offering fixed dummy terms', async () => {
    render(
      <ThemeProvider theme={createTheme()}>
        <MemoryRouter initialEntries={['/KMC/examinations/reports']}>
          <Routes>
            <Route path='/:municipalitySlug/examinations/reports' element={<ReportCards />} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>,
    );

    expect(await screen.findByRole('combobox', { name: 'academic.academicYear' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'examinations.term' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'common.class' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'common.section (common.optional)' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'students.student' })).toBeInTheDocument();
    expect(apiClient.get).toHaveBeenCalledWith('/academic/terms', { params: { academicYearId: '30001' } });

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'examinations.term' }));
    const termOptions = await screen.findByRole('listbox');
    expect(within(termOptions).getByRole('option', { name: 'examinations.noTermsConfigured' })).toHaveAttribute('aria-disabled', 'true');
    expect(within(termOptions).queryByRole('option', { name: 'examinations.firstTerm' })).not.toBeInTheDocument();
  });

  it('offers the selected class section and resets it when the class changes', async () => {
    const { container } = render(
      <ThemeProvider theme={createTheme()}>
        <MemoryRouter initialEntries={['/KMC/examinations/reports']}>
          <Routes>
            <Route path='/:municipalitySlug/examinations/reports' element={<ReportCards />} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>,
    );

    const classFilter = await screen.findByRole('combobox', { name: 'common.class' });
    fireEvent.mouseDown(classFilter);
    let options = await screen.findByRole('listbox');
    fireEvent.click(within(options).getByRole('option', { name: 'common.class 1K' }));
    await waitFor(() => expect(apiClient.get).toHaveBeenCalledWith('/students', expect.objectContaining({
      params: expect.objectContaining({ classId: 1 }),
    })));

    let sectionFilter = screen.getByRole('combobox', { name: 'common.section (common.optional)' });
    await waitFor(() => expect(sectionFilter).toBeEnabled());
    fireEvent.mouseDown(sectionFilter);
    options = await screen.findByRole('listbox');
    expect(within(options).getByRole('option', { name: 'common.section K' })).toBeInTheDocument();
    expect(within(options).queryByRole('option', { name: 'common.section A' })).not.toBeInTheDocument();
    fireEvent.click(within(options).getByRole('option', { name: 'common.section K' }));
    await waitFor(() => expect(apiClient.get).toHaveBeenCalledWith('/students', expect.objectContaining({
      params: expect.objectContaining({ section: 'K' }),
    })));

    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'common.class' }));
    options = await screen.findByRole('listbox');
    fireEvent.click(within(options).getByRole('option', { name: 'common.class 1L' }));

    await waitFor(() => expect(apiClient.get).toHaveBeenCalledWith('/students', expect.objectContaining({
      params: expect.objectContaining({ classId: 2 }),
    })));
    expect(container.querySelector('input[name="section"]')).toHaveValue('');
    sectionFilter = screen.getByRole('combobox', { name: 'common.section (common.optional)' });
    fireEvent.mouseDown(sectionFilter);
    options = await screen.findByRole('listbox');
    expect(within(options).getByRole('option', { name: 'common.section L' })).toBeInTheDocument();
    expect(within(options).queryByRole('option', { name: 'common.section K' })).not.toBeInTheDocument();
  });

  it('shows the backend delivery error when parent email is not configured', async () => {
    (apiClient.get as jest.Mock).mockImplementation((path: string) => {
      if (path === '/academic/classes') return Promise.resolve({ data: { data: [
        { classId: 1, gradeLevel: 1, section: 'K' },
      ] } });
      if (path === '/academic/terms') return Promise.resolve({ data: { data: [
        { termId: 7, name: 'First Term' },
      ] } });
      if (path === '/students') return Promise.resolve({ data: { data: [
        { studentId: 41, studentCode: 'QA-41', firstNameEn: 'Test', lastNameEn: 'Student', rollNumber: 1 },
      ] } });
      return Promise.resolve({ data: { data: [] } });
    });
    (apiClient.post as jest.Mock).mockRejectedValue({
      response: {
        status: 501,
        data: { success: false, error: { message: 'Email delivery is not configured. No report cards were sent.' } },
      },
    });

    render(
      <ThemeProvider theme={createTheme()}>
        <MemoryRouter initialEntries={['/KMC/examinations/reports']}>
          <Routes>
            <Route path='/:municipalitySlug/examinations/reports' element={<ReportCards />} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>,
    );

    const termFilter = await screen.findByRole('combobox', { name: 'examinations.term' });
    fireEvent.mouseDown(termFilter);
    let options = await screen.findByRole('listbox');
    fireEvent.click(within(options).getByRole('option', { name: 'First Term' }));

    const classFilter = screen.getByRole('combobox', { name: 'common.class' });
    fireEvent.mouseDown(classFilter);
    options = await screen.findByRole('listbox');
    fireEvent.click(within(options).getByRole('option', { name: 'common.class 1K' }));

    const emailButton = await screen.findByRole('button', { name: 'examinations.emailToParents' });
    await waitFor(() => expect(emailButton).toBeEnabled());
    await act(async () => {
      const button = emailButton;
      fireEvent.click(button);
      await waitFor(() => expect(apiClient.post).toHaveBeenCalled());
    });

    await waitFor(() => expect(apiClient.post).toHaveBeenCalledWith('/examinations/reports/email', {
      studentIds: [41],
      termId: '7',
      academicYearId: '30001',
    }));
    expect(await screen.findByText('Email delivery is not configured. No report cards were sent.')).toBeInTheDocument();
    expect(screen.queryByText('examinations.reportCardsSentViaEmail')).not.toBeInTheDocument();
  });
});
