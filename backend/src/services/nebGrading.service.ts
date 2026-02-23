/**
 * NEB (National Examination Board) Grading Service
 * 
 * This service implements Nepal's NEB grading system with 8 grade levels.
 * It provides functions to convert numerical marks to NEB grades and grade points.
 * 
 * Requirements: N1.1, N1.4
 */

export interface NEBGrade {
  grade: string;
  gradePoint: number;
  description: string;
  minMarks: number;
  maxMarks: number;
}

/**
 * NEB Grade Scale Lookup Table
 * Based on Nepal's National Examination Board standards
 * 
 * Grade Scale:
 * - A+: 90-100 marks, 4.0 grade point (Outstanding)
 * - A:  80-89 marks,  3.6 grade point (Excellent)
 * - B+: 70-79 marks,  3.2 grade point (Very Good)
 * - B:  60-69 marks,  2.8 grade point (Good)
 * - C+: 50-59 marks,  2.4 grade point (Satisfactory)
 * - C:  40-49 marks,  2.0 grade point (Acceptable)
 * - D:  32-39 marks,  1.6 grade point (Basic)
 * - NG: 0-31 marks,   0.0 grade point (Not Graded)
 */
export const NEB_GRADE_SCALE: readonly NEBGrade[] = [
  {
    grade: 'A+',
    gradePoint: 4.0,
    description: 'Outstanding',
    minMarks: 90,
    maxMarks: 100,
  },
  {
    grade: 'A',
    gradePoint: 3.6,
    description: 'Excellent',
    minMarks: 80,
    maxMarks: 89,
  },
  {
    grade: 'B+',
    gradePoint: 3.2,
    description: 'Very Good',
    minMarks: 70,
    maxMarks: 79,
  },
  {
    grade: 'B',
    gradePoint: 2.8,
    description: 'Good',
    minMarks: 60,
    maxMarks: 69,
  },
  {
    grade: 'C+',
    gradePoint: 2.4,
    description: 'Satisfactory',
    minMarks: 50,
    maxMarks: 59,
  },
  {
    grade: 'C',
    gradePoint: 2.0,
    description: 'Acceptable',
    minMarks: 40,
    maxMarks: 49,
  },
  {
    grade: 'D',
    gradePoint: 1.6,
    description: 'Basic',
    minMarks: 32,
    maxMarks: 39,
  },
  {
    grade: 'NG',
    gradePoint: 0.0,
    description: 'Not Graded',
    minMarks: 0,
    maxMarks: 31,
  },
] as const;

export interface NEBGradeResult {
  grade: string;
  gradePoint: number;
  description: string;
}

/**
 * Calculate NEB grade and grade point from numerical marks
 * 
 * @param marks - Numerical marks (0-100)
 * @returns NEBGradeResult containing grade, grade point, and description
 * @throws Error if marks are invalid (< 0 or > 100)
 * 
 * @example
 * calculateNEBGrade(95) // Returns { grade: 'A+', gradePoint: 4.0, description: 'Outstanding' }
 * calculateNEBGrade(75) // Returns { grade: 'B+', gradePoint: 3.2, description: 'Very Good' }
 * calculateNEBGrade(30) // Returns { grade: 'NG', gradePoint: 0.0, description: 'Not Graded' }
 */
export function calculateNEBGrade(marks: number): NEBGradeResult {
  // Validate input
  if (typeof marks !== 'number' || isNaN(marks)) {
    throw new Error('Marks must be a valid number');
  }

  if (marks < 0 || marks > 100) {
    throw new Error('Marks must be between 0 and 100');
  }

  // Find the appropriate grade from the lookup table
  // For decimal marks, we use < instead of <= for the upper boundary
  // This ensures 89.5 maps to A, not A+
  for (const gradeInfo of NEB_GRADE_SCALE) {
    if (marks >= gradeInfo.minMarks && marks < gradeInfo.maxMarks + 1) {
      return {
        grade: gradeInfo.grade,
        gradePoint: gradeInfo.gradePoint,
        description: gradeInfo.description,
      };
    }
  }

  // This should never happen if the grade scale is properly defined
  // But as a fallback, return NG (Not Graded)
  throw new Error(`Unable to determine grade for marks: ${marks}`);
}

