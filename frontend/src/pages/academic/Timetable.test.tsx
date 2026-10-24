import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import api from '../../config/api';
import { Timetable } from './Timetable';

jest.mock('../../config/api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

jest.mock('../../hooks/useCurrentAcademicYear', () => ({
  useCurrentAcademicYear: () => ({ currentYear: { academicYearId: 2026 } }),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    i18n: { language: 'en' },
    t: (key: string, options?: Record<string, unknown>) => {
      if (key === 'academic.addPeriodTitle') return `Add Period - ${options?.day} Period ${options?.number}`;
      if (key === 'academic.classSection') return `Class ${options?.grade} - Section ${options?.section}`;
      const labels: Record<string, string> = {
        'academic.selectClass': 'Select Class',
        'academic.timetableManagement': 'Timetable Management',
        'academic.timetableSubtitle': 'Create and manage class schedules',
        'academic.daysScheduled': `${options?.count ?? 0} days scheduled`,
        'academic.period': 'Period',
        'academic.periodDay': 'Period / Day',
        'academic.monday': 'Monday',
        'academic.tuesday': 'Tuesday',
        'academic.wednesday': 'Wednesday',
        'academic.thursday': 'Thursday',
        'academic.friday': 'Friday',
        'academic.teacherOptional': 'Teacher (Optional)',
        'common.subject': 'Subject',
        'common.cancel': 'Cancel',
        'academic.savePeriod': 'Save Period',
        'timetable.startTime': 'Start Time',
        'timetable.endTime': 'End Time',
        'academic.roomNumberOptional': 'Room Number (Optional)',
      };
      return labels[key] ?? key;
    },
  }),
}));

const mockedApi = api as jest.Mocked<typeof api>;

describe('Timetable', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedApi.get.mockImplementation((url) => Promise.resolve({
      data: {
        data: url === '/academic/classes'
          ? [{ classId: 1, gradeLevel: 1, section: 'K' }]
          : url === '/academic/subjects'
            ? [{ subjectId: 1, nameEn: 'Test Subject', code: 'TEST-101' }]
            : [],
      },
    } as never));
  });

  it('renders and opens the first period at its configured time', async () => {
    const user = userEvent.setup();
    render(<Timetable />);

    const classSelector = await screen.findByRole('combobox', { name: /Select Class/ });
    await user.click(classSelector);
    await user.click(await screen.findByRole('option', { name: 'Class 1 - Section K' }));

    const firstPeriodButton = await screen.findByRole('button', { name: 'Add Period - Monday Period 1' });
    expect(screen.getByRole('columnheader', { name: 'Period / Day' })).toHaveStyle({ color: 'rgb(255, 255, 255)' });
    await user.click(firstPeriodButton);
    expect(await screen.findByRole('heading', { name: 'Add Period - Monday Period 1' })).toBeInTheDocument();
    expect(screen.getByLabelText('Start Time')).toHaveValue('08:00');
    expect(screen.getByLabelText('End Time')).toHaveValue('08:45');
    await waitFor(() => expect(mockedApi.get).toHaveBeenCalledWith('/academic/timetable/1'));
  });

  it('does not log timetable payloads or response data when saving a period', async () => {
    const user = userEvent.setup();
    const consoleLog = jest.spyOn(console, 'log').mockImplementation(() => undefined);
    mockedApi.post.mockResolvedValue({ data: { data: { timetableId: 99 } } } as never);
    render(<Timetable />);

    const classSelector = await screen.findByRole('combobox', { name: /Select Class/ });
    await user.click(classSelector);
    await user.click(await screen.findByRole('option', { name: 'Class 1 - Section K' }));
    await user.click(await screen.findByRole('button', { name: 'Add Period - Monday Period 1' }));
    const subject = await screen.findByRole('combobox', { name: 'Subject' });
    await user.click(subject);
    await user.click(await screen.findByRole('option', { name: 'TEST-101 - Test Subject' }));
    await user.click(screen.getByRole('button', { name: 'Save Period' }));

    await waitFor(() => expect(mockedApi.post).toHaveBeenCalledTimes(2));
    expect(consoleLog).not.toHaveBeenCalled();
    consoleLog.mockRestore();
  });
});
