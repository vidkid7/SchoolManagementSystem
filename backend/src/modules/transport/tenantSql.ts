export interface TransportTenantScope {
  enforceIsolation: boolean;
  schoolConfigIds?: string[];
  municipalityId?: string;
}

export interface ScopedSql {
  sql: string;
  replacements: Record<string, unknown>;
}

const TRANSPORT_TABLES = new Set([
  'transport_routes',
  'transport_vehicles',
  'transport_pickup_points',
  'transport_attendance',
  'transport_drivers',
  'transport_maintenance_records',
]);

function getTenantPredicate(scope: TransportTenantScope): {
  predicate: string;
  replacements: Record<string, unknown>;
} {
  const schoolConfigIds = scope.enforceIsolation ? scope.schoolConfigIds ?? [] : [];
  if (schoolConfigIds.length === 0) {
    return { predicate: '1 = 0', replacements: {} };
  }

  return {
    predicate: 'school_config_id IN (:tenantSchoolConfigIds)',
    replacements: { tenantSchoolConfigIds: schoolConfigIds },
  };
}

function getTransportTable(sql: string): string {
  const match = sql.match(/\b(?:FROM|UPDATE|INTO|DELETE\s+FROM)\s+(transport_[a-z_]+)/i);
  const tableName = match?.[1]?.toLowerCase();
  if (!tableName || !TRANSPORT_TABLES.has(tableName)) {
    throw new Error('Transport SQL must target a tenant-scoped transport table');
  }
  return tableName;
}

function scopeInsert(
  sql: string,
  replacements: Record<string, unknown>,
  scope: TransportTenantScope
): ScopedSql {
  const ids = scope.enforceIsolation ? scope.schoolConfigIds ?? [] : [];
  if (ids.length !== 1) {
    throw new Error('A single authorized school is required to create transport records');
  }

  const tableName = getTransportTable(sql);
  const tablePattern = new RegExp(`\\bINSERT\\s+INTO\\s+${tableName}\\s*\\(`, 'i');
  const columnOpenIndex = sql.search(tablePattern);
  if (columnOpenIndex < 0) throw new Error('Invalid transport insert statement');
  const columnParenIndex = sql.indexOf('(', columnOpenIndex);
  const columns = sql.slice(columnParenIndex + 1).match(/^([^)]*)\)/)?.[1] ?? '';
  if (!columns || /\b(?:school_config_id|municipality_id)\b/i.test(columns)) {
    throw new Error('Transport insert must not supply tenant columns directly');
  }

  if (!/\bVALUES\s*\(/i.test(sql)) throw new Error('Invalid transport insert values');
  const scopedSql = `${sql.slice(0, columnParenIndex + 1)}school_config_id, municipality_id, ${sql.slice(columnParenIndex + 1)}`;
  const valuesKeyword = scopedSql.search(/\bVALUES\s*\(/i);
  if (valuesKeyword < 0) throw new Error('Invalid transport insert values');
  const scopedValueParenIndex = scopedSql.indexOf('(', valuesKeyword);
  const finalSql = `${scopedSql.slice(0, scopedValueParenIndex + 1)}:tenantSchoolConfigId, :tenantMunicipalityId, ${scopedSql.slice(scopedValueParenIndex + 1)}`;

  return {
    sql: finalSql,
    replacements: {
      ...replacements,
      tenantSchoolConfigId: ids[0],
      tenantMunicipalityId: scope.municipalityId ?? null,
    },
  };
}

export function scopeTransportSql(
  sql: string,
  replacements: Record<string, unknown>,
  scope: TransportTenantScope
): ScopedSql {
  if (/^\s*INSERT\s+INTO\b/i.test(sql)) {
    return scopeInsert(sql, replacements, scope);
  }

  getTransportTable(sql);
  const tenant = getTenantPredicate(scope);
  const whereMatch = /\bWHERE\b/i.exec(sql);
  let scopedSql: string;
  if (whereMatch && whereMatch.index !== undefined) {
    const whereEnd = whereMatch.index + whereMatch[0].length;
    const trailingClause = /\b(?:GROUP\s+BY|HAVING|ORDER\s+BY|LIMIT|FOR\s+UPDATE)\b/i.exec(sql.slice(whereEnd));
    const conditionEnd = trailingClause?.index === undefined
      ? sql.length
      : whereEnd + trailingClause.index;
    const condition = sql.slice(whereEnd, conditionEnd).trim();
    if (!condition) throw new Error('Transport SQL WHERE clause must include a condition');
    scopedSql = `${sql.slice(0, whereEnd)} ${tenant.predicate} AND (${condition}) ${sql.slice(conditionEnd)}`;
  } else {
    const clauseMatch = /\b(?:ORDER\s+BY|LIMIT|ON\s+DUPLICATE\s+KEY\s+UPDATE)\b/i.exec(sql);
    const insertAt = clauseMatch?.index ?? sql.length;
    scopedSql = `${sql.slice(0, insertAt)} WHERE ${tenant.predicate} ${sql.slice(insertAt)}`;
  }

  return {
    sql: scopedSql,
    replacements: { ...replacements, ...tenant.replacements },
  };
}
