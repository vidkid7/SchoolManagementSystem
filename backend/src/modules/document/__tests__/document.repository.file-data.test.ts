import { DataTypes, Sequelize } from 'sequelize';
import { Document, initDocument } from '../../../models/Document.model';
import { DocumentRepository } from '../document.repository';

describe('DocumentRepository file data persistence', () => {
  let sequelize: Sequelize;

  beforeEach(async () => {
    sequelize = new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false });
    await sequelize.getQueryInterface().createTable('users', {
      user_id: { type: DataTypes.INTEGER.UNSIGNED, primaryKey: true, autoIncrement: true },
    });
    await sequelize.getQueryInterface().bulkInsert('users', [{ user_id: 1 }]);
    initDocument(sequelize);
    await Document.sync({ force: true });
  });

  afterEach(async () => {
    await sequelize.close();
  });

  it('round-trips bytes without including them in normal document queries or JSON', async () => {
    const bytes = Buffer.from('%PDF synthetic test content');
    const saved = await Document.create({
      documentNumber: 'DOC-TEST-000001',
      name: 'QA persistence test',
      originalName: 'qa.pdf',
      category: 'other',
      mimeType: 'application/pdf',
      size: bytes.length,
      storagePath: '/uploads/documents/DOC-TEST-000001.pdf',
      fileData: bytes,
      uploadedBy: 1,
      accessLevel: 'private',
      isCompressed: false,
    });

    const repository = new DocumentRepository();
    const listedDocument = await repository.findById(saved.documentId);
    const loadedBytes = await repository.getFileData(saved.documentId);

    expect(listedDocument?.fileData).toBeUndefined();
    expect(JSON.stringify(listedDocument)).not.toContain(bytes.toString());
    expect(loadedBytes).toEqual(bytes);
  });

  it('restores an archived document to the active status', async () => {
    const saved = await Document.create({
      documentNumber: 'DOC-TEST-000002',
      name: 'QA archived document',
      originalName: 'qa.pdf',
      category: 'other',
      mimeType: 'application/pdf',
      size: 4,
      storagePath: '/uploads/documents/DOC-TEST-000002.pdf',
      fileData: Buffer.from('%PDF'),
      uploadedBy: 1,
      accessLevel: 'private',
      isCompressed: false,
    });

    const repository = new DocumentRepository();
    await repository.archive(saved.documentId);
    const restored = await repository.restore(saved.documentId);

    expect(restored?.status).toBe('active');
  });
});
