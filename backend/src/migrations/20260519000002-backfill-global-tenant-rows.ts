import { QueryInterface } from 'sequelize';

const TABLES = ['notification_templates', 'archive_metadata'];

function normalizeTableName(table: unknown): string {
  if (typeof table === 'string') {
    return table;
  }

  if (table && typeof table === 'object') {
    const values = Object.values(table as Record<string, string>);
    if (values.length > 0 && typeof values[0] === 'string') {
      return values[0];
    }
  }

  return '';
}

async function hasTable(queryInterface: QueryInterface, tableName: string): Promise<boolean> {
  const tables = await queryInterface.showAllTables();
  return tables.map(normalizeTableName).includes(tableName);
}

async function hasColumn(
  queryInterface: QueryInterface,
  tableName: string,
  columnName: string
): Promise<boolean> {
  try {
    const description = await queryInterface.describeTable(tableName);
    return Object.prototype.hasOwnProperty.call(description, columnName);
  } catch {
    return false;
  }
}

async function getFallbackMunicipalityId(queryInterface: QueryInterface): Promise<string | null> {
  if (!(await hasTable(queryInterface, 'municipalities'))) {
    return null;
  }

  const [rows] = await queryInterface.sequelize.query(
    'SELECT id FROM municipalities ORDER BY created_at ASC, id ASC LIMIT 1'
  );
  const first = (rows as Array<{ id: string }>)[0];
  return first?.id ?? null;
}

export async function up(queryInterface: QueryInterface): Promise<void> {
  const municipalityId = await getFallbackMunicipalityId(queryInterface);
  if (!municipalityId) {
    return;
  }

  for (const tableName of TABLES) {
    if (!(await hasTable(queryInterface, tableName))) {
      continue;
    }
    if (!(await hasColumn(queryInterface, tableName, 'municipality_id'))) {
      continue;
    }

    await queryInterface.sequelize.query(
      `UPDATE \`${tableName}\`
       SET municipality_id = :municipalityId
       WHERE municipality_id IS NULL`,
      { replacements: { municipalityId } }
    );
  }
}

export async function down(): Promise<void> {
  // Keep tenant ownership on existing rows. Reversing this would hide data again.
}
