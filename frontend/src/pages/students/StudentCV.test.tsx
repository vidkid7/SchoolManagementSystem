import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ElementType } from 'react';
import { StudentCV } from './StudentCV';
import { apiClient } from '../../services/apiClient';

jest.mock('react-router-dom', () => ({ useParams: () => ({ id: '570001' }) }));
jest.mock('../../hooks/useSlugNavigate', () => ({ useSlugNavigate: () => jest.fn() }));
jest.mock('react-redux', () => ({ useSelector: () => ({ auth: { accessToken: 'test-token' } }) }));
jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => ({ 'common.back': 'Back' }[key] ?? key) }),
}));
jest.mock('framer-motion', () => {
  const React = jest.requireActual<typeof import('react')>('react');
  const motionOnlyProps = new Set(['initial', 'animate', 'exit', 'whileHover', 'whileTap', 'transition', 'variants']);
  return {
    motion: {
      create: (Component: ElementType) => (props: Record<string, unknown>) => {
        const forwardedProps = Object.fromEntries(
          Object.entries(props).filter(([key]) => !motionOnlyProps.has(key))
        );
        return React.createElement(Component, forwardedProps);
      },
    },
  };
});
jest.mock('../../services/apiClient', () => ({
  apiClient: { get: jest.fn(), put: jest.fn(), post: jest.fn(), defaults: { baseURL: 'https://api.example.test' } },
}));

const mockedApi = apiClient as jest.Mocked<typeof apiClient>;
const cvData = {
  studentId: 570001,
  generatedAt: new Date('2026-10-21T00:00:00Z'),
  verificationUrl: 'https://example.test/verify/570001',
  personalInfo: {
    studentId: 570001,
    studentCode: 'SCH001-2026-0232',
    fullNameEn: 'QA Browser Student',
    dateOfBirthBS: '2069-07-03',
    dateOfBirthAD: new Date('2012-01-01'),
    gender: 'female',
    addressEn: 'QA test address',
    addressNp: '',
  },
  attendance: {
    overallPercentage: 0,
    totalDays: 0,
    presentDays: 0,
    absentDays: 0,
    lateDays: 0,
    excusedDays: 0,
    yearWise: [],
  },
  customFields: { skills: [], hobbies: [], careerGoals: '', personalStatement: '' },
};
const customization = {
  studentId: 570001,
  showPersonalInfo: true,
  showAcademicPerformance: true,
  showAttendance: true,
  showECA: true,
  showSports: true,
  showCertificates: true,
  showAwards: false,
  showTeacherRemarks: false,
  skills: [],
  hobbies: [],
  careerGoals: '',
  personalStatement: '',
  templateId: 'standard',
  schoolBrandingEnabled: true,
};

