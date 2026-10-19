import {
  bulkGenerateInvoicesSchema,
  generateInvoiceSchema,
} from '../finance.validation';

describe('finance invoice validation contracts', () => {
  const invoiceBase = {
    studentId: 600001,
    feeStructureId: 42,
    academicYearId: 30001,
    dueDate: '2026-10-20',
  };

  it('accepts invoice notes and requires the selected fee structure year', () => {
    const valid = generateInvoiceSchema.validate({ ...invoiceBase, remarks: 'Synthetic QA invoice' });
    expect(valid.error).toBeUndefined();
    expect(generateInvoiceSchema.validate({ ...invoiceBase, academicYearId: undefined }).error).toBeDefined();
  });

  it('requires an explicit non-empty student ID list for bulk generation', () => {
    expect(bulkGenerateInvoicesSchema.validate({
      feeStructureId: 42,
      academicYearId: 30001,
      dueDate: '2026-10-20',
      studentIds: [600001],
    }).error).toBeUndefined();

    expect(bulkGenerateInvoicesSchema.validate({
      feeStructureId: 42,
      academicYearId: 30001,
      dueDate: '2026-10-20',
      classId: 1,
    }).error).toBeDefined();
  });
});
