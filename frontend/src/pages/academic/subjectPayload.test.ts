import { toSubjectApiPayload } from './subjectPayload';

describe('toSubjectApiPayload', () => {
  it('maps the subject form fields to the academic API contract', () => {
    expect(toSubjectApiPayload({
      code: ' QA-101 ',
      name_en: ' QA Subject ',
      name_np: ' परीक्षण विषय ',
      type: 'compulsory',
      credit_hours: '3',
      full_marks: '80',
    })).toEqual({
      code: 'QA-101',
      nameEn: 'QA Subject',
      nameNp: 'परीक्षण विषय',
      type: 'compulsory',
      creditHours: 3,
      fullMarks: 80,
    });
  });
});