describe('StudentCV', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedApi.get.mockImplementation((url) => {
      if (url.endsWith('/data')) return Promise.resolve({ data: { data: cvData } });
      if (url.endsWith('/needs-regeneration')) return Promise.resolve({ data: { data: { needsRegeneration: false } } });
      return Promise.resolve({ data: { data: { ...customization } } });
    });
    mockedApi.put.mockResolvedValue({ data: { success: true } });
  });

  it('labels the loading progress indicator while CV data is pending', async () => {
    let resolveData!: (value: { data: { data: typeof cvData } }) => void;
    mockedApi.get.mockImplementation((url) => {
      if (url.endsWith('/data')) return new Promise((resolve) => { resolveData = resolve; });
      if (url.endsWith('/needs-regeneration')) return Promise.resolve({ data: { data: { needsRegeneration: false } } });
      return Promise.resolve({ data: { data: { ...customization } } });
    });

    render(<StudentCV />);
    expect(screen.getByRole('progressbar', { name: 'Loading...' })).toBeInTheDocument();

    await waitFor(() => expect(resolveData).toBeDefined());
    resolveData({ data: { data: cvData } });
    expect(await screen.findByRole('heading', { name: 'Student CV', level: 1 })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });

  it('supports preview/edit mode and exposes labeled customization controls without saving', async () => {
    const user = userEvent.setup();
    render(<StudentCV />);

    expect(await screen.findByRole('button', { name: 'Back Student' })).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: 'Preview Mode' }));
    expect(screen.getByRole('button', { name: 'Edit Mode' })).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'Preview' }));
    await user.keyboard('{ArrowRight}');
    expect(document.activeElement).toBe(screen.getByRole('tab', { name: 'Customization' }));
    await user.keyboard('{Enter}');
    expect(screen.getByRole('tab', { name: 'Customization' })).toHaveAttribute('aria-selected', 'true');

    expect(screen.getByRole('combobox', { name: 'Template' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Career Goals' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Personal Statement' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Skill' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Hobby' })).toBeInTheDocument();
    expect(mockedApi.put).not.toHaveBeenCalled();
  });

  it('hides CV preview sections disabled by the saved customization', async () => {
    const user = userEvent.setup();
    mockedApi.get.mockImplementation((url) => {
      if (url.endsWith('/data')) return Promise.resolve({ data: { data: cvData } });
      if (url.endsWith('/needs-regeneration')) return Promise.resolve({ data: { data: { needsRegeneration: false } } });
      return Promise.resolve({ data: { data: { ...customization, showPersonalInfo: false, showAttendance: false } } });
    });

    render(<StudentCV />);

    expect(await screen.findByRole('heading', { name: 'Student CV', level: 1 })).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'Customization' }));
    const personalInfoToggle = await screen.findByRole('checkbox', { name: 'Personal Information' });
    await waitFor(() => expect(personalInfoToggle).not.toBeChecked());
    await user.click(screen.getByRole('tab', { name: 'Preview' }));
    const preview = screen.getByRole('tabpanel');
    expect(within(preview).queryByRole('heading', { name: 'Personal Information' })).not.toBeInTheDocument();
    expect(within(preview).queryByRole('heading', { name: 'Attendance Record' })).not.toBeInTheDocument();
  });

  it('retries supported CV reads after an initial data error without posting to an unregistered endpoint', async () => {
    const user = userEvent.setup();
    let dataRequests = 0;
    mockedApi.get.mockImplementation((url) => {
      if (url.endsWith('/data')) {
        dataRequests += 1;
        if (dataRequests === 1) {
          return Promise.reject({ response: { status: 503, data: { message: 'Service unavailable' } } });
        }
        return Promise.resolve({ data: { data: cvData } });
      }
      if (url.endsWith('/needs-regeneration')) {
        return Promise.resolve({ data: { data: { needsRegeneration: false } } });
      }
      return Promise.resolve({ data: { data: { ...customization } } });
    });

    render(<StudentCV />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Service unavailable');
    await user.click(screen.getByRole('button', { name: 'Retry' }));

    expect(await screen.findByRole('heading', { name: 'Student CV', level: 1 })).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(dataRequests).toBe(2);
    expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/cv/570001');
    expect(mockedApi.get).toHaveBeenCalledWith('/api/v1/cv/570001/needs-regeneration');
    expect(mockedApi.post).not.toHaveBeenCalled();
  });

  it('reverts a customization toggle when the server rejects the save', async () => {
    const user = userEvent.setup();
    mockedApi.put.mockRejectedValueOnce({ response: { data: { message: 'Save rejected' } } });
    render(<StudentCV />);

    await user.click(await screen.findByRole('tab', { name: 'Customization' }));
    const personalInfoToggle = await screen.findByRole('checkbox', { name: 'Personal Information' });
    expect(personalInfoToggle).toBeChecked();

    await user.click(personalInfoToggle);

    expect(await screen.findByRole('alert')).toHaveTextContent('Save rejected');
    await waitFor(() => expect(personalInfoToggle).toBeChecked());
  });
});
