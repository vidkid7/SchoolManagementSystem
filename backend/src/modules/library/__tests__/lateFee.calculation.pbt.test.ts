/**
 * Property-Based Test: Late Fee Calculation
 * 
 * **Property 27: Late Fee Calculation**
 * **Validates: Requirements 10.5**
 * 
 * Test that fines are calculated correctly based on overdue days
 */

import * as fc from 'fast-check';
import { LateFeeService } from '../lateFee.service';

describe('Property Test: Late Fee Calculation', () => {
  const lateFeeService = new LateFeeService();

  /**
   * Property: Fine calculation formula correctness
   * 
   * For any number of overdue days and daily rate:
   * fine = days_overdue × daily_rate
   */
  it('should calculate fine as days_overdue × daily_rate', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 0, max: 365 }), // days overdue (0 to 1 year)
        fc.integer({ min: 1, max: 100 }), // daily rate (NPR 1 to 100)
        (daysOverdue, dailyRate) => {
          const fine = lateFeeService.calculateOverdueFine(daysOverdue, dailyRate);
          const expectedFine = daysOverdue * dailyRate;
          
          expect(fine).toBe(expectedFine);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Zero days overdue results in zero fine
   */
  it('should return zero fine for zero or negative days overdue', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -100, max: 0 }), // zero or negative days
        fc.integer({ min: 1, max: 100 }), // daily rate
        (daysOverdue, dailyRate) => {
          const fine = lateFeeService.calculateOverdueFine(daysOverdue, dailyRate);
          expect(fine).toBe(0);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Fine increases monotonically with days overdue
   * 
   * If days1 < days2, then fine1 < fine2 (for same rate)
   */
  it('should increase fine monotonically with days overdue', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }), // days1
        fc.integer({ min: 1, max: 100 }), // additional days
        fc.integer({ min: 1, max: 50 }), // daily rate
        (days1, additionalDays, dailyRate) => {
          const days2 = days1 + additionalDays;
          
          const fine1 = lateFeeService.calculateOverdueFine(days1, dailyRate);
          const fine2 = lateFeeService.calculateOverdueFine(days2, dailyRate);
          
          expect(fine2).toBeGreaterThan(fine1);
          expect(fine2 - fine1).toBe(additionalDays * dailyRate);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Fine scales linearly with daily rate
   * 
   * If rate2 = 2 × rate1, then fine2 = 2 × fine1 (for same days)
   */
  it('should scale fine linearly with daily rate', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }), // days overdue
        fc.integer({ min: 1, max: 50 }), // base rate
        (daysOverdue, baseRate) => {
          const rate1 = baseRate;
          const rate2 = baseRate * 2;
          
          const fine1 = lateFeeService.calculateOverdueFine(daysOverdue, rate1);
          const fine2 = lateFeeService.calculateOverdueFine(daysOverdue, rate2);
          
          expect(fine2).toBe(fine1 * 2);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Fine is always non-negative
   */
  it('should always return non-negative fine', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: -100, max: 365 }), // any days (including negative)
        fc.integer({ min: 1, max: 100 }), // daily rate
        (daysOverdue, dailyRate) => {
          const fine = lateFeeService.calculateOverdueFine(daysOverdue, dailyRate);
          expect(fine).toBeGreaterThanOrEqual(0);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Fine calculation is commutative in multiplication
   * 
   * days × rate = rate × days
   */
  it('should be commutative (days × rate = rate × days)', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }), // days
        fc.integer({ min: 1, max: 100 }), // rate
        (days, rate) => {
          const fine = lateFeeService.calculateOverdueFine(days, rate);
          expect(fine).toBe(days * rate);
          expect(fine).toBe(rate * days);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Default rate is used when not specified
   */
  it('should use default rate when rate is not provided', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }), // days overdue
        (daysOverdue) => {
          const fineWithoutRate = lateFeeService.calculateOverdueFine(daysOverdue);
          const fineWithDefaultRate = lateFeeService.calculateOverdueFine(daysOverdue, 5); // DEFAULT_DAILY_RATE = 5
          
          expect(fineWithoutRate).toBe(fineWithDefaultRate);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Fine for 1 day equals the daily rate
   */
  it('should equal daily rate for exactly 1 day overdue', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }), // daily rate
        (dailyRate) => {
          const fine = lateFeeService.calculateOverdueFine(1, dailyRate);
          expect(fine).toBe(dailyRate);
        }
      ),
      { numRuns: 50 }
    );
  });

  /**
   * Property: Fine calculation is associative
   * 
   * (days1 + days2) × rate = (days1 × rate) + (days2 × rate)
   */
  it('should be associative in addition', () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 50 }), // days1
        fc.integer({ min: 1, max: 50 }), // days2
        fc.integer({ min: 1, max: 50 }), // rate
        (days1, days2, rate) => {
          const fineCombined = lateFeeService.calculateOverdueFine(days1 + days2, rate);
          const fine1 = lateFeeService.calculateOverdueFine(days1, rate);
          const fine2 = lateFeeService.calculateOverdueFine(days2, rate);
          
          expect(fineCombined).toBe(fine1 + fine2);
        }
      ),
      { numRuns: 100 }
    );
  });

  /**
   * Property: Realistic fine amounts for common scenarios
   */
  it('should produce realistic fine amounts for common scenarios', () => {
    // 1 week overdue at NPR 5/day = NPR 35
    expect(lateFeeService.calculateOverdueFine(7, 5)).toBe(35);
    
    // 2 weeks overdue at NPR 5/day = NPR 70
    expect(lateFeeService.calculateOverdueFine(14, 5)).toBe(70);
    
    // 1 month overdue at NPR 5/day = NPR 150
    expect(lateFeeService.calculateOverdueFine(30, 5)).toBe(150);
    
    // 1 day overdue at NPR 10/day = NPR 10
    expect(lateFeeService.calculateOverdueFine(1, 10)).toBe(10);
  });
});
