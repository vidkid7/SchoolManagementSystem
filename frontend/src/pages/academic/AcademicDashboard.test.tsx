import { fireEvent, render, screen } from '@testing-library/react';
import { ThemeProvider, createTheme } from '@mui/material';
import { AcademicDashboard } from './AcademicDashboard';

jest.mock('../../hooks/useSlugNavigate', () => ({ useSlugNavigate: () => navigateMock }));
jest.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }));

const navigateMock = jest.fn();

describe('AcademicDashboard', () => {
  beforeEach(() => jest.clearAllMocks());

  it('shows all academic feature cards as accessible buttons and opens their routes', () => {
    render(
      <ThemeProvider theme={createTheme()}>
        <AcademicDashboard />
      </ThemeProvider>,
    );

    const features = [
      ['academic.classesSubjects', '/academic/classes'],
      ['academic.academicYears', '/academic/years'],
      ['academic.classSubjectAssignment', '/academic/class-subjects'],
      ['academic.timetable', '/academic/timetable'],
      ['academic.syllabus', '/academic/syllabus'],
      ['academic.academicCalendar', '/academic/calendar'],
    ];

    for (const [label, path] of features) {
      const card = screen.getByRole('button', { name: new RegExp(label) });
      expect(card).toBeVisible();
      fireEvent.click(card);
      expect(navigateMock).toHaveBeenLastCalledWith(path);
    }

    expect(screen.getByRole('heading', { name: 'academic.dashboardTitle' })).toBeInTheDocument();
  });
});
