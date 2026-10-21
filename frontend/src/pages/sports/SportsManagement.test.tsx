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
      'sports.selectSport': 'Select sport',
      'sports.loadEnrollments': 'Load Enrollments',
      'sports.noEnrollments': 'No active enrollments found for this sport.',
      'sports.createSport': 'Create Sport',
      'sports.noSportsFound': 'No sports found',
      'sports.failedToLoadData': 'Could not load sports data. Please try again.',
      'sports.retry': 'Retry',
      'sports.sportName': 'Sport Name',
      'sports.category': 'Category',
      'sports.status': 'Status',
      'sports.cancel': 'Cancel',
      'sports.submit': 'Submit',
      'sports.active': 'Active',
      'sports.inactive': 'Inactive',
      'common.create': 'Create',
      'common.delete': 'Delete',
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

  it('gives the sport delete action an accessible name', async () => {
    mockedApiClient.get.mockImplementation(async (url: any) => {
      if (url === '/sports/list') {
        return { data: { data: [{ sportId: 1, name: 'QA Sport', category: 'team', coordinatorId: 1, status: 'active' }], meta: { total: 1 } } } as any;
      }
      return { data: { data: [] } } as any;
    });

    render(<MemoryRouter><SportsManagement /></MemoryRouter>);

    expect(await screen.findByText('QA Sport')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Delete' })).toBeInTheDocument();
  });

  it('shows an empty state after loading a sport with no active enrollments', async () => {
    mockedApiClient.get.mockImplementation(async (url: any) => {
      if (url === '/sports/list') return { data: { data: [{ sportId: 1, name: 'QA Sport' }], meta: { total: 1 } } } as any;
      if (url === '/sports/1/enrollments') return { data: { data: [] } } as any;
      return { data: { data: [], meta: { total: 0 } } } as any;
    });

    render(<MemoryRouter><SportsManagement /></MemoryRouter>);
    fireEvent.click(await screen.findByRole('tab', { name: 'Enrollments & Attendance' }));
    fireEvent.mouseDown(screen.getByRole('combobox', { name: 'Select sport' }));
    fireEvent.click(await screen.findByRole('option', { name: 'QA Sport' }));
    fireEvent.click(screen.getByRole('button', { name: 'Load Enrollments' }));

    expect(await screen.findByText('No active enrollments found for this sport.')).toBeInTheDocument();
    expect(screen.queryByText('Select a sport and click Load Enrollments')).not.toBeInTheDocument();
  });

  it('shows a retryable load error instead of a false empty state', async () => {
    mockedApiClient.get.mockImplementation(async (url: any) => {
      if (url === '/sports/list') throw new Error('network unavailable');
      return { data: { data: [], meta: { total: 0 } } } as any;
    });

    render(<MemoryRouter><SportsManagement /></MemoryRouter>);

    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load sports data. Please try again.');
    expect(screen.queryByText('No sports found')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Retry' })).toBeInTheDocument();
  });
});
