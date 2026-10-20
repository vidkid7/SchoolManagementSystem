import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Calendar as AcademicCalendar } from '../academic/Calendar';
import { EventManagement } from './EventManagement';
import apiClient from '../../services/apiClient';

jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn() },
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, fallback?: string) => fallback ?? key,
    i18n: { language: 'en' },
  }),
}));

const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('calendar event dialog focus restoration', () => {
  beforeEach(() => {
    mockedApiClient.get.mockImplementation((path) => {
      if (String(path).includes('/range?')) {
        return Promise.resolve({ data: [] });
      }
      return Promise.resolve({ data: { data: [], pagination: { total: 0 } } });
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('restores focus to the Academic Calendar opener after the dialog exits', async () => {
    render(<AcademicCalendar />);
    await screen.findByText('No events found for this month');
    const trigger = screen.getByRole('button', { name: 'Add Event' });

    fireEvent.click(trigger);
    fireEvent.click(await screen.findByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(trigger).toHaveFocus());
  });

  it('restores focus to the Event Management opener after the dialog exits', async () => {
    render(<EventManagement />);
    await screen.findByText('calendar.noEventsFound');
    const trigger = screen.getByRole('button', { name: 'calendar.addEvent' });

    fireEvent.click(trigger);
    fireEvent.click(await screen.findByRole('button', { name: 'common.cancel' }));

    await waitFor(() => expect(trigger).toHaveFocus());
  });
});
