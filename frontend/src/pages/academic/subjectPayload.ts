export interface SubjectFormValues {
  code: string;
  name_en: string;
  name_np: string;
  type: 'compulsory' | 'optional';
  credit_hours: string;
  full_marks: string;
}

export function toSubjectApiPayload(values: SubjectFormValues) {
  return {
    code: values.code.trim(),
    nameEn: values.name_en.trim(),
    nameNp: values.name_np.trim(),
    type: values.type,
    creditHours: Number(values.credit_hours),
    fullMarks: Number(values.full_marks),
  };
}
