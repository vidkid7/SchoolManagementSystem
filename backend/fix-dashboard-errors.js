const mysql = require('mysql2/promise');
require('dotenv').config();

async function fixDashboardErrors() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'school_management_system',
  });

  console.log('✅ Connected to database');

  try {
    // Check staff_id data type
    const [staffColumns] = await connection.execute(`
      SELECT COLUMN_NAME, DATA_TYPE, COLUMN_TYPE 
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'staff' AND COLUMN_NAME = 'staff_id'
    `, [process.env.DB_NAME || 'school_management_system']);
    
    const staffIdType = staffColumns[0]?.COLUMN_TYPE || 'INT';
    console.log(`ℹ️  Staff ID type: ${staffIdType}`);

    // 1. Create books table
    console.log('\n📚 Creating books table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS books (
        book_id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        author VARCHAR(255),
        isbn VARCHAR(50) UNIQUE,
        category VARCHAR(100),
        publisher VARCHAR(255),
        publication_year INT,
        quantity INT DEFAULT 1,
        available_quantity INT DEFAULT 1,
        location VARCHAR(100),
        municipality_id VARCHAR(36) NOT NULL,
        school_config_id VARCHAR(36) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_books_tenant (municipality_id, school_config_id),
        INDEX idx_books_category (category),
        INDEX idx_books_isbn (isbn)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ Books table created');

    // 2. Create ecas table (without foreign key constraint)
    console.log('\n🎭 Creating ecas table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS ecas (
        eca_id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        description TEXT,
        coordinator_id VARCHAR(36),
        status ENUM('active', 'inactive') DEFAULT 'active',
        municipality_id VARCHAR(36) NOT NULL,
        school_config_id VARCHAR(36) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        INDEX idx_ecas_tenant (municipality_id, school_config_id),
        INDEX idx_ecas_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ ECAs table created');

    // 3. Create sports table (without foreign key constraint)
    console.log('\n⚽ Creating sports table...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS sports (
        sport_id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(100),
        description TEXT,
        coach_id VARCHAR(36),
        status ENUM('active', 'inactive') DEFAULT 'active',
        municipality_id VARCHAR(36) NOT NULL,
        school_config_id VARCHAR(36) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        deleted_at TIMESTAMP NULL,
        INDEX idx_sports_tenant (municipality_id, school_config_id),
        INDEX idx_sports_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);
    console.log('✅ Sports table created');

    // 4. Add role column to staff table
    console.log('\n👥 Adding role column to staff table...');
    try {
      await connection.execute(`
        ALTER TABLE staff 
        ADD COLUMN role VARCHAR(100) DEFAULT 'Teacher' AFTER department;
      `);
      console.log('✅ Role column added to staff table');
    } catch (error) {
      if (error.code === 'ER_DUP_FIELDNAME') {
        console.log('ℹ️  Role column already exists');
      } else {
        throw error;
      }
    }

    // 5. Update existing staff records with role based on department
    console.log('\n🔄 Updating staff roles based on department...');
    await connection.execute(`
      UPDATE staff 
      SET role = CASE 
        WHEN department = 'Administration' THEN 'Administrator'
        WHEN department = 'Teaching' THEN 'Teacher'
        WHEN department = 'Support' THEN 'Support Staff'
        WHEN department = 'Management' THEN 'Manager'
        ELSE 'Teacher'
      END
      WHERE role IS NULL OR role = '';
    `);
    console.log('✅ Staff roles updated');

    // 6. Get admin tenant IDs
    const [adminUsers] = await connection.execute(`
      SELECT municipality_id, school_config_id 
      FROM users 
      WHERE role = 'School_Admin' 
      LIMIT 1
    `);

    if (adminUsers.length > 0) {
      const { municipality_id, school_config_id } = adminUsers[0];
      console.log(`\n🏢 Using tenant IDs: municipality=${municipality_id}, school=${school_config_id}`);

      // 7. Populate books with sample data
      console.log('\n📚 Adding sample books...');
      await connection.execute(`
        INSERT IGNORE INTO books (title, author, isbn, category, quantity, available_quantity, municipality_id, school_config_id)
        VALUES 
          ('Mathematics Grade 10', 'CDC Nepal', 'ISBN-001', 'Textbook', 50, 50, ?, ?),
          ('Science Grade 10', 'CDC Nepal', 'ISBN-002', 'Textbook', 50, 50, ?, ?),
          ('English Grade 10', 'CDC Nepal', 'ISBN-003', 'Textbook', 50, 50, ?, ?),
          ('Social Studies', 'CDC Nepal', 'ISBN-004', 'Textbook', 40, 40, ?, ?),
          ('Nepali Literature', 'Various Authors', 'ISBN-005', 'Literature', 30, 30, ?, ?)
      `, [
        municipality_id, school_config_id,
        municipality_id, school_config_id,
        municipality_id, school_config_id,
        municipality_id, school_config_id,
        municipality_id, school_config_id
      ]);
      console.log('✅ Sample books added');

      // 8. Populate ECAs with sample data
      console.log('\n🎭 Adding sample ECAs...');
      await connection.execute(`
        INSERT IGNORE INTO ecas (name, category, description, status, municipality_id, school_config_id)
        VALUES 
          ('Drama Club', 'Arts', 'School drama and theater activities', 'active', ?, ?),
          ('Debate Club', 'Academic', 'Debate and public speaking', 'active', ?, ?),
          ('Music Club', 'Arts', 'Music and singing activities', 'active', ?, ?),
          ('Science Club', 'Academic', 'Science experiments and projects', 'active', ?, ?),
          ('Art Club', 'Arts', 'Drawing and painting activities', 'active', ?, ?)
      `, [
        municipality_id, school_config_id,
        municipality_id, school_config_id,
        municipality_id, school_config_id,
        municipality_id, school_config_id,
        municipality_id, school_config_id
      ]);
      console.log('✅ Sample ECAs added');

      // 9. Populate sports with sample data
      console.log('\n⚽ Adding sample sports...');
      await connection.execute(`
        INSERT IGNORE INTO sports (name, category, description, status, municipality_id, school_config_id)
        VALUES 
          ('Football', 'Team Sports', 'School football team', 'active', ?, ?),
          ('Basketball', 'Team Sports', 'School basketball team', 'active', ?, ?),
          ('Cricket', 'Team Sports', 'School cricket team', 'active', ?, ?),
          ('Volleyball', 'Team Sports', 'School volleyball team', 'active', ?, ?),
          ('Athletics', 'Individual Sports', 'Track and field events', 'active', ?, ?)
      `, [
        municipality_id, school_config_id,
        municipality_id, school_config_id,
        municipality_id, school_config_id,
        municipality_id, school_config_id,
        municipality_id, school_config_id
      ]);
      console.log('✅ Sample sports added');
    }

    console.log('\n✅ All dashboard errors fixed successfully!');
    console.log('\n📊 Summary:');
    console.log('  - Created books table');
    console.log('  - Created ecas table');
    console.log('  - Created sports table');
    console.log('  - Added role column to staff table');
    console.log('  - Populated sample data for books, ECAs, and sports');

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await connection.end();
  }
}

fixDashboardErrors().catch(console.error);
