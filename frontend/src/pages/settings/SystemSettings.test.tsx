import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import apiClient from '../../services/apiClient';
import { SystemSettings } from './SystemSettings';

jest.mock('../../services/apiClient', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: { language: 'en' },
    t: (key: string) => ({
      'systemSettings.title': 'System Settings',
      'systemSettings.subtitle': 'Configure system-wide school settings',
      'systemSettings.gradingSchemes': 'Grading Schemes',
      'systemSettings.attendanceRules': 'Attendance Rules',
      'systemSettings.notificationTemplates': 'Notification Templates',
      'systemSettings.dateFormat': 'Date Format',
      'systemSettings.addGradingScheme': 'Add Grading Scheme',
      'systemSettings.addAttendanceRule': 'Add Attendance Rule',
      'systemSettings.notificationTemplates': 'Notification Templates',
      'systemSettings.addTemplate': 'Add Template',
      'systemSettings.templateName': 'Template Name',
      'systemSettings.templateNameRequired': 'Template name is required.',
      'systemSettings.templateNameTooLong': 'Template name must be 100 characters or fewer.',
      'systemSettings.templateCode': 'Template Code',
      'systemSettings.templateCodeRequired': 'Template code is required.',
      'systemSettings.templateCodeTooLong': 'Template code must be 50 characters or fewer.',
      'systemSettings.category': 'Category',
      'systemSettings.channel': 'Channel',
      'systemSettings.language': 'Language',
      'systemSettings.english': 'English',
      'systemSettings.nepali': 'Nepali',
      'systemSettings.templateSubject': 'Subject (optional)',
      'systemSettings.templateEnglish': 'English Template',
      'systemSettings.templateEnglishRequired': 'English template content is required.',
      'systemSettings.templateNepali': 'Nepali Template (optional)',
      'systemSettings.templateVariablesHint': 'Use {{variable}} for dynamic content.',
      'systemSettings.templateCategory.general': 'General',
      'systemSettings.templateChannel.in_app': 'In-app',
      'systemSettings.dateFormat': 'Date Format',
      'systemSettings.dateFormatSettings': 'Date Format Settings',
      'systemSettings.dateFormatLabel': 'Date Display Format',
      'systemSettings.timeFormat': 'Time Format',
      'systemSettings.numberFormat': 'Number Format',
      'systemSettings.currency': 'Currency Code',
      'systemSettings.noActiveSchoolConfiguration': 'There is no active school configuration. Activate School Configuration before changing these settings.',
      'systemSettings.ruleName': 'Rule Name',
      'systemSettings.ruleNameRequired': 'Rule name is required.',
      'systemSettings.ruleNameTooLong': 'Rule name must be 100 characters or fewer.',
      'systemSettings.schemeName': 'Scheme Name',
      'systemSettings.schemeNameRequired': 'Scheme name is required.',
      'systemSettings.schemeNameTooLong': 'Scheme name must be 100 characters or fewer.',
      'systemSettings.grades': 'Grades',
      'systemSettings.grade': 'Grade',
      'systemSettings.gradeRequired': 'Grade is required.',
      'systemSettings.minPercentage': 'Min Percentage',
      'systemSettings.maxPercentage': 'Max Percentage',
      'systemSettings.percentageRangeError': 'Enter a value from 0 to 100; minimum must not exceed maximum.',
      'systemSettings.gradePoint': 'Grade Point',
      'systemSettings.gradePointRangeError': 'Enter a grade point from 0 to 4.',
      'systemSettings.gradeDescription': 'Grade Description',
      'systemSettings.gradeDescriptionRequired': 'Grade description is required.',
      'systemSettings.isDefault': 'Is Default',
      'systemSettings.addGrade': 'Add Grade',
      'systemSettings.successMessage': 'Settings saved successfully',
      'common.save': 'Save',
      'common.cancel': 'Cancel',
      'common.delete': 'Delete',
      'staff.actions': 'Actions',
      'roles.active': 'Active',
      'roles.inactive': 'Inactive',
    }[key] ?? key),
  }),
}));

const mockedApi = apiClient as jest.Mocked<typeof apiClient>;

