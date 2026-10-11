import { Request } from 'express';
import { validationResult } from 'express-validator';
import { createEventValidation, updateEventValidation } from '../event.validation';

async function validate(
  rules: typeof createEventValidation | typeof updateEventValidation,
  request: Request
) {
  await Promise.all(rules.map(rule => rule.run(request)));
  return validationResult(request);
}

describe('event validation', () => {
  it('accepts blank optional date and time fields from the calendar form', async () => {
    const request = {
      body: {
        title: 'QA event',
        category: 'academic',
        startDate: '2026-10-11',
        endDate: '',
        startTime: '',
        endTime: '',
        recurrenceEndDate: '',
      },
      params: {},
      query: {},
    } as unknown as Request;

    const errors = await validate(createEventValidation, request);

    expect(errors.isEmpty()).toBe(true);
    expect(request.body.endDate).toBeUndefined();
    expect(request.body.startTime).toBeUndefined();
    expect(request.body.endTime).toBeUndefined();
    expect(request.body.recurrenceEndDate).toBeUndefined();
  });

  it('still rejects invalid non-empty date and time values', async () => {
    const request = {
      body: {
        title: 'QA event',
        category: 'academic',
        startDate: '2026-10-11',
        endDate: 'not-a-date',
        startTime: '25:90',
      },
      params: { eventId: '1' },
      query: {},
    } as unknown as Request;

    const errors = await validate(updateEventValidation, request);

    expect(errors.array().map(error => 'path' in error ? error.path : '')).toEqual(
      expect.arrayContaining(['endDate', 'startTime'])
    );
  });
});
