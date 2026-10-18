export interface TimetablePeriodForm {
  subjectId: string;
  startTime: string;
  endTime: string;
}

export interface TimetablePeriodErrors {
  subjectId?: string;
  endTime?: string;
}

function toMinutes(value: string): number | null {
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value)) return null;
  const [hours, minutes] = value.split(':').map(Number);
  return hours * 60 + minutes;
}

export function validateTimetablePeriod(form: TimetablePeriodForm): TimetablePeriodErrors {
  const errors: TimetablePeriodErrors = {};
  const subjectId = Number(form.subjectId);
  const start = toMinutes(form.startTime);
  const end = toMinutes(form.endTime);

  if (!form.subjectId || !Number.isInteger(subjectId) || subjectId < 1) {
    errors.subjectId = 'subjectRequired';
  }
  if (start === null || end === null || end <= start) {
    errors.endTime = 'endAfterStart';
  }

  return errors;
}
