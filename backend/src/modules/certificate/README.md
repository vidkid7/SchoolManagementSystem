# Certificate Template Management Module

This module implements certificate template management functionality for the School Management System.

## Requirements

Implements **Requirement 25.2**: Certificate template creation with dynamic fields

## Features

- ✅ Create certificate templates with dynamic variables
- ✅ Support for multiple certificate types (character, transfer, academic_excellence, eca, sports, course_completion, bonafide)
- ✅ Template CRUD operations (Create, Read, Update, Delete)
- ✅ Dynamic field configuration using {{variable_name}} syntax
- ✅ Template validation (variable names, HTML structure)
- ✅ Template rendering with data substitution
- ✅ Soft delete support (isActive flag)
- ✅ Template statistics and filtering

## Architecture

### Model
- **CertificateTemplate.model.ts**: Sequelize model with helper methods
  - `extractVariables()`: Extract variable names from template HTML
  - `validateVariables()`: Validate all required variables are present
  - `renderTemplate(data)`: Replace variables with actual values

### Repository
- **certificateTemplate.repository.ts**: Database operations
  - CRUD operations
  - Filtering by type, active status, search term
  - Name uniqueness checking

### Service
- **certificateTemplate.service.ts**: Business logic
  - Template creation with validation
  - Variable name validation (alphanumeric + underscore, must start with letter/underscore)
  - Template HTML validation (ensures all variables are present)
  - Template rendering with missing variable detection

### Controller
- **certificateTemplate.controller.ts**: HTTP request handlers
  - POST /api/v1/certificates/templates - Create template
  - GET /api/v1/certificates/templates - List templates (with filters)
  - GET /api/v1/certificates/templates/:id - Get template by ID
  - PUT /api/v1/certificates/templates/:id - Update template
  - DELETE /api/v1/certificates/templates/:id - Soft delete template
  - GET /api/v1/certificates/templates/type/:type - Get active templates by type
  - POST /api/v1/certificates/templates/:id/render - Render template with data
  - GET /api/v1/certificates/templates/stats - Get template statistics

### Validation
- **certificateTemplate.validation.ts**: Joi schemas for input validation
  - Template name: 3-200 characters
  - Type: Must be one of the supported types
  - Variables: Array of valid variable names
  - Template HTML: Minimum 10 characters

### Routes
- **certificateTemplate.routes.ts**: API route definitions with validation middleware

## Database Schema

```sql
CREATE TABLE certificate_templates (
  template_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(200) NOT NULL,
  type ENUM('character', 'transfer', 'academic_excellence', 'eca', 'sports', 'course_completion', 'bonafide') NOT NULL,
  template_html LONGTEXT NOT NULL,
  variables JSON NOT NULL DEFAULT '[]',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_certificate_templates_type (type),
  INDEX idx_certificate_templates_active (is_active),
  INDEX idx_certificate_templates_type_active (type, is_active)
);
```

## Usage Examples

### Creating a Template

```typescript
POST /api/v1/certificates/templates
{
  "name": "Character Certificate",
  "type": "character",
  "templateHtml": "<div>This is to certify that {{student_name}} from {{class}} has good character.</div>",
  "variables": ["student_name", "class"],
  "isActive": true
}
```

### Rendering a Template

```typescript
POST /api/v1/certificates/templates/1/render
{
  "data": {
    "student_name": "John Doe",
    "class": "Class 10"
  }
}

// Response:
{
  "success": true,
  "data": {
    "html": "<div>This is to certify that John Doe from Class 10 has good character.</div>"
  }
}
```

### Variable Syntax

Variables in templates use double curly braces: `{{variable_name}}`

**Valid variable names:**
- Must start with a letter or underscore
- Can contain letters, numbers, and underscores
- Examples: `student_name`, `class_name`, `_private`, `name123`

**Invalid variable names:**
- `123start` (starts with number)
- `with-dash` (contains dash)
- `with space` (contains space)
- `with.dot` (contains dot)

## Testing

### Unit Tests
- Model logic tests: `backend/src/models/__tests__/CertificateTemplate.model.test.ts`
- Repository tests: `backend/src/modules/certificate/__tests__/certificateTemplate.repository.test.ts`
- Service tests: `backend/src/modules/certificate/__tests__/certificateTemplate.service.test.ts`

Run tests:
```bash
npm test -- certificateTemplate
```

## Integration

To use this module in the application:

1. **Add routes to app.ts:**
```typescript
import certificateTemplateRoutes from '@modules/certificate/certificateTemplate.routes';
app.use('/api/v1/certificates/templates', certificateTemplateRoutes);
```

2. **Run migration:**
```bash
npm run migrate
```

3. **Initialize model** (if not using auto-initialization):
```typescript
import { initCertificateTemplate } from '@models/CertificateTemplate.model';
import sequelize from '@config/database';

initCertificateTemplate(sequelize);
```

## Future Enhancements

- PDF generation from templates (Task 27.2)
- QR code generation for verification
- Template preview functionality
- Template versioning
- Template categories/tags
- Rich text editor integration
- Template marketplace/sharing

## Related Tasks

- Task 27.2: Implement certificate generation (uses these templates)
- Task 27.3: Implement certificate verification
- Task 27.4: Implement bulk certificate generation

## Notes

- Templates support HTML content for flexible formatting
- Soft delete is used to preserve template history
- Template names must be unique across all templates
- Inactive templates cannot be rendered
- All variables must be present in the template HTML
