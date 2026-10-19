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
