export interface ClassFormData {
  grade_level: string;
  section: string;
  capacity: string;
}

export interface ClassFormErrors {
  grade_level?: string;
  section?: string;
  capacity?: string;
}

export function validateClassForm(form: ClassFormData): ClassFormErrors {
  const errors: ClassFormErrors = {};
  const gradeLevel = Number(form.grade_level);
  const section = form.section.trim();
  const capacity = form.capacity.trim();

  if (!form.grade_level) {
    errors.grade_level = 'gradeRequired';
  } else if (!Number.isInteger(gradeLevel) || gradeLevel < 1 || gradeLevel > 12) {
    errors.grade_level = 'gradeRange';
  }

  if (!section) {
    errors.section = 'sectionRequired';
  } else if (section.length > 10) {
    errors.section = 'sectionLength';
  }

  if (capacity) {
    const capacityValue = Number(capacity);
    if (!Number.isInteger(capacityValue) || capacityValue < 1 || capacityValue > 100) {
      errors.capacity = 'capacityRange';
    }
  }

  return errors;
}
