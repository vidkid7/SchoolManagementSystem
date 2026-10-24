import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import apiClient from '../../services/apiClient';
import ParentPortal from './ParentPortal';

const mockT = (key: string) => key;
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: mockT }) }));
jest.mock('../../hooks/useSlugNavigate', () => ({ useSlugNavigate: () => jest.fn() }));
jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

const renderParentPortal = () => render(
  <ThemeProvider theme={createTheme()}>
    <ParentPortal />
  </ThemeProvider>,
);

describe('ParentPortal child data selection', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(apiClient.get).mockImplementation((url) => {
      const childMatch = url.match(/\/children\/(\d+)\/summary/);
      let data: unknown = [];
      if (url === '/api/v1/parents/children') {
        data = [
          { studentId: 41, name: 'Asha QA', class: '7', section: 'A', rollNo: 3 },
          { studentId: 42, name: 'Bikash QA', class: '8', section: 'B', rollNo: 5 },
        ];
      } else if (childMatch) {
        data = {
          attendance: { present: Number(childMatch[1]) === 42 ? 8 : 20, total: 20, percentage: Number(childMatch[1]) === 42 ? 40 : 100 },
          fees: { invoices: [], totalPaid: 1000, totalPending: Number(childMatch[1]) === 42 ? 500 : 0 },
          grades: [], notifications: [], library: [],
        };
      } else if (url === '/api/v1/parents/children/42/assignments') {
        data = [{ id: 1, title: 'Bikash assignment', status: 'pending', dueDate: '2026-10-30' }];
      } else if (url === '/api/v1/parents/children/41/assignments') {
        data = [{ id: 2, title: 'Asha assignment', status: 'pending', dueDate: '2026-10-30' }];
      } else if (url === '/api/v1/parents/children/42/activities') {
        data = { eca: [], sports: [] };
      } else if (url.endsWith('/activities')) {
        data = { eca: [], sports: [] };
      } else if (url.startsWith('/api/v1/parents/children/')) {
        data = [];
      }
      return Promise.resolve({ data: { data } } as never);
    });
  });

  it('loads a child summary and switches all child-scoped requests when selection changes', async () => {
    const user = userEvent.setup();
    renderParentPortal();

    expect(await screen.findByText('Asha QA')).toBeInTheDocument();
    expect(await screen.findByText('common.currency 0')).toBeInTheDocument();

    await user.click(screen.getByRole('combobox', { name: 'portal.selectChild' }));
    const secondChildOption = await screen.findByRole('option', { name: /Bikash QA/ });
    await user.click(secondChildOption);

    expect(await screen.findByText('Bikash QA')).toBeInTheDocument();
    expect(await screen.findByText('common.currency 500')).toBeInTheDocument();
    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/parents/children/42/summary');
    expect(apiClient.get).toHaveBeenCalledWith('/api/v1/parents/children/42/assignments');

    await user.click(screen.getByRole('tab', { name: 'portal.assignments' }));
    const assignmentsPanel = screen.getByRole('tabpanel');
    expect(within(assignmentsPanel).getByText('Bikash assignment')).toBeInTheDocument();
  });
});
