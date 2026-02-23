import dotenv from 'dotenv';
dotenv.config();

import sequelize from '../config/database';

async function createEventsTable() {
  try {
    console.log('Creating events table...');
    
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`events\` (
        \`event_id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`title\` VARCHAR(255) NOT NULL,
        \`title_np\` VARCHAR(255) DEFAULT NULL,
        \`description\` TEXT DEFAULT NULL,
        \`description_np\` TEXT DEFAULT NULL,
        \`category\` ENUM('academic', 'sports', 'cultural', 'holiday', 'exam', 'meeting', 'other') NOT NULL,
        \`start_date\` DATE NOT NULL,
        \`start_date_bs\` VARCHAR(10) DEFAULT NULL,
        \`end_date\` DATE DEFAULT NULL,
        \`end_date_bs\` VARCHAR(10) DEFAULT NULL,
        \`start_time\` VARCHAR(5) DEFAULT NULL,
        \`end_time\` VARCHAR(5) DEFAULT NULL,
        \`venue\` VARCHAR(255) DEFAULT NULL,
        \`venue_np\` VARCHAR(255) DEFAULT NULL,
        \`is_recurring\` BOOLEAN NOT NULL DEFAULT FALSE,
        \`recurrence_pattern\` ENUM('daily', 'weekly', 'monthly', 'yearly') DEFAULT NULL,
        \`recurrence_end_date\` DATE DEFAULT NULL,
        \`target_audience\` ENUM('all', 'students', 'parents', 'teachers', 'staff') NOT NULL DEFAULT 'all',
        \`target_classes\` JSON DEFAULT NULL,
        \`is_holiday\` BOOLEAN NOT NULL DEFAULT FALSE,
        \`is_nepal_government_holiday\` BOOLEAN NOT NULL DEFAULT FALSE,
        \`government_holiday_name\` VARCHAR(255) DEFAULT NULL,
        \`government_holiday_name_np\` VARCHAR(255) DEFAULT NULL,
        \`color\` VARCHAR(7) DEFAULT NULL,
        \`created_by\` INT UNSIGNED DEFAULT NULL,
        \`status\` ENUM('scheduled', 'ongoing', 'completed', 'cancelled') NOT NULL DEFAULT 'scheduled',
        \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        \`deleted_at\` DATETIME DEFAULT NULL,
        PRIMARY KEY (\`event_id\`),
        KEY \`idx_events_start_date\` (\`start_date\`),
        KEY \`idx_events_end_date\` (\`end_date\`),
        KEY \`idx_events_category\` (\`category\`),
        KEY \`idx_events_target_audience\` (\`target_audience\`),
        KEY \`idx_events_status\` (\`status\`),
        KEY \`idx_events_is_holiday\` (\`is_holiday\`),
        KEY \`idx_events_is_nepal_government_holiday\` (\`is_nepal_government_holiday\`),
        KEY \`idx_events_is_recurring\` (\`is_recurring\`),
        KEY \`idx_events_created_by\` (\`created_by\`),
        KEY \`idx_events_date_range\` (\`start_date\`, \`end_date\`),
        KEY \`idx_events_category_holiday\` (\`category\`, \`is_holiday\`),
        CONSTRAINT \`fk_events_created_by\` FOREIGN KEY (\`created_by\`) REFERENCES \`users\` (\`user_id\`) ON DELETE SET NULL ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    
    console.log('✓ Events table created successfully');
    
    await sequelize.close();
    console.log('\nDone!');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

createEventsTable();
