import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Provider } from 'react-redux';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { buildLessonPlanPayload, LessonPlanning } from './LessonPlanning';
import apiClient from '../../services/apiClient';
import { store } from '../../store';
import { setCredentials } from '../../store/slices/authSlice';

jest.mock('react-i18next', () => ({
  useTranslation: (() => {
    const t = (key: string) => ({
      'teacher.lessonPlanning': 'Lesson Planning',
      'teacher.lessonPlanningSubtitle': 'Create and manage lesson plans with syllabus tracking.',
      'teacher.createLessonPlan': 'Create Lesson Plan',
      'teacher.viewCalendar': 'View Calendar',
      'teacher.subjectRequired': 'Select a subject.',
      'teacher.topicRequired': 'Enter a lesson topic.',
      'teacher.durationMustBePositiveInteger': 'Duration must be a positive whole number.',
      'teacher.saveAsDraft': 'Save as Draft',
      'teacher.saveAndSchedule': 'Save & Schedule',
      'common.subject': 'Subject',
      'common.class': 'Class',
      'common.date': 'Date',
      'common.cancel': 'Cancel',
      'portal.lessonPlans': 'Lesson Plans',
      'teacher.syllabusProgress': 'Syllabus Progress',
      'portal.noData': 'No data available',
      'portal.failedToLoadData': 'Failed to load data',
      'teacher.duration': 'Duration',
      'teacher.learningObjectives': 'Learning Objectives',
      'teacher.teachingActivities': 'Teaching Activities',
      'teacher.assessmentMethods': 'Assessment Methods',
      'teacher.uploadMaterials': 'Upload Teaching Materials',
    }[key] ?? key);
    return () => ({ t });
  })(),
}));

jest.mock('../../services/apiClient');
const mockedApiClient = apiClient as jest.Mocked<typeof apiClient>;

const CurrentPath = () => {
  const location = useLocation();
  return <div data-testid="current-path">{location.pathname}</div>;
};

const renderPage = () => render(
  <MemoryRouter initialEntries={['/KMC/teacher/lesson-planning']}>
    <Provider store={store}>
      <Routes>
        <Route path="/:municipalitySlug/teacher/lesson-planning" element={<><LessonPlanning /><CurrentPath /></>} />
        <Route path="/:municipalitySlug/calendar" element={<CurrentPath />} />
      </Routes>
    </Provider>
  </MemoryRouter>,
);

describe('LessonPlanning', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    store.dispatch(setCredentials({ accessToken: 'qa-token', refreshToken: 'qa-refresh' }));
    mockedApiClient.get.mockImplementation((url: string) => Promise.resolve({
      data: { data: url.endsWith('/syllabus-progress') ? { syllabusProgress: [] } : { lessonPlans: [] } },
    } as any));
  });

  it('keeps the form open and shows required errors without sending an empty plan', async () => {
    expect(store.getState().auth.accessToken).toBe('qa-token');
    renderPage();
    await screen.findByText('No data available');
    fireEvent.click(await screen.findByRole('button', { name: 'Create Lesson Plan' }));
    const dialog = await screen.findByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'Save as Draft' }));
    expect(dialog.textContent).toContain('Select a subject.');
    expect(dialog.textContent).toContain('Enter a lesson topic.');
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(mockedApiClient.post).not.toHaveBeenCalled();
  });

  it('builds the API payload from the lesson plan form values', () => {
    expect(buildLessonPlanPayload({
      subject: 'Mathematics',
      className: 'Class 10 A',
      topic: '  QA lesson plan  ',
      date: '2026-10-19',
      duration: '45',
      objectives: 'Objective one\nObjective two',
      methodology: 'Discussion',
      assessment: 'Quiz',
    }, 'draft')).toEqual({
      subject: 'Mathematics',
      className: 'Class 10 A',
      topic: 'QA lesson plan',
      date: '2026-10-19',
      duration: 45,
      objectives: ['Objective one', 'Objective two'],
      methodology: 'Discussion',
      assessment: 'Quiz',
      status: 'draft',
    });
  });

  it('labels lesson filters and opens the school calendar', async () => {
    renderPage();
    await screen.findByText('No data available');

    expect(screen.getByRole('combobox', { name: 'Subject' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'Class' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'View Calendar' }));
    expect(screen.getByTestId('current-path')).toHaveTextContent('/KMC/calendar');
  });

  it('ends loading and shows an error when lesson plan requests fail', async () => {
    mockedApiClient.get.mockRejectedValue(new Error('Network Error'));
    renderPage();

    expect(await screen.findByText('Failed to load data')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create Lesson Plan' })).toBeInTheDocument();
  });
});
