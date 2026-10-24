import Student from '@models/Student.model';
import Certificate from '@models/Certificate.model';
import StudentRepository from '../student.repository';
import studentController from '../student.controller';

describe('GET student certificates ownership', () => {
  afterEach(() => jest.restoreAllMocks());

  it('denies a student requesting another student’s certificates before reading certificate data', async () => {
    jest.spyOn(Student, 'findOne').mockResolvedValue({ studentId: 51 } as never);
    const findStudent = jest.spyOn(StudentRepository, 'findById');
    const findCertificates = jest.spyOn(Certificate, 'findAll');
    const req = { params: { id: '52' }, user: { userId: 7, role: 'Student' } } as never;
    const res = { status: jest.fn().mockReturnThis(), json: jest.fn() } as never;

    const error = await new Promise<Error>((resolve) => {
      studentController.getCertificates(req, res, (nextError) => resolve(nextError as Error));
    });

    expect(error).toMatchObject({ statusCode: 404 });
    expect(findStudent).not.toHaveBeenCalled();
    expect(findCertificates).not.toHaveBeenCalled();
  });
});
