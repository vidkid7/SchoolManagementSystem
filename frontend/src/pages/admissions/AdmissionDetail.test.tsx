import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import api from '../../config/api';
import { useSlugNavigate } from '../../hooks/useSlugNavigate';
import { AdmissionDetail } from './AdmissionDetail';

jest.mock('../../config/api', () => ({ __esModule: true, default: { get: jest.fn(), post: jest.fn() } }));
jest.mock('../../hooks/useSlugNavigate', () => ({ useSlugNavigate: jest.fn() }));
const mockTranslate = jest.fn((key: string) => key);
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: mockTranslate }) }));
jest.mock('../../components/YearSelectableDatePicker/YearSelectableDatePicker', () => ({
  YearSelectableDateTimeField: ({ label, value, onChange }: {
    label: string;
    value: string;
    onChange: (event: { target: { value: string } }) => void;
  }) => (
    <input aria-label={label} type="datetime-local" value={value} onChange={(event) => onChange({ target: { value: event.target.value } })} />
  ),
}));

const navigateMock = jest.fn();
const admission = {
  admissionId: 501,
  temporaryId: 'ADM-501',
  firstNameEn: 'Nima',
  lastNameEn: 'Rai',
  applyingForClass: 6,
  status: 'inquiry',
  inquiryDate: '2026-10-20T00:00:00.000Z',
  phone: '9800000101',
};

const renderPage = (entry = '/admissions/501') => render(
  <ThemeProvider theme={createTheme()}>
    <MemoryRouter initialEntries={[entry]}>
      <Routes>
        <Route path="/admissions/:id" element={<AdmissionDetail />} />
      </Routes>
    </MemoryRouter>
  </ThemeProvider>,
);

describe('AdmissionDetail', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useSlugNavigate).mockReturnValue(navigateMock);
    jest.mocked(api.get).mockResolvedValue({ data: { data: admission } } as Awaited<ReturnType<typeof api.get>>);
    jest.mocked(api.post).mockResolvedValue({ data: { success: true } } as Awaited<ReturnType<typeof api.post>>);
  });

  it('loads the detail and opens/executes the inquiry conversion from the route action', async () => {
    renderPage('/admissions/501?action=convert');
    expect(await screen.findByText('ADM-501')).toBeInTheDocument();
    expect(screen.getByText(/Nima\s+Rai/)).toBeInTheDocument();
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText('admissions.confirmConvert')).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: 'admissions.convert' }));

    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/admissions/501/apply'));
    expect(await screen.findByRole('alert')).toHaveTextContent('admissions.convertedSuccessfully');
  });

  it('requires a test date before scheduling and sends the selected date', async () => {
    jest.mocked(api.get).mockResolvedValue({
      data: { data: { ...admission, status: 'applied' } },
    } as Awaited<ReturnType<typeof api.get>>);
    renderPage('/admissions/501?action=schedule-test');
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'admissions.schedule' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('admissions.testDateRequired');
    expect(api.post).not.toHaveBeenCalled();

    fireEvent.change(within(dialog).getByLabelText('admissions.testDateAndTime'), { target: { value: '2026-11-10T09:30' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'admissions.schedule' }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/admissions/501/schedule-test', { testDate: '2026-11-10T09:30' }));
  });

  it('rejects an out-of-range test score and submits a valid score/max-score pair', async () => {
    jest.mocked(api.get).mockResolvedValue({
      data: { data: { ...admission, status: 'test_scheduled' } },
    } as Awaited<ReturnType<typeof api.get>>);
    renderPage('/admissions/501?action=record-test');
    const dialog = await screen.findByRole('dialog');
    fireEvent.change(within(dialog).getByRole('spinbutton', { name: 'admissions.testScore' }), { target: { value: '101' } });
    fireEvent.change(within(dialog).getByRole('spinbutton', { name: 'admissions.testMaxScore' }), { target: { value: '100' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'admissions.record' }));
    expect(await screen.findByRole('alert')).toHaveTextContent('admissions.testScoreRangeInvalid');
    expect(api.post).not.toHaveBeenCalled();

    fireEvent.change(within(dialog).getByRole('spinbutton', { name: 'admissions.testScore' }), { target: { value: '88' } });
    fireEvent.click(within(dialog).getByRole('button', { name: 'admissions.record' }));
    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/admissions/501/record-test-score', {
      score: 88,
      maxScore: 100,
      remarks: '',
    }));
  });
});
