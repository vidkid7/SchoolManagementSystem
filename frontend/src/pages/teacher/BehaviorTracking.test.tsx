import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import apiClient from '../../services/apiClient';
import { BehaviorTracking } from './BehaviorTracking';

jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));
jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn() },
}));

const record = {
  id: 9,
  studentId: 123,
  studentName: 'Asha Rai',
  type: 'positive' as const,
  category: 'achievement',
  description: 'Helped classmates during group work',
  actionTaken: 'Recognized in class',
  date: '2026-10-20',
  recordedBy: 'Teacher One',
};

const renderPage = () => render(
  <ThemeProvider theme={createTheme()}><BehaviorTracking /></ThemeProvider>,
);

describe('BehaviorTracking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(apiClient.get).mockImplementation(async (url) => {
      if (url === '/teachers/behavior-records') return { data: { data: [record] } } as never;
      return { data: { data: { students: [{ studentId: 123, firstNameEn: 'Asha', lastNameEn: 'Rai', rollNumber: '8' }] } } } as never;
    });
    jest.mocked(apiClient.post).mockResolvedValue({ data: { data: {} } } as never);
  });

  it('opens an accessible details view for a behavior record', async () => {
    renderPage();
    await screen.findByText('Helped classmates during group work');

    fireEvent.click(screen.getByRole('button', { name: 'common.details' }));

    const dialog = await screen.findByRole('dialog', { name: 'teacher.behaviorDetails' });
    expect(within(dialog).getByText('Asha Rai')).toBeInTheDocument();
    expect(within(dialog).getByText('Recognized in class')).toBeInTheDocument();
    expect(within(dialog).getByText('Teacher One')).toBeInTheDocument();
  });

  it('shows a visible error if the initial behavior requests fail', async () => {
    jest.mocked(apiClient.get).mockRejectedValue(new Error('offline'));
    renderPage();

    expect(await screen.findByRole('alert')).toHaveTextContent('portal.failedToLoadData');
  });

  it('submits a behavior record with the selected student and required fields', async () => {
    const user = userEvent.setup();
    renderPage();
    await screen.findByText('Helped classmates during group work');
    await user.click(screen.getByRole('button', { name: 'teacher.recordBehavior' }));

    const studentInput = screen.getByRole('combobox', { name: 'portal.student' });
    await user.type(studentInput, 'Asha');
    await user.click(await screen.findByRole('option', { name: '8 - Asha Rai' }));
    await user.click(screen.getByRole('combobox', { name: 'portal.categoryLabel' }));
    await user.click(screen.getByRole('option', { name: 'portal.discipline' }));
    await user.type(screen.getByRole('textbox', { name: 'common.description' }), 'Shared supplies with class');
    await user.click(screen.getByRole('button', { name: 'teacher.recordBehavior' }));

    await waitFor(() => expect(apiClient.post).toHaveBeenCalledWith('/teachers/behavior-records', expect.objectContaining({
      studentId: 123,
      type: 'neutral',
      category: 'discipline',
      description: 'Shared supplies with class',
    })));
  });
});
