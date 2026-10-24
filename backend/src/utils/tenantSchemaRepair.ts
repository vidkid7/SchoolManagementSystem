import type { Sequelize } from 'sequelize';

interface TenantColumnRow {
  TABLE_NAME: string;
  COLUMN_NAME: string | null;
}

type QueryDatabase = Pick<Sequelize, 'query'>;

/** Add missing tenant columns using one metadata query instead of probing each table separately. */
export async function repairMissingTenantColumns(
  database: QueryDatabase,
  tenantTables: readonly string[],
): Promise<void> {
  let rows: TenantColumnRow[];

  try {
    const [metadata] = await database.query(
      `SELECT t.TABLE_NAME, c.COLUMN_NAME
       FROM INFORMATION_SCHEMA.TABLES AS t
       LEFT JOIN INFORMATION_SCHEMA.COLUMNS AS c
         ON c.TABLE_SCHEMA = t.TABLE_SCHEMA
         AND c.TABLE_NAME = t.TABLE_NAME
         AND c.COLUMN_NAME IN ('municipality_id', 'school_config_id')
       WHERE t.TABLE_SCHEMA = DATABASE()
         AND t.TABLE_NAME IN (:tenantTables)`,
      { replacements: { tenantTables: [...tenantTables] } },
    ) as [TenantColumnRow[], unknown];
    rows = metadata;
  } catch {
    // Keep startup resilient when the metadata scan is unavailable, as the previous per-table probes did.
    return;
  }

  const columnsByTable = new Map<string, Set<string>>();
  for (const row of rows) {
    let columnNames = columnsByTable.get(row.TABLE_NAME);
    if (!columnNames) {
      columnNames = new Set<string>();
      columnsByTable.set(row.TABLE_NAME, columnNames);
    }
    if (row.COLUMN_NAME) columnNames.add(row.COLUMN_NAME);
  }

  for (const table of tenantTables) {
    const columnNames = columnsByTable.get(table);
    if (!columnNames) continue;

    try {
      if (!columnNames.has('municipality_id')) {
        await database.query(`ALTER TABLE \`${table}\` ADD COLUMN municipality_id CHAR(36) NULL`);
      }
      if (!columnNames.has('school_config_id')) {
        await database.query(`ALTER TABLE \`${table}\` ADD COLUMN school_config_id CHAR(36) NULL`);
      }
    } catch {
      // Skip a table that cannot be repaired, matching the existing non-fatal startup behavior.
    }
  }
}
