import { CertificateTemplate } from './CertificateTemplate.model';

describe('CertificateTemplate Sequelize attributes', () => {
  it('reads stored HTML through Sequelize accessors and renders placeholders', () => {
    const templateHtml = '<div>{{student_name}} completed {{course_name}}</div>';
    const template = CertificateTemplate.build({
      name: 'QA Certificate Template',
      type: 'course_completion',
      templateHtml,
      variables: ['student_name', 'course_name'],
      isActive: true,
    });

    expect(template.templateHtml).toBe(templateHtml);
    expect(template.extractVariables()).toEqual(['student_name', 'course_name']);
    expect(template.renderTemplate({ student_name: 'QA Student', course_name: 'Testing' }))
      .toBe('<div>QA Student completed Testing</div>');
  });
});