/**
 * Get grade information by grade string
 * 
 * @param grade - Grade string (e.g., 'A+', 'B', 'NG')
 * @returns NEBGrade information or undefined if not found
 */
export function getGradeInfo(grade: string): NEBGrade | undefined {
  return NEB_GRADE_SCALE.find((g) => g.grade === grade);
}

/**
 * Check if marks are passing (>= 32 marks, grade D or above)
 * 
 * @param marks - Numerical marks (0-100)
 * @returns true if passing, false if failing (NG)
 */
export function isPassing(marks: number): boolean {
  const result = calculateNEBGrade(marks);
  return result.grade !== 'NG';
}

/**
 * Get all available NEB grades
 * 
 * @returns Array of all NEB grade information
 */
export function getAllGrades(): readonly NEBGrade[] {
  return NEB_GRADE_SCALE;
}

/**
 * Subject grade information for GPA calculation
 */
export interface SubjectGrade {
  subjectName: string;
  creditHours: number;
  gradePoint: number;
}

/**
 * Calculate GPA (Grade Point Average) using the NEB formula
 * 
 * Formula: GPA = Σ(Credit Hour × Grade Point) / Total Credit Hours
 * 
 * @param subjects - Array of subject grades with credit hours and grade points
 * @returns GPA rounded to 2 decimal places
 * @throws Error if subjects array is empty or contains invalid data
 * 
 * Requirements: N1.2
 * 
 * @example
 * calculateGPA([
 *   { subjectName: 'Math', creditHours: 4, gradePoint: 4.0 },
 *   { subjectName: 'English', creditHours: 3, gradePoint: 3.6 }
 * ]) // Returns 3.83
 */
export function calculateGPA(subjects: SubjectGrade[]): number {
  // Validate input
  if (!Array.isArray(subjects) || subjects.length === 0) {
    throw new Error('Subjects array must not be empty');
  }

  let totalWeightedPoints = 0;
  let totalCreditHours = 0;

  for (const subject of subjects) {
    // Validate subject data
    if (typeof subject.creditHours !== 'number' || subject.creditHours <= 0) {
      throw new Error(`Invalid credit hours for subject ${subject.subjectName}: ${subject.creditHours}`);
    }

    if (typeof subject.gradePoint !== 'number' || subject.gradePoint < 0 || subject.gradePoint > 4.0) {
      throw new Error(`Invalid grade point for subject ${subject.subjectName}: ${subject.gradePoint}`);
    }

    // Calculate weighted points
    totalWeightedPoints += subject.creditHours * subject.gradePoint;
    totalCreditHours += subject.creditHours;
  }

  // Calculate GPA
  const gpa = totalWeightedPoints / totalCreditHours;

  // Round to 2 decimal places
  return Math.round(gpa * 100) / 100;
}

/**
 * Weighted marks configuration for theory and practical components
 */
export interface WeightedMarksConfig {
  theoryMarks: number;
  practicalMarks: number;
  theoryWeight: number;  // Percentage (0-100)
  practicalWeight: number;  // Percentage (0-100)
}

/**
 * Calculate weighted grade from theory and practical marks
 * 
 * Supports different weight configurations:
 * - Default: 75% theory + 25% practical
 * - 50/50 split for subjects like Computer Science
 * 
 * @param config - Configuration with theory/practical marks and weights
 * @returns Total weighted marks rounded to 2 decimal places
 * @throws Error if weights don't sum to 100 or marks are invalid
 * 
 * Requirements: N1.3
 * 
 * @example
 * // 75% theory + 25% practical (default)
 * calculateWeightedGrade({
 *   theoryMarks: 80,
 *   practicalMarks: 90,
 *   theoryWeight: 75,
 *   practicalWeight: 25
 * }) // Returns 82.5
 * 
 * // 50/50 split
 * calculateWeightedGrade({
 *   theoryMarks: 80,
 *   practicalMarks: 90,
 *   theoryWeight: 50,
 *   practicalWeight: 50
 * }) // Returns 85.0
 */
