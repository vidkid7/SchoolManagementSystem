import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { ECAManagement } from './ECAManagement';

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
});
