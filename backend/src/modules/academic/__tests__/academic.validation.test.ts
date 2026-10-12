import { validationResult } from 'express-validator';
import { createSubjectValidation, updateSubjectValidation } from '../academic.validation';

async function validateBody(validations: Array<{ run: (request: any) => Promise<unknown> }>, body: Record<string, unknown>) {
  const request = { body, query: {}, params: {} } as any;
  await Promise.all(validations.map((validation) => validation.run(request)));
  return validationResult(request).array();
}

describe('academic subject request validation', () => {
  it('accepts the subject form API payload including full marks', async () => {
    const errors = await validateBody(createSubjectValidation, {
      code: 'QA-101',
      nameEn: 'QA Subject',
      nameNp: 'परीक्षण विषय',
      type: 'compulsory',
      creditHours: 3,
      fullMarks: 80,
    });

    expect(errors).toHaveLength(0);
  });

  it('rejects full marks outside the supported range for create and update', async () => {
    const fields = {
      code: 'QA-101',
      nameEn: 'QA Subject',
      nameNp: 'परीक्षण विषय',
      type: 'compulsory',
      fullMarks: 201,
    };
    const createErrors = await validateBody(createSubjectValidation, fields);
    const updateErrors = await validateBody(updateSubjectValidation, { subjectId: 1, fullMarks: 201 });

    expect(createErrors.some((error: any) => error.path === 'fullMarks')).toBe(true);
    expect(updateErrors.some((error: any) => error.path === 'fullMarks')).toBe(true);
  });
});
