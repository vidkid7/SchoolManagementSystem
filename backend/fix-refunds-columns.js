const mysql = require('mysql2/promise');
async function main() {
  const conn = await mysql.createConnection({
    host: 'localhost', port: 3306,
    user: 'root', password: 'Dhire12345@@',
    database: 'school_management_system'
  });
  // Check existing columns
  const [cols] = await conn.query("SHOW COLUMNS FROM refunds");
  const colNames = cols.map(c => c.Field);
  console.log('Existing columns:', colNames.join(', '));
  
  if (!colNames.includes('municipality_id')) {
    await conn.query("ALTER TABLE refunds ADD COLUMN municipality_id INT NOT NULL DEFAULT 1");
    console.log('Added municipality_id');
  }
  if (!colNames.includes('school_config_id')) {
    await conn.query("ALTER TABLE refunds ADD COLUMN school_config_id INT NOT NULL DEFAULT 1");
    console.log('Added school_config_id');
  }
  
  // Get the correct municipality_id from municipalities table
  try {
    const [municipalities] = await conn.query("SELECT id FROM municipalities WHERE code = 'KMC' LIMIT 1");
    if (municipalities.length > 0) {
      const [schoolConfigs] = await conn.query("SELECT id FROM school_configs WHERE municipality_id = ? LIMIT 1", [municipalities[0].id]);
      if (schoolConfigs.length > 0) {
        await conn.query("UPDATE refunds SET municipality_id = ?, school_config_id = ?", [municipalities[0].id, schoolConfigs[0].id]);
        console.log(`Updated rows: municipality_id=${municipalities[0].id}, school_config_id=${schoolConfigs[0].id}`);
      }
    }
  } catch(e) { console.log('Update error:', e.message); }
  await conn.end();
  console.log('Done!');
}
main().catch(console.error);
