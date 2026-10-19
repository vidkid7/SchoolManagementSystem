import { isSupportedStudentImportFile, studentImportFileFilter } from '../studentImportUpload';
import { ValidationError } from '@middleware/errorHandler';

describe('student import upload validation', () => {
  it.each([
    ['students.xlsx', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'],
    ['students.xls', 'application/vnd.ms-excel'],
    ['students.csv', 'text/csv'],
    ['students.csv', 'application/csv'],
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

  it('returns a client validation error for an unsupported upload', () => {
    const callback = jest.fn();

    studentImportFileFilter({}, { originalname: 'students.pdf', mimetype: 'application/pdf' }, callback);

    expect(callback).toHaveBeenCalledWith(expect.any(ValidationError));
    expect(callback.mock.calls[0][0].statusCode).toBe(400);
    expect(callback.mock.calls[0][0].errors).toEqual([
      { field: 'file', message: 'Please upload an Excel or CSV file (.xlsx, .xls, or .csv)' },
    ]);
  });
});
