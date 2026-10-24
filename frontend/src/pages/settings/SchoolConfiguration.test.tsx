import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import apiClient from '../../services/apiClient';
import { SchoolConfiguration } from './SchoolConfiguration';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

const mockedApi = jest.mocked(apiClient);

const initialConfig = {
  id: 'school-1',
  schoolNameEn: 'Sample School',
  schoolNameNp: 'नमुना विद्यालय',
  schoolCode: 'SAMPLE-1',
  email: 'office@sample.example',
  phone: '0123456789',
  addressEn: 'Old Street',
  addressNp: 'पुरानो मार्ग',
  city: 'Kathmandu',
  district: 'Kathmandu',
  province: 'Bagmati Pradesh',
  establishedYear: 2000,
  affiliationNumber: 'AFF-1',
  principalName: 'Sample Principal',
  principalNameNp: 'नमुना प्रधानाध्यापक',
  primaryColor: '#123456',
  secondaryColor: '#234567',
  accentColor: '#345678',
  defaultLanguage: 'english',
  dateFormat: 'YYYY-MM-DD',
  academicYearStartMonth: 7,
  isActive: true,
};

const renderPage = () => render(
  <ThemeProvider theme={createTheme()}>
    <SchoolConfiguration />
  </ThemeProvider>,
);

describe('SchoolConfiguration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedApi.get.mockResolvedValue({ data: { data: initialConfig } } as never);
    mockedApi.put.mockImplementation(async (_url: string, data: unknown) => ({
      data: { data: { ...initialConfig, ...(data as object) } },
    } as never));
  });

  it('loads the current configuration and exposes the profile values', async () => {
    renderPage();

    expect(await screen.findByDisplayValue('Sample School')).toBeInTheDocument();
    expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/config/school');
    expect(screen.getAllByDisplayValue('Kathmandu')).toHaveLength(2);
  });

  it('persists profile, branding, language, and academic-year fields using API contract names', async () => {
    renderPage();
    await screen.findByDisplayValue('Sample School');
    fireEvent.click(screen.getByRole('button', { name: 'common.edit' }));

    fireEvent.change(screen.getByLabelText('settings.city'), { target: { value: 'Pokhara' } });
    fireEvent.click(screen.getByRole('tab', { name: 'settings.branding' }));
    fireEvent.change(screen.getByLabelText('settings.primaryColor'), { target: { value: '#abcdef' } });
    fireEvent.click(screen.getByRole('tab', { name: 'settings.localization' }));

    const languageSelect = screen.getAllByRole('combobox')[0];
    fireEvent.mouseDown(languageSelect);
    fireEvent.click(await screen.findByRole('option', { name: 'नेपाली (Nepali)' }));
    fireEvent.click(screen.getByRole('button', { name: 'common.save' }));

    await waitFor(() => expect(mockedApi.put).toHaveBeenCalledWith('/api/v1/config/school/school-1', expect.any(Object)));
    expect(mockedApi.put.mock.calls[0][1]).toEqual(expect.objectContaining({
      city: 'Pokhara',
      primaryColor: '#abcdef',
      defaultLanguage: 'nepali',
      academicYearStartMonth: 7,
    }));
    expect(screen.getByText('settings.configUpdated')).toBeInTheDocument();
  });

  it('requires visibly required fields before creating a configuration', async () => {
    mockedApi.get.mockResolvedValueOnce({ data: { data: null } } as never);
    jest.spyOn(console, 'error').mockImplementation(() => undefined);
    renderPage();
    fireEvent.click(await screen.findByRole('button', { name: 'settings.createConfig' }));

    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'settings.createConfig' }));

    expect(mockedApi.post).not.toHaveBeenCalled();
    expect(within(dialog).getAllByRole('textbox')[0]).toBeRequired();
  });
});
