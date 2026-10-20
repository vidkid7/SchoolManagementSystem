import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { ECAManagement, mapEcaEventFormData } from './ECAManagement';

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
});
