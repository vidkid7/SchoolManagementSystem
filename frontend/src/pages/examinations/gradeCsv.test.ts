import { escapeCsvCell, importGradesFromCsv } from './gradeCsv';

const students = [
  { id: 101, student_id: 'STU-101', roll_number: 1, status: 'pending' as const },
  { id: 102, student_id: 'STU-102', roll_number: 2, status: 'pending' as const },
];

describe('importGradesFromCsv', () => {
  it('matches students by ID, recalculates totals and grades, and stages updates', () => {
    const csv = [
      'Student ID,Roll Number,Name,Theory (Max: 75),Practical (Max: 25)',
      'STU-101,1,"Doe, Jane",65,20',
    ].join('\r\n');

    const result = importGradesFromCsv(csv, students);

    expect(result.importedCount).toBe(1);
    expect(result.students[0]).toMatchObject({ theory_marks: 65, practical_marks: 20, total_marks: 85, grade: 'A', status: 'pending' });
    expect(result.students[1]).toEqual(students[1]);
  });

  it('matches by roll number when Student ID is not present', () => {
    const result = importGradesFromCsv('Roll Number,Theory\n2,40', students);
    expect(result.students[1]).toMatchObject({ theory_marks: 40, practical_marks: 0, total_marks: 40, grade: 'C' });
  });

  it.each([
    ['missing required headers', 'Name,Practical\nJane,10'],
    ['unknown student', 'Student ID,Theory\nSTU-999,40'],
    ['duplicate student', 'Student ID,Theory\nSTU-101,40\nSTU-101,50'],
    ['out-of-range marks', 'Student ID,Theory\nSTU-101,76'],
    ['mismatched identifiers', 'Student ID,Roll Number,Theory\nSTU-101,2,40'],
    ['unclosed quoted field', 'Student ID,Theory\nSTU-101,"40'],
  ])('rejects %s without staging partial changes', (_name, csv) => {
    expect(() => importGradesFromCsv(csv, students)).toThrow();
  });
});

describe('escapeCsvCell', () => {
  it('quotes and escapes values containing commas, quotes, or newlines', () => {
    expect(escapeCsvCell('Doe, "Jane"')).toBe('"Doe, ""Jane"""');
    expect(escapeCsvCell('line one\nline two')).toBe('"line one\nline two"');
    expect(escapeCsvCell('STU-101')).toBe('STU-101');
  });
});
