import { swaggerSpec } from '../swagger';

const spec = swaggerSpec as any;

describe('Swagger Configuration', () => {
  describe('OpenAPI Specification', () => {
    it('should have valid OpenAPI version', () => {
      expect(spec.openapi).toBe('3.0.0');
    });

    it('should have API information', () => {
      expect(spec.info).toBeDefined();
      expect(spec.info.title).toBe('School Management System API');
      expect(spec.info.version).toBe('1.0.0');
      expect(spec.info.description).toContain('Nepal Education System');
    });

    it('should have contact information', () => {
      expect(spec.info.contact).toBeDefined();
      expect(spec.info.contact.name).toBe('School Management System Support');
      expect(spec.info.contact.email).toBe('support@schoolsystem.com');
    });

    it('should have license information', () => {
      expect(spec.info.license).toBeDefined();
      expect(spec.info.license.name).toBe('MIT');
    });
  });

  describe('Servers', () => {
    it('should have development and production servers', () => {
      expect(spec.servers).toBeDefined();
      expect(spec.servers.length).toBeGreaterThanOrEqual(2);
      
      const devServer = spec.servers.find((s: any) => s.description === 'Development server');
      const prodServer = spec.servers.find((s: any) => s.description === 'Production server');
      
      expect(devServer).toBeDefined();
      expect(prodServer).toBeDefined();
    });

    it('should have correct server URLs', () => {
      const devServer = spec.servers.find((s: any) => s.description === 'Development server');
      expect(devServer?.url).toContain('/api/v1');
    });
  });

  describe('Security Schemes', () => {
    it('should have bearer authentication', () => {
      expect(spec.components.securitySchemes).toBeDefined();
      expect(spec.components.securitySchemes.bearerAuth).toBeDefined();
      expect(spec.components.securitySchemes.bearerAuth.type).toBe('http');
      expect(spec.components.securitySchemes.bearerAuth.scheme).toBe('bearer');
      expect(spec.components.securitySchemes.bearerAuth.bearerFormat).toBe('JWT');
    });
  });

  describe('Common Schemas', () => {
    it('should have Error schema', () => {
      expect(spec.components.schemas.Error).toBeDefined();
      expect(spec.components.schemas.Error.type).toBe('object');
      expect(spec.components.schemas.Error.properties.success).toBeDefined();
      expect(spec.components.schemas.Error.properties.error).toBeDefined();
    });

    it('should have SuccessResponse schema', () => {
      expect(spec.components.schemas.SuccessResponse).toBeDefined();
      expect(spec.components.schemas.SuccessResponse.type).toBe('object');
      expect(spec.components.schemas.SuccessResponse.properties.success).toBeDefined();
      expect(spec.components.schemas.SuccessResponse.properties.data).toBeDefined();
    });

    it('should have PaginatedResponse schema', () => {
      expect(spec.components.schemas.PaginatedResponse).toBeDefined();
      expect(spec.components.schemas.PaginatedResponse.properties.meta).toBeDefined();
    });

    it('should have UserRole enum', () => {
      expect(spec.components.schemas.UserRole).toBeDefined();
      expect(spec.components.schemas.UserRole.type).toBe('string');
      expect(spec.components.schemas.UserRole.enum).toContain('school_admin');
      expect(spec.components.schemas.UserRole.enum).toContain('student');
      expect(spec.components.schemas.UserRole.enum).toContain('parent');
      expect(spec.components.schemas.UserRole.enum.length).toBe(13);
    });

    it('should have NEBGrade enum', () => {
      expect(spec.components.schemas.NEBGrade).toBeDefined();
      expect(spec.components.schemas.NEBGrade.enum).toContain('A+');
      expect(spec.components.schemas.NEBGrade.enum).toContain('A');
      expect(spec.components.schemas.NEBGrade.enum).toContain('NG');
    });

    it('should have AttendanceStatus enum', () => {
      expect(spec.components.schemas.AttendanceStatus).toBeDefined();
      expect(spec.components.schemas.AttendanceStatus.enum).toContain('present');
      expect(spec.components.schemas.AttendanceStatus.enum).toContain('absent');
      expect(spec.components.schemas.AttendanceStatus.enum).toContain('late');
      expect(spec.components.schemas.AttendanceStatus.enum).toContain('excused');
    });

    it('should have PaymentMethod enum', () => {
      expect(spec.components.schemas.PaymentMethod).toBeDefined();
      expect(spec.components.schemas.PaymentMethod.enum).toContain('cash');
      expect(spec.components.schemas.PaymentMethod.enum).toContain('esewa');
      expect(spec.components.schemas.PaymentMethod.enum).toContain('khalti');
      expect(spec.components.schemas.PaymentMethod.enum).toContain('ime_pay');
    });
  });

  describe('Common Responses', () => {
    it('should have UnauthorizedError response', () => {
      expect(spec.components.responses.UnauthorizedError).toBeDefined();
      expect(spec.components.responses.UnauthorizedError.description).toContain('Authentication');
    });

    it('should have ForbiddenError response', () => {
      expect(spec.components.responses.ForbiddenError).toBeDefined();
      expect(spec.components.responses.ForbiddenError.description).toContain('permission');
    });

    it('should have NotFoundError response', () => {
      expect(spec.components.responses.NotFoundError).toBeDefined();
      expect(spec.components.responses.NotFoundError.description).toContain('not found');
    });

    it('should have ValidationError response', () => {
      expect(spec.components.responses.ValidationError).toBeDefined();
      expect(spec.components.responses.ValidationError.description).toContain('Validation');
    });

    it('should have RateLimitError response', () => {
      expect(spec.components.responses.RateLimitError).toBeDefined();
      expect(spec.components.responses.RateLimitError.description).toContain('Rate limit');
    });
  });

  describe('Common Parameters', () => {
    it('should have PageParam', () => {
      expect(spec.components.parameters.PageParam).toBeDefined();
      expect(spec.components.parameters.PageParam.in).toBe('query');
      expect(spec.components.parameters.PageParam.name).toBe('page');
      expect(spec.components.parameters.PageParam.schema.type).toBe('integer');
    });

    it('should have LimitParam', () => {
      expect(spec.components.parameters.LimitParam).toBeDefined();
      expect(spec.components.parameters.LimitParam.in).toBe('query');
      expect(spec.components.parameters.LimitParam.name).toBe('limit');
      expect(spec.components.parameters.LimitParam.schema.maximum).toBe(100);
    });

    it('should have SortParam', () => {
      expect(spec.components.parameters.SortParam).toBeDefined();
      expect(spec.components.parameters.SortParam.name).toBe('sort');
    });

    it('should have SearchParam', () => {
      expect(spec.components.parameters.SearchParam).toBeDefined();
      expect(spec.components.parameters.SearchParam.name).toBe('search');
    });
  });

  describe('Tags', () => {
    it('should have all module tags', () => {
      expect(spec.tags).toBeDefined();
      expect(spec.tags.length).toBeGreaterThan(10);
      
      const tagNames = spec.tags.map((t: any) => t.name);
      expect(tagNames).toContain('Authentication');
      expect(tagNames).toContain('Students');
      expect(tagNames).toContain('Staff');
      expect(tagNames).toContain('Academic');
      expect(tagNames).toContain('Attendance');
      expect(tagNames).toContain('Examinations');
      expect(tagNames).toContain('Finance');
      expect(tagNames).toContain('Library');
      expect(tagNames).toContain('ECA');
      expect(tagNames).toContain('Sports');
      expect(tagNames).toContain('Communication');
      expect(tagNames).toContain('Certificates');
      expect(tagNames).toContain('Documents');
      expect(tagNames).toContain('Calendar');
      expect(tagNames).toContain('Reports');
      expect(tagNames).toContain('Configuration');
      expect(tagNames).toContain('Audit');
    });

    it('should have descriptions for all tags', () => {
      spec.tags.forEach((tag: any) => {
        expect(tag.name).toBeDefined();
        expect(tag.description).toBeDefined();
        expect(tag.description.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Security', () => {
    it('should have global security requirement', () => {
      expect(spec.security).toBeDefined();
      expect(spec.security.length).toBeGreaterThan(0);
      expect(spec.security[0].bearerAuth).toBeDefined();
    });
  });

  describe('API Paths', () => {
    it('should have paths defined', () => {
      expect(spec.paths).toBeDefined();
    });
  });
});
