/**
 * Property-Based Tests for NEB Subject Combination Validation
 * 
 * Uses fast-check to verify universal properties of subject combination validation
 * for Classes 11-12 as per NEB curriculum rules.
 * 
 * Task: 12.7 Write property test for subject combination validation
 * Property 5: Subject Combination Validation
 * Validates: Requirements N2.4
 */

import * as fc from 'fast-check';
import {
  validateClass11SubjectCombination,
  validateClass12SubjectCombination,
  validateSubjectCombination,
  Subject,
  SubjectStream,
  CLASS_11_COMPULSORY_SUBJECTS,
  CLASS_12_COMPULSORY_SUBJECTS,
  STREAM_OPTIONAL_SUBJECTS,
  MIN_OPTIONAL_SUBJECTS,
  MAX_OPTIONAL_SUBJECTS,
} from '../nebGrading.service';

describe('NEB Subject Combination Validation - Property-Based Tests', () => {
  describe('Property 5: Subject Combination Validation', () => {
    /**
     * **Validates: Requirements N2.4**
     * 
     * Property: For any subject combination for Classes 11-12, if it violates NEB rules
     * (e.g., missing compulsory subjects, invalid stream combinations), the enrollment
     * should be rejected with a descriptive error.
     * 
     * This test verifies that:
     * 1. Invalid combinations are rejected with descriptive errors
     * 2. Valid combinations are accepted
     * 3. Edge cases are handled correctly
     */

    // Helper function to create a valid subject
    const createSubject = (name: string, creditHours: number = 100): Subject => ({
      name,
      creditHours,
    });

    // Arbitrary for generating valid streams
    const streamArbitrary = fc.constantFrom<SubjectStream>(
      'science',
      'management',
      'humanities',
      'technical'
    );

    // Arbitrary for generating credit hours
    const validCreditHoursArbitrary = fc.integer({ min: 100, max: 200 });
    const invalidCreditHoursArbitrary = fc.integer({ min: 1, max: 99 });

    describe('Class 11 Subject Combination Validation', () => {
      /**
       * Property: Valid Class 11 combinations should be accepted
       * 
       * A valid combination includes:
       * - All compulsory subjects (Nepali, English, Social Studies)
       * - Either Mathematics OR Social Studies & Life Skills
       * - 3-4 optional subjects from the declared stream
       * - All subjects meet minimum credit hours
       */
      it('should accept valid Class 11 subject combinations', () => {
        fc.assert(
          fc.property(
            streamArbitrary,
            fc.integer({ min: MIN_OPTIONAL_SUBJECTS, max: MAX_OPTIONAL_SUBJECTS }),
            validCreditHoursArbitrary,
            (stream, numOptionalSubjects, creditHours) => {
              // Get available optional subjects for this stream
              const availableOptionalSubjects = STREAM_OPTIONAL_SUBJECTS[stream].filter(
                s => s !== 'Mathematics' // Exclude Mathematics as it's used for compulsory requirement
              );

              // Skip if stream doesn't have enough optional subjects
              // (e.g., technical stream only has 2 subjects)
              fc.pre(availableOptionalSubjects.length >= numOptionalSubjects);

              // Build a valid subject combination
              const subjects: Subject[] = [];

              // Add compulsory subjects
              subjects.push(createSubject('Nepali', creditHours));
              subjects.push(createSubject('English', creditHours));
              subjects.push(createSubject('Social Studies', creditHours));

              // Add Mathematics to satisfy the requirement
              subjects.push(createSubject('Mathematics', creditHours));

              // Add optional subjects from the stream
              for (let i = 0; i < numOptionalSubjects && i < availableOptionalSubjects.length; i++) {
                subjects.push(createSubject(availableOptionalSubjects[i], creditHours));
              }

              const result = validateClass11SubjectCombination(subjects, stream);

              // Valid combinations should be accepted
              expect(result.isValid).toBe(true);
              expect(result.errors).toHaveLength(0);
            }
          ),
          {
            numRuns: 100,
            verbose: true,
          }
        );
      });

      /**
       * Property: Missing compulsory subjects should be rejected
       * 
       * If any compulsory subject (Nepali, English, Social Studies) is missing,
       * the combination should be rejected with a descriptive error.
       */
      it('should reject Class 11 combinations missing compulsory subjects', () => {
        fc.assert(
          fc.property(
            streamArbitrary,
            fc.constantFrom<typeof CLASS_11_COMPULSORY_SUBJECTS[number]>(
              'Nepali',
              'English',
              'Social Studies'
            ),
            validCreditHoursArbitrary,
            (stream, missingSubject, creditHours) => {
              // Build a combination missing one compulsory subject
              const subjects: Subject[] = [];

              // Add compulsory subjects except the missing one
              for (const subject of CLASS_11_COMPULSORY_SUBJECTS) {
                if (subject !== missingSubject) {
                  subjects.push(createSubject(subject, creditHours));
                }
              }

              // Add Mathematics
              subjects.push(createSubject('Mathematics', creditHours));

              // Add some optional subjects
              const optionalSubjects = STREAM_OPTIONAL_SUBJECTS[stream];
              for (let i = 0; i < MIN_OPTIONAL_SUBJECTS; i++) {
                if (optionalSubjects[i] && optionalSubjects[i] !== 'Mathematics') {
                  subjects.push(createSubject(optionalSubjects[i], creditHours));
                }
              }

              const result = validateClass11SubjectCombination(subjects, stream);

              // Should be rejected
              expect(result.isValid).toBe(false);
              expect(result.errors.length).toBeGreaterThan(0);
              
              // Should have error about missing compulsory subject
              const hasCompulsoryError = result.errors.some(
                error => error.includes('Missing compulsory subject') && error.includes(missingSubject)
              );
              expect(hasCompulsoryError).toBe(true);
            }
          ),
          {
            numRuns: 50,
            verbose: true,
          }
        );
      });

      /**
       * Property: Missing Mathematics OR Social Studies & Life Skills should be rejected
       * 
       * Class 11 requires either Mathematics OR both Social Studies & Life Skills.
       * If neither requirement is satisfied, the combination should be rejected.
       */
      it('should reject Class 11 combinations without Mathematics OR Social Studies & Life Skills', () => {
        fc.assert(
          fc.property(
            streamArbitrary,
            validCreditHoursArbitrary,
            (stream, creditHours) => {
              // Build a combination without Mathematics and without Life Skills
              const subjects: Subject[] = [];

              // Add compulsory subjects
              subjects.push(createSubject('Nepali', creditHours));
              subjects.push(createSubject('English', creditHours));
              subjects.push(createSubject('Social Studies', creditHours));
              // Note: NOT adding Mathematics or Life Skills

              // Add optional subjects
              const optionalSubjects = STREAM_OPTIONAL_SUBJECTS[stream].filter(
                s => s !== 'Mathematics' // Exclude Mathematics from optional
              );
              for (let i = 0; i < MIN_OPTIONAL_SUBJECTS && i < optionalSubjects.length; i++) {
                subjects.push(createSubject(optionalSubjects[i], creditHours));
              }

              const result = validateClass11SubjectCombination(subjects, stream);

              // Should be rejected
              expect(result.isValid).toBe(false);
              expect(result.errors.length).toBeGreaterThan(0);
              
              // Should have error about Mathematics OR Social Studies & Life Skills
              const hasRequirementError = result.errors.some(
                error => error.includes('Mathematics OR') && error.includes('Life Skills')
              );
              expect(hasRequirementError).toBe(true);
            }
          ),
          {
            numRuns: 50,
            verbose: true,
          }
        );
      });

      /**
       * Property: Too few optional subjects should be rejected
       * 
       * Class 11 requires at least 3 optional subjects.
       */
      it('should reject Class 11 combinations with too few optional subjects', () => {
        fc.assert(
          fc.property(
            streamArbitrary,
            fc.integer({ min: 0, max: MIN_OPTIONAL_SUBJECTS - 1 }),
            validCreditHoursArbitrary,
            (stream, numOptionalSubjects, creditHours) => {
              // Build a combination with too few optional subjects
              const subjects: Subject[] = [];

              // Add compulsory subjects
              subjects.push(createSubject('Nepali', creditHours));
              subjects.push(createSubject('English', creditHours));
              subjects.push(createSubject('Social Studies', creditHours));
              subjects.push(createSubject('Mathematics', creditHours));

              // Add fewer than minimum optional subjects
              const optionalSubjects = STREAM_OPTIONAL_SUBJECTS[stream].filter(
                s => s !== 'Mathematics'
              );
              for (let i = 0; i < numOptionalSubjects && i < optionalSubjects.length; i++) {
                subjects.push(createSubject(optionalSubjects[i], creditHours));
              }

              const result = validateClass11SubjectCombination(subjects, stream);

              // Should be rejected
              expect(result.isValid).toBe(false);
              expect(result.errors.length).toBeGreaterThan(0);
              
              // Should have error about minimum optional subjects
              const hasMinError = result.errors.some(
                error => error.includes('Must select at least') && error.includes('optional subjects')
              );
              expect(hasMinError).toBe(true);
            }
          ),
          {
            numRuns: 50,
            verbose: true,
          }
        );
      });

      /**
       * Property: Too many optional subjects should be rejected
       * 
       * Class 11 allows at most 4 optional subjects.
       */
      it('should reject Class 11 combinations with too many optional subjects', () => {
        fc.assert(
          fc.property(
            streamArbitrary,
            fc.integer({ min: MAX_OPTIONAL_SUBJECTS + 1, max: MAX_OPTIONAL_SUBJECTS + 3 }),
            validCreditHoursArbitrary,
            (stream, numOptionalSubjects, creditHours) => {
              // Build a combination with too many optional subjects
              const subjects: Subject[] = [];

              // Add compulsory subjects
              subjects.push(createSubject('Nepali', creditHours));
              subjects.push(createSubject('English', creditHours));
              subjects.push(createSubject('Social Studies', creditHours));
              subjects.push(createSubject('Mathematics', creditHours));

              // Add more than maximum optional subjects
              const optionalSubjects = STREAM_OPTIONAL_SUBJECTS[stream].filter(
                s => s !== 'Mathematics'
              );
              
              // If stream doesn't have enough subjects, add duplicates with different names
              for (let i = 0; i < numOptionalSubjects; i++) {
                if (i < optionalSubjects.length) {
                  subjects.push(createSubject(optionalSubjects[i], creditHours));
                } else {
                  // Add extra subjects with unique names
                  subjects.push(createSubject(`Extra Subject ${i}`, creditHours));
                }
              }

              const result = validateClass11SubjectCombination(subjects, stream);

              // Should be rejected
              expect(result.isValid).toBe(false);
              expect(result.errors.length).toBeGreaterThan(0);
              
              // Should have error about maximum optional subjects OR invalid subjects
              const hasMaxError = result.errors.some(
                error => error.includes('Cannot select more than') || error.includes('not valid for')
              );
              expect(hasMaxError).toBe(true);
            }
          ),
          {
            numRuns: 50,
            verbose: true,
          }
        );
      });

      /**
       * Property: Optional subjects not matching stream should be rejected
       * 
       * Optional subjects must belong to the declared stream.
       */
      it('should reject Class 11 combinations with optional subjects from wrong stream', () => {
        fc.assert(
          fc.property(
            streamArbitrary,
            streamArbitrary,
            validCreditHoursArbitrary,
            (declaredStream, wrongStream, creditHours) => {
              // Only test when streams are different
              fc.pre(declaredStream !== wrongStream);

              // Build a combination with subjects from wrong stream
              const subjects: Subject[] = [];

              // Add compulsory subjects
              subjects.push(createSubject('Nepali', creditHours));
              subjects.push(createSubject('English', creditHours));
              subjects.push(createSubject('Social Studies', creditHours));
              subjects.push(createSubject('Mathematics', creditHours));

              // Add optional subjects from WRONG stream
              const wrongStreamSubjects = STREAM_OPTIONAL_SUBJECTS[wrongStream].filter(
                s => !STREAM_OPTIONAL_SUBJECTS[declaredStream].includes(s)
              );

              // Add at least one subject from wrong stream
              if (wrongStreamSubjects.length > 0) {
                subjects.push(createSubject(wrongStreamSubjects[0], creditHours));

                // Add more subjects from declared stream to meet minimum
                const correctStreamSubjects = STREAM_OPTIONAL_SUBJECTS[declaredStream].filter(
                  s => s !== 'Mathematics'
                );
                for (let i = 0; i < MIN_OPTIONAL_SUBJECTS - 1 && i < correctStreamSubjects.length; i++) {
                  subjects.push(createSubject(correctStreamSubjects[i], creditHours));
                }

                const result = validateClass11SubjectCombination(subjects, declaredStream);

                // Should be rejected
                expect(result.isValid).toBe(false);
                expect(result.errors.length).toBeGreaterThan(0);
                
                // Should have error about invalid subject for stream
                const hasStreamError = result.errors.some(
                  error => error.includes('not valid for') && error.includes('stream')
                );
                expect(hasStreamError).toBe(true);
              }
            }
          ),
          {
            numRuns: 50,
            verbose: true,
          }
        );
      });

      /**
       * Property: Subjects with insufficient credit hours should be rejected
       * 
       * All subjects must meet the minimum credit hours requirement (100 hours).
       */
      it('should reject Class 11 combinations with insufficient credit hours', () => {
        fc.assert(
          fc.property(
            streamArbitrary,
            invalidCreditHoursArbitrary,
            validCreditHoursArbitrary,
            (stream, invalidCreditHours, validCreditHours) => {
              // Build a combination with one subject having insufficient credit hours
              const subjects: Subject[] = [];

              // Add compulsory subjects (one with invalid credit hours)
              subjects.push(createSubject('Nepali', invalidCreditHours)); // Invalid!
              subjects.push(createSubject('English', validCreditHours));
              subjects.push(createSubject('Social Studies', validCreditHours));
              subjects.push(createSubject('Mathematics', validCreditHours));

              // Add optional subjects
              const optionalSubjects = STREAM_OPTIONAL_SUBJECTS[stream].filter(
                s => s !== 'Mathematics'
              );
              for (let i = 0; i < MIN_OPTIONAL_SUBJECTS && i < optionalSubjects.length; i++) {
                subjects.push(createSubject(optionalSubjects[i], validCreditHours));
              }

              const result = validateClass11SubjectCombination(subjects, stream);

              // Should be rejected
              expect(result.isValid).toBe(false);
              expect(result.errors.length).toBeGreaterThan(0);
              
              // Should have error about insufficient credit hours
              const hasCreditError = result.errors.some(
                error => error.includes('insufficient credit hours') && error.includes('Nepali')
              );
              expect(hasCreditError).toBe(true);
            }
          ),
          {
            numRuns: 50,
            verbose: true,
          }
        );
      });

      /**
       * Property: Empty subject list should be rejected
       * 
       * Subject list cannot be empty.
       */
      it('should reject empty subject list for Class 11', () => {
        fc.assert(
          fc.property(
            streamArbitrary,
            (stream) => {
              const result = validateClass11SubjectCombination([], stream);

              // Should be rejected
              expect(result.isValid).toBe(false);
              expect(result.errors.length).toBeGreaterThan(0);
              
              // Should have error about empty list
              const hasEmptyError = result.errors.some(
                error => error.includes('cannot be empty')
              );
              expect(hasEmptyError).toBe(true);
            }
          ),
          {
            numRuns: 20,
            verbose: true,
          }
        );
      });

      /**
       * Property: Invalid stream should be rejected
       * 
       * Stream must be one of: science, management, humanities, technical
       */
      it('should reject invalid stream for Class 11', () => {
        fc.assert(
          fc.property(
            fc.string({ minLength: 1, maxLength: 20 }).filter(
              s => !['science', 'management', 'humanities', 'technical'].includes(s)
            ),
            validCreditHoursArbitrary,
            (invalidStream, creditHours) => {
              // Build a valid combination but with invalid stream
              const subjects: Subject[] = [];

              subjects.push(createSubject('Nepali', creditHours));
              subjects.push(createSubject('English', creditHours));
              subjects.push(createSubject('Social Studies', creditHours));
              subjects.push(createSubject('Mathematics', creditHours));

              const result = validateClass11SubjectCombination(
                subjects,
                invalidStream as SubjectStream
              );

              // Should be rejected
              expect(result.isValid).toBe(false);
              expect(result.errors.length).toBeGreaterThan(0);
              
              // Should have error about invalid stream
              const hasStreamError = result.errors.some(
                error => error.includes('Invalid stream')
              );
              expect(hasStreamError).toBe(true);
            }
          ),
          {
            numRuns: 30,
            verbose: true,
          }
        );
      });
    });

    describe('Class 12 Subject Combination Validation', () => {
      /**
       * Property: Valid Class 12 combinations should be accepted
       * 
       * A valid combination includes:
       * - All compulsory subjects (Nepali, English, Life Skill)
       * - 3-4 optional subjects from the declared stream
       * - All subjects meet minimum credit hours
       */
      it('should accept valid Class 12 subject combinations', () => {
        fc.assert(
          fc.property(
            streamArbitrary,
            fc.integer({ min: MIN_OPTIONAL_SUBJECTS, max: MAX_OPTIONAL_SUBJECTS }),
            validCreditHoursArbitrary,
            (stream, numOptionalSubjects, creditHours) => {
              // Get available optional subjects for this stream
              const availableOptionalSubjects = STREAM_OPTIONAL_SUBJECTS[stream];

              // Skip if stream doesn't have enough optional subjects
              // (e.g., technical stream only has 2 subjects)
              fc.pre(availableOptionalSubjects.length >= numOptionalSubjects);

              // Build a valid subject combination
              const subjects: Subject[] = [];

              // Add compulsory subjects
              subjects.push(createSubject('Nepali', creditHours));
              subjects.push(createSubject('English', creditHours));
              subjects.push(createSubject('Life Skill', creditHours));

              // Add optional subjects from the stream
              for (let i = 0; i < numOptionalSubjects && i < availableOptionalSubjects.length; i++) {
                subjects.push(createSubject(availableOptionalSubjects[i], creditHours));
              }

              const result = validateClass12SubjectCombination(subjects, stream);

              // Valid combinations should be accepted
              expect(result.isValid).toBe(true);
              expect(result.errors).toHaveLength(0);
            }
          ),
          {
            numRuns: 100,
            verbose: true,
          }
        );
      });

      /**
       * Property: Missing compulsory subjects should be rejected
       * 
       * If any compulsory subject (Nepali, English, Life Skill) is missing,
       * the combination should be rejected with a descriptive error.
       */
      it('should reject Class 12 combinations missing compulsory subjects', () => {
        fc.assert(
          fc.property(
            streamArbitrary,
            fc.constantFrom<typeof CLASS_12_COMPULSORY_SUBJECTS[number]>(
              'Nepali',
              'English',
              'Life Skill'
            ),
            validCreditHoursArbitrary,
            (stream, missingSubject, creditHours) => {
              // Build a combination missing one compulsory subject
              const subjects: Subject[] = [];

              // Add compulsory subjects except the missing one
              for (const subject of CLASS_12_COMPULSORY_SUBJECTS) {
                if (subject !== missingSubject) {
                  subjects.push(createSubject(subject, creditHours));
                }
              }

              // Add some optional subjects
              const optionalSubjects = STREAM_OPTIONAL_SUBJECTS[stream];
              for (let i = 0; i < MIN_OPTIONAL_SUBJECTS && i < optionalSubjects.length; i++) {
                subjects.push(createSubject(optionalSubjects[i], creditHours));
              }

              const result = validateClass12SubjectCombination(subjects, stream);

              // Should be rejected
              expect(result.isValid).toBe(false);
              expect(result.errors.length).toBeGreaterThan(0);
              
              // Should have error about missing compulsory subject
              const hasCompulsoryError = result.errors.some(
                error => error.includes('Missing compulsory subject') && error.includes(missingSubject)
              );
              expect(hasCompulsoryError).toBe(true);
            }
          ),
          {
            numRuns: 50,
            verbose: true,
          }
        );
      });

      /**
       * Property: Too few optional subjects should be rejected
       * 
       * Class 12 requires at least 3 optional subjects.
       */
      it('should reject Class 12 combinations with too few optional subjects', () => {
        fc.assert(
          fc.property(
            streamArbitrary,
            fc.integer({ min: 0, max: MIN_OPTIONAL_SUBJECTS - 1 }),
            validCreditHoursArbitrary,
            (stream, numOptionalSubjects, creditHours) => {
              // Build a combination with too few optional subjects
              const subjects: Subject[] = [];

              // Add compulsory subjects
              subjects.push(createSubject('Nepali', creditHours));
              subjects.push(createSubject('English', creditHours));
              subjects.push(createSubject('Life Skill', creditHours));

              // Add fewer than minimum optional subjects
              const optionalSubjects = STREAM_OPTIONAL_SUBJECTS[stream];
              for (let i = 0; i < numOptionalSubjects && i < optionalSubjects.length; i++) {
                subjects.push(createSubject(optionalSubjects[i], creditHours));
              }

              const result = validateClass12SubjectCombination(subjects, stream);

              // Should be rejected
              expect(result.isValid).toBe(false);
              expect(result.errors.length).toBeGreaterThan(0);
              
              // Should have error about minimum optional subjects
              const hasMinError = result.errors.some(
                error => error.includes('Must select at least') && error.includes('optional subjects')
              );
              expect(hasMinError).toBe(true);
            }
          ),
          {
            numRuns: 50,
            verbose: true,
          }
        );
      });

      /**
       * Property: Optional subjects not matching stream should be rejected
       * 
       * Optional subjects must belong to the declared stream.
       */
      it('should reject Class 12 combinations with optional subjects from wrong stream', () => {
        fc.assert(
          fc.property(
            streamArbitrary,
            streamArbitrary,
            validCreditHoursArbitrary,
            (declaredStream, wrongStream, creditHours) => {
              // Only test when streams are different
              fc.pre(declaredStream !== wrongStream);

              // Build a combination with subjects from wrong stream
              const subjects: Subject[] = [];

              // Add compulsory subjects
              subjects.push(createSubject('Nepali', creditHours));
              subjects.push(createSubject('English', creditHours));
              subjects.push(createSubject('Life Skill', creditHours));

              // Add optional subjects from WRONG stream
              const wrongStreamSubjects = STREAM_OPTIONAL_SUBJECTS[wrongStream].filter(
                s => !STREAM_OPTIONAL_SUBJECTS[declaredStream].includes(s)
              );

              // Add at least one subject from wrong stream
              if (wrongStreamSubjects.length > 0) {
                subjects.push(createSubject(wrongStreamSubjects[0], creditHours));

                // Add more subjects from declared stream to meet minimum
                const correctStreamSubjects = STREAM_OPTIONAL_SUBJECTS[declaredStream];
                for (let i = 0; i < MIN_OPTIONAL_SUBJECTS - 1 && i < correctStreamSubjects.length; i++) {
                  subjects.push(createSubject(correctStreamSubjects[i], creditHours));
                }

                const result = validateClass12SubjectCombination(subjects, declaredStream);

                // Should be rejected
                expect(result.isValid).toBe(false);
                expect(result.errors.length).toBeGreaterThan(0);
                
                // Should have error about invalid subject for stream
                const hasStreamError = result.errors.some(
                  error => error.includes('not valid for') && error.includes('stream')
                );
                expect(hasStreamError).toBe(true);
              }
            }
          ),
          {
            numRuns: 50,
            verbose: true,
          }
        );
      });

      /**
       * Property: Subjects with insufficient credit hours should be rejected
       * 
       * All subjects must meet the minimum credit hours requirement (100 hours).
       */
      it('should reject Class 12 combinations with insufficient credit hours', () => {
        fc.assert(
          fc.property(
            streamArbitrary,
            invalidCreditHoursArbitrary,
            validCreditHoursArbitrary,
            (stream, invalidCreditHours, validCreditHours) => {
              // Build a combination with one subject having insufficient credit hours
              const subjects: Subject[] = [];

              // Add compulsory subjects (one with invalid credit hours)
              subjects.push(createSubject('Nepali', validCreditHours));
              subjects.push(createSubject('English', invalidCreditHours)); // Invalid!
              subjects.push(createSubject('Life Skill', validCreditHours));

              // Add optional subjects
              const optionalSubjects = STREAM_OPTIONAL_SUBJECTS[stream];
              for (let i = 0; i < MIN_OPTIONAL_SUBJECTS && i < optionalSubjects.length; i++) {
                subjects.push(createSubject(optionalSubjects[i], validCreditHours));
              }

              const result = validateClass12SubjectCombination(subjects, stream);

              // Should be rejected
              expect(result.isValid).toBe(false);
              expect(result.errors.length).toBeGreaterThan(0);
              
              // Should have error about insufficient credit hours
              const hasCreditError = result.errors.some(
                error => error.includes('insufficient credit hours') && error.includes('English')
              );
              expect(hasCreditError).toBe(true);
            }
          ),
          {
            numRuns: 50,
            verbose: true,
          }
        );
      });
    });

    describe('Generic validateSubjectCombination function', () => {
      /**
       * Property: Should route to correct validator based on class level
       * 
       * The generic function should delegate to Class 11 or Class 12 validator
       * based on the classLevel parameter.
       */
      it('should route to Class 11 validator when classLevel is 11', () => {
        fc.assert(
          fc.property(
            streamArbitrary,
            validCreditHoursArbitrary,
            (stream, creditHours) => {
              // Build a valid Class 11 combination
              const subjects: Subject[] = [];
              subjects.push(createSubject('Nepali', creditHours));
              subjects.push(createSubject('English', creditHours));
              subjects.push(createSubject('Social Studies', creditHours));
              subjects.push(createSubject('Mathematics', creditHours));

              const optionalSubjects = STREAM_OPTIONAL_SUBJECTS[stream].filter(
                s => s !== 'Mathematics'
              );
              for (let i = 0; i < MIN_OPTIONAL_SUBJECTS && i < optionalSubjects.length; i++) {
                subjects.push(createSubject(optionalSubjects[i], creditHours));
              }

              const result = validateSubjectCombination(subjects, stream, 11);
              const directResult = validateClass11SubjectCombination(subjects, stream);

              // Results should match
              expect(result.isValid).toBe(directResult.isValid);
              expect(result.errors).toEqual(directResult.errors);
            }
          ),
          {
            numRuns: 50,
            verbose: true,
          }
        );
      });

      it('should route to Class 12 validator when classLevel is 12', () => {
        fc.assert(
          fc.property(
            streamArbitrary,
            validCreditHoursArbitrary,
            (stream, creditHours) => {
              // Build a valid Class 12 combination
              const subjects: Subject[] = [];
              subjects.push(createSubject('Nepali', creditHours));
              subjects.push(createSubject('English', creditHours));
              subjects.push(createSubject('Life Skill', creditHours));

              const optionalSubjects = STREAM_OPTIONAL_SUBJECTS[stream];
              for (let i = 0; i < MIN_OPTIONAL_SUBJECTS && i < optionalSubjects.length; i++) {
                subjects.push(createSubject(optionalSubjects[i], creditHours));
              }

              const result = validateSubjectCombination(subjects, stream, 12);
              const directResult = validateClass12SubjectCombination(subjects, stream);

              // Results should match
              expect(result.isValid).toBe(directResult.isValid);
              expect(result.errors).toEqual(directResult.errors);
            }
          ),
          {
            numRuns: 50,
            verbose: true,
          }
        );
      });

      /**
       * Property: Should reject invalid class levels
       * 
       * Only class levels 11 and 12 are valid for subject combination validation.
       */
      it('should reject invalid class levels', () => {
        fc.assert(
          fc.property(
            streamArbitrary,
            fc.integer({ min: 1, max: 20 }).filter(n => n !== 11 && n !== 12),
            validCreditHoursArbitrary,
            (stream, invalidClassLevel, creditHours) => {
              const subjects: Subject[] = [];
              subjects.push(createSubject('Nepali', creditHours));
              subjects.push(createSubject('English', creditHours));

              const result = validateSubjectCombination(
                subjects,
                stream,
                invalidClassLevel as 11 | 12
              );

              // Should be rejected
              expect(result.isValid).toBe(false);
              expect(result.errors.length).toBeGreaterThan(0);
              
              // Should have error about invalid class level
              const hasClassLevelError = result.errors.some(
                error => error.includes('Invalid class level')
              );
              expect(hasClassLevelError).toBe(true);
            }
          ),
          {
            numRuns: 30,
            verbose: true,
          }
        );
      });
    });

    describe('Edge Cases and Boundary Conditions', () => {
      /**
       * Property: Duplicate subjects should be handled
       * 
       * While not explicitly validated, duplicate subjects should not cause crashes.
       */
      it('should handle duplicate subjects gracefully', () => {
        fc.assert(
          fc.property(
            streamArbitrary,
            validCreditHoursArbitrary,
            (stream, creditHours) => {
              // Build a combination with duplicate subjects
              const subjects: Subject[] = [];
              subjects.push(createSubject('Nepali', creditHours));
              subjects.push(createSubject('Nepali', creditHours)); // Duplicate!
              subjects.push(createSubject('English', creditHours));
              subjects.push(createSubject('Life Skill', creditHours));

              const optionalSubjects = STREAM_OPTIONAL_SUBJECTS[stream];
              for (let i = 0; i < MIN_OPTIONAL_SUBJECTS && i < optionalSubjects.length; i++) {
                subjects.push(createSubject(optionalSubjects[i], creditHours));
              }

              // Should not crash
              expect(() => {
                validateClass12SubjectCombination(subjects, stream);
              }).not.toThrow();
            }
          ),
          {
            numRuns: 30,
            verbose: true,
          }
        );
      });

      /**
       * Property: Validation should be deterministic
       * 
       * Same input should always produce same output.
       */
      it('should be deterministic (same input produces same output)', () => {
        fc.assert(
          fc.property(
            streamArbitrary,
            fc.integer({ min: MIN_OPTIONAL_SUBJECTS, max: MAX_OPTIONAL_SUBJECTS }),
            validCreditHoursArbitrary,
            (stream, numOptionalSubjects, creditHours) => {
              // Build a subject combination
              const subjects: Subject[] = [];
              subjects.push(createSubject('Nepali', creditHours));
              subjects.push(createSubject('English', creditHours));
              subjects.push(createSubject('Life Skill', creditHours));

              const optionalSubjects = STREAM_OPTIONAL_SUBJECTS[stream];
              for (let i = 0; i < numOptionalSubjects && i < optionalSubjects.length; i++) {
                subjects.push(createSubject(optionalSubjects[i], creditHours));
              }

              // Call validation multiple times
              const result1 = validateClass12SubjectCombination(subjects, stream);
              const result2 = validateClass12SubjectCombination(subjects, stream);
              const result3 = validateClass12SubjectCombination(subjects, stream);

              // All results should be identical
              expect(result1.isValid).toBe(result2.isValid);
              expect(result2.isValid).toBe(result3.isValid);
              expect(result1.errors).toEqual(result2.errors);
              expect(result2.errors).toEqual(result3.errors);
            }
          ),
          {
            numRuns: 50,
            verbose: true,
          }
        );
      });

      /**
       * Property: Subject order should not affect validation
       * 
       * The order of subjects in the array should not change the validation result.
       */
      it('should produce same result regardless of subject order', () => {
        fc.assert(
          fc.property(
            streamArbitrary,
            validCreditHoursArbitrary,
            (stream, creditHours) => {
              // Build a valid combination
              const subjects: Subject[] = [];
              subjects.push(createSubject('Nepali', creditHours));
              subjects.push(createSubject('English', creditHours));
              subjects.push(createSubject('Life Skill', creditHours));

              const optionalSubjects = STREAM_OPTIONAL_SUBJECTS[stream];
              for (let i = 0; i < MIN_OPTIONAL_SUBJECTS && i < optionalSubjects.length; i++) {
                subjects.push(createSubject(optionalSubjects[i], creditHours));
              }

              // Validate original order
              const result1 = validateClass12SubjectCombination(subjects, stream);

              // Validate reversed order
              const reversedSubjects = [...subjects].reverse();
              const result2 = validateClass12SubjectCombination(reversedSubjects, stream);

              // Validate shuffled order
              const shuffledSubjects = [...subjects].sort(() => Math.random() - 0.5);
              const result3 = validateClass12SubjectCombination(shuffledSubjects, stream);

              // All results should have same validity
              expect(result1.isValid).toBe(result2.isValid);
              expect(result2.isValid).toBe(result3.isValid);

              // Error counts should be the same
              expect(result1.errors.length).toBe(result2.errors.length);
              expect(result2.errors.length).toBe(result3.errors.length);
            }
          ),
          {
            numRuns: 50,
            verbose: true,
          }
        );
      });

      /**
       * Property: All error messages should be descriptive
       * 
       * Error messages should contain useful information about what went wrong.
       */
      it('should provide descriptive error messages', () => {
        fc.assert(
          fc.property(
            streamArbitrary,
            validCreditHoursArbitrary,
            (stream, creditHours) => {
              // Build an invalid combination (missing compulsory subjects)
              const subjects: Subject[] = [];
              subjects.push(createSubject('Nepali', creditHours));
              // Missing English and Life Skill

              const optionalSubjects = STREAM_OPTIONAL_SUBJECTS[stream];
              for (let i = 0; i < MIN_OPTIONAL_SUBJECTS && i < optionalSubjects.length; i++) {
                subjects.push(createSubject(optionalSubjects[i], creditHours));
              }

              const result = validateClass12SubjectCombination(subjects, stream);

              // Should have errors
              expect(result.isValid).toBe(false);
              expect(result.errors.length).toBeGreaterThan(0);

              // All error messages should be non-empty strings
              for (const error of result.errors) {
                expect(typeof error).toBe('string');
                expect(error.length).toBeGreaterThan(0);
                // Error messages should contain useful keywords
                expect(error).toMatch(/Missing|invalid|insufficient|must|cannot|required/i);
              }
            }
          ),
          {
            numRuns: 30,
            verbose: true,
          }
        );
      });
    });
  });
});
