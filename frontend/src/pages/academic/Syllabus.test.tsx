import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import api from '../../config/api';
import { Syllabus } from './Syllabus';

jest.mock('../../config/api', () => ({
  __esModule: true,
  default: { get: jest.fn(), post: jest.fn(), put: jest.fn(), delete: jest.fn() },
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const renderSyllabus = () => render(
  <MemoryRouter initialEntries={['/KMC/academic/syllabus?classId=1&subjectId=1']}>
    <Routes>
      <Route path="/:municipalitySlug/academic/syllabus" element={<Syllabus />} />
    </Routes>
  </MemoryRouter>,
);

describe('Syllabus', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (api.get as jest.Mock).mockImplementation((path: string) => {
      if (path === '/academic/classes') {
        return Promise.resolve({ data: { data: [{ classId: 1, gradeLevel: 1, section: 'K' }] } });
      }
      if (path === '/academic/subjects') {
        return Promise.resolve({ data: { data: [{ subjectId: 1, code: 'QA-101', nameEn: 'QA Subject' }] } });
      }
      if (path === '/academic/syllabus?classId=1&subjectId=1') {
        return Promise.resolve({ data: { success: true, data: null } });
      }
      throw new Error(`Unexpected GET ${path}`);
    });
  });

  it('shows the create state when the API successfully returns no syllabus', async () => {
    renderSyllabus();

    expect(await screen.findByRole('combobox', { name: 'academic.selectClass' })).toBeInTheDocument();
    expect(screen.getByRole('combobox', { name: 'academic.selectSubject' })).toBeInTheDocument();
    expect(await screen.findByText('academic.noSyllabusFound')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'academic.createSyllabus' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'academic.addTopic' })).not.toBeInTheDocument();
  });

  it('creates a syllabus with the current academic year', async () => {
    let syllabusExists = false;
    (api.get as jest.Mock).mockImplementation((path: string) => {
      if (path === '/academic/classes') {
        return Promise.resolve({ data: { data: [{ classId: 1, gradeLevel: 1, section: 'K' }] } });
      }
      if (path === '/academic/subjects') {
        return Promise.resolve({ data: { data: [{ subjectId: 1, code: 'QA-101', nameEn: 'QA Subject' }] } });
      }
      if (path === '/academic/years/current') {
        return Promise.resolve({ data: { data: { academicYearId: 30001 } } });
      }
      if (path === '/academic/syllabus?classId=1&subjectId=1') {
        return Promise.resolve({
          data: { data: syllabusExists ? { syllabusId: 80001, topics: [] } : null },
        });
      }
      throw new Error(`Unexpected GET ${path}`);
    });
    (api.post as jest.Mock).mockImplementation(async (_path: string, body: Record<string, number>) => {
      expect(body).toEqual({ classId: 1, subjectId: 1, academicYearId: 30001 });
      syllabusExists = true;
      return { data: { success: true } };
    });

    renderSyllabus();
    fireEvent.click(await screen.findByRole('button', { name: 'academic.createSyllabus' }));

    await waitFor(() => expect(api.post).toHaveBeenCalledWith('/academic/syllabus', {
      classId: 1,
      subjectId: 1,
      academicYearId: 30001,
    }));
    expect(await screen.findByRole('button', { name: 'academic.addTopic' })).toBeInTheDocument();
  });

  it('keeps topic validation feedback inside the dialog and prevents invalid writes', async () => {
    (api.get as jest.Mock).mockImplementation((path: string) => {
      if (path === '/academic/classes') {
        return Promise.resolve({ data: { data: [{ classId: 1, gradeLevel: 1, section: 'K' }] } });
      }
      if (path === '/academic/subjects') {
        return Promise.resolve({ data: { data: [{ subjectId: 1, code: 'QA-101', nameEn: 'QA Subject' }] } });
      }
      if (path === '/academic/syllabus?classId=1&subjectId=1') {
        return Promise.resolve({ data: { data: { syllabusId: 1, topics: [] } } });
      }
      throw new Error(`Unexpected GET ${path}`);
    });

    renderSyllabus();
    fireEvent.click(await screen.findByRole('button', { name: 'academic.addTopic' }));
    const dialog = await screen.findByRole('dialog', { name: 'academic.addTopic' });

    fireEvent.click(within(dialog).getByRole('button', { name: 'academic.addTopic' }));
    expect(within(dialog).getByRole('alert')).toHaveTextContent('academic.topicTitleRequired');
    expect(within(dialog).getByRole('textbox', { name: 'academic.topicTitle' })).toBeRequired();
    expect(within(dialog).getByRole('spinbutton', { name: 'academic.estimatedHours' })).toBeRequired();
    expect(api.post).not.toHaveBeenCalled();

    fireEvent.change(within(dialog).getByRole('textbox', { name: 'academic.topicTitle' }), {
      target: { value: 'New QA topic' },
    });
    fireEvent.click(within(dialog).getByRole('button', { name: 'academic.addTopic' }));
    expect(within(dialog).getByRole('alert')).toHaveTextContent('academic.estimatedHoursMin');
    expect(api.post).not.toHaveBeenCalled();
  });

  it('validates progress inside the dialog and sends only a whole number from 0 to 500', async () => {
    (api.get as jest.Mock).mockImplementation((path: string) => {
      if (path === '/academic/classes') {
        return Promise.resolve({ data: { data: [{ classId: 1, gradeLevel: 1, section: 'K' }] } });
      }
      if (path === '/academic/subjects') {
        return Promise.resolve({ data: { data: [{ subjectId: 1, code: 'QA-101', nameEn: 'QA Subject' }] } });
      }
      if (path === '/academic/syllabus?classId=1&subjectId=1') {
        return Promise.resolve({
          data: { data: { syllabusId: 1, topics: [{
            topicId: 11,
            title: 'Existing topic',
            estimatedHours: 5,
            completedHours: 2,
            orderIndex: 1,
          }] } },
        });
      }
      throw new Error(`Unexpected GET ${path}`);
    });

    renderSyllabus();
    fireEvent.click(await screen.findByRole('button', { name: 'academic.updateProgress' }));
    const dialog = await screen.findByRole('dialog', { name: 'academic.updateProgress' });
    const completedHours = within(dialog).getByRole('spinbutton', { name: 'academic.completedHours' });
    const update = within(dialog).getByRole('button', { name: 'common.update' });

    fireEvent.change(completedHours, { target: { value: '' } });
    fireEvent.click(update);
    expect(within(dialog).getByRole('alert')).toHaveTextContent('academic.completedHoursRange');
    expect(api.put).not.toHaveBeenCalled();

    fireEvent.change(completedHours, { target: { value: '501' } });
    fireEvent.click(update);
    expect(within(dialog).getByRole('alert')).toHaveTextContent('academic.completedHoursRange');
    expect(api.put).not.toHaveBeenCalled();

    fireEvent.change(completedHours, { target: { value: '3' } });
    fireEvent.click(update);
    await waitFor(() => expect(api.put).toHaveBeenCalledWith('/academic/syllabus', {
      topicId: 11,
      completedHours: 3,
    }));
  });
});