export function calculateWeightedGrade(config: WeightedMarksConfig): number {
  const { theoryMarks, practicalMarks, theoryWeight, practicalWeight } = config;

  // Validate weights sum to 100
  if (theoryWeight + practicalWeight !== 100) {
    throw new Error(`Weights must sum to 100. Got: ${theoryWeight} + ${practicalWeight} = ${theoryWeight + practicalWeight}`);
  }

  // Validate weights are positive
  if (theoryWeight < 0 || practicalWeight < 0) {
    throw new Error('Weights must be non-negative');
  }

  // Validate marks are within valid range
  if (typeof theoryMarks !== 'number' || theoryMarks < 0 || theoryMarks > 100) {
    throw new Error(`Theory marks must be between 0 and 100. Got: ${theoryMarks}`);
  }

  if (typeof practicalMarks !== 'number' || practicalMarks < 0 || practicalMarks > 100) {
    throw new Error(`Practical marks must be between 0 and 100. Got: ${practicalMarks}`);
  }

  // Calculate weighted marks
  const weightedMarks = (theoryMarks * theoryWeight / 100) + (practicalMarks * practicalWeight / 100);

  // Round to 2 decimal places
  return Math.round(weightedMarks * 100) / 100;
}

/**
 * Calculate aggregate GPA for Class 11-12 students
 * 
 * For NEB Class 11-12, the aggregate GPA is the average of both years' GPAs
 * 
 * @param class11GPA - GPA from Class 11
 * @param class12GPA - GPA from Class 12
 * @returns Aggregate GPA rounded to 2 decimal places
 * @throws Error if GPAs are invalid
 * 
 * Requirements: N1.8
 * 
 * @example
 * calculateAggregateGPA(3.5, 3.7) // Returns 3.6
 */
export function calculateAggregateGPA(class11GPA: number, class12GPA: number): number {
  // Validate GPAs
  if (typeof class11GPA !== 'number' || isNaN(class11GPA) || class11GPA < 0 || class11GPA > 4.0) {
    throw new Error(`Invalid Class 11 GPA: ${class11GPA}. Must be between 0 and 4.0`);
  }

  if (typeof class12GPA !== 'number' || isNaN(class12GPA) || class12GPA < 0 || class12GPA > 4.0) {
    throw new Error(`Invalid Class 12 GPA: ${class12GPA}. Must be between 0 and 4.0`);
  }

  // Calculate average of both years
  const aggregateGPA = (class11GPA + class12GPA) / 2;

  // Round to 2 decimal places
  return Math.round(aggregateGPA * 100) / 100;
}

/**
 * Subject stream types for Classes 11-12
 */
export type SubjectStream = 'science' | 'management' | 'humanities' | 'technical';

/**
 * Subject information for validation
 */
export interface Subject {
  name: string;
  code?: string;
  creditHours: number;
  stream?: SubjectStream;
  isCompulsory?: boolean;
}

/**
 * Subject combination validation result
 */
export interface SubjectCombinationValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Compulsory subjects for Class 11 as per NEB curriculum
 * Requirements: N2.1
 */
export const CLASS_11_COMPULSORY_SUBJECTS = [
  'Nepali',
  'English',
  'Social Studies',
] as const;

/**
 * Compulsory subjects for Class 12 as per NEB curriculum
 * Requirements: N2.2
 */
export const CLASS_12_COMPULSORY_SUBJECTS = [
  'Nepali',
  'English',
  'Life Skill',
] as const;

/**
 * Optional subjects by stream for Classes 11-12
 * Requirements: N2.3
 */
export const STREAM_OPTIONAL_SUBJECTS: Record<SubjectStream, readonly string[]> = {
  science: ['Physics', 'Chemistry', 'Biology', 'Computer Science', 'Mathematics'],
  management: ['Accounting', 'Economics', 'Business Studies', 'Computer Science', 'Finance', 'Marketing'],
  humanities: ['Sociology', 'Political Science', 'History', 'Psychology', 'Education'],
  technical: ['Hotel Management', 'Tourism & Mountaineering'],
} as const;

/**
 * Minimum credit hours per subject as per NEB rules
 * Requirements: N2.5
 */
