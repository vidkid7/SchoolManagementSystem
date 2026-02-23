const mysql = require('mysql2/promise');
require('dotenv').config();

async function createTable() {
  let connection;
  
  try {
    console.log('🔄 Connecting to database...');
    
    connection = await mysql.createConnection({
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      database: process.env.DB_NAME || 'school_management_system'
    });
    
    console.log('✅ Connected to database');
    console.log('🔄 Creating staff_documents table...');
    
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS staff_documents (
        document_id INT UNSIGNED NOT NULL AUTO_INCREMENT,
        staff_id INT UNSIGNED NOT NULL,
        category ENUM('certificate', 'contract', 'id_proof', 'qualification', 'experience', 'medical', 'other') NOT NULL COMMENT 'Document category',
        document_name VARCHAR(200) NOT NULL COMMENT 'User-friendly document name',
        original_file_name VARCHAR(255) NOT NULL COMMENT 'Original uploaded file name',
        document_url VARCHAR(500) NOT NULL COMMENT 'Relative URL path to the document',
        file_size INT UNSIGNED NOT NULL COMMENT 'File size in bytes',
        mime_type VARCHAR(100) NOT NULL COMMENT 'MIME type of the document',
        version INT UNSIGNED NOT NULL DEFAULT 1 COMMENT 'Document version number',
        is_latest TINYINT(1) NOT NULL DEFAULT 1 COMMENT 'Flag indicating if this is the latest version',
        uploaded_by INT UNSIGNED NULL COMMENT 'User ID who uploaded the document',
        description TEXT NULL COMMENT 'Optional description or notes about the document',
        expiry_date DATE NULL COMMENT 'Document expiry date (for contracts, licenses, etc.)',
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at DATETIME NULL,
        PRIMARY KEY (document_id),
        CONSTRAINT fk_staff_documents_staff FOREIGN KEY (staff_id) REFERENCES staff (staff_id) ON DELETE CASCADE ON UPDATE CASCADE,
        INDEX idx_staff_documents_staff_id (staff_id),
        INDEX idx_staff_documents_category (category),
        INDEX idx_staff_documents_is_latest (is_latest),
        INDEX idx_staff_documents_staff_category_latest (staff_id, category, is_latest),
        INDEX idx_staff_documents_expiry_date (expiry_date)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `;
    
    await connection.execute(createTableSQL);
    
    console.log('✅ staff_documents table created successfully!');
    console.log('✅ All indexes created');
    
  } catch (error) {
    if (error.code === 'ER_TABLE_EXISTS_ERROR') {
      console.log('ℹ️  Table already exists');
    } else {
      console.error('❌ Error:', error.message);
      process.exit(1);
    }
  } finally {
    if (connection) {
      await connection.end();
      console.log('✅ Database connection closed');
    }
  }
}

createTable();
