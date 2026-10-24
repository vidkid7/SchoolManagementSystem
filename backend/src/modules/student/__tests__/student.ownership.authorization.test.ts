import Student from '@models/Student.model';
import StudentRepository from '../student.repository';
import studentController from '../student.controller';

const ownershipProtectedHandlers = [
  ['profile', studentController.getById],
  ['academic history', studentController.getAcademicHistory],
  ['attendance', studentController.getAttendance],
  ['grades', studentController.getGrades],
  ['fees', studentController.getFees],
  ['ECA history', studentController.getECA],
  ['certificates', studentController.getCertificates],
  ['teacher remarks', studentController.getRemarks],
  ['library history', studentController.getLibrary],
] as const;

describe.each(ownershipProtectedHandlers)('student %s ownership', (_name, handler) => {
  afterEach(() => jest.restoreAllMocks());

  it('rejects another student before loading student data', async () => {
    jest.spyOn(Student, 'findOne').mockResolvedValue({ studentId: 51 } as never);
    const findStudent = jest.spyOn(StudentRepository, 'findById');
    const req = { params: { id: '52' }, query: {}, user: { userId: 7, role: 'Student' } } as never;
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as never;

    const error = await new Promise<Error>((resolve) => {
      handler(req, res, (nextError) => resolve(nextError as Error));
    });

    expect(error).toMatchObject({ statusCode: 404 });
    expect(findStudent).not.toHaveBeenCalled();
  });
});
