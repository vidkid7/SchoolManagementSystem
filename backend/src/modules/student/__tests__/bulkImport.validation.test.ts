import XLSX from 'xlsx';
import StudentRepository from '../student.repository';
import studentIdService from '../studentId.service';
import bulkImportService from '../bulkImport.service';

describe('bulk student import validation before persistence', () => {
  afterEach(() => jest.restoreAllMocks());

  it('returns required-field errors without generating IDs or writing invalid rows', async () => {
    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.json_to_sheet([
      { 'First Name (English)': 'QA', 'Last Name (English)': 'Student' },
    ]);
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Students');
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' }) as Buffer;
    const generateId = jest.spyOn(studentIdService, 'generateStudentId');
    const createStudent = jest.spyOn(StudentRepository, 'create');

    const result = await bulkImportService.importFromExcel(buffer, 1);

    expect(result.totalRows).toBe(1);
    expect(result.successCount).toBe(0);
    expect(result.errorCount).toBe(1);
    expect(result.errors).toEqual(expect.arrayContaining([
      expect.objectContaining({ row: 2, field: 'fatherPhone' }),
      expect.objectContaining({ row: 2, field: 'dateOfBirthBS' }),
    ]));
    expect(generateId).not.toHaveBeenCalled();
    expect(createStudent).not.toHaveBeenCalled();
  });
});
