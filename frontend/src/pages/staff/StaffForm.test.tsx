import { act, fireEvent, render, screen, within, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { StaffForm } from './StaffForm';

jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn() },
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

describe('StaffForm', () => {
  it('offers year selection for BS date of birth and joining dates', async () => {
    const cases = [/staff\.form\.dateOfBirth/, /staff\.form\.joiningDate/];
    for (const label of cases) {
      const view = render(
        <ThemeProvider theme={createTheme()}>
          <MemoryRouter initialEntries={['/KMC/staff/create']}>
            <Routes>
              <Route path="/:municipalitySlug/staff/create" element={<StaffForm />} />
            </Routes>
          </MemoryRouter>
        </ThemeProvider>,
      );

      fireEvent.click(screen.getByRole('textbox', { name: label }));
      const yearSelect = await screen.findByRole('combobox', { name: 'Select year' });
      fireEvent.mouseDown(yearSelect);
      fireEvent.click(await screen.findByRole('option', { name: '2082' }));
      expect(yearSelect).toHaveTextContent('2082');
      view.unmount();
    }
  }, 15000);

  it('shows the required message beside the position selector on empty submit', async () => {
    render(
      <ThemeProvider theme={createTheme()}>
        <MemoryRouter initialEntries={['/KMC/staff/create']}>
          <Routes>
            <Route path="/:municipalitySlug/staff/create" element={<StaffForm />} />
          </Routes>
        </MemoryRouter>
      </ThemeProvider>,
    );

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'staff.form.save' }));
    });

    const positionLabel = screen.getAllByText('staff.position *')[0];
    const positionControl = positionLabel.closest('.MuiFormControl-root');
    expect(positionControl).not.toBeNull();
    await waitFor(() => {
      expect(within(positionControl as HTMLElement).getByText('staff.form.required')).toBeInTheDocument();
    });
  });
});
