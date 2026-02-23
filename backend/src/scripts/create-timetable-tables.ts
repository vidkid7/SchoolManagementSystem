import dotenv from 'dotenv';
dotenv.config();

import sequelize from '../config/database';

async function createTimetableTables() {
  try {
    console.log('Creating timetable-related tables...');
    
    // Create timetables table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`timetables\` (
        \`timetable_id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`class_id\` INT UNSIGNED NOT NULL,
        \`academic_year_id\` INT UNSIGNED NOT NULL,
        \`day_of_week\` INT NOT NULL COMMENT '0-6 (Sunday-Saturday)',
        \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`timetable_id\`),
        UNIQUE KEY \`idx_timetables_class_year_day\` (\`class_id\`, \`academic_year_id\`, \`day_of_week\`),
        KEY \`idx_timetables_academic_year_id\` (\`academic_year_id\`),
        CONSTRAINT \`fk_timetables_class\` FOREIGN KEY (\`class_id\`) REFERENCES \`classes\` (\`class_id\`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`fk_timetables_academic_year\` FOREIGN KEY (\`academic_year_id\`) REFERENCES \`academic_years\` (\`academic_year_id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✓ timetables table created');
    
    // Create periods table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`periods\` (
        \`period_id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`timetable_id\` INT UNSIGNED NOT NULL,
        \`period_number\` INT NOT NULL COMMENT 'Period sequence number (1, 2, 3, etc.)',
        \`start_time\` VARCHAR(5) NOT NULL COMMENT 'HH:mm format (e.g., 09:00)',
        \`end_time\` VARCHAR(5) NOT NULL COMMENT 'HH:mm format (e.g., 09:45)',
        \`subject_id\` INT UNSIGNED NULL,
        \`teacher_id\` INT UNSIGNED NULL,
        \`room_number\` VARCHAR(20) NULL COMMENT 'Classroom or lab number',
        \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`period_id\`),
        UNIQUE KEY \`idx_periods_timetable_period\` (\`timetable_id\`, \`period_number\`),
        KEY \`idx_periods_teacher_id\` (\`teacher_id\`),
        KEY \`idx_periods_subject_id\` (\`subject_id\`),
        CONSTRAINT \`fk_periods_timetable\` FOREIGN KEY (\`timetable_id\`) REFERENCES \`timetables\` (\`timetable_id\`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`fk_periods_subject\` FOREIGN KEY (\`subject_id\`) REFERENCES \`subjects\` (\`subject_id\`) ON DELETE SET NULL ON UPDATE CASCADE,
        CONSTRAINT \`fk_periods_teacher\` FOREIGN KEY (\`teacher_id\`) REFERENCES \`staff\` (\`staff_id\`) ON DELETE SET NULL ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✓ periods table created');
    
    // Create syllabi table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`syllabi\` (
        \`syllabus_id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`subject_id\` INT UNSIGNED NOT NULL,
        \`class_id\` INT UNSIGNED NOT NULL,
        \`academic_year_id\` INT UNSIGNED NOT NULL,
        \`completed_percentage\` DECIMAL(5, 2) NOT NULL DEFAULT 0 COMMENT 'Overall syllabus completion percentage (0-100)',
        \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`syllabus_id\`),
        UNIQUE KEY \`idx_syllabi_subject_class_year\` (\`subject_id\`, \`class_id\`, \`academic_year_id\`),
        KEY \`idx_syllabi_class_id\` (\`class_id\`),
        CONSTRAINT \`fk_syllabi_subject\` FOREIGN KEY (\`subject_id\`) REFERENCES \`subjects\` (\`subject_id\`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`fk_syllabi_class\` FOREIGN KEY (\`class_id\`) REFERENCES \`classes\` (\`class_id\`) ON DELETE CASCADE ON UPDATE CASCADE,
        CONSTRAINT \`fk_syllabi_academic_year\` FOREIGN KEY (\`academic_year_id\`) REFERENCES \`academic_years\` (\`academic_year_id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✓ syllabi table created');
    
    // Create syllabus_topics table
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`syllabus_topics\` (
        \`topic_id\` INT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`syllabus_id\` INT UNSIGNED NOT NULL,
        \`title\` VARCHAR(200) NOT NULL COMMENT 'Topic title',
        \`description\` TEXT NULL COMMENT 'Detailed topic description',
        \`estimated_hours\` DECIMAL(5, 2) NOT NULL COMMENT 'Estimated teaching hours for this topic',
        \`completed_hours\` DECIMAL(5, 2) NOT NULL DEFAULT 0 COMMENT 'Actual completed teaching hours',
        \`status\` ENUM('not_started', 'in_progress', 'completed') NOT NULL DEFAULT 'not_started',
        \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        \`updated_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (\`topic_id\`),
        KEY \`idx_syllabus_topics_syllabus_id\` (\`syllabus_id\`),
        KEY \`idx_syllabus_topics_status\` (\`status\`),
        CONSTRAINT \`fk_syllabus_topics_syllabus\` FOREIGN KEY (\`syllabus_id\`) REFERENCES \`syllabi\` (\`syllabus_id\`) ON DELETE CASCADE ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✓ syllabus_topics table created');
    
    console.log('\n✓ All timetable-related tables created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error creating timetable tables:', error);
    process.exit(1);
  }
}

createTimetableTables();
