const mysql = require('mysql2/promise');

(async () => {
  const conn = await mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: 'Dhire12345@@',
    database: 'school_management_system'
  });

  await conn.query(`
    CREATE TABLE IF NOT EXISTS notification_templates (
      id VARCHAR(36) NOT NULL PRIMARY KEY DEFAULT (UUID()),
      name VARCHAR(100) NOT NULL,
      code VARCHAR(50) NOT NULL UNIQUE,
      description TEXT,
      category ENUM('attendance','exam','fee','grade','announcement','leave','library','general') NOT NULL,
      channel ENUM('sms','email','push','in_app') NOT NULL,
      language ENUM('nepali','english') NOT NULL,
      subject VARCHAR(255),
      template_en TEXT NOT NULL,
      template_np TEXT,
      variables JSON NOT NULL DEFAULT ('[]'),
      is_active TINYINT(1) NOT NULL DEFAULT 1,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('notification_templates created OK');

  await conn.query(`
    CREATE TABLE IF NOT EXISTS archive_metadata (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
      academic_year_id INT UNSIGNED NOT NULL,
      academic_year_name VARCHAR(100) NOT NULL,
      archived_at DATETIME NOT NULL,
      archived_by INT UNSIGNED NOT NULL,
      status ENUM('in_progress','completed','failed','restored') NOT NULL DEFAULT 'in_progress',
      tables_archived JSON,
      record_counts JSON,
      retention_until DATETIME NOT NULL,
      error_message TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);
  console.log('archive_metadata created OK');

  await conn.end();
})().catch(e => console.error('ERROR:', e.message));
