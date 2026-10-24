import parentService from './parent.service';

describe('parent child record authorization', () => {
  beforeEach(() => {
    jest.spyOn(parentService, 'getParentChildren').mockResolvedValue([]);
  });

  afterEach(() => jest.restoreAllMocks());

  it.each([
    ['attendance', () => parentService.getChildAttendance(99, 7)],
    ['grades', () => parentService.getChildGrades(99, 7)],
    ['fees', () => parentService.getChildFees(99, 7)],
    ['notifications', () => parentService.getParentNotifications(7, 99)],
    ['library', () => parentService.getChildLibrary(99, 7)],
    ['assignments', () => parentService.getChildAssignments(99, 7)],
    ['activities', () => parentService.getChildActivities(99, 7)],
    ['behavior', () => parentService.getChildBehavior(99, 7)],
    ['certificates', () => parentService.getChildCertificates(99, 7)],
  ])('denies a non-child %s request', async (_name, operation) => {
    await expect(operation()).rejects.toThrow('Access denied');
  });
});
