jest.mock('sanitize-html', () => (html: string) => html);

import request from 'supertest';
import app from '../../../app';
import sequelize from '@config/database';
import User, { UserRole } from '@models/User.model';
import SchoolConfig from '@models/SchoolConfig.model';
import CertificateTemplate from '@models/CertificateTemplate.model';
import jwtService from '@modules/auth/jwt.service';

describe('Certificate template API persistence with isolated SQLite', () => {
  let authToken: string;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    const school = await SchoolConfig.create({
      schoolNameEn: 'Local Certificate Template QA',
      schoolCode: 'LOCALCERTQA',
    });
    const admin = await User.create({
      username: 'localcertadmin',
      email: 'local-cert-admin@example.test',
      password: 'LocalOnly!Test123',
      role: UserRole.SCHOOL_ADMIN,
      schoolConfigId: school.id,
    });
    authToken = jwtService.generateAccessToken({
      userId: admin.userId,
      username: admin.username,
      email: admin.email,
      role: admin.role,
      schoolConfigId: school.id,
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  it('creates, reads, renders, updates and soft-deletes a template through the API', async () => {
    const payload = {
      name: 'Local QA Character Certificate',
      type: 'character',
      templateHtml: '<div>Certificate for {{student_name}}</div>',
      variables: ['student_name'],
    };
    const headers = { Authorization: `Bearer ${authToken}` };

    const created = await request(app)
      .post('/api/v1/certificate-templates')
      .set(headers)
      .send(payload)
      .expect(201);
    expect(created.body.success).toBe(true);
    expect(created.body.data.templateHtml).toBe(payload.templateHtml);
    const templateId = created.body.data.templateId as number;

    const listed = await request(app)
      .get('/api/v1/certificate-templates')
      .query({ search: 'Local QA Character Certificate', isActive: true })
      .set(headers)
      .expect(200);
    expect(listed.body.data).toEqual(expect.arrayContaining([
      expect.objectContaining({ templateId, templateHtml: payload.templateHtml }),
    ]));

    const rendered = await request(app)
      .post(`/api/v1/certificate-templates/${templateId}/render`)
      .set(headers)
      .send({ data: { student_name: '<script>alert(1)</script>' } })
      .expect(200);
    expect(rendered.body.data.html).toContain('&lt;script&gt;alert(1)&lt;/script&gt;');
    expect(rendered.body.data.html).not.toContain('<script>');

    const updated = await request(app)
      .put(`/api/v1/certificate-templates/${templateId}`)
      .set(headers)
      .send({
        name: 'Local QA Character Certificate Updated',
        templateHtml: '<p>Updated for {{student_name}}</p>',
        variables: ['student_name'],
      })
      .expect(200);
    expect(updated.body.data.name).toBe('Local QA Character Certificate Updated');

    const readBack = await request(app)
      .get(`/api/v1/certificate-templates/${templateId}`)
      .set(headers)
      .expect(200);
    expect(readBack.body.data.templateHtml).toBe('<p>Updated for {{student_name}}</p>');
    expect((await CertificateTemplate.findByPk(templateId))?.getDataValue('name'))
      .toBe('Local QA Character Certificate Updated');

    await request(app)
      .delete(`/api/v1/certificate-templates/${templateId}`)
      .set(headers)
      .expect(200);
    const softDeleted = await CertificateTemplate.findByPk(templateId);
    expect(softDeleted?.getDataValue('isActive')).toBe(false);
    const activeList = await request(app)
      .get('/api/v1/certificate-templates')
      .query({ isActive: true })
      .set(headers)
      .expect(200);
    expect(activeList.body.data).not.toEqual(expect.arrayContaining([
      expect.objectContaining({ templateId }),
    ]));
    const inactiveList = await request(app)
      .get('/api/v1/certificate-templates')
      .query({ isActive: false })
      .set(headers)
      .expect(200);
    expect(inactiveList.body.data).toEqual(expect.arrayContaining([
      expect.objectContaining({ templateId, isActive: false }),
    ]));
  });
});
