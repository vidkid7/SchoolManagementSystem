import dotenv from 'dotenv';
dotenv.config();

import sequelize from '../config/database';

async function createAuditLogsTable() {
  try {
    console.log('Creating audit_logs table...');
    
    await sequelize.query(`
      CREATE TABLE IF NOT EXISTS \`audit_logs\` (
        \`audit_log_id\` BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        \`user_id\` INT UNSIGNED NULL,
        \`entity_type\` VARCHAR(50) NOT NULL COMMENT 'Type of entity (e.g., student, staff, user, etc.)',
        \`entity_id\` INT UNSIGNED NOT NULL COMMENT 'ID of the entity being modified',
        \`action\` ENUM('create', 'update', 'delete', 'restore') NOT NULL COMMENT 'Type of action performed',
        \`old_value\` JSON NULL COMMENT 'Previous state of the entity (null for create)',
        \`new_value\` JSON NULL COMMENT 'New state of the entity (null for delete)',
        \`changed_fields\` JSON NULL COMMENT 'Array of field names that were changed (for update actions)',
        \`ip_address\` VARCHAR(45) NULL COMMENT 'IP address of the user (supports IPv4 and IPv6)',
        \`user_agent\` TEXT NULL COMMENT 'User agent string from the request',
        \`metadata\` JSON NULL COMMENT 'Additional context data (e.g., request ID, session ID)',
        \`timestamp\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT 'When the action was performed',
        \`created_at\` DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY (\`audit_log_id\`),
        KEY \`idx_audit_logs_user_id\` (\`user_id\`),
        KEY \`idx_audit_logs_entity\` (\`entity_type\`, \`entity_id\`),
        KEY \`idx_audit_logs_action\` (\`action\`),
        KEY \`idx_audit_logs_timestamp\` (\`timestamp\`),
        KEY \`idx_audit_logs_entity_timestamp\` (\`entity_type\`, \`entity_id\`, \`timestamp\`),
        KEY \`idx_audit_logs_user_timestamp\` (\`user_id\`, \`timestamp\`),
        CONSTRAINT \`fk_audit_logs_user\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\` (\`user_id\`) ON DELETE SET NULL ON UPDATE CASCADE
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    
    console.log('✓ audit_logs table created successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error creating audit_logs table:', error);
    process.exit(1);
  }
}

createAuditLogsTable();
