import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import apiClient from '../../services/apiClient';
import AccountantPortal from './AccountantPortal';

const mockT = (key: string) => key;

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: mockT }) }));
jest.mock('react-redux', () => ({
  useSelector: (selector: (state: unknown) => unknown) => selector({
    auth: { user: { username: 'accountant.qa', firstName: 'QA' }, accessToken: 'accountant-token' },
  }),
}));
jest.mock('react-router-dom', () => ({ useParams: () => ({ municipalitySlug: 'qa-school' }) }));
jest.mock('../../hooks/useSlugNavigate', () => ({ useSlugNavigate: () => jest.fn() }));
jest.mock('../../hooks/useCurrentAcademicYear', () => ({
  useCurrentAcademicYear: () => ({
    currentYear: { academicYearId: 44, name: '2083-2084' },
    academicYears: [{ academicYearId: 44, name: '2083-2084' }],
    loading: false,
    error: null,
    label: 'AY 2083/84',
  }),
}));
jest.mock('../../components/YearSelectableDatePicker/YearSelectableDatePicker', () => ({
  YearSelectableDateField: ({ label, value, onChange }: { label: string; value: string; onChange: (event: { target: { value: string } }) => void }) => (
    <input aria-label={label} value={value ?? ''} onChange={onChange} />
  ),
}));
jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn() },
}));

const renderAccountantPortal = () => render(
  <ThemeProvider theme={createTheme()}>
    <AccountantPortal />
  </ThemeProvider>,
);

describe('AccountantPortal finance forms', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(apiClient.get).mockImplementation((url) => {
      const data = url.endsWith('/statistics')
        ? {}
        : url.endsWith('/fee-structures')
          ? [{ feeStructureId: 42, name: 'Tuition 2083', totalAmount: 2500, isActive: true }]
          : [];
      return Promise.resolve({ data: { data } } as never);
    });
    jest.mocked(apiClient.post).mockResolvedValue({ data: { success: true } } as never);
  });

  it('creates an invoice with the fee structure and academic year required by backend validation', async () => {
    const user = userEvent.setup();
    renderAccountantPortal();
    await screen.findByRole('heading', { name: 'finance.portal' });
    await user.click(screen.getByRole('tab', { name: 'finance.invoices' }));
    await waitFor(() => expect(apiClient.get).toHaveBeenCalledWith('/api/v1/finance/fee-structures', {
      headers: { Authorization: 'Bearer accountant-token' },
    }));
    await user.click(screen.getByRole('button', { name: 'finance.generateInvoice' }));
    await user.type(screen.getByRole('spinbutton', { name: 'finance.studentId *' }), '91');
    await user.click(screen.getByRole('combobox', { name: 'finance.feeStructureId' }));
    await user.click(await screen.findByRole('option', { name: 'Tuition 2083' }));
    fireEvent.change(screen.getByRole('textbox', { name: 'finance.dueDate *' }), { target: { value: '2026-10-25' } });
    await user.click(screen.getByRole('button', { name: 'finance.generate' }));

    await waitFor(() => expect(apiClient.post).toHaveBeenCalledWith('/api/v1/finance/invoices', expect.objectContaining({
      studentId: 91,
      feeStructureId: 42,
      academicYearId: 44,
      dueDate: '2026-10-25',
    }), { headers: { Authorization: 'Bearer accountant-token' } }));
  });

  it('rejects invalid payment values locally and sends all backend-required fields for a valid payment', async () => {
    const user = userEvent.setup();
    renderAccountantPortal();
    await screen.findByRole('heading', { name: 'finance.portal' });
    await user.click(screen.getByRole('tab', { name: 'finance.payments' }));
    await user.click(screen.getByRole('button', { name: 'finance.recordPayment' }));

    await user.type(screen.getByRole('spinbutton', { name: 'finance.invoiceId *' }), '23');
    await user.type(screen.getByRole('spinbutton', { name: 'finance.studentId *' }), '91');
    await user.type(screen.getByRole('spinbutton', { name: 'finance.amountRs *' }), '-5');
    await user.click(screen.getByRole('button', { name: 'finance.recordPayment' }));
    expect(await screen.findByText('finance.paymentRequiredFields')).toBeInTheDocument();
    expect(apiClient.post).not.toHaveBeenCalledWith('/api/v1/finance/payments', expect.anything(), expect.anything());

    await user.clear(screen.getByRole('spinbutton', { name: 'finance.amountRs *' }));
    await user.type(screen.getByRole('spinbutton', { name: 'finance.amountRs *' }), '250');
    await user.click(screen.getByRole('button', { name: 'finance.recordPayment' }));

    await waitFor(() => expect(apiClient.post).toHaveBeenCalledWith('/api/v1/finance/payments', expect.objectContaining({
      invoiceId: 23,
      studentId: 91,
      amount: 250,
      paymentMethod: 'cash',
      paymentDate: expect.stringMatching(/^\d{4}-\d{2}-\d{2}$/),
    }), { headers: { Authorization: 'Bearer accountant-token' } }));
  });

  it('sends fee structure fields required by backend validation and rejects an empty component', async () => {
    const user = userEvent.setup();
    renderAccountantPortal();
    await screen.findByRole('heading', { name: 'finance.portal' });
    await user.click(screen.getByRole('tab', { name: 'finance.feeStructures' }));
    await user.click(screen.getByRole('button', { name: 'finance.newStructure' }));

    const nameField = screen.getByRole('textbox', { name: 'finance.name *' });
    await user.type(nameField, 'Tuition 2083');
    await user.click(screen.getByRole('button', { name: 'common.create' }));
    expect(await screen.findByText('finance.feeStructureRequiredFields')).toBeInTheDocument();
    expect(apiClient.post).not.toHaveBeenCalledWith('/api/v1/finance/fee-structures', expect.anything(), expect.anything());

    await user.type(screen.getByRole('textbox', { name: 'finance.componentName' }), 'Monthly tuition');
    await user.type(screen.getByRole('spinbutton', { name: 'finance.amountRs' }), '2500');
    await user.click(screen.getByRole('button', { name: 'common.create' }));

    await waitFor(() => expect(apiClient.post).toHaveBeenCalledWith('/api/v1/finance/fee-structures', expect.objectContaining({
      name: 'Tuition 2083',
      academicYearId: 44,
      applicableClasses: Array.from({ length: 12 }, (_, index) => index + 1),
      applicableShifts: ['morning', 'day', 'evening'],
      feeComponents: [{ name: 'Monthly tuition', type: 'monthly', amount: 2500, frequency: 'monthly', isMandatory: true }],
    }), { headers: { Authorization: 'Bearer accountant-token' } }));
  }, 30000);
});