describe('SystemSettings grading scheme form', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedApi.get.mockImplementation((url) => Promise.resolve({
      data: { data: url.endsWith('/date-format') ? { dateFormat: 'YYYY-MM-DD', fiscalYearStart: 1 } : [] },
    } as never));
    mockedApi.post.mockResolvedValue({ data: { success: true } } as never);
  });

  it('shows required scheme name feedback and does not POST an invalid scheme', async () => {
    const user = userEvent.setup();
    render(<SystemSettings />);

    await user.click(await screen.findByRole('button', { name: 'Add Grading Scheme' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Scheme name is required.')).toBeInTheDocument();
    expect(mockedApi.post).not.toHaveBeenCalled();
  });

  it('posts grading fields using the API percentage and description schema', async () => {
    const user = userEvent.setup();
    render(<SystemSettings />);

    await user.click(await screen.findByRole('button', { name: 'Add Grading Scheme' }));
    await user.type(screen.getByRole('textbox', { name: 'Scheme Name' }), 'QA Grade Scale');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(mockedApi.post).toHaveBeenCalledWith(
      '/api/v1/system-settings/grading-schemes',
      expect.objectContaining({
        name: 'QA Grade Scale',
        grades: [expect.objectContaining({
          grade: 'A',
          minPercentage: 90,
          maxPercentage: 100,
          gradePoint: 4,
          description: 'Excellent',
        })],
      }),
    ));
    const payload = mockedApi.post.mock.calls[0][1] as { grades: Array<Record<string, unknown>> };
    expect(payload.grades[0]).not.toHaveProperty('minMarks');
    expect(payload.grades[0]).not.toHaveProperty('maxMarks');
  });

  it('prevents a blank attendance rule from reaching the API', async () => {
    const user = userEvent.setup();
    render(<SystemSettings />);

    await user.click(await screen.findByRole('tab', { name: 'Attendance Rules' }));
    await user.click(await screen.findByRole('button', { name: 'Add Attendance Rule' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Rule name is required.')).toBeInTheDocument();
    expect(mockedApi.post).not.toHaveBeenCalled();
  });

  it('returns focus to the Attendance Rule trigger after closing the dialog', async () => {
    const user = userEvent.setup();
    render(<SystemSettings />);

    await user.click(await screen.findByRole('tab', { name: 'Attendance Rules' }));
    const trigger = await screen.findByRole('button', { name: 'Add Attendance Rule' });
    await user.click(trigger);
    await user.click(screen.getByRole('button', { name: 'Cancel' }));

    await waitFor(() => expect(document.activeElement).toBe(trigger));
  });

  it('prevents a blank notification template from reaching the API', async () => {
    const user = userEvent.setup();
    render(<SystemSettings />);

    await user.click(await screen.findByRole('tab', { name: 'Notification Templates' }));
    await user.click(await screen.findByRole('button', { name: 'Add Template' }));
    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(await screen.findByText('Template name is required.')).toBeInTheDocument();
    expect(mockedApi.post).not.toHaveBeenCalled();
  });

  it('posts a notification template using the backend-required fields', async () => {
    const user = userEvent.setup();
    render(<SystemSettings />);

    await user.click(await screen.findByRole('tab', { name: 'Notification Templates' }));
    await user.click(await screen.findByRole('button', { name: 'Add Template' }));
    await user.type(screen.getByRole('textbox', { name: 'Template Name' }), 'QA Notice');
    await user.type(screen.getByRole('textbox', { name: 'Template Code' }), 'qa_notice');
    fireEvent.change(screen.getByRole('textbox', { name: 'English Template' }), { target: { value: 'Hello {{student_name}}' } });
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => expect(mockedApi.post).toHaveBeenCalledWith(
      '/api/v1/system-settings/notification-templates',
      expect.objectContaining({
        name: 'QA Notice',
        code: 'QA_NOTICE',
        category: 'general',
        channel: 'in_app',
        language: 'english',
        templateEn: 'Hello {{student_name}}',
        variables: ['student_name'],
      }),
    ));
  });

  it('uses date-format defaults and disables saving when no active school configuration exists', async () => {
    const user = userEvent.setup();
    mockedApi.get.mockImplementation((url) => Promise.resolve({
      data: { data: url.endsWith('/date-format') ? {} : [] },
    } as never));
    render(<SystemSettings />);

    await user.click(await screen.findByRole('tab', { name: 'Date Format' }));

    expect(await screen.findByText('There is no active school configuration. Activate School Configuration before changing these settings.')).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: 'Date Display Format' })).toHaveValue('YYYY-MM-DD');
    expect(screen.getByRole('textbox', { name: 'Time Format' })).toHaveValue('HH:mm');
    expect(screen.getByRole('textbox', { name: 'Number Format' })).toHaveValue('en-US');
    expect(screen.getByRole('textbox', { name: 'Currency Code' })).toHaveValue('NPR');
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();
    expect(mockedApi.put).not.toHaveBeenCalled();
  });
});
