import { createIssueBookPayload } from './issueBookPayload';

describe('createIssueBookPayload', () => {
  it('sends the numeric book and student IDs expected by the API', () => {
    expect(createIssueBookPayload(
      { bookId: 12 },
      { studentId: 34 },
      '2026-10-26'
    )).toEqual({ bookId: 12, studentId: 34, dueDate: '2026-10-26' });
  });

  it('omits an empty optional due date', () => {
    expect(createIssueBookPayload(
      { bookId: 12 },
      { studentId: 34 },
      ''
    )).toEqual({ bookId: 12, studentId: 34 });
  });

  it('rejects missing or invalid selection IDs', () => {
    expect(() => createIssueBookPayload({ bookId: 0 }, { studentId: 34 }, '')).toThrow('Select a valid book and student');
    expect(() => createIssueBookPayload({ bookId: 12 }, { studentId: Number.NaN }, '')).toThrow('Select a valid book and student');
  });
});
