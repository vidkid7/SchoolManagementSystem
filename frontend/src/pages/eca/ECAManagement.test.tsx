import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { ECAManagement, mapEcaAchievementFormData, mapEcaAttendanceFormData, mapEcaEventFormData } from './ECAManagement';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => ({
      'eca.management': 'ECA Management',
      'eca.enrollments': 'Enrollments',
      'eca.attendance': 'Attendance',
      'eca.events': 'Events',
      'eca.achievements': 'Achievements',
      'eca.enrollStudent': 'Enroll Student',
      'eca.studentName': 'Student Name',
      'eca.ecaCol': 'ECA',
      'eca.enrollmentDate': 'Enrollment Date',
      'eca.status': 'Status',
      'eca.noEnrollments': 'No enrollments',
      'eca.ecaId': 'ECA ID',
      'eca.studentId': 'Student ID',
      'eca.submit': 'Submit',
      'eca.cancel': 'Cancel',
      'eca.ecaIdRequired': 'ECA ID is required.',
      'eca.studentIdRequired': 'Student ID is required.',
      'eca.positiveIdRequired': 'Enter a positive whole number.',
      'eca.createEvent': 'Create Event',
      'eca.eventTitle': 'Event Title',
      'eca.eventTitleRequired': 'Event title is required.',
      'eca.eventType': 'Event Type',
      'eca.eventTypeRequired': 'Select an event type.',
      'eca.eventDate': 'Event Date',
      'eca.eventDateRequired': 'Select an event date.',
      'eca.noEvents': 'No events',
      'eca.recordAchievementBtn': 'Record Achievement',
      'eca.noAchievements': 'No achievements',
      'eca.achievements': 'Achievements',
      'eca.achievementTitleRequired': 'Achievement title is required.',
      'eca.achievementType': 'Achievement Type',
      'eca.achievementTypeRequired': 'Select an achievement type.',
      'eca.achievementLevel': 'Achievement Level',
      'eca.achievementLevelRequired': 'Select an achievement level.',
      'eca.date': 'Date',
      'eca.achievementDateRequired': 'Select an achievement date.',
      'eca.markAttendanceBtn': 'Mark Attendance',
      'eca.noActiveEnrollments': 'No active enrollments for this ECA.',
      'eca.noAttendanceRecords': 'No attendance records',
      'common.loading': 'Loading...',
    }[key] ?? key),
  }),
}));

jest.mock('../../services/apiClient');
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('ECAManagement enrollment form', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedApiClient.get.mockResolvedValue({ data: { data: [] } } as any);
  });

  it('shows field errors and avoids posting when ids are missing', async () => {
    render(<MemoryRouter><ECAManagement /></MemoryRouter>);
    await screen.findByText('No enrollments');
    fireEvent.click(screen.getByRole('button', { name: 'Enroll Student' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Submit' }));

    expect(await within(dialog).findByText('ECA ID is required.')).toBeInTheDocument();
    expect(within(dialog).getByText('Student ID is required.')).toBeInTheDocument();
    expect(mockedApiClient.post).not.toHaveBeenCalled();
  });

  it('validates required event fields in the dialog without sending an invalid request', async () => {
    render(<MemoryRouter><ECAManagement /></MemoryRouter>);
    await screen.findByText('No enrollments');
    fireEvent.click(screen.getByRole('tab', { name: 'Events' }));
    await screen.findByText('No events');
    fireEvent.click(screen.getByRole('button', { name: 'Create Event' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Submit' }));

    expect(await within(dialog).findByText('ECA ID is required.')).toBeInTheDocument();
    expect(within(dialog).getByText('Event title is required.')).toBeInTheDocument();
    expect(within(dialog).getByText('Select an event type.')).toBeInTheDocument();
    expect(within(dialog).getByText('Select an event date.')).toBeInTheDocument();
    expect(mockedApiClient.post).not.toHaveBeenCalled();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByText('Event title is required.')).not.toBeInTheDocument();
  });

  it('maps the event title to the API name field and converts the ECA ID', () => {
    expect(mapEcaEventFormData({ ecaId: '12', title: '  Art Showcase  ', type: 'exhibition', eventDate: '2026-10-30' })).toEqual({
      ecaId: 12,
      name: 'Art Showcase',
      type: 'exhibition',
      eventDate: '2026-10-30',
    });
  });

  it('validates required achievement fields without sending an invalid request', async () => {
    render(<MemoryRouter><ECAManagement /></MemoryRouter>);
    await screen.findByText('No enrollments');
    fireEvent.click(screen.getByRole('tab', { name: 'Achievements' }));
    await screen.findByText('No achievements');
    fireEvent.click(screen.getByRole('button', { name: 'Record Achievement' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Submit' }));

    expect(await within(dialog).findByText('ECA ID is required.')).toBeInTheDocument();
    expect(within(dialog).getByText('Student ID is required.')).toBeInTheDocument();
    expect(within(dialog).getByText('Achievement title is required.')).toBeInTheDocument();
    expect(within(dialog).getByText('Select an achievement type.')).toBeInTheDocument();
    expect(within(dialog).getByText('Select an achievement level.')).toBeInTheDocument();
    expect(within(dialog).getByPlaceholderText('MM/DD/YYYY')).toHaveValue(new Date().toLocaleDateString('en-US'));
    expect(mockedApiClient.post).not.toHaveBeenCalled();
  });

  it('maps achievement form fields to the direct API contract', () => {
    expect(mapEcaAchievementFormData({
      ecaId: '2', studentId: '100', achievement: '  Art Showcase  ', type: 'award', level: 'school', date: '2026-10-30', description: 'Annual showcase',
    })).toEqual({
      ecaId: 2, studentId: 100, title: 'Art Showcase', type: 'award', level: 'school', achievementDate: '2026-10-30', description: 'Annual showcase',
    });
  });

  it('validates attendance and only loads actual active enrollments', async () => {
    render(<MemoryRouter><ECAManagement /></MemoryRouter>);
    await screen.findByText('No enrollments');
    fireEvent.click(screen.getByRole('tab', { name: 'Attendance' }));
    await screen.findByText('No attendance records');
    fireEvent.click(screen.getByRole('button', { name: 'Mark Attendance' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Submit' }));

    expect(await within(dialog).findByText('ECA ID is required.')).toBeInTheDocument();
    expect(mockedApiClient.post).not.toHaveBeenCalled();

    fireEvent.change(within(dialog).getByRole('spinbutton', { name: 'ECA ID' }), { target: { value: '9' } });
    await screen.findByText('No active enrollments for this ECA.');
    expect(mockedApiClient.get).toHaveBeenCalledWith('/eca/enrollments', { params: { ecaId: 9, status: 'active', limit: 100 } });
    expect(mockedApiClient.post).not.toHaveBeenCalled();
  });

  it('converts attendance ECA ID while preserving enrollment attendance', () => {
    expect(mapEcaAttendanceFormData({ ecaId: '9', attendanceData: [{ enrollmentId: 22, present: false }] })).toEqual({
      ecaId: 9,
      attendanceData: [{ enrollmentId: 22, present: false }],
    });
  });
});
