import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { MemoryRouter } from 'react-router-dom';
import apiClient from '../../services/apiClient';
import { SportsManagement } from './SportsManagement';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => ({
      'sports.management': 'Sports Management',
      'sports.sports': 'Sports',
      'sports.teams': 'Teams',
      'sports.tournaments': 'Tournaments',
      'sports.achievements': 'Achievements',
      'sports.enrollmentsAndAttendance': 'Enrollments & Attendance',
      'sports.studentHistory': 'Student History',
      'sports.createSport': 'Create Sport',
      'sports.noSportsFound': 'No sports found',
      'sports.sportName': 'Sport Name',
      'sports.category': 'Category',
      'sports.status': 'Status',
      'sports.cancel': 'Cancel',
      'sports.submit': 'Submit',
      'sports.active': 'Active',
      'sports.inactive': 'Inactive',
      'common.create': 'Create',
    }[key] ?? key),
  }),
}));

jest.mock('../../services/apiClient');
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('SportsManagement dialog lifecycle', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedApiClient.get.mockResolvedValue({ data: { data: [], meta: { total: 0 } } } as any);
  });

  it('clears the validation message when the user cancels the form', async () => {
    render(<MemoryRouter><SportsManagement /></MemoryRouter>);
    fireEvent.click(await screen.findByRole('button', { name: 'Create Sport' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Submit' }));
    expect(await within(dialog).findByText('Name is required.')).toBeInTheDocument();

    fireEvent.click(within(dialog).getByRole('button', { name: 'Cancel' }));
    expect(await screen.findByRole('button', { name: 'Create Sport' })).toBeInTheDocument();
    expect(screen.queryByText('Name is required.')).not.toBeInTheDocument();
  });
});
