import { scopeTransportSql } from '../tenantSql';

const schoolScope = {
  enforceIsolation: true,
  schoolConfigIds: ['school-a'],
  municipalityId: 'municipality-a',
};

describe('scopeTransportSql', () => {
  it('scopes reads and preserves existing filters and ordering', () => {
    const result = scopeTransportSql(
      'SELECT * FROM transport_attendance WHERE date = :date OR student_id = :studentId ORDER BY date DESC',
      { date: '2026-10-11', studentId: 12 },
      schoolScope
    );

    expect(result.sql).toContain('school_config_id IN (:tenantSchoolConfigIds) AND (date = :date OR student_id = :studentId)');
    expect(result.sql).toContain('ORDER BY date DESC');
    expect(result.replacements).toEqual({
      date: '2026-10-11',
      studentId: 12,
      tenantSchoolConfigIds: ['school-a'],
    });
  });

  it('scopes updates and deletes', () => {
    const update = scopeTransportSql(
      'UPDATE transport_routes SET status = :status WHERE id = :id',
      { status: 'inactive', id: 4 },
      schoolScope
    );
    const deletion = scopeTransportSql(
      'DELETE FROM transport_routes WHERE id = :id',
      { id: 4 },
      schoolScope
    );

    expect(update.sql).toContain('school_config_id IN (:tenantSchoolConfigIds) AND (id = :id)');
    expect(deletion.sql).toContain('school_config_id IN (:tenantSchoolConfigIds) AND (id = :id)');
  });

  it('adds authenticated tenant identifiers to inserts', () => {
    const result = scopeTransportSql(
      'INSERT INTO transport_routes (route_name, status, created_at) VALUES (:name, :status, NOW())',
      { name: 'Route A', status: 'active' },
      schoolScope
    );

    expect(result.sql).toContain('(school_config_id, municipality_id, route_name, status, created_at)');
    expect(result.sql).toContain('VALUES (:tenantSchoolConfigId, :tenantMunicipalityId, :name, :status, NOW())');
    expect(result.replacements).toMatchObject({
      tenantSchoolConfigId: 'school-a',
      tenantMunicipalityId: 'municipality-a',
    });
  });

  it('fails closed when the authenticated user has no school scope', () => {
    const result = scopeTransportSql(
      'SELECT * FROM transport_routes ORDER BY id DESC',
      {},
      { enforceIsolation: true, schoolConfigIds: [] }
    );

    expect(result.sql).toContain('WHERE 1 = 0 ORDER BY id DESC');
  });

  it('rejects inserts without exactly one authorized school', () => {
    expect(() => scopeTransportSql(
      'INSERT INTO transport_routes (route_name) VALUES (:name)',
      { name: 'Route A' },
      { enforceIsolation: true, schoolConfigIds: ['school-a', 'school-b'] }
    )).toThrow('A single authorized school is required');
  });

  it('rejects SQL that targets a non-transport table', () => {
    expect(() => scopeTransportSql('SELECT * FROM users', {}, schoolScope))
      .toThrow('Transport SQL must target a tenant-scoped transport table');
  });
});
