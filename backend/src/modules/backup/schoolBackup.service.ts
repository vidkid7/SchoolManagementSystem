import { createCipheriv, createDecipheriv, randomBytes, scrypt as scryptCallback } from 'crypto';
import { promisify } from 'util';
import { gzipSync, gunzipSync } from 'zlib';
import { Model, ModelStatic } from 'sequelize';
import sequelize from '@config/database';
import SchoolConfig from '@models/SchoolConfig.model';
import User from '@models/User.model';
import { NotFoundError, ValidationError } from '@middleware/errorHandler';

const scrypt = promisify(scryptCallback);
const ARCHIVE_FORMAT = 'school-management-school-backup';
const ARCHIVE_VERSION = 1;
const MAX_ARCHIVE_BYTES = 100 * 1024 * 1024;
const MAX_DECOMPRESSED_BYTES = 250 * 1024 * 1024;
const USER_SECRET_FIELDS = new Set(['refreshToken', 'passwordResetToken', 'passwordResetExpires']);

interface BackupEnvelope {
  format: typeof ARCHIVE_FORMAT;
  version: typeof ARCHIVE_VERSION;
  kdf: 'scrypt';
  cipher: 'aes-256-gcm';
  salt: string;
  iv: string;
  authTag: string;
  ciphertext: string;
}

interface SchoolArchive {
  format: typeof ARCHIVE_FORMAT;
  version: typeof ARCHIVE_VERSION;
  createdAt: string;
  school: { id: string; name: string; code: string | null };
  tables: Array<{ model: string; rows: Array<Record<string, unknown>> }>;
}

function validatePassphrase(passphrase: unknown): asserts passphrase is string {
  if (typeof passphrase !== 'string' || passphrase.length < 12 || passphrase.length > 128) {
    throw new ValidationError('Backup passphrase must be between 12 and 128 characters.');
  }
}

async function deriveKey(passphrase: string, salt: Buffer): Promise<Buffer> {
  return await scrypt(passphrase, salt, 32) as Buffer;
}

function getSchoolDataModels(): Array<ModelStatic<Model>> {
  return Object.values(sequelize.models)
    .filter((model): model is ModelStatic<Model> =>
      model.name !== SchoolConfig.name &&
      Object.prototype.hasOwnProperty.call(model.rawAttributes, 'schoolConfigId')
    )
    .sort((a, b) => a.name.localeCompare(b.name));
}

function sortForRestore(models: Array<ModelStatic<Model>>): Array<ModelStatic<Model>> {
  const byName = new Map(models.map((model) => [model.name, model]));
  const dependencies = new Map<string, Set<string>>();
  for (const model of models) {
    const refs = new Set<string>();
    for (const association of Object.values(model.associations || {})) {
      if (association.associationType === 'BelongsTo' && byName.has(association.target.name)) {
        refs.add(association.target.name);
      }
    }
    dependencies.set(model.name, refs);
  }

  const ordered: Array<ModelStatic<Model>> = [];
  const pending = new Set(models.map((model) => model.name));
  while (pending.size) {
    const ready = [...pending].filter((name) =>
      [...(dependencies.get(name) || [])].every((dependency) => !pending.has(dependency))
    );
    if (!ready.length) {
      // Keep deterministic ordering for cyclic associations; bulk upsert still
      // runs transactionally, so a constraint failure rolls the whole restore back.
      ready.push([...pending].sort()[0]);
    }
    for (const name of ready) {
      pending.delete(name);
      const model = byName.get(name);
      if (model) ordered.push(model);
    }
  }
  return ordered;
}

export class SchoolBackupService {
  async create(schoolId: string, passphrase: string): Promise<{ file: Buffer; filename: string; rowCount: number }> {
    validatePassphrase(passphrase);
    const school = await SchoolConfig.findByPk(schoolId, { skipTenantIsolation: true } as any);
    if (!school) throw new NotFoundError('School configuration');

    const tables: SchoolArchive['tables'] = [];
    let rowCount = 0;
    for (const model of getSchoolDataModels()) {
      const rows = await model.findAll({
        where: { schoolConfigId: schoolId },
        raw: true,
        paranoid: false,
        skipTenantIsolation: true,
      } as any) as unknown as Array<Record<string, unknown>>;
      const safeRows = model === User
        ? rows.map(({ refreshToken: _refreshToken, passwordResetToken: _resetToken, passwordResetExpires: _resetExpiry, ...row }) => row)
        : rows;
      tables.push({ model: model.name, rows: safeRows });
      rowCount += safeRows.length;
    }

    const archive: SchoolArchive = {
      format: ARCHIVE_FORMAT,
      version: ARCHIVE_VERSION,
      createdAt: new Date().toISOString(),
      school: { id: String(school.id), name: school.schoolNameEn, code: school.schoolCode || null },
      tables,
    };

    const compressed = gzipSync(Buffer.from(JSON.stringify(archive)), { level: 9 });
    const salt = randomBytes(16);
    const iv = randomBytes(12);
    const key = await deriveKey(passphrase, salt);
    const cipher = createCipheriv('aes-256-gcm', key, iv);
    cipher.setAAD(Buffer.from(`${ARCHIVE_FORMAT}:${ARCHIVE_VERSION}:${schoolId}`));
    const ciphertext = Buffer.concat([cipher.update(compressed), cipher.final()]);
    const envelope: BackupEnvelope = {
      format: ARCHIVE_FORMAT,
      version: ARCHIVE_VERSION,
      kdf: 'scrypt',
      cipher: 'aes-256-gcm',
      salt: salt.toString('base64'),
      iv: iv.toString('base64'),
      authTag: cipher.getAuthTag().toString('base64'),
      ciphertext: ciphertext.toString('base64'),
    };
    const file = Buffer.from(JSON.stringify(envelope));
    if (file.length > MAX_ARCHIVE_BYTES) throw new ValidationError('Encrypted backup exceeds the 100 MB limit.');
    const safeName = String(school.schoolCode || schoolId).replace(/[^a-zA-Z0-9_-]/g, '_');
    const date = new Date().toISOString().replace(/[:.]/g, '-');
    return { file, filename: `school-${safeName}-${date}.smbak`, rowCount };
  }

