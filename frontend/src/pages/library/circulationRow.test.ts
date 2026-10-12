import { normalizeCirculation } from './circulationRow';

describe('normalizeCirculation', () => {
  it('flattens the book and student associations returned by the API', () => {
    expect(normalizeCirculation({
      circulationId: 77,
      book: { title: 'QA Book', accessionNumber: 'QA-77' },
      student: { firstNameEn: 'Codex', lastNameEn: 'QA' },
      status: 'borrowed',
      fine: '0.00',
    })).toMatchObject({
      circulationId: 77,
      bookTitle: 'QA Book',
      accessionNumber: 'QA-77',
      memberName: 'Codex QA',
      memberType: 'student',
      status: 'borrowed',
      fineAmount: 0,
    });
  });

  it('supports capitalized Sequelize association names and missing member names', () => {
    expect(normalizeCirculation({
      circulationId: 78,
      Book: { title: 'Other Book', accession_number: 'QA-78' },
      Student: { first_name_en: 'Test', last_name_en: 'Student' },
      studentId: 9,
      status: 'returned',
    })).toMatchObject({
      bookTitle: 'Other Book',
      accessionNumber: 'QA-78',
      memberName: 'Test Student',
      status: 'returned',
    });
  });
});
