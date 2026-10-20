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
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
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
    fireEvent.click(await screen.findByRole('button', { name: 'academic.addSubject' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByRole('textbox', { name: 'academic.subjectCode' })).toBeRequired();
    expect(within(dialog).getByRole('textbox', { name: 'academic.subjectNameEnglish' })).toBeRequired();
    expect(within(dialog).getByRole('textbox', { name: 'academic.subjectNameNepali' })).toBeRequired();
    expect(within(dialog).getByRole('combobox', { name: 'academic.subjectType' })).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('button', { name: 'common.save' }));

    expect(await within(dialog).findByRole('alert')).toHaveTextContent('academic.fillRequiredSubjectFields');
    expect(apiClient.post).not.toHaveBeenCalled();

    fireEvent.click(within(dialog).getByRole('button', { name: 'common.cancel' }));
    await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
  });
});