  private async decrypt(schoolId: string, passphrase: string, input: Buffer): Promise<SchoolArchive> {
    validatePassphrase(passphrase);
    if (!Buffer.isBuffer(input) || input.length === 0 || input.length > MAX_ARCHIVE_BYTES) {
      throw new ValidationError('Backup file is empty or exceeds the 100 MB limit.');
    }

    let envelope: BackupEnvelope;
    try {
      envelope = JSON.parse(input.toString('utf8')) as BackupEnvelope;
    } catch {
      throw new ValidationError('Backup file is not a valid encrypted school archive.');
    }
    if (envelope.format !== ARCHIVE_FORMAT || envelope.version !== ARCHIVE_VERSION ||
      envelope.kdf !== 'scrypt' || envelope.cipher !== 'aes-256-gcm') {
      throw new ValidationError('Unsupported backup file format.');
    }

    try {
      const salt = Buffer.from(envelope.salt, 'base64');
      const iv = Buffer.from(envelope.iv, 'base64');
      const tag = Buffer.from(envelope.authTag, 'base64');
      const key = await deriveKey(passphrase, salt);
      const decipher = createDecipheriv('aes-256-gcm', key, iv);
      decipher.setAAD(Buffer.from(`${ARCHIVE_FORMAT}:${ARCHIVE_VERSION}:${schoolId}`));
      decipher.setAuthTag(tag);
      const compressed = Buffer.concat([
        decipher.update(Buffer.from(envelope.ciphertext, 'base64')),
        decipher.final(),
      ]);
      const json = gunzipSync(compressed, { maxOutputLength: MAX_DECOMPRESSED_BYTES });
      const archive = JSON.parse(json.toString('utf8')) as SchoolArchive;
      if (archive.format !== ARCHIVE_FORMAT || archive.version !== ARCHIVE_VERSION || archive.school?.id !== schoolId || !Array.isArray(archive.tables)) {
        throw new ValidationError('Backup does not belong to the selected school or has an invalid structure.');
      }
      return archive;
    } catch (error) {
      if (error instanceof ValidationError) throw error;
      throw new ValidationError('Could not decrypt backup. Check the passphrase and file integrity.');
    }
  }

  async verify(schoolId: string, passphrase: string, input: Buffer): Promise<{ school: SchoolArchive['school']; createdAt: string; tableCount: number; rowCount: number }> {
    const archive = await this.decrypt(schoolId, passphrase, input);
    return {
      school: archive.school,
      createdAt: archive.createdAt,
      tableCount: archive.tables.length,
      rowCount: archive.tables.reduce((sum, table) => sum + (Array.isArray(table.rows) ? table.rows.length : 0), 0),
    };
  }

  async restore(schoolId: string, passphrase: string, input: Buffer): Promise<{ tableCount: number; rowCount: number; schoolName: string }> {
    const archive = await this.decrypt(schoolId, passphrase, input);
    const school = await SchoolConfig.findByPk(schoolId, { skipTenantIsolation: true } as any);
    if (!school) throw new NotFoundError('School configuration');
    const models = getSchoolDataModels();
    const modelsByName = new Map(models.map((model) => [model.name, model]));
    const tables = new Map(archive.tables.map((table) => [table.model, table.rows]));
    if (tables.size !== archive.tables.length) throw new ValidationError('Backup contains duplicate model entries.');

    for (const [modelName, rows] of tables) {
      const model = modelsByName.get(modelName);
      if (!model || !Array.isArray(rows)) throw new ValidationError('Backup contains an unsupported data table.');
      if (rows.length > 250000) throw new ValidationError('Backup contains too many records in one table.');
      for (const row of rows) {
        if (!row || typeof row !== 'object' || row.schoolConfigId !== schoolId) {
          throw new ValidationError('Backup contains data outside the selected school.');
        }
        for (const field of Object.keys(row)) {
          if (!Object.prototype.hasOwnProperty.call(model.rawAttributes, field)) {
            throw new ValidationError('Backup contains fields that are not supported by this version.');
          }
        }
      }
    }

    let restoredRows = 0;
    const transaction = await sequelize.transaction();
    try {
      for (const model of sortForRestore(models)) {
        const rows = tables.get(model.name) || [];
        if (!rows.length) continue;
        const fields = [...new Set(rows.flatMap((row) => Object.keys(row)))];
        const primaryKeys = model.primaryKeyAttributes || [];
        const updateOnDuplicate = fields.filter((field) =>
          !primaryKeys.includes(field) &&
          !(model === User && USER_SECRET_FIELDS.has(field))
        );
        await model.bulkCreate(rows as any[], {
          fields,
          updateOnDuplicate,
          validate: true,
          hooks: false,
          transaction,
          skipTenantIsolation: true,
        } as any);
        restoredRows += rows.length;
      }

      // Existing sessions and pending reset links must not survive a restore.
      await User.update(
        { refreshToken: null, passwordResetToken: null, passwordResetExpires: null },
        { where: { schoolConfigId: schoolId }, transaction, skipTenantIsolation: true } as any
      );
      await transaction.commit();
    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    return { tableCount: tables.size, rowCount: restoredRows, schoolName: school.schoolNameEn };
  }
}

export const schoolBackupService = new SchoolBackupService();
