import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import apiClient from '../../services/apiClient';
import { EventManagement } from './EventManagement';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { language: 'en' } }),
}));

jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

describe('EventManagement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (apiClient.get as jest.Mock).mockResolvedValue({
      data: { data: [], pagination: { total: 0 } },
    });
  });

  it('blocks an empty event submission and shows field-level required errors', async () => {
    render(<EventManagement />);

    await waitFor(() => expect(apiClient.get).toHaveBeenCalled());
    fireEvent.click(screen.getByRole('button', { name: 'calendar.addEvent' }));
    fireEvent.click(screen.getByRole('button', { name: 'common.save' }));

    expect(await screen.findByRole('alert')).toHaveTextContent('calendar.fillRequiredFields');
    expect(screen.getAllByText('validation.required')).toHaveLength(2);
    expect(apiClient.post).not.toHaveBeenCalled();
  });

  it('gives the event list filter controls accessible names', async () => {
    render(<EventManagement />);

    await waitFor(() => expect(apiClient.get).toHaveBeenCalled());
    expect(screen.getByRole('combobox', { name: 'calendar.category' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'calendar.status' })).toBeInTheDocument();
  });
});
