import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { ClassManagement } from './ClassManagement';

jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

jest.mock('../../hooks/useSlugNavigate', () => ({ useSlugNavigate: () => jest.fn() }));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string, fallback?: string) => fallback || key, i18n: { language: 'en' } }),
}));

describe('ClassManagement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiClient.get as jest.Mock).mockResolvedValue({ data: { data: [] } });
  });

  it('shows subject validation inside the dialog, labels its type selector, and clears the error on cancel', async () => {
    render(
      <ThemeProvider theme={createTheme()}>
        <MemoryRouter initialEntries={['/KMC/academic/classes']}>
          <Routes>
            <Route path='/:municipalitySlug/academic/classes' element={<ClassManagement />} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>,
    );

    fireEvent.click(screen.getAllByRole('tab')[1]);
    const addSubjectButton = await screen.findByRole('button', { name: 'academic.addSubject' });
    addSubjectButton.focus();
    const triggerBlurSpy = jest.spyOn(addSubjectButton, 'blur');
    fireEvent.click(addSubjectButton);
    const dialog = await screen.findByRole('dialog');
    expect(triggerBlurSpy).toHaveBeenCalledTimes(1);
    expect(within(dialog).getByRole('textbox', { name: 'academic.subjectCode' })).toBeRequired();
    expect(within(dialog).getByRole('textbox', { name: 'academic.subjectNameEnglish' })).toBeRequired();
    expect(within(dialog).getByRole('textbox', { name: 'academic.subjectNameNepali' })).toBeRequired();
    expect(within(dialog).getByRole('combobox', { name: 'academic.subjectType' })).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('button', { name: 'common.save' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent(
      'Enter a subject code, names in English and Nepali, credit hours, and full marks.',
    );
    expect(apiClient.post).not.toHaveBeenCalled();

    const cancelButton = within(dialog).getByRole('button', { name: 'common.cancel' });
    cancelButton.focus();
    const cancelBlurSpy = jest.spyOn(cancelButton, 'blur');
    fireEvent.click(cancelButton);
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
    expect(cancelBlurSpy).toHaveBeenCalledTimes(1);
    await waitFor(() => expect(addSubjectButton).toHaveFocus());
    triggerBlurSpy.mockRestore();
    cancelBlurSpy.mockRestore();
  });

  it('exposes the numeric limits described by class capacity and subject mark validation', async () => {
    render(
      <ThemeProvider theme={createTheme()}>
        <MemoryRouter initialEntries={['/KMC/academic/classes']}>
          <Routes>
            <Route path='/:municipalitySlug/academic/classes' element={<ClassManagement />} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>,
    );

    fireEvent.click(await screen.findByRole('button', { name: 'academic.addClass' }));
    const classDialog = await screen.findByRole('dialog');
    const capacity = within(classDialog).getByRole('spinbutton', { name: 'academic.capacity' });
    expect(capacity).toHaveAttribute('min', '1');
    expect(capacity).toHaveAttribute('max', '100');
    expect(capacity).toHaveAttribute('step', '1');
    fireEvent.click(within(classDialog).getByRole('button', { name: 'common.cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    fireEvent.click(screen.getAllByRole('tab')[1]);
    fireEvent.click(await screen.findByRole('button', { name: 'academic.addSubject' }));
    const subjectDialog = await screen.findByRole('dialog');
    for (const label of ['academic.creditHours', 'academic.fullMarks']) {
      const mark = within(subjectDialog).getByRole('spinbutton', { name: label });
      expect(mark).toHaveAttribute('min', '1');
      expect(mark).toHaveAttribute('step', '1');
    }
  });
});
