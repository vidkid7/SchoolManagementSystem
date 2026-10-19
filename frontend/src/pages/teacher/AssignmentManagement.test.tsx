import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { AssignmentManagement } from './AssignmentManagement';
import apiClient from '../../services/apiClient';
import { store } from '../../store';
import { setCredentials } from '../../store/slices/authSlice';

jest.mock('react-i18next', () => ({
  useTranslation: (() => {
    const t = (key: string) => ({
      'portal.failedToLoadData': 'Failed to load data',
      'teacher.assignmentManagement': 'Assignment Management',
      'teacher.createAssignment': 'Create Assignment',
    }[key] ?? key);
    return () => ({ t });
  })(),
}));

jest.mock('../../services/apiClient');
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

describe('AssignmentManagement', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    store.dispatch(setCredentials({ accessToken: 'qa-token', refreshToken: 'qa-refresh' }));
    mockedApiClient.get.mockRejectedValue(new Error('Network Error'));
  });

  it('ends loading and shows an error when assignments cannot be fetched', async () => {
    render(
      <Provider store={store}>
        <AssignmentManagement />
      </Provider>,
    );

    expect(await screen.findByText('Failed to load data')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Assignment/i })).toBeInTheDocument();
  });
});
