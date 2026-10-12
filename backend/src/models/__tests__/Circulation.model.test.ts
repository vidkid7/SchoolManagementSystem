import { Circulation } from '../Circulation.model';

describe('Circulation serialization', () => {
  it('includes only the selected associated book and student fields', () => {
    const associations = {
      book: { toJSON: () => ({ title: 'QA book', accessionNumber: 'QA-1' }) },
      student: { toJSON: () => ({ firstNameEn: 'Codex', lastNameEn: 'QA', studentCode: 'QA-1' }) },
    };
    const circulation = Object.assign(Object.create(Circulation.prototype), {
      circulationId: 4,
      bookId: 2,
      studentId: 3,
      issueDate: new Date('2026-10-12T00:00:00.000Z'),
      dueDate: new Date('2026-10-26T00:00:00.000Z'),
      status: 'borrowed',
      renewalCount: 0,
      maxRenewals: 2,
      issuedBy: 1,
      fine: 0,
      finePaid: false,
    });
    jest.spyOn(circulation, 'getDataValue').mockImplementation((...args: unknown[]) => associations[String(args[0]) as keyof typeof associations]);
    jest.spyOn(circulation, 'isOverdue').mockReturnValue(false);
    jest.spyOn(circulation, 'getDaysOverdue').mockReturnValue(0);
    jest.spyOn(circulation, 'canRenew').mockReturnValue(true);

    expect(circulation.toJSON()).toMatchObject({
      circulationId: 4,
      book: { title: 'QA book', accessionNumber: 'QA-1' },
      student: { firstNameEn: 'Codex', lastNameEn: 'QA', studentCode: 'QA-1' },
    });
  });
});
