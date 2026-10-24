import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';
import apiClient from '../../services/apiClient';
import { Calendar } from './Calendar';

jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (_key: string, fallback?: string) => fallback || _key, i18n: { language: 'en' } }),
}));

jest.mock('../../components/YearSelectableDatePicker/YearSelectableDatePicker', () => ({
  parseDateOnly: (value: string) => value ? new Date(`${value}T00:00:00`) : null,
  formatDateOnly: (value: Date | null) => value
    ? `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}`
    : '',
  YearSelectableDatePicker: ({ label, value, onChange, required }: {
    label: string;
    value: Date | null;
    onChange: (value: Date | null) => void;
    required?: boolean;
  }) => (
    <input
      aria-label={label}
      type="date"
      required={required}
      value={value ? `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, '0')}-${String(value.getDate()).padStart(2, '0')}` : ''}
      onChange={(event) => onChange(event.target.value ? new Date(`${event.target.value}T00:00:00`) : null)}
    />
  ),
}));

const eventRecord = {
  eventId: 42,
  title: 'Sports Day',
  description: 'Annual school sports',
  startDate: '2026-10-15T00:00:00.000Z',
  endDate: '2026-10-16T00:00:00.000Z',
  category: 'sports',
  targetAudience: 'students',
  venue: 'Main field',
  isHoliday: false,
  status: 'scheduled',
};

const renderPage = () => render(
  <ThemeProvider theme={createTheme()}>
    <Calendar />
  </ThemeProvider>,
);

describe('Academic Calendar', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(window, 'confirm').mockReturnValue(true);
    jest.mocked(apiClient.get).mockResolvedValue({ data: { data: [eventRecord] } } as Awaited<ReturnType<typeof apiClient.get>>);
    jest.mocked(apiClient.post).mockResolvedValue({ data: { success: true } } as Awaited<ReturnType<typeof apiClient.post>>);
    jest.mocked(apiClient.put).mockResolvedValue({ data: { success: true } } as Awaited<ReturnType<typeof apiClient.put>>);
    jest.mocked(apiClient.delete).mockResolvedValue({ data: { success: true } } as Awaited<ReturnType<typeof apiClient.delete>>);
  });

  afterEach(() => jest.restoreAllMocks());

  it('loads events and refetches the selected calendar year', async () => {
    renderPage();
    expect(await screen.findByText('Sports Day')).toBeInTheDocument();
    const yearSelect = screen.getByRole('combobox', { name: 'Year' });
    fireEvent.mouseDown(yearSelect);
    fireEvent.click(await screen.findByRole('option', { name: '1980' }));

    await waitFor(() => expect(apiClient.get).toHaveBeenCalledTimes(2));
    expect(screen.getByRole('heading', { name: `${new Date().toLocaleString('en-US', { month: 'long' })} 1980` })).toBeInTheDocument();
    expect(apiClient.get).toHaveBeenLastCalledWith(expect.stringContaining('startDate=1980-'));
  });

  it('validates required title and start date, then creates an event with the entered values', async () => {
    renderPage();
    fireEvent.click(screen.getByRole('button', { name: 'Add Event' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent('Please fill all required fields');
    expect(apiClient.post).not.toHaveBeenCalled();

    fireEvent.change(within(dialog).getByRole('textbox', { name: 'Event Title' }), { target: { value: 'Founders Day' } });
    fireEvent.change(within(dialog).getByLabelText('Start Date'), { target: { value: '2026-11-02' } });
    fireEvent.change(within(dialog).getByLabelText('End Date'), { target: { value: '2026-11-02' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(apiClient.post).toHaveBeenCalledWith('/calendar/events', expect.objectContaining({
      title: 'Founders Day',
      startDate: '2026-11-02',
      endDate: '2026-11-02',
    })));
  });

  it('updates and deletes an existing event after confirmation', async () => {
    renderPage();
    const event = await screen.findByText('Sports Day');
    const row = event.closest('li');
    expect(row).not.toBeNull();
    fireEvent.click(within(row as HTMLElement).getByRole('button', { name: 'Edit event' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByRole('textbox', { name: 'Event Title' }), { target: { value: 'Science Fair' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(apiClient.put).toHaveBeenCalledWith('/calendar/events/42', expect.objectContaining({ title: 'Science Fair' })));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());

    fireEvent.click((await screen.findAllByRole('button', { name: 'Delete event' }))[0]);
    await waitFor(() => expect(apiClient.delete).toHaveBeenCalledWith('/calendar/events/42'));
    expect(window.confirm).toHaveBeenCalled();
  });
});
