import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import apiClient from '../../services/apiClient';
import { ExaminationDashboard } from './ExaminationDashboard';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('../../hooks/useSlugNavigate', () => ({
  useSlugNavigate: () => jest.fn(),
}));

jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn().mockResolvedValue({ data: { data: [] } }) },
}));

describe('ExaminationDashboard accessibility', () => {
  it('keeps dashboard section headings in order after the stat headings', async () => {
    render(
      <ThemeProvider theme={createTheme()}>
        <ExaminationDashboard />
      </ThemeProvider>,
    );

    await screen.findByRole('heading', { name: 'examinations.examinationManagementDashboard' });
    await waitFor(() => expect(apiClient.get).toHaveBeenCalledWith('/examinations'));

    expect(screen.getByRole('heading', { name: 'examinations.pendingActions' }).tagName).toBe('H5');
    expect(screen.getByRole('heading', { name: 'examinations.quickActions' }).tagName).toBe('H5');
  });
});
