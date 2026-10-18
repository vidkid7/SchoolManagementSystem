import { validateTimetablePeriod } from './timetablePeriodValidation';

describe('validateTimetablePeriod', () => {
  it('requires a subject before any timetable requests are sent', () => {
    expect(validateTimetablePeriod({ subjectId: '', startTime: '08:45', endTime: '09:30' })).toEqual({
      subjectId: 'subjectRequired',
    });
  });

  it('accepts a selected subject and a valid time range', () => {
    expect(validateTimetablePeriod({ subjectId: '2', startTime: '08:45', endTime: '09:30' })).toEqual({});
  });

  it('rejects malformed or non-increasing time ranges', () => {
    expect(validateTimetablePeriod({ subjectId: '2', startTime: '09:30', endTime: '09:30' })).toEqual({
      endTime: 'endAfterStart',
    });
    expect(validateTimetablePeriod({ subjectId: '2', startTime: 'bad', endTime: '09:30' }).endTime).toBe('endAfterStart');
  });
});