export const MINIMUM_CREDIT_HOURS_PER_SUBJECT = 100;

/**
 * Minimum and maximum number of optional subjects
 * Requirements: N2.3
 */
export const MIN_OPTIONAL_SUBJECTS = 3;
export const MAX_OPTIONAL_SUBJECTS = 4;

/**
 * Validate subject combination for Class 11 students
 * 
 * Validates:
 * - All compulsory subjects are present (Nepali, English, Social Studies)
 * - Either Mathematics OR Social Studies & Life Skills is present
 * - 3-4 optional subjects from the same stream
 * - All subjects meet minimum credit hours requirement
 * - Optional subjects match the declared stream
 * 
 * @param subjects - Array of subjects the student wants to enroll in
 * @param stream - The stream the student is enrolling in
 * @returns Validation result with errors if any
 * 
 * Requirements: N2.1, N2.3, N2.4, N2.5, N2.7
 */
export function validateClass11SubjectCombination(
  subjects: Subject[],
  stream: SubjectStream
): SubjectCombinationValidationResult {
  const errors: string[] = [];

  // Validate input
  if (!Array.isArray(subjects) || subjects.length === 0) {
    return {
      isValid: false,
      errors: ['Subject list cannot be empty'],
    };
  }

  if (!stream || !['science', 'management', 'humanities', 'technical'].includes(stream)) {
    return {
      isValid: false,
      errors: [`Invalid stream: ${stream}. Must be one of: science, management, humanities, technical`],
    };
  }

  const subjectNames = subjects.map(s => s.name);

  // Check compulsory subjects (Nepali, English, Social Studies)
  for (const compulsorySubject of CLASS_11_COMPULSORY_SUBJECTS) {
    if (!subjectNames.includes(compulsorySubject)) {
      errors.push(`Missing compulsory subject: ${compulsorySubject}`);
    }
  }

  // Check Mathematics OR Social Studies & Life Skills requirement
  const hasMathematics = subjectNames.includes('Mathematics');
  const hasSocialStudiesAndLifeSkills = subjectNames.includes('Social Studies') && subjectNames.includes('Life Skills');
  
  if (!hasMathematics && !hasSocialStudiesAndLifeSkills) {
    errors.push('Must have either Mathematics OR both Social Studies & Life Skills');
  }

  // Separate optional subjects from compulsory ones
  // Compulsory subjects include: Nepali, English, Social Studies
  // Plus either Mathematics OR Life Skills (depending on which requirement is satisfied)
  const compulsorySubjectNames: string[] = [...CLASS_11_COMPULSORY_SUBJECTS];
  
  // If using Mathematics to satisfy the requirement, it's compulsory
  // But if BOTH Mathematics and Life Skills are present, prefer Life Skills as compulsory
  // and treat Mathematics as optional
  if (hasMathematics && !hasSocialStudiesAndLifeSkills) {
    compulsorySubjectNames.push('Mathematics');
  }
  
  // If using Social Studies & Life Skills, Life Skills is compulsory
  if (hasSocialStudiesAndLifeSkills) {
    compulsorySubjectNames.push('Life Skills');
  }
  
  const optionalSubjects = subjects.filter(s => !compulsorySubjectNames.includes(s.name));

  // Check number of optional subjects (3-4)
  if (optionalSubjects.length < MIN_OPTIONAL_SUBJECTS) {
    errors.push(`Must select at least ${MIN_OPTIONAL_SUBJECTS} optional subjects. Currently selected: ${optionalSubjects.length}`);
  }

  if (optionalSubjects.length > MAX_OPTIONAL_SUBJECTS) {
    errors.push(`Cannot select more than ${MAX_OPTIONAL_SUBJECTS} optional subjects. Currently selected: ${optionalSubjects.length}`);
  }

  // Validate optional subjects belong to the declared stream
  const validOptionalSubjects = STREAM_OPTIONAL_SUBJECTS[stream];
  for (const optionalSubject of optionalSubjects) {
    if (!validOptionalSubjects.includes(optionalSubject.name)) {
      errors.push(`Subject "${optionalSubject.name}" is not valid for ${stream} stream. Valid subjects: ${validOptionalSubjects.join(', ')}`);
    }
  }

  // Validate minimum credit hours for all subjects
  for (const subject of subjects) {
    if (subject.creditHours < MINIMUM_CREDIT_HOURS_PER_SUBJECT) {
      errors.push(`Subject "${subject.name}" has insufficient credit hours: ${subject.creditHours}. Minimum required: ${MINIMUM_CREDIT_HOURS_PER_SUBJECT}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate subject combination for Class 12 students
 * 
 * Validates:
 * - All compulsory subjects are present (Nepali, English, Life Skill)
 * - 3-4 optional subjects from the same stream
 * - All subjects meet minimum credit hours requirement
 * - Optional subjects match the declared stream
 * 
 * @param subjects - Array of subjects the student wants to enroll in
 * @param stream - The stream the student is enrolling in
 * @returns Validation result with errors if any
 * 
 * Requirements: N2.2, N2.3, N2.4, N2.5, N2.7
 */
export function validateClass12SubjectCombination(
  subjects: Subject[],
  stream: SubjectStream
): SubjectCombinationValidationResult {
  const errors: string[] = [];

  // Validate input
  if (!Array.isArray(subjects) || subjects.length === 0) {
    return {
      isValid: false,
      errors: ['Subject list cannot be empty'],
    };
  }

  if (!stream || !['science', 'management', 'humanities', 'technical'].includes(stream)) {
    return {
      isValid: false,
      errors: [`Invalid stream: ${stream}. Must be one of: science, management, humanities, technical`],
    };
  }

  const subjectNames = subjects.map(s => s.name);

  // Check compulsory subjects (Nepali, English, Life Skill)
  for (const compulsorySubject of CLASS_12_COMPULSORY_SUBJECTS) {
    if (!subjectNames.includes(compulsorySubject)) {
      errors.push(`Missing compulsory subject: ${compulsorySubject}`);
    }
  }

  // Separate optional subjects from compulsory ones
  const optionalSubjects = subjects.filter(s => !CLASS_12_COMPULSORY_SUBJECTS.includes(s.name as any));

  // Check number of optional subjects (3-4)
  if (optionalSubjects.length < MIN_OPTIONAL_SUBJECTS) {
    errors.push(`Must select at least ${MIN_OPTIONAL_SUBJECTS} optional subjects. Currently selected: ${optionalSubjects.length}`);
  }

  if (optionalSubjects.length > MAX_OPTIONAL_SUBJECTS) {
    errors.push(`Cannot select more than ${MAX_OPTIONAL_SUBJECTS} optional subjects. Currently selected: ${optionalSubjects.length}`);
  }

  // Validate optional subjects belong to the declared stream
  const validOptionalSubjects = STREAM_OPTIONAL_SUBJECTS[stream];
  for (const optionalSubject of optionalSubjects) {
    if (!validOptionalSubjects.includes(optionalSubject.name)) {
      errors.push(`Subject "${optionalSubject.name}" is not valid for ${stream} stream. Valid subjects: ${validOptionalSubjects.join(', ')}`);
    }
  }

  // Validate minimum credit hours for all subjects
  for (const subject of subjects) {
    if (subject.creditHours < MINIMUM_CREDIT_HOURS_PER_SUBJECT) {
      errors.push(`Subject "${subject.name}" has insufficient credit hours: ${subject.creditHours}. Minimum required: ${MINIMUM_CREDIT_HOURS_PER_SUBJECT}`);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validate subject combination for Classes 11-12
 * 
 * This is a convenience function that routes to the appropriate validator
 * based on the class level.
 * 
 * @param subjects - Array of subjects the student wants to enroll in
 * @param stream - The stream the student is enrolling in
 * @param classLevel - The class level (11 or 12)
 * @returns Validation result with errors if any
 * 
 * Requirements: N2.1-N2.7
 */
export function validateSubjectCombination(
  subjects: Subject[],
  stream: SubjectStream,
  classLevel: 11 | 12
): SubjectCombinationValidationResult {
  if (classLevel === 11) {
    return validateClass11SubjectCombination(subjects, stream);
  } else if (classLevel === 12) {
    return validateClass12SubjectCombination(subjects, stream);
  } else {
    return {
      isValid: false,
      errors: [`Invalid class level: ${classLevel}. Subject combination validation is only for Classes 11 and 12`],
    };
  }
}

/**
 * Maximum number of subjects allowed for grade improvement
 * Requirements: N1.6
 */
export const MAX_GRADE_IMPROVEMENT_SUBJECTS = 2;

/**
 * Maximum number of re-examination attempts per subject
 * Requirements: N1.7
 */
export const MAX_REEXAMINATION_ATTEMPTS = 3;

/**
 * Grade improvement attempt record
 */
export interface GradeImprovementAttempt {
  attemptNumber: number;
  examDate: string;
  marks: number;
  grade: string;
  gradePoint: number;
  attemptDate: Date;
}

/**
 * Grade improvement record for a subject
 */
export interface GradeImprovementRecord {
  studentId: string;
  subjectId: string;
  subjectName: string;
  originalMarks: number;
  originalGrade: string;
  originalGradePoint: number;
  attempts: GradeImprovementAttempt[];
  currentMarks: number;
  currentGrade: string;
  currentGradePoint: number;
  status: 'active' | 'completed' | 'exhausted';
}

/**
 * Grade improvement tracking for a student
 */
export interface StudentGradeImprovement {
  studentId: string;
  academicYearId: string;
  subjects: GradeImprovementRecord[];
}

/**
 * Result of grade improvement validation
 */
export interface GradeImprovementValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate if a student can register for grade improvement in a subject
 * 
 * Validates:
 * - Student hasn't exceeded maximum of 2 subjects for grade improvement
 * - Subject hasn't exceeded maximum of 3 re-examination attempts
 * - Subject is not already at maximum grade (A+)
 * 
 * @param studentImprovement - Current grade improvement records for the student
 * @param subjectId - Subject ID to register for improvement
 * @returns Validation result with errors if any
 * 
 * Requirements: N1.6, N1.7
 */
export function validateGradeImprovementRegistration(
  studentImprovement: StudentGradeImprovement,
  subjectId: string
): GradeImprovementValidationResult {
  const errors: string[] = [];

  // Check if student already has 2 subjects registered for grade improvement
  const activeSubjects = studentImprovement.subjects.filter(
    s => s.status === 'active' || s.status === 'completed'
  );

  // Check if this is a new subject or an existing one
  const existingSubject = studentImprovement.subjects.find(s => s.subjectId === subjectId);

  if (!existingSubject && activeSubjects.length >= MAX_GRADE_IMPROVEMENT_SUBJECTS) {
    errors.push(
      `Cannot register for grade improvement. Maximum ${MAX_GRADE_IMPROVEMENT_SUBJECTS} subjects allowed. ` +
      `Currently registered: ${activeSubjects.length}`
    );
  }

  // If subject already exists, check attempt count
  if (existingSubject) {
    if (existingSubject.attempts.length >= MAX_REEXAMINATION_ATTEMPTS) {
      errors.push(
        `Cannot register for re-examination. Maximum ${MAX_REEXAMINATION_ATTEMPTS} attempts allowed. ` +
        `Current attempts: ${existingSubject.attempts.length}`
      );
    }

    if (existingSubject.status === 'exhausted') {
      errors.push(
        `Cannot register for re-examination. All ${MAX_REEXAMINATION_ATTEMPTS} attempts have been exhausted for this subject.`
      );
    }

    // Check if already at maximum grade
    if (existingSubject.currentGrade === 'A+') {
      errors.push(
        `Cannot register for grade improvement. Subject already has the maximum grade (A+).`
      );
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Record a grade improvement attempt for a subject
 * 
 * @param record - Existing grade improvement record for the subject
 * @param attemptMarks - Marks obtained in the re-examination
 * @param examDate - Date of the re-examination
 * @returns Updated grade improvement record
 * @throws Error if maximum attempts exceeded or invalid marks
 * 
 * Requirements: N1.7
 */
export function recordGradeImprovementAttempt(
  record: GradeImprovementRecord,
  attemptMarks: number,
  examDate: string
): GradeImprovementRecord {
  // Validate marks
  if (typeof attemptMarks !== 'number' || attemptMarks < 0 || attemptMarks > 100) {
    throw new Error(`Invalid marks: ${attemptMarks}. Must be between 0 and 100`);
  }

  // Check if maximum attempts exceeded
  if (record.attempts.length >= MAX_REEXAMINATION_ATTEMPTS) {
    throw new Error(
      `Cannot record attempt. Maximum ${MAX_REEXAMINATION_ATTEMPTS} attempts already reached.`
    );
  }

  // Calculate grade for the attempt
  const gradeResult = calculateNEBGrade(attemptMarks);

  // Create new attempt record
  const newAttempt: GradeImprovementAttempt = {
    attemptNumber: record.attempts.length + 1,
    examDate,
    marks: attemptMarks,
    grade: gradeResult.grade,
    gradePoint: gradeResult.gradePoint,
    attemptDate: new Date(),
  };

  // Update record with new attempt
  const updatedAttempts = [...record.attempts, newAttempt];

  // Determine if this is the best score
  const bestAttempt = updatedAttempts.reduce((best, current) => 
    current.marks > best.marks ? current : best
  );

  // Use the better of original or best attempt
  const useBestAttempt = bestAttempt.marks > record.originalMarks;
  const currentMarks = useBestAttempt ? bestAttempt.marks : record.originalMarks;
  const currentGrade = useBestAttempt ? bestAttempt.grade : record.originalGrade;
  const currentGradePoint = useBestAttempt ? bestAttempt.gradePoint : record.originalGradePoint;

  // Determine status
  let status: 'active' | 'completed' | 'exhausted' = 'active';
  if (updatedAttempts.length >= MAX_REEXAMINATION_ATTEMPTS) {
    status = 'exhausted';
  } else if (currentGrade === 'A+') {
    status = 'completed';
  }

  return {
    ...record,
    attempts: updatedAttempts,
    currentMarks,
    currentGrade,
    currentGradePoint,
    status,
  };
}

/**
 * Create a new grade improvement record for a subject
 * 
 * @param studentId - Student ID
 * @param subjectId - Subject ID
 * @param subjectName - Subject name
 * @param originalMarks - Original marks obtained
 * @returns New grade improvement record
 * 
 * Requirements: N1.6, N1.7
 */
export function createGradeImprovementRecord(
  studentId: string,
  subjectId: string,
  subjectName: string,
  originalMarks: number
): GradeImprovementRecord {
  // Validate marks
  if (typeof originalMarks !== 'number' || originalMarks < 0 || originalMarks > 100) {
    throw new Error(`Invalid original marks: ${originalMarks}. Must be between 0 and 100`);
  }

  const gradeResult = calculateNEBGrade(originalMarks);

  return {
    studentId,
    subjectId,
    subjectName,
    originalMarks,
    originalGrade: gradeResult.grade,
    originalGradePoint: gradeResult.gradePoint,
    attempts: [],
    currentMarks: originalMarks,
    currentGrade: gradeResult.grade,
    currentGradePoint: gradeResult.gradePoint,
    status: 'active',
  };
}

/**
 * Get grade improvement history for a subject
 * 
 * Returns a formatted history showing all attempts and improvements
 * 
 * @param record - Grade improvement record
 * @returns Array of history entries
 */
export function getGradeImprovementHistory(record: GradeImprovementRecord): string[] {
  const history: string[] = [];

  history.push(
    `Original: ${record.originalMarks} marks (${record.originalGrade}, ${record.originalGradePoint} GP)`
  );

  for (const attempt of record.attempts) {
    const improvement = attempt.marks > record.originalMarks ? 
      `+${attempt.marks - record.originalMarks}` : 
      `${attempt.marks - record.originalMarks}`;
    
    history.push(
      `Attempt ${attempt.attemptNumber} (${attempt.examDate}): ${attempt.marks} marks ` +
      `(${attempt.grade}, ${attempt.gradePoint} GP) [${improvement}]`
    );
  }

  history.push(
    `Current Best: ${record.currentMarks} marks (${record.currentGrade}, ${record.currentGradePoint} GP)`
  );

  return history;
}
