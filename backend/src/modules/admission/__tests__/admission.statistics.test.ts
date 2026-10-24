import Admission, { AdmissionStatus } from '@models/Admission.model';
import admissionService from '../admission.service';

describe('admission statistics query', () => {
  afterEach(() => jest.restoreAllMocks());

  it('aggregates total, status and class counts from one grouped query', async () => {
    const findAll = jest.spyOn(Admission, 'findAll').mockResolvedValue([
      { status: AdmissionStatus.INQUIRY, applyingForClass: 1, count: '2' },
      { status: AdmissionStatus.APPLIED, applyingForClass: 1, count: 1 },
      { status: AdmissionStatus.ADMITTED, applyingForClass: 5, count: 1 }
    ] as unknown as Admission[]);

    await expect(admissionService.getStatistics()).resolves.toEqual({
      total: 4,
      byStatus: {
        [AdmissionStatus.INQUIRY]: 2,
        [AdmissionStatus.APPLIED]: 1,
        [AdmissionStatus.TEST_SCHEDULED]: 0,
        [AdmissionStatus.TESTED]: 0,
        [AdmissionStatus.INTERVIEW_SCHEDULED]: 0,
        [AdmissionStatus.INTERVIEWED]: 0,
        [AdmissionStatus.ADMITTED]: 1,
        [AdmissionStatus.ENROLLED]: 0,
        [AdmissionStatus.REJECTED]: 0,
        [AdmissionStatus.WITHDRAWN]: 0
      },
      byClass: { 1: 3, 5: 1 }
    });

    expect(findAll).toHaveBeenCalledTimes(1);
    expect(findAll).toHaveBeenCalledWith(expect.objectContaining({
      where: {},
      group: ['status', 'applyingForClass'],
      raw: true
    }));
  });

  it('applies the academic year filter to the grouped query', async () => {
    const findAll = jest.spyOn(Admission, 'findAll').mockResolvedValue([]);

    await expect(admissionService.getStatistics(2026)).resolves.toEqual({
      total: 0,
      byStatus: Object.fromEntries(Object.values(AdmissionStatus).map(status => [status, 0])),
      byClass: {}
    });
    expect(findAll).toHaveBeenCalledWith(expect.objectContaining({ where: { academicYearId: 2026 } }));
  });
});
