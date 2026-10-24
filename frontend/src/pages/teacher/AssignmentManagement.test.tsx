import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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
      'teacher.assignmentRequiredFields': 'Complete the required assignment fields.',
    }[key] ?? key);
    return () => ({ t });
  })(),
}));

jest.mock('../../services/apiClient');
jest.mock('../../components/YearSelectableDatePicker/YearSelectableDatePicker', () => ({
  YearSelectableDateField: ({ label, value, onChange }: any) => (
    <input aria-label={label} value={value ?? ''} onChange={onChange} />
  ),
}));
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

const mockAssignmentLookupsAndList = () => {
  mockedApiClient.get.mockImplementation((url) => Promise.resolve({
    data: {
      data: url.endsWith('/academic/subjects')
        ? { subjects: [{ subjectId: 1, code: 'QA-101', nameEn: 'QA Subject' }] }
        : url.endsWith('/academic/classes')
          ? { classes: [{ classId: 1, gradeLevel: 1, section: 'K' }] }
          : { assignments: [] },
    },
  } as any));
};

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

  it('keeps the create dialog open and prevents an incomplete assignment request', async () => {
    mockAssignmentLookupsAndList();
    render(
      <Provider store={store}>
        <AssignmentManagement />
      </Provider>,
    );

    fireEvent.click(await screen.findByRole('button', { name: /Create Assignment/i }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: /Create Assignment/i }));

    expect(await screen.findByText('Complete the required assignment fields.')).toBeInTheDocument();
    expect(mockedApiClient.post).not.toHaveBeenCalled();
  });

  it('sends the entered required fields when creating an assignment', async () => {
    const user = userEvent.setup();
    mockAssignmentLookupsAndList();
    mockedApiClient.post.mockResolvedValue({ data: { data: { id: 42 } } } as any);
    render(
      <Provider store={store}>
        <AssignmentManagement />
      </Provider>,
    );

    await user.click(await screen.findByRole('button', { name: /Create Assignment/i }));
    const dialog = await screen.findByRole('dialog');
    await user.click(within(dialog).getByRole('combobox', { name: 'common.subject' }));
    await user.click(await screen.findByRole('option', { name: 'QA Subject' }));
    await user.click(within(dialog).getByRole('combobox', { name: 'common.class' }));
    await user.click(await screen.findByRole('option', { name: 'Class 1 - Section K' }));
    await user.type(within(dialog).getByPlaceholderText('teacher.assignmentTitle'), 'Fractions exercise');
    await user.type(within(dialog).getByLabelText('teacher.dueDate'), '2026-10-31');
    await user.type(within(dialog).getByPlaceholderText('teacher.totalMarks'), '25');
    await user.click(within(dialog).getByRole('button', { name: /Create Assignment/i }));

    expect(mockedApiClient.post).toHaveBeenCalledWith('/api/v1/assignments', expect.objectContaining({
      title: 'Fractions exercise',
      subject: 'QA Subject',
      className: 'Class 1 - Section K',
      dueDate: '2026-10-31',
      totalMarks: 25,
    }), expect.objectContaining({ headers: { Authorization: 'Bearer qa-token' } }));
  });
});
