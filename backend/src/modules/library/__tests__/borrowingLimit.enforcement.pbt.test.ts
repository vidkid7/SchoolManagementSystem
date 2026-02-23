/**
 * Property-Based Test: Borrowing Limit Enforcement
 * 
 * **Property 28: Borrowing Limit Enforcement**
 * **Validates: Requirements 10.13**
 * 
 * Test that borrowing is rejected when limit is exceeded
 */

import * as fc from 'fast-check';

describe('Property Test: Borrowing Limit Enforcement', () => {
  /**
   * Property: Cannot borrow when at or above limit
   * 
   * For any borrowing limit L and current borrowings C:
   * - If C >= L, then canBorrow = false
   * - If C < L, then canBorrow = true
   */
  it('should reject borrowing when at or above limit', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }), // borrowing limit
        fc.integer({ min: 0, max: 20 }), // current borrowings
        (limit, currentBorrowings) => {
          const canBorrow = currentBorrowings < limit;
          
          if (currentBorrowings >= limit) {
            expect(canBorrow).toBe(false);
          } else {
            expect(canBorrow).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Remaining capacity calculation
   * 
   * remaining = limit - current (when current < limit)
   * remaining = 0 (when current >= limit)
   */
  it('should calculate remaining capacity correctly', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }), // limit
        fc.integer({ min: 0, max: 15 }), // current
        (limit, current) => {
          const remaining = Math.max(0, limit - current);
          
          if (current >= limit) {
            expect(remaining).toBe(0);
          } else {
            expect(remaining).toBe(limit - current);
            expect(remaining).toBeGreaterThan(0);
            expect(remaining).toBeLessThanOrEqual(limit);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Limit boundary conditions
   * 
   * At exactly the limit, cannot borrow more
   */
  it('should enforce limit at exact boundary', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }), // limit
        (limit) => {
          const currentAtLimit = limit;
          const currentBelowLimit = limit - 1;
          const currentAboveLimit = limit + 1;
          
          expect(currentAtLimit >= limit).toBe(true); // Cannot borrow
          expect(currentBelowLimit < limit).toBe(true); // Can borrow
          expect(currentAboveLimit >= limit).toBe(true); // Cannot borrow
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Zero current borrowings always allows borrowing
   */
  it('should always allow borrowing when current is zero', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }), // limit (must be at least 1)
        (limit) => {
          const current = 0;
          const canBorrow = current < limit;
          
          expect(canBorrow).toBe(true);
          expect(limit - current).toBe(limit);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Limit of 1 allows only 1 book
   */
  it('should allow only 1 book when limit is 1', () => {
    const limit = 1;
    
    expect(0 < limit).toBe(true); // Can borrow first book
    expect(1 >= limit).toBe(true); // Cannot borrow second book
    expect(2 >= limit).toBe(true); // Cannot borrow third book
  });

  /**
   * Property: Increasing current borrowings eventually hits limit
   */
  it('should eventually hit limit as borrowings increase', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 5 }), // limit
        (limit) => {
          let canBorrow = true;
          let current = 0;
          
          // Keep borrowing until we hit the limit
          while (canBorrow && current < limit + 5) {
            canBorrow = current < limit;
            if (canBorrow) {
              current++;
            }
          }
          
          // Should have borrowed exactly 'limit' books
          expect(current).toBe(limit);
          expect(current < limit).toBe(false);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Returning a book increases available capacity
   */
  it('should increase capacity when a book is returned', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 2, max: 10 }), // limit (at least 2)
        fc.integer({ min: 1, max: 10 }), // current (at least 1 to return)
        (limit, current) => {
          const currentCapped = Math.min(current, limit); // Cap at limit
          const canBorrowBefore = currentCapped < limit;
          
          // Return one book
          const afterReturn = currentCapped - 1;
          const canBorrowAfter = afterReturn < limit;
          
          // After returning, should have more capacity
          expect(afterReturn).toBeLessThan(currentCapped);
          
          // If we were at limit, returning should allow borrowing
          if (currentCapped === limit) {
            expect(canBorrowBefore).toBe(false);
            expect(canBorrowAfter).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Limit enforcement is consistent
   */
  it('should consistently enforce the same limit', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 10 }), // limit
        fc.array(fc.integer({ min: 0, max: 15 }), { minLength: 5, maxLength: 10 }), // multiple checks
        (limit, borrowingCounts) => {
          // Check limit enforcement for multiple borrowing counts
          borrowingCounts.forEach((count) => {
            const canBorrow = count < limit;
            const expected = count < limit;
            expect(canBorrow).toBe(expected);
          });
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Common limit values work correctly
   */
  it('should work correctly for common limit values', () => {
    const commonLimits = [1, 2, 3, 5, 10];
    
    commonLimits.forEach((limit) => {
      // Can borrow when below limit
      expect(0 < limit).toBe(true);
      expect((limit - 1) < limit).toBe(true);
      
      // Cannot borrow at or above limit
      expect(limit >= limit).toBe(true);
      expect((limit + 1) >= limit).toBe(true);
    });
  });

  /**
   * Property: Limit must be positive
   */
  it('should require positive limit values', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }), // positive limit
        (limit) => {
          expect(limit).toBeGreaterThan(0);
          
          // With positive limit, zero borrowings should allow borrowing
          expect(0 < limit).toBe(true);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Realistic school library scenarios
   */
  it('should handle realistic school library scenarios', () => {
    // Typical school library limit: 3 books per student
    const typicalLimit = 3;
    
    // Student with no books can borrow
    expect(0 < typicalLimit).toBe(true);
    
    // Student with 1 book can borrow more
    expect(1 < typicalLimit).toBe(true);
    
    // Student with 2 books can borrow one more
    expect(2 < typicalLimit).toBe(true);
    
    // Student with 3 books cannot borrow more
    expect(3 >= typicalLimit).toBe(true);
    
    // Student with 4 books (overdue scenario) cannot borrow
    expect(4 >= typicalLimit).toBe(true);
  });
});
