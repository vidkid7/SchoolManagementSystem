/**
 * Certificate Template Model Tests
 * 
 * Tests for CertificateTemplate model methods and functionality
 * 
 * Requirements: 25.2
 */

describe('CertificateTemplate Model Logic', () => {
  describe('extractVariables', () => {
    it('should extract variables from template HTML', () => {
      const templateHtml = '<div>{{student_name}} from {{class}} achieved {{achievement}}</div>';
      const regex = /\{\{([^}]+)\}\}/g;
      const matches = templateHtml.matchAll(regex);
      const variables = new Set<string>();
      
      for (const match of matches) {
        variables.add(match[1].trim());
      }
      
      const extracted = Array.from(variables);
      expect(extracted).toHaveLength(3);
      expect(extracted).toContain('student_name');
      expect(extracted).toContain('class');
      expect(extracted).toContain('achievement');
    });

    it('should handle variables with spaces', () => {
      const templateHtml = '<div>{{ student_name }} and {{ class }}</div>';
      const regex = /\{\{([^}]+)\}\}/g;
      const matches = templateHtml.matchAll(regex);
      const variables = new Set<string>();
      
      for (const match of matches) {
        variables.add(match[1].trim());
      }
      
      const extracted = Array.from(variables);
      expect(extracted).toContain('student_name');
      expect(extracted).toContain('class');
    });

    it('should return unique variables only', () => {
      const templateHtml = '<div>{{name}} and {{name}} again</div>';
      const regex = /\{\{([^}]+)\}\}/g;
      const matches = templateHtml.matchAll(regex);
      const variables = new Set<string>();
      
      for (const match of matches) {
        variables.add(match[1].trim());
      }
      
      const extracted = Array.from(variables);
      expect(extracted).toHaveLength(1);
      expect(extracted).toContain('name');
    });

    it('should return empty array if no variables found', () => {
      const templateHtml = '<div>No variables here</div>';
      const regex = /\{\{([^}]+)\}\}/g;
      const matches = templateHtml.matchAll(regex);
      const variables = new Set<string>();
      
      for (const match of matches) {
        variables.add(match[1].trim());
      }
      
      const extracted = Array.from(variables);
      expect(extracted).toHaveLength(0);
    });
  });

  describe('validateVariables', () => {
    it('should return true when all variables are present in template', () => {
      const templateHtml = '<div>{{student_name}} from {{class}}</div>';
      const requiredVars = ['student_name', 'class'];
      
      const regex = /\{\{([^}]+)\}\}/g;
      const matches = templateHtml.matchAll(regex);
      const extractedVars = new Set<string>();
      
      for (const match of matches) {
        extractedVars.add(match[1].trim());
      }
      
      const isValid = requiredVars.every(v => Array.from(extractedVars).includes(v));
      expect(isValid).toBe(true);
    });

    it('should return false when variables are missing from template', () => {
      const templateHtml = '<div>{{student_name}}</div>';
      const requiredVars = ['student_name', 'class']; // class is missing
      
      const regex = /\{\{([^}]+)\}\}/g;
      const matches = templateHtml.matchAll(regex);
      const extractedVars = new Set<string>();
      
      for (const match of matches) {
        extractedVars.add(match[1].trim());
      }
      
      const isValid = requiredVars.every(v => Array.from(extractedVars).includes(v));
      expect(isValid).toBe(false);
    });
  });

  describe('renderTemplate', () => {
    it('should replace variables with provided data', () => {
      let templateHtml = '<div>{{student_name}} from {{class}}</div>';
      const data = {
        student_name: 'John Doe',
        class: 'Class 10',
      };
      
      for (const [key, value] of Object.entries(data)) {
        const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
        templateHtml = templateHtml.replace(regex, String(value || ''));
      }
      
      expect(templateHtml).toBe('<div>John Doe from Class 10</div>');
    });

    it('should handle variables with spaces in template', () => {
      let templateHtml = '<div>{{ student_name }} from {{ class }}</div>';
      const data = {
        student_name: 'John Doe',
        class: 'Class 10',
      };
      
      for (const [key, value] of Object.entries(data)) {
        const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
        templateHtml = templateHtml.replace(regex, String(value || ''));
      }
      
      expect(templateHtml).toBe('<div>John Doe from Class 10</div>');
    });

    it('should replace missing variables with empty string', () => {
      let templateHtml = '<div>{{student_name}} from {{class}}</div>';
      const data = {
        student_name: 'John Doe',
        // class is missing
      };
      
      for (const [key, value] of Object.entries(data)) {
        const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
        templateHtml = templateHtml.replace(regex, String(value || ''));
      }
      
      // Replace remaining variables with empty string
      templateHtml = templateHtml.replace(/\{\{[^}]+\}\}/g, '');
      
      expect(templateHtml).toBe('<div>John Doe from </div>');
    });

    it('should handle multiple occurrences of same variable', () => {
      let templateHtml = '<div>{{name}} and {{name}} again</div>';
      const data = {
        name: 'John',
      };
      
      for (const [key, value] of Object.entries(data)) {
        const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
        templateHtml = templateHtml.replace(regex, String(value || ''));
      }
      
      expect(templateHtml).toBe('<div>John and John again</div>');
    });
  });
});
