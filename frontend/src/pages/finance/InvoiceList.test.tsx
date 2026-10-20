import { render, screen, waitFor } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import { InvoiceList } from './InvoiceList';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('../../hooks/useSlugNavigate', () => ({ useSlugNavigate: () => jest.fn() }));

jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn().mockResolvedValue({ data: { data: [], total: 0 } }), post: jest.fn() },
}));

describe('InvoiceList accessibility', () => {
  it('gives the payment status filter an accessible name', async () => {
    render(
      <ThemeProvider theme={createTheme()}>
        <InvoiceList />
      </ThemeProvider>,
    );

    await waitFor(() => {
      expect(screen.getByRole('combobox', { name: 'finance.paymentStatus' })).toBeInTheDocument();
    });
  });
});
