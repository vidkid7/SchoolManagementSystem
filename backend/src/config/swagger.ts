import swaggerJsdoc from 'swagger-jsdoc';
import { env } from './env';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'School Management System API',
      version: '1.0.0',
      description: `
        Comprehensive School Management System API optimized for Nepal Education System.
        
        ## Features
        - NEB (National Examination Board) compliant grading system
        - Bikram Sambat (BS) calendar support
        - Nepal payment gateway integration (eSewa, Khalti, IME Pay)
        - Offline-first architecture
        - Role-based access control (13 user roles)
        - 17+ modules covering all school operations
        
        ## Authentication
        This API uses JWT (JSON Web Tokens) for authentication. Include the token in the Authorization header:
        \`Authorization: Bearer <token>\`
        
        Access tokens expire after 30 minutes. Use the refresh token endpoint to obtain a new access token.
        
        ## Rate Limiting
        API requests are limited to 100 requests per minute per user.
        
        ## Versioning
        The API is versioned using URL path versioning (e.g., /api/v1/).
      `,
      contact: {
        name: 'School Management System Support',
        email: 'support@schoolsystem.com'
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT'
      }
    },
    servers: [
      {
        url: `http://localhost:${env.PORT || 3000}/api/v1`,
        description: 'Development server'
      },
      {
        url: 'https://api.schoolsystem.com/api/v1',
        description: 'Production server'
      }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter your JWT token in the format: Bearer <token>'
        }
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: false
            },
            error: {
              type: 'object',
              properties: {
                code: {
                  type: 'string',
                  example: 'VALIDATION_ERROR'
                },
                message: {
                  type: 'string',
                  example: 'Invalid input data'
                },
                details: {
                  type: 'object',
                  additionalProperties: true
                }
              }
            }
          }
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'object',
              additionalProperties: true
            },
            message: {
              type: 'string'
            }
          }
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: {
              type: 'boolean',
              example: true
            },
            data: {
              type: 'array',
              items: {
                type: 'object'
              }
            },
            meta: {
              type: 'object',
              properties: {
                page: {
                  type: 'integer',
                  example: 1
                },
                limit: {
                  type: 'integer',
                  example: 10
                },
                total: {
                  type: 'integer',
                  example: 100
                },
                totalPages: {
                  type: 'integer',
                  example: 10
                }
              }
            }
          }
        },
        UserRole: {
          type: 'string',
          enum: [
            'school_admin',
            'subject_teacher',
            'class_teacher',
            'department_head',
            'eca_coordinator',
            'sports_coordinator',
            'student',
            'parent',
            'librarian',
            'accountant',
            'transport_manager',
            'hostel_warden',
            'non_teaching_staff'
          ],
          description: 'User role in the system'
        },
        NEBGrade: {
          type: 'string',
          enum: ['A+', 'A', 'B+', 'B', 'C+', 'C', 'D', 'NG'],
          description: 'NEB (National Examination Board) grade'
        },
        AttendanceStatus: {
          type: 'string',
          enum: ['present', 'absent', 'late', 'excused'],
          description: 'Student attendance status'
        },
        PaymentMethod: {
          type: 'string',
          enum: ['cash', 'bank_transfer', 'esewa', 'khalti', 'ime_pay'],
          description: 'Payment method'
        }
      },
      responses: {
        UnauthorizedError: {
          description: 'Authentication token is missing or invalid',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: {
                  code: 'UNAUTHORIZED',
                  message: 'Authentication required'
                }
              }
            }
          }
        },
        ForbiddenError: {
          description: 'User does not have permission to access this resource',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: {
                  code: 'FORBIDDEN',
                  message: 'Insufficient permissions'
                }
              }
            }
          }
        },
        NotFoundError: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: {
                  code: 'NOT_FOUND',
                  message: 'Resource not found'
                }
              }
            }
          }
        },
        ValidationError: {
          description: 'Validation error',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: {
                  code: 'VALIDATION_ERROR',
                  message: 'Invalid input data',
                  details: {
                    email: 'Invalid email format'
                  }
                }
              }
            }
          }
        },
        RateLimitError: {
          description: 'Rate limit exceeded',
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/Error'
              },
              example: {
                success: false,
                error: {
                  code: 'RATE_LIMIT_EXCEEDED',
                  message: 'Too many requests. Please try again later.'
                }
              }
            }
          }
        }
      },
      parameters: {
        PageParam: {
          in: 'query',
          name: 'page',
          schema: {
            type: 'integer',
            minimum: 1,
            default: 1
          },
          description: 'Page number for pagination'
        },
        LimitParam: {
          in: 'query',
          name: 'limit',
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
            default: 10
          },
          description: 'Number of items per page'
        },
        SortParam: {
          in: 'query',
          name: 'sort',
          schema: {
            type: 'string'
          },
          description: 'Sort field and order (e.g., "createdAt:desc")'
        },
        SearchParam: {
          in: 'query',
          name: 'search',
          schema: {
            type: 'string'
          },
          description: 'Search query'
        }
      }
    },
    security: [
      {
        bearerAuth: []
      }
    ],
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization endpoints'
      },
      {
        name: 'Students',
        description: 'Student management operations'
      },
      {
        name: 'Staff',
        description: 'Staff management operations'
      },
      {
        name: 'Academic',
        description: 'Academic structure management (classes, subjects, timetables)'
      },
      {
        name: 'Attendance',
        description: 'Student and staff attendance tracking'
      },
      {
        name: 'Examinations',
        description: 'Examination and grading management'
      },
      {
        name: 'Finance',
        description: 'Fee management and payment processing'
      },
      {
        name: 'Library',
        description: 'Library management and book circulation'
      },
      {
        name: 'ECA',
        description: 'Extra-curricular activities management'
      },
      {
        name: 'Sports',
        description: 'Sports activities and tournaments'
      },
      {
        name: 'Communication',
        description: 'Messaging and announcements'
      },
      {
        name: 'Certificates',
        description: 'Certificate generation and verification'
      },
      {
        name: 'Documents',
        description: 'Document management and storage'
      },
      {
        name: 'Calendar',
        description: 'Event and calendar management'
      },
      {
        name: 'Reports',
        description: 'Reports and analytics'
      },
      {
        name: 'Configuration',
        description: 'System configuration and settings'
      },
      {
        name: 'Audit',
        description: 'Audit logs and system monitoring'
      }
    ]
  },
  apis: [
    './src/modules/**/*.routes.ts',
    './src/modules/**/*.controller.ts',
    './src/docs/swagger/*.yaml'
  ]
};

export const swaggerSpec = swaggerJsdoc(options);
