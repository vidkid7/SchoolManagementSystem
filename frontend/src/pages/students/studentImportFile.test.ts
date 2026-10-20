import { isSupportedStudentImportFile } from './studentImportFile';

describe('student import file validation', () => {
  it.each([
    ['students.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    ['students.xls', 'application/vnd.ms-excel'],
    ['students.csv', 'text/csv'],
    ['students.csv', 'application/csv'],
    ['students.csv', 'text/comma-separated-values'],
  ])('accepts supported file %s', (name, mimeType) => {
    expect(isSupportedStudentImportFile(name, mimeType)).toBe(true);
  });

  it.each([
    ['students.csv', 'application/pdf'],
    ['students.xlsx', 'text/csv'],
    ['students.exe', 'application/vnd.ms-excel'],
  ])('rejects mismatched or unsupported file %s', (name, mimeType) => {
    expect(isSupportedStudentImportFile(name, mimeType)).toBe(false);
  });
});
